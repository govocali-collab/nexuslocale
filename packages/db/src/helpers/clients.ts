import type { Db } from '../client.js';
import type { Client, ClientInsert, ClientUpdate } from '../types.js';

export async function createClient_(db: Db, input: ClientInsert): Promise<Client> {
  const { data, error } = await db.from('clients').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateClient(db: Db, id: string, input: ClientUpdate): Promise<Client> {
  const { data, error } = await db.from('clients').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function getClient(db: Db, id: string): Promise<Client | null> {
  const { data, error } = await db.from('clients').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listClients(db: Db): Promise<Client[]> {
  const { data, error } = await db.from('clients').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
