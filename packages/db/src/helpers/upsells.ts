import type { Db } from '../client.js';
import type { Upsell, UpsellInsert, UpsellUpdate } from '../types.js';

export async function createUpsell(db: Db, input: UpsellInsert): Promise<Upsell> {
  const { data, error } = await db.from('upsells').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateUpsell(db: Db, id: string, input: UpsellUpdate): Promise<Upsell> {
  const { data, error } = await db.from('upsells').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function listUpsellsByClient(db: Db, clientId: string): Promise<Upsell[]> {
  const { data, error } = await db
    .from('upsells')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
