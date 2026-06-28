'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAuthClient } from './supabase/server';
import { createAdminClient } from './admin';

export async function updateProspectStatus(id: string, status: string): Promise<void> {
  await createAdminClient().from('prospects').update({ status }).eq('id', id);
  revalidatePath('/pipeline');
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
  fields: { notes?: string; phone?: string; demo_url?: string; status?: string; sale_value?: number | null; monthly_value?: number | null },
): Promise<{ error?: string }> {
  const { error } = await createAdminClient().from('prospects').update(fields).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/pipeline');
  return {};
}

export async function signOut() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect('/login');
}
