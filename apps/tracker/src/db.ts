import { createClient } from '@supabase/supabase-js';
import type { Site, Client } from '@nexuslocale/tracker';
import type { LeadInsert, Lead } from '@nexuslocale/db';

export function getDb() {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_KEY'];
  if (!url || !key) throw new Error('SUPABASE_URL + SUPABASE_SERVICE_KEY requis');
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── Sites ────────────────────────────────────────────────────────────────────

export async function getSiteByTwilioNumber(twilioNumber: string): Promise<Site | null> {
  const { data } = await getDb()
    .from('sites').select('*').eq('twilio_number', twilioNumber).maybeSingle();
  return (data as Site | null);
}

export async function getSiteById(id: string): Promise<Site | null> {
  const { data } = await getDb()
    .from('sites').select('*').eq('id', id).maybeSingle();
  return (data as Site | null);
}

export async function getSiteByDomain(domain: string): Promise<Site | null> {
  const { data } = await getDb()
    .from('sites').select('*').eq('domain', domain).maybeSingle();
  return (data as Site | null);
}

export async function updateSiteTwilioNumber(
  id:           string,
  twilioNumber: string | null,
): Promise<void> {
  const { error } = await getDb()
    .from('sites').update({ twilio_number: twilioNumber }).eq('id', id);
  if (error) throw error;
}

export async function getSitesWithTracking(): Promise<Site[]> {
  const { data, error } = await getDb()
    .from('sites')
    .select('*')
    .not('twilio_number', 'is', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Site[];
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export async function insertLead(input: LeadInsert): Promise<Lead> {
  const { data, error } = await getDb()
    .from('leads').insert(input).select().single();
  if (error) throw error;
  return data as Lead;
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export async function getClientById(id: string): Promise<Client | null> {
  const { data } = await getDb()
    .from('clients').select('*').eq('id', id).maybeSingle();
  return (data as Client | null);
}
