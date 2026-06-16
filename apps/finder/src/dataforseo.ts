import type { KeywordInfo } from './types.js';

const BASE = 'https://api.dataforseo.com/v3';

export const ESTIMATED_COST_USD = 0.003;

function authHeader(login: string, password: string): string {
  return 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');
}

async function dfsFetch<T>(url: string, auth: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`DataForSEO HTTP ${res.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text) as T;
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); } catch (e) {
      last = e;
      if (i < attempts - 1) await new Promise(r => setTimeout(r, 1000 * 2 ** i));
    }
  }
  throw last;
}

// ─── DataForSEO Labs — keyword_ideas/live (KD réel inclus) ───────────────────

interface LabsItem {
  keyword: string;
  keyword_info?: {
    search_volume: number | null;
    cpc:           number | null;
    competition:   number | null;
  };
  keyword_properties?: {
    keyword_difficulty: number | null;
  };
}

interface LabsResponse {
  tasks: Array<{
    status_code:    number;
    status_message: string;
    result: Array<{ items: LabsItem[]; items_count?: number }> | null;
  }>;
}

function normalizeAscii(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, ' ').trim();
}

function seedSignificantWords(seeds: string[]): string[] {
  const stop = new Set(['de','du','des','d','la','le','les','et','en','au','qc','canada']);
  return [...new Set(
    seeds.flatMap(s => normalizeAscii(s).split(/\s+/).filter(w => w.length >= 3 && !stop.has(w)))
  )];
}

function isRelevant(keyword: string, seedWords: string[]): boolean {
  const kwWords = normalizeAscii(keyword).split(/\s+/);
  // word-boundary match: a seed word must appear as a whole word (or prefix for plural/conjugation)
  return seedWords.some(sw => kwWords.some(w => w === sw || w.startsWith(sw)));
}

async function runLabsScan(opts: {
  seedKeywords: string[];
  locationName: string;
  languageName: string;
  limit:        number;
  auth:         string;
}): Promise<KeywordInfo[]> {
  const niche = opts.seedKeywords[0] ?? opts.seedKeywords.join(' ');
  const seedWords = seedSignificantWords([niche]); // pertinence ancrée sur la niche, pas la ville
  const limit = Number.isFinite(opts.limit) && opts.limit > 0 ? opts.limit : 100;

  const common = {
    location_name: opts.locationName,
    language_name: opts.languageName,
    limit:         limit * 3, // demande plus pour compenser le filtrage
    order_by:      ['keyword_info.search_volume,desc'],
  };

  // keyword_suggestions = mots-clés long-tail CONTENANT la phrase seed (idéal niche locale)
  // keyword_ideas = plus large/sémantique — en fallback seulement
  const endpoints: Array<{ url: string; body: unknown }> = [
    { url:  `${BASE}/dataforseo_labs/google/keyword_suggestions/live`,
      body: [{ keyword: niche, ...common }] },
    { url:  `${BASE}/dataforseo_labs/google/keyword_ideas/live`,
      body: [{ keywords: opts.seedKeywords, ...common }] },
  ];

  for (const { url, body } of endpoints) {
    const label = url.split('/').at(-2) + '/' + url.split('/').at(-1);
    process.stdout.write(`[labs] ${label}…`);
    try {
      const data = await withRetry(() => dfsFetch<LabsResponse>(url, opts.auth, body));
      const task = data.tasks?.[0];
      if (!task || task.status_code >= 40000) {
        console.log(` ✗ (${task?.status_code ?? '?'}: ${task?.status_message ?? 'vide'})`);
        continue;
      }
      const allItems = task.result?.[0]?.items ?? [];
      const items = allItems
        .filter(item => isRelevant(item.keyword, seedWords))
        .slice(0, opts.limit);
      console.log(` ✓ (${items.length} pertinents / ${allItems.length} reçus, KD inclus)`);
      if (items.length === 0) { console.log('   ⚠  Aucun résultat pertinent — essai endpoint suivant'); continue; }
      return items.map((item): KeywordInfo => ({
        keyword:            item.keyword,
        search_volume:      item.keyword_info?.search_volume ?? null,
        cpc:                item.keyword_info?.cpc ?? null,
        competition:        item.keyword_info?.competition ?? null,
        keyword_difficulty: item.keyword_properties?.keyword_difficulty ?? null,
        score:              0,
      }));
    } catch (e) {
      console.log(` ✗ (${e instanceof Error ? e.message.split('\n')[0] : e})`);
    }
  }

  return [];
}

// ─── Fallback — Keywords Data Google Ads (pas de KD, mais disponible partout) ─

interface GadsItem {
  keyword:           string;
  search_volume:     number | null;
  cpc:               number | null;
  competition:       number | null;
}

interface GadsResponse {
  tasks: Array<{
    status_code:    number;
    status_message: string;
    result:         GadsItem[] | null;
  }>;
}

async function runGadsScan(opts: {
  seedKeywords: string[];
  locationName: string;
  languageName: string;
  limit:        number;
  auth:         string;
}): Promise<KeywordInfo[]> {
  const url  = `${BASE}/keywords_data/google_ads/keywords_for_keywords/live`;
  const body = [{
    keywords:      opts.seedKeywords,
    location_name: opts.locationName,
    language_name: opts.languageName,
  }];

  process.stdout.write(`[gads] keywords_for_keywords/live…`);
  const data = await withRetry(() => dfsFetch<GadsResponse>(url, opts.auth, body));
  const task = data.tasks?.[0];
  if (!task || task.status_code >= 40000) {
    throw new Error(`Google Ads fallback échoué : ${task?.status_message ?? 'vide'}`);
  }
  const items = (task.result ?? []).slice(0, opts.limit);
  console.log(` ✓ (${items.length} mots-clés, pas de KD — fallback Google Ads)`);

  return items.map((item): KeywordInfo => {
    const comp = item.competition;
    const kd   = comp != null && !isNaN(comp) ? Math.round(comp * 100) : null;
    return {
      keyword:            item.keyword,
      search_volume:      item.search_volume ?? null,
      cpc:                item.cpc ?? null,
      competition:        comp ?? null,
      keyword_difficulty: kd,
      score:              0,
    };
  });
}

// ─── Point d'entrée public ────────────────────────────────────────────────────

export async function runKeywordScan(opts: {
  seedKeywords: string[];
  locationName: string;
  languageName: string;
  limit:        number;
  login:        string;
  password:     string;
}): Promise<KeywordInfo[]> {
  const auth = authHeader(opts.login, opts.password);

  // 1. Tente DataForSEO Labs (KD réel)
  const labsResults = await runLabsScan({ ...opts, auth });
  if (labsResults.length > 0) return labsResults;

  // 2. Fallback Google Ads si Labs inaccessible sur ce plan
  console.warn('[dataforseo] Labs inaccessible — fallback Google Ads (pas de KD SEO)');
  return runGadsScan({ ...opts, auth });
}
