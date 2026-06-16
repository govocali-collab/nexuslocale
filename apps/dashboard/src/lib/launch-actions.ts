'use server';

import { exec } from 'child_process';
import path from 'path';

const ROOT = path.resolve(process.cwd(), '../..');

function run(cmd: string, timeoutMs = 90_000): Promise<{ out: string; ok: boolean }> {
  return new Promise(resolve => {
    exec(cmd, { cwd: ROOT, env: process.env, timeout: timeoutMs }, (err, stdout, stderr) => {
      const out = [stdout, stderr].filter(Boolean).join('\n').trim();
      resolve({ out: out || (err?.message ?? '(aucune sortie)'), ok: !err || !!stdout });
    });
  });
}

function shellQuote(s: string): string {
  // Wrap in single quotes, escaping any embedded single quote — safe for exec().
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

export async function runFinderScan(
  niche: string,
  city: string,
  opts: { country: string; lang: string; limit: number; maxDifficulty?: number; estimate: boolean },
): Promise<{ out: string; ok: boolean }> {
  if (!niche.trim() || !city.trim()) {
    return { out: 'Niche et ville sont requis.', ok: false };
  }
  const flags = [
    `--country ${opts.country}`,
    `--lang ${opts.lang}`,
    `--limit ${Math.max(10, Math.min(500, opts.limit))}`,
    opts.maxDifficulty !== undefined ? `--max-difficulty ${opts.maxDifficulty}` : '',
    opts.estimate ? '--estimate' : '--yes', // live runs auto-confirm the cost prompt
  ].filter(Boolean).join(' ');
  const cmd = `pnpm --filter @nexuslocale/finder cli scan ${shellQuote(niche)} ${shellQuote(city)} ${flags}`;
  return run(cmd, 240_000);
}

export async function runProspectorScan(
  niche: string,
  location: string,
  opts: { limit: number; minReviews: number; simulate: boolean },
): Promise<{ out: string; ok: boolean }> {
  if (!niche.trim() || !location.trim()) {
    return { out: 'Niche et ville sont requis.', ok: false };
  }
  const flags = [
    `--limit ${Math.max(1, Math.min(200, opts.limit))}`,
    opts.minReviews > 0 ? `--min-reviews ${opts.minReviews}` : '',
    opts.simulate ? '--simulate' : '', // sans ce flag = vrai appel Google Places (~$1+)
  ].filter(Boolean).join(' ');
  // Le prospector ne demande confirmation que sous --estimate ; on l'omet ⇒ pas de prompt bloquant.
  const cmd = `pnpm --filter @nexuslocale/prospector scan ${shellQuote(niche)} ${shellQuote(location)} ${flags}`;
  return run(cmd, 240_000);
}

export async function runGscSubmit(
  siteId: string,
  opts: { estimate: boolean; skipVerify: boolean; force: boolean },
): Promise<{ out: string; ok: boolean }> {
  const flags = [
    opts.estimate   ? '--estimate'    : '',
    opts.skipVerify ? '--skip-verify' : '',
    opts.force      ? '--force'       : '',
  ].filter(Boolean).join(' ');
  return run(`pnpm --filter @nexuslocale/indexer-cli cli submit ${siteId} ${flags}`, 120_000);
}

export async function runRank(
  siteId: string,
  opts: { estimate: boolean; withGsc: boolean; top: number },
): Promise<{ out: string; ok: boolean }> {
  const flags = [
    opts.estimate ? '--estimate' : '',
    opts.withGsc  ? '--with-gsc' : '',
    `--top ${opts.top}`,
  ].filter(Boolean).join(' ');
  return run(`pnpm --filter @nexuslocale/indexer-cli cli rank ${siteId} ${flags}`, 360_000);
}

export async function runCron(dryRun: boolean): Promise<{ out: string; ok: boolean }> {
  const flags = dryRun ? '--dry-run' : '';
  return run(`pnpm --filter @nexuslocale/indexer-cli cron ${flags}`, 300_000);
}
