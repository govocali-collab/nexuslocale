import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function getClient(): SupabaseClient {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_KEY'];
  if (!url || !key) throw new Error('SUPABASE_URL et SUPABASE_SERVICE_KEY requis dans .env');
  return createClient(url, key);
}

export interface IndexerSite {
  id:            string;
  domain:        string | null;
  status:        string;
  gsc_property:  string | null;
  research_data: ResearchData | null;
}

export interface ResearchData {
  niche:    string;
  city:     string;
  country?: string;
  lang?:    string;
  keywords: Array<{
    keyword:            string;
    search_volume:      number | null;
    cpc:                number | null;
    keyword_difficulty: number | null;
    score:              number;
  }>;
}

export async function getSiteById(id: string): Promise<IndexerSite> {
  const { data, error } = await getClient()
    .from('sites')
    .select('id,domain,status,gsc_property,research_data')
    .eq('id', id)
    .single();
  if (error) throw new Error(`Site introuvable (${id}): ${error.message}`);
  return data as IndexerSite;
}

export async function getSitesForRanking(): Promise<IndexerSite[]> {
  const { data, error } = await getClient()
    .from('sites')
    .select('id,domain,status,gsc_property,research_data')
    .in('status', ['indexed', 'ranking', 'rented']);
  if (error) throw new Error(`getSitesForRanking: ${error.message}`);
  return (data ?? []) as IndexerSite[];
}

export async function updateSiteGsc(id: string, gscProperty: string): Promise<void> {
  const { error } = await getClient()
    .from('sites')
    .update({ gsc_property: gscProperty })
    .eq('id', id);
  if (error) throw new Error(`updateSiteGsc: ${error.message}`);
}

export async function updateSiteStatus(id: string, status: string): Promise<void> {
  const { error } = await getClient()
    .from('sites')
    .update({ status })
    .eq('id', id);
  if (error) throw new Error(`updateSiteStatus: ${error.message}`);
}

export interface RankingRow {
  site_id:     string;
  keyword:     string;
  position:    number | null;
  page:        string | null;
  impressions: number | null;
  clicks:      number | null;
  ctr:         number | null;
  checked_at:  string; // YYYY-MM-DD
  source:      string;
}

export async function insertRankings(rows: RankingRow[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await getClient().from('rankings').insert(rows);
  if (error) throw new Error(`insertRankings: ${error.message}`);
}

export async function getRankingHistory(
  siteId:   string,
  keyword?: string,
): Promise<RankingRow[]> {
  let q = getClient()
    .from('rankings')
    .select('*')
    .eq('site_id', siteId)
    .order('checked_at', { ascending: false });
  if (keyword !== undefined) q = q.eq('keyword', keyword);
  const { data, error } = await q;
  if (error) throw new Error(`getRankingHistory: ${error.message}`);
  return (data ?? []) as RankingRow[];
}

/** Returns site IDs indexed for more than `weeksThreshold` weeks with no top-20 position. */
export async function getStaleIndexedSites(weeksThreshold = 6): Promise<string[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeksThreshold * 7);

  // Sites with status 'indexed' (not yet 'ranking') updated before cutoff
  const { data, error } = await getClient()
    .from('sites')
    .select('id,updated_at')
    .eq('status', 'indexed');
  if (error) throw new Error(`getStaleIndexedSites: ${error.message}`);

  return (data ?? [])
    .filter(s => s.updated_at && new Date(s.updated_at as string) < cutoff)
    .map(s => s.id as string);
}
