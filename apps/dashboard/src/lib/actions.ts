'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAuthClient } from './supabase/server';
import { createAdminClient } from './admin';

export async function updateProspectStatus(id: string, status: string): Promise<void> {
  await createAdminClient().from('prospects').update({ status }).eq('id', id);
  revalidatePath('/app/pipeline');
  revalidatePath('/app');
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
  const { error } = await createAdminClient().from('prospects').update(fields).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/app/pipeline');
  revalidatePath('/app');
  return {};
}

export async function signOut() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect('/login');
}
