'use server';

import { exec } from 'child_process';
import path from 'path';
import { generateBeautifulHtml, type SiteBrief } from './site-generator';
import { createAdminClient } from './admin';

function slugify(s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export async function publishBeautifulSite(
  slug: string,
  businessName: string,
  html: string,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const s = slugify(slug);
  if (!s) return { ok: false, error: 'Slug invalide.' };
  if (!html.trim()) return { ok: false, error: 'Aucun HTML à publier.' };
  try {
    const db = createAdminClient();
    const { error } = await db
      .from('published_sites')
      .upsert({ slug: s, business_name: businessName, html, updated_at: new Date().toISOString() }, { onConflict: 'slug' });
    if (error) throw error;
    return { ok: true, url: `/s/${s}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

const ROOT = path.resolve(process.cwd(), '../..');

function run(cmd: string, timeoutMs = 90_000): Promise<{ out: string; ok: boolean }> {
  return new Promise(resolve => {
    exec(cmd, { cwd: ROOT, env: process.env, timeout: timeoutMs }, (err, stdout, stderr) => {
      const out = [stdout, stderr].filter(Boolean).join('\n').trim();
      resolve({ out: out || (err?.message ?? '(aucune sortie)'), ok: !err || !!stdout });
    });
  });
}

export async function generateBeautifulSite(
  brief: SiteBrief,
  feedback?: string,
): Promise<{ html: string; ok: boolean; error?: string }> {
  if (!brief.businessName.trim() || !brief.industry.trim()) {
    return { html: '', ok: false, error: 'Nom du commerce et industrie requis.' };
  }
  try {
    const { html } = await generateBeautifulHtml(brief, feedback);
    return { html, ok: true };
  } catch (e) {
    return { html: '', ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function shellQuote(s: string): string {
  // Wrap in single quotes, escaping any embedded single quote — safe for exec().
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

// CLIs print their structured payload between these markers when run with --json.
function extractJson<T = unknown>(out: string): { data: T | null; logs: string } {
  const start = out.indexOf('__NEXUS_JSON__');
  const end   = out.indexOf('__NEXUS_END__', start);
  if (start === -1 || end === -1) return { data: null, logs: out };
  const raw  = out.slice(start + '__NEXUS_JSON__'.length, end);
  const logs = (out.slice(0, start) + out.slice(end + '__NEXUS_END__'.length)).trim();
  try {
    return { data: JSON.parse(raw) as T, logs };
  } catch {
    return { data: null, logs: out };
  }
}

export interface FinderKeyword {
  keyword: string;
  search_volume: number | null;
  cpc: number | null;
  keyword_difficulty: number | null;
  score: number;
}
export interface FinderDomain {
  domain: string;
  available?: boolean | null;
  price_usd?: number | null;
  type?: string;
}
export interface FinderResult {
  niche: string;
  city: string;
  niche_score: number;
  keywords: FinderKeyword[];
  candidates: FinderDomain[];
  best_domain?: FinderDomain | null;
}

export async function runFinderScan(
  niche: string,
  city: string,
  opts: { country: string; lang: string; limit: number; maxDifficulty?: number; estimate: boolean },
): Promise<{ out: string; ok: boolean; data: FinderResult | null }> {
  if (!niche.trim() || !city.trim()) {
    return { out: 'Niche et ville sont requis.', ok: false, data: null };
  }
  const flags = [
    `--country ${opts.country}`,
    `--lang ${opts.lang}`,
    `--limit ${Math.max(10, Math.min(500, opts.limit))}`,
    opts.maxDifficulty !== undefined ? `--max-difficulty ${opts.maxDifficulty}` : '',
    opts.estimate ? '--estimate' : '--yes', // live runs auto-confirm the cost prompt
    '--json',
  ].filter(Boolean).join(' ');
  const cmd = `pnpm --filter @nexuslocale/finder cli scan ${shellQuote(niche)} ${shellQuote(city)} ${flags}`;
  const { out, ok } = await run(cmd, 240_000);
  const { data, logs } = extractJson<FinderResult>(out);
  return { out: logs, ok, data };
}

export interface Prospect {
  business_name: string;
  rating: number | null;
  review_count: number | null;
  web_presence: string;
  pain_score: number;
  prospect_score: number;
  detected_issues: string[];
  phone: string | null;
  website: string | null;
  maps_url: string | null;
}
export interface ProspectorResult {
  niche: string;
  city: string;
  prospects: Prospect[];
}

export async function runProspectorScan(
  niche: string,
  location: string,
  opts: { limit: number; minReviews: number; simulate: boolean; judge?: boolean },
): Promise<{ out: string; ok: boolean; data: ProspectorResult | null }> {
  if (!niche.trim() || !location.trim()) {
    return { out: 'Niche et ville sont requis.', ok: false, data: null };
  }
  const flags = [
    `--limit ${Math.max(1, Math.min(200, opts.limit))}`,
    opts.minReviews > 0 ? `--min-reviews ${opts.minReviews}` : '',
    opts.simulate ? '--simulate' : '', // sans ce flag = vrai appel Google Places (~$1+)
    opts.judge ? '--judge' : '',       // jugement IA des sites (Claude)
    '--json',
  ].filter(Boolean).join(' ');
  // Le prospector ne demande confirmation que sous --estimate ; on l'omet ⇒ pas de prompt bloquant.
  const cmd = `pnpm --filter @nexuslocale/prospector scan ${shellQuote(niche)} ${shellQuote(location)} ${flags}`;
  const { out, ok } = await run(cmd, 240_000);
  const { data, logs } = extractJson<ProspectorResult>(out);
  return { out: logs, ok, data };
}

export async function runDemoGen(
  name: string,
  city: string,
  opts: { simulate: boolean; keywords?: string[]; nicheSite?: boolean },
): Promise<{ out: string; ok: boolean }> {
  const hasNames = name.trim() !== '' && city.trim() !== '';
  // niche-site = marque synthétisée (pas besoin de prospect Supabase) ; sinon prospect réel requis.
  if (!opts.simulate && !opts.nicheSite && !hasNames) {
    return { out: 'Nom de l’entreprise et ville requis (le prospect doit exister dans Supabase, via un scan Prospector).', ok: false };
  }
  if (opts.nicheSite && !hasNames) {
    return { out: 'Niche et ville requises pour bâtir un site de niche.', ok: false };
  }
  const kws = (opts.keywords ?? []).map(k => k.trim()).filter(Boolean);
  const flags = [
    hasNames ? `${shellQuote(name.trim())} ${shellQuote(city.trim())}` : '',
    opts.nicheSite ? '--niche-site' : '',
    opts.simulate ? '--simulate' : '',
    kws.length ? `--keywords ${shellQuote(kws.join(','))}` : '',
  ].filter(Boolean).join(' ');
  return run(`pnpm --filter @nexuslocale/demo-gen gen ${flags}`, 180_000);
}

export interface SubmitStep { title: string; details: string[] }
export interface SubmitResult {
  site_id: string;
  domain: string | null;
  estimate: boolean;
  sitemap: string;
  steps: SubmitStep[];
  urls: string[];
  keywords: string[];
}

export async function runGscSubmit(
  siteId: string,
  opts: { estimate: boolean; skipVerify: boolean; force: boolean },
): Promise<{ out: string; ok: boolean; data: SubmitResult | null }> {
  const flags = [
    opts.estimate   ? '--estimate'    : '',
    opts.skipVerify ? '--skip-verify' : '',
    opts.force      ? '--force'       : '',
    '--json',
  ].filter(Boolean).join(' ');
  const { out, ok } = await run(`pnpm --filter @nexuslocale/indexer-cli cli submit ${siteId} ${flags}`, 120_000);
  const { data, logs } = extractJson<SubmitResult>(out);
  return { out: logs, ok, data };
}

export interface RankPosition {
  keyword: string;
  position: number | null;
  page: string | null;
  clicks: number | null;
  impressions: number | null;
  ctr: number | null;
}
export interface RankResult {
  site_id: string;
  domain: string | null;
  estimate: boolean;
  positions: RankPosition[];
}

export async function runRank(
  siteId: string,
  opts: { estimate: boolean; withGsc: boolean; top: number },
): Promise<{ out: string; ok: boolean; data: RankResult | null }> {
  const flags = [
    opts.estimate ? '--estimate' : '',
    opts.withGsc  ? '--with-gsc' : '',
    `--top ${opts.top}`,
    '--json',
  ].filter(Boolean).join(' ');
  const { out, ok } = await run(`pnpm --filter @nexuslocale/indexer-cli cli rank ${siteId} ${flags}`, 360_000);
  const { data, logs } = extractJson<RankResult>(out);
  return { out: logs, ok, data };
}

export interface CronSiteResult {
  siteId: string;
  domain: string;
  status: 'tracked' | 'skipped' | 'dry-run' | 'error';
  note?: string;
  keywordsChecked: number;
  top20Count: number;
  statusChanged: boolean;
  error?: string;
}
export interface CronResult {
  date: string;
  dryRun: boolean;
  total: number;
  processed: number;
  results: CronSiteResult[];
}

export async function runCron(dryRun: boolean): Promise<{ out: string; ok: boolean; data: CronResult | null }> {
  const flags = [dryRun ? '--dry-run' : '', '--json'].filter(Boolean).join(' ');
  const { out, ok } = await run(`pnpm --filter @nexuslocale/indexer-cli cron ${flags}`, 300_000);
  const { data, logs } = extractJson<CronResult>(out);
  return { out: logs, ok, data };
}
