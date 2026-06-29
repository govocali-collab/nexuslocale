'use server';

import { createAdminClient } from './admin';
import { revalidatePath } from 'next/cache';

/** Supprime des sites (et leurs dépendances leads/rankings) — service role. */
export async function deleteSites(ids: string[]): Promise<{ ok: boolean; count: number; error?: string }> {
  const list = ids.filter(Boolean);
  if (list.length === 0) return { ok: true, count: 0 };
  try {
    const db = createAdminClient();
    // Détache un éventuel client, puis supprime les dépendances FK, puis les sites.
    await db.from('clients').update({ site_id: null }).in('site_id', list);
    await db.from('rankings').delete().in('site_id', list);
    await db.from('leads').delete().in('site_id', list);
    const { error } = await db.from('sites').delete().in('id', list);
    if (error) throw error;
    revalidatePath('/sites');
    return { ok: true, count: list.length };
  } catch (e) {
    return { ok: false, count: 0, error: e instanceof Error ? e.message : String(e) };
  }
}
