import { createAdminClient } from './admin';

// ─── Types retournés par les requêtes ─────────────────────────────────────────

export interface OverviewStats {
  sitesByStatus:     Record<string, number>;
  leadsThisMonth:    number;
  leadsPrevMonth:    number;
  mrr:               number;
  salesTotal:        number;
  prospectsByStatus: Record<string, number>;
}

export interface RecentLead {
  id:            string;
  site_id:       string;
  site_domain:   string | null;
  type:          string;
  caller_number: string | null;
  duration_sec:  number | null;
  created_at:    string;
}

export interface StaleSite {
  id:         string;
  domain:     string | null;
  created_at: string;
}

export interface SiteRow {
  id:             string;
  domain:         string | null;
  type:           string;
  niche:          string;
  city:           string;
  status:         string;
  twilio_number:  string | null;
  monthly_rent:   number | null;
  leads_month:    number;
  best_position:  number | null;
  niche_score:    number | null;
  top_volume:     number | null;
  keyword_count:  number;
}

export interface SiteDetail {
  id:            string;
  domain:        string | null;
  type:          string;
  niche:         string;
  city:          string;
  status:        string;
  twilio_number: string | null;
  forward_to:    string | null;
  gsc_property:  string | null;
  vercel_project: string | null;
  monthly_rent:  number | null;
  created_at:    string;
}

export interface SiteLead {
  id:            string;
  type:          string;
  caller_number: string | null;
  duration_sec:  number | null;
  recording_url: string | null;
  payload:       Record<string, unknown> | null;
  created_at:    string;
}

export interface RankingPoint {
  keyword:    string;
  position:   number | null;
  checked_at: string;
}

// ─── Vue d'ensemble ───────────────────────────────────────────────────────────

export async function getOverviewStats(): Promise<OverviewStats> {
  const db = createAdminClient();
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const [
    sitesRes, leadsThisRes, leadsPrevRes,
    rentedRes, clientsRes, upsellsRes, prospectsRes,
  ] = await Promise.all([
    db.from('sites').select('status'),
    db.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', thisMonthStart),
    db.from('leads').select('id', { count: 'exact', head: true })
      .gte('created_at', prevMonthStart).lt('created_at', thisMonthStart),
    db.from('sites').select('monthly_rent').eq('status', 'rented'),
    db.from('clients').select('hosting_monthly'),
    db.from('upsells').select('monthly_price').eq('status', 'active'),
    db.from('prospects').select('status, sale_value, monthly_value'),
  ]);

  const sitesByStatus: Record<string, number> = {};
  for (const s of sitesRes.data ?? []) {
    const st = s.status as string;
    sitesByStatus[st] = (sitesByStatus[st] ?? 0) + 1;
  }

  // Revenus : uniquement les prospects dans la colonne « Gagnés ».
  const won = (prospectsRes.data ?? []).filter(p => (p.status as string) === 'won');
  const salesTotal       = won.reduce((n, p) => n + ((p.sale_value    as number | null) ?? 0), 0);
  const prospectsMonthly = won.reduce((n, p) => n + ((p.monthly_value as number | null) ?? 0), 0);

  const mrr =
    (rentedRes.data  ?? []).reduce((n, r) => n + ((r.monthly_rent   as number | null) ?? 0), 0) +
    (clientsRes.data ?? []).reduce((n, r) => n + ((r.hosting_monthly as number | null) ?? 0), 0) +
    (upsellsRes.data ?? []).reduce((n, r) => n + ((r.monthly_price   as number) ?? 0), 0) +
    prospectsMonthly;

  const prospectsByStatus: Record<string, number> = {};
  for (const p of prospectsRes.data ?? []) {
    const st = p.status as string;
    prospectsByStatus[st] = (prospectsByStatus[st] ?? 0) + 1;
  }

  return {
    sitesByStatus,
    leadsThisMonth:    leadsThisRes.count  ?? 0,
    leadsPrevMonth:    leadsPrevRes.count  ?? 0,
    mrr,
    salesTotal,
    prospectsByStatus,
  };
}

export async function getRecentLeads(limit = 10): Promise<RecentLead[]> {
  const db = createAdminClient();
  const { data } = await db
    .from('leads')
    .select('id, site_id, type, caller_number, duration_sec, created_at, sites(domain)')
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []).map(l => ({
    id:            l.id as string,
    site_id:       l.site_id as string,
    site_domain:   (l.sites as unknown as { domain: string | null } | null)?.domain ?? null,
    type:          l.type as string,
    caller_number: l.caller_number as string | null,
    duration_sec:  l.duration_sec  as number | null,
    created_at:    l.created_at as string,
  }));
}

export async function getStaleSites(weeksThreshold = 6): Promise<StaleSite[]> {
  const db     = createAdminClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeksThreshold * 7);

  const { data: indexedSites } = await db
    .from('sites')
    .select('id, domain, created_at')
    .eq('status', 'indexed')
    .lt('created_at', cutoff.toISOString());

  if (!indexedSites?.length) return [];

  const ids = indexedSites.map(s => s.id as string);
  const { data: rankingsExist } = await db
    .from('rankings')
    .select('site_id')
    .in('site_id', ids)
    .not('position', 'is', null);

  const withRankings = new Set((rankingsExist ?? []).map(r => r.site_id as string));

  return indexedSites
    .filter(s => !withRankings.has(s.id as string))
    .map(s => ({
      id:         s.id as string,
      domain:     s.domain as string | null,
      created_at: s.created_at as string,
    }));
}

// ─── Portefeuille ─────────────────────────────────────────────────────────────

export async function getSitesList(filters?: {
  status?: string;
  type?:   string;
  q?:      string;
}): Promise<SiteRow[]> {
  const db = createAdminClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thirtyAgo  = new Date(Date.now() - 30 * 86400_000).toISOString();

  let q = db.from('sites').select('id, domain, type, niche, city, status, twilio_number, monthly_rent, research_data');
  if (filters?.status) q = q.eq('status', filters.status);
  if (filters?.type)   q = q.eq('type', filters.type);
  if (filters?.q)      q = q.or(`domain.ilike.%${filters.q}%,niche.ilike.%${filters.q}%`);

  const [sitesRes, leadsRes, rankingsRes] = await Promise.all([
    q.order('created_at', { ascending: false }),
    db.from('leads').select('site_id').gte('created_at', monthStart),
    db.from('rankings').select('site_id, position')
      .not('position', 'is', null)
      .gte('checked_at', thirtyAgo),
  ]);

  const leadsPerSite: Record<string, number> = {};
  for (const l of leadsRes.data ?? []) {
    const sid = l.site_id as string;
    leadsPerSite[sid] = (leadsPerSite[sid] ?? 0) + 1;
  }

  const bestPositionPerSite: Record<string, number> = {};
  for (const r of rankingsRes.data ?? []) {
    const sid = r.site_id as string;
    const pos = r.position as number;
    if (!bestPositionPerSite[sid] || pos < bestPositionPerSite[sid]!) {
      bestPositionPerSite[sid] = pos;
    }
  }

  return (sitesRes.data ?? []).map(s => {
    const rd = s.research_data as
      { niche_score?: number; keywords?: { search_volume?: number | null }[] } | null;
    const kws    = rd?.keywords ?? [];
    const topVol = kws.reduce((max, k) => Math.max(max, k.search_volume ?? 0), 0);
    return {
      id:            s.id as string,
      domain:        s.domain as string | null,
      type:          s.type as string,
      niche:         s.niche as string,
      city:          s.city as string,
      status:        s.status as string,
      twilio_number: s.twilio_number as string | null,
      monthly_rent:  s.monthly_rent  as number | null,
      leads_month:   leadsPerSite[s.id as string]       ?? 0,
      best_position: bestPositionPerSite[s.id as string] ?? null,
      niche_score:   rd?.niche_score ?? null,
      top_volume:    kws.length ? topVol : null,
      keyword_count: kws.length,
    };
  });
}

// ─── Détail d'un site ─────────────────────────────────────────────────────────

export async function getSiteDetail(id: string): Promise<SiteDetail | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from('sites')
    .select('id, domain, type, niche, city, status, twilio_number, forward_to, gsc_property, vercel_project, monthly_rent, created_at')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as unknown as SiteDetail;
}

export async function getSiteLeads(siteId: string, limit = 50): Promise<SiteLead[]> {
  const db = createAdminClient();
  const { data } = await db
    .from('leads')
    .select('id, type, caller_number, duration_sec, recording_url, payload, created_at')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as SiteLead[];
}

export async function getSiteRankings(siteId: string): Promise<RankingPoint[]> {
  const db = createAdminClient();
  const { data } = await db
    .from('rankings')
    .select('keyword, position, checked_at')
    .eq('site_id', siteId)
    .order('checked_at', { ascending: true });
  return (data ?? []) as unknown as RankingPoint[];
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

export interface Prospect {
  id:             string;
  business_name:  string;
  niche:          string;
  city:           string;
  phone:          string | null;
  rating:         number | null;
  review_count:   number | null;
  web_presence:   string;
  pain_score:     number | null;
  prospect_score: number | null;
  status:         string;
  demo_url:       string | null;
  website:        string | null;
  notes:          string | null;
  email:          string | null;
  sale_value:     number | null;
  monthly_value:  number | null;
  created_at:     string;
}

export async function getProspects(): Promise<Prospect[]> {
  const db = createAdminClient();
  const { data } = await db
    .from('prospects')
    .select('id, business_name, niche, city, phone, rating, review_count, web_presence, pain_score, prospect_score, status, demo_url, website, notes, email, sale_value, monthly_value, created_at')
    .order('prospect_score', { ascending: false, nullsFirst: false });
  return (data ?? []) as unknown as Prospect[];
}

export interface WonDeal { date: string; sale_value: number; monthly_value: number }

// Prospects « Gagnés » pour le suivi des ventes par mois.
// Mois attribué à won_at (date de conversion) ; repli sur created_at si la colonne
// won_at n'existe pas encore (migration 016 non lancée).
export async function getSalesDeals(): Promise<WonDeal[]> {
  const db = createAdminClient();
  let res = await db.from('prospects')
    .select('won_at, created_at, sale_value, monthly_value').eq('status', 'won');
  if (res.error && /won_at/i.test(res.error.message)) {
    res = await db.from('prospects')
      .select('created_at, sale_value, monthly_value').eq('status', 'won');
  }
  return (res.data ?? []).map((d) => ({
    date:          ((d as { won_at?: string | null }).won_at ?? (d.created_at as string)),
    sale_value:    (d.sale_value    as number | null) ?? 0,
    monthly_value: (d.monthly_value as number | null) ?? 0,
  }));
}

// ─── Lanceur : files d'attente ────────────────────────────────────────────────

export interface ActionQueue {
  toSubmit:  { id: string; domain: string | null; niche: string; city: string }[];
  toRank:    { id: string; domain: string | null; niche: string; city: string }[];
  stale:     { id: string; domain: string | null; weeksOld: number }[];
}

export async function getActionQueues(): Promise<ActionQueue> {
  const db  = createAdminClient();
  const ago6 = new Date(Date.now() - 6 * 7 * 86400_000).toISOString();

  const [builtRes, indexedRes, rankingsRes] = await Promise.all([
    // Sites built but no gsc_property yet
    db.from('sites').select('id, domain, niche, city')
      .in('status', ['built'])
      .is('gsc_property', null),
    // Sites indexed/ranking but never tracked
    db.from('sites').select('id, domain, niche, city, created_at')
      .in('status', ['indexed', 'ranking', 'rented']),
    // Rankings in last 30 days
    db.from('rankings').select('site_id')
      .not('position', 'is', null)
      .gte('checked_at', new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10)),
  ]);

  const rankedIds = new Set((rankingsRes.data ?? []).map(r => r.site_id as string));

  const toRank = (indexedRes.data ?? [])
    .filter(s => !rankedIds.has(s.id as string))
    .map(s => ({ id: s.id as string, domain: s.domain as string | null, niche: s.niche as string, city: s.city as string }));

  const stale = (indexedRes.data ?? [])
    .filter(s => !rankedIds.has(s.id as string) && new Date(s.created_at as string) < new Date(ago6))
    .map(s => ({
      id: s.id as string,
      domain: s.domain as string | null,
      weeksOld: Math.floor((Date.now() - new Date(s.created_at as string).getTime()) / (7 * 86400_000)),
    }));

  return {
    toSubmit: (builtRes.data ?? []).map(s => ({ id: s.id as string, domain: s.domain as string | null, niche: s.niche as string, city: s.city as string })),
    toRank,
    stale,
  };
}

// ─── Actions serveur (mutations) ─────────────────────────────────────────────

export async function updateSiteField(
  id:    string,
  field: 'status' | 'forward_to',
  value: string,
): Promise<void> {
  const db = createAdminClient();
  await db.from('sites').update({ [field]: value }).eq('id', id);
}
