import { createClient } from '@supabase/supabase-js';
import type { ScanResult } from './types.js';

function getDb() {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_KEY'];
  if (!url || !key) throw new Error('SUPABASE_URL + SUPABASE_SERVICE_KEY requis');
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function upsertSite(result: ScanResult, domain: string | null): Promise<string> {
  const db = getDb();

  const payload = {
    domain:            domain ?? null,
    type:              'rent' as const,
    niche:             result.niche,
    city:              result.city,
    status:            'research' as const,
    research_data:     { keywords: result.keywords.slice(0, 50), clusters: result.clusters, niche_score: result.niche_score, scanned_at: result.scanned_at },
    candidate_domains: result.candidates,
  };

  // Cherche un enregistrement existant (par domaine en priorité, puis niche+city)
  let existingId: string | null = null;

  if (domain) {
    const { data } = await db.from('sites').select('id').eq('domain', domain).maybeSingle();
    existingId = (data as { id: string } | null)?.id ?? null;
  }
  if (!existingId) {
    const { data } = await db.from('sites').select('id')
      .eq('niche', result.niche).eq('city', result.city).eq('type', 'rent').maybeSingle();
    existingId = (data as { id: string } | null)?.id ?? null;
  }

  if (existingId) {
    await db.from('sites').update(payload).eq('id', existingId);
    return existingId;
  } else {
    const { data, error } = await db.from('sites').insert(payload).select('id').single();
    if (error) throw error;
    return (data as { id: string }).id;
  }
}

export async function updateSiteDomain(siteId: string, domain: string): Promise<void> {
  const db = getDb();
  const { error } = await db.from('sites').update({ domain }).eq('id', siteId);
  if (error) throw error;
}
