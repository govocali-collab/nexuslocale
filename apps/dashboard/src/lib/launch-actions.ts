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
