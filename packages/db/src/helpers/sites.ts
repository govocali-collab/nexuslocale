import type { Db } from '../client.js';
import type { Site, SiteInsert, SiteUpdate } from '../types.js';

export async function getSite(db: Db, id: string): Promise<Site | null> {
  const { data, error } = await db.from('sites').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listSites(db: Db): Promise<Site[]> {
  const { data, error } = await db.from('sites').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createSite(db: Db, input: SiteInsert): Promise<Site> {
  const { data, error } = await db.from('sites').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateSite(db: Db, id: string, input: SiteUpdate): Promise<Site> {
  const { data, error } = await db.from('sites').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSite(db: Db, id: string): Promise<void> {
  const { error } = await db.from('sites').delete().eq('id', id);
  if (error) throw error;
}
