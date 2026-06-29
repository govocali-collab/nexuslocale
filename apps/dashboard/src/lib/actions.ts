'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAuthClient } from './supabase/server';
import { createAdminClient } from './admin';

// Met à jour un prospect. Si on le passe à « Gagnés », on fixe won_at = maintenant
// (la 1re fois). Résilient : si la colonne won_at n'existe pas encore (migration 016
// non lancée), on réessaie sans won_at — donc le déplacement vers « Gagnés » ne casse jamais.
async function applyProspectUpdate(id: string, fields: Record<string, unknown>): Promise<{ error?: string }> {
  const db = createAdminClient();
  let patch = { ...fields };
  if (fields.status === 'won') {
    const cur = await db.from('prospects').select('won_at').eq('id', id).maybeSingle();
    if (!cur.error && !(cur.data as { won_at?: string } | null)?.won_at) {
      patch = { ...patch, won_at: new Date().toISOString() };
    }
  }
  let { error } = await db.from('prospects').update(patch as never).eq('id', id);
  if (error && /won_at/i.test(error.message)) {
    const rest = { ...patch }; delete (rest as Record<string, unknown>)['won_at'];
    ({ error } = await db.from('prospects').update(rest as never).eq('id', id));
  }
  revalidatePath('/app/pipeline');
  revalidatePath('/app');
  return error ? { error: error.message } : {};
}

export async function updateProspectStatus(id: string, status: string): Promise<void> {
  await applyProspectUpdate(id, { status });
}

export async function createProspect(fields: {
  business_name: string; niche: string; city: string; phone?: string; email?: string; notes?: string;
}): Promise<{ error?: string }> {
  const business_name = fields.business_name.trim();
  const niche = fields.niche.trim();
  const city = fields.city.trim();
  if (!business_name || !niche || !city) {
    return { error: 'Nom du commerce, niche et ville sont requis.' };
  }
  const { error } = await createAdminClient().from('prospects').insert({
    business_name, niche, city,
    phone: fields.phone?.trim() || null,
    email: fields.email?.trim() || null,
    notes: fields.notes?.trim() || null,
    web_presence: 'none',
    status: 'new',
  } as never);
  if (error) {
    if (error.code === '23505') return { error: 'Ce prospect existe déjà (même nom + ville).' };
    return { error: error.message };
  }
  revalidatePath('/app/pipeline');
  return {};
}

export async function deleteProspects(ids: string[]): Promise<{ error?: string }> {
  const list = ids.filter(Boolean);
  if (list.length === 0) return {};
  const { error } = await createAdminClient().from('prospects').delete().in('id', list);
  if (error) return { error: error.message };
  revalidatePath('/app/pipeline');
  return {};
}

export async function updateProspect(
  id: string,
  fields: { notes?: string; phone?: string; demo_url?: string; status?: string; email?: string | null; sale_value?: number | null; monthly_value?: number | null },
): Promise<{ error?: string }> {
  return applyProspectUpdate(id, fields as Record<string, unknown>);
}

export async function signOut() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect('/login');
}
