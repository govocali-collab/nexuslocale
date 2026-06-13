import type { Db } from '../client.js';
import type { Ranking, RankingInsert } from '../types.js';

export async function upsertRanking(db: Db, input: RankingInsert): Promise<Ranking> {
  const { data, error } = await db.from('rankings').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function listRankingsBySite(db: Db, siteId: string): Promise<Ranking[]> {
  const { data, error } = await db
    .from('rankings')
    .select('*')
    .eq('site_id', siteId)
    .order('checked_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function latestRankingsForSite(db: Db, siteId: string): Promise<Ranking[]> {
  const { data, error } = await db
    .from('rankings')
    .select('*')
    .eq('site_id', siteId)
    .order('checked_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}
