import type { Db } from '../client.js';
import type { Prospect, ProspectInsert, ProspectUpdate } from '../types.js';

export async function createProspect(db: Db, input: ProspectInsert): Promise<Prospect> {
  const { data, error } = await db.from('prospects').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateProspect(db: Db, id: string, input: ProspectUpdate): Promise<Prospect> {
  const { data, error } = await db.from('prospects').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function listProspects(db: Db): Promise<Prospect[]> {
  const { data, error } = await db
    .from('prospects')
    .select('*')
    .order('prospect_score', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getProspect(db: Db, id: string): Promise<Prospect | null> {
  const { data, error } = await db.from('prospects').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}
