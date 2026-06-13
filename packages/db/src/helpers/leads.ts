import type { Db } from '../client.js';
import type { Lead, LeadInsert } from '../types.js';

export async function createLead(db: Db, input: LeadInsert): Promise<Lead> {
  const { data, error } = await db.from('leads').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function listLeadsBySite(db: Db, siteId: string): Promise<Lead[]> {
  const { data, error } = await db
    .from('leads')
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
