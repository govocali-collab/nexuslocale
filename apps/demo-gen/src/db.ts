import { createClient } from '@supabase/supabase-js';
import type { ProspectFull } from './types.js';

function getDb() {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_KEY'];
  if (!url || !key) throw new Error('SUPABASE_URL et SUPABASE_SERVICE_KEY requis');
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function fetchProspectByName(name: string, city: string): Promise<ProspectFull> {
  const db = getDb();
  const citySlug = city.split(/[\s,]/)[0] ?? city; // "Granby QC" → "Granby"

  const { data, error } = await db
    .from('prospects')
    .select('*')
    .ilike('business_name', `%${name}%`)
    .ilike('city', `%${citySlug}%`)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Supabase : ${error.message}`);
  if (!data) throw new Error(`Prospect "${name}" introuvable (ville: ${city})`);

  return data as unknown as ProspectFull;
}

export async function fetchTopProspects(limit: number): Promise<ProspectFull[]> {
  const db = getDb();

  const { data, error } = await db
    .from('prospects')
    .select('*')
    .eq('status', 'new')
    .not('prospect_score', 'is', null)
    .order('prospect_score', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Supabase : ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error('Aucun prospect avec status=new trouvé dans Supabase');
  }

  return data as unknown as ProspectFull[];
}
