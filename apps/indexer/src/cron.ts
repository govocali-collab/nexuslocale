/**
 * Cron : rank tracking hebdomadaire pour tous les sites status indexed/ranking/rented.
 *
 * Usage :
 *   npx dotenv -e ../../.env -- tsx src/cron.ts
 *
 * Vercel Cron : ajoutez dans apps/dashboard/vercel.json :
 *   { "crons": [{ "path": "/api/cron/rank", "schedule": "0 8 * * 1" }] }
 * Et dans l'API route, importez et appelez runRankCron().
 *
 * GitHub Actions : voir apps/indexer/README.md → Setup Cron.
 */

import {
  getSitesForRanking,
  trackKeywordPositions,
  getSearchAnalytics,
  hasGscCredentials,
  insertRankings,
  updateSiteStatus,
  getRankingHistory,
  type IndexerSite,
} from '@nexuslocale/indexer';

const TOP_KEYWORDS = 20;
const STALE_WEEKS  = 6;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function subDate(weeksAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - weeksAgo * 7);
  return d.toISOString().slice(0, 10);
}

function extractKeywords(site: IndexerSite): string[] {
  return (site.research_data?.keywords ?? [])
    .filter(k => k.score > 0 && (k.search_volume ?? 0) > 0)
    .slice(0, TOP_KEYWORDS)
    .map(k => k.keyword);
}

export interface CronResult {
  siteId:       string;
  domain:       string;
  keywordsChecked: number;
  top20Count:   number;
  statusChanged: boolean;
  error?:       string;
}

export async function runRankCron(opts: { dryRun?: boolean } = {}): Promise<CronResult[]> {
  const dfsLogin    = process.env['DATAFORSEO_LOGIN'];
  const dfsPassword = process.env['DATAFORSEO_PASSWORD'];
  if (!dfsLogin || !dfsPassword) {
    throw new Error('DATAFORSEO_LOGIN et DATAFORSEO_PASSWORD requis dans .env');
  }

  const sites = await getSitesForRanking();
  console.log(`[cron] ${sites.length} site(s) à vérifier (${today()})${opts.dryRun ? ' [DRY-RUN]' : ''}`);

  const results: CronResult[] = [];

  for (const site of sites) {
    if (!site.domain) {
      console.log(`  ⚠  ${site.id} — pas de domaine, ignoré`);
      continue;
    }

    const keywords = extractKeywords(site);
    if (keywords.length === 0) {
      console.log(`  ⚠  ${site.domain} — pas de mots-clés, ignoré`);
      continue;
    }

    console.log(`\n  [${site.domain}] ${keywords.length} mots-clés…`);

    if (opts.dryRun) {
      console.log(`    → DRY-RUN : aucun appel API`);
      results.push({ siteId: site.id, domain: site.domain, keywordsChecked: keywords.length, top20Count: 0, statusChanged: false });
      continue;
    }

    try {
      const research     = site.research_data;
      const locationName = research?.country === 'CA' ? 'Canada' : (research?.country ?? 'Canada');
      const languageName = research?.lang === 'fr' ? 'French' : 'English';

      const positions = await trackKeywordPositions({
        domain: site.domain,
        keywords,
        locationName,
        languageName,
        login:    dfsLogin,
        password: dfsPassword,
      });

      // Optionally enrich with GSC data
      const gscRows = new Map<string, { impressions: number; clicks: number; ctr: number }>();
      if (hasGscCredentials() && site.gsc_property) {
        try {
          const rows = await getSearchAnalytics(site.gsc_property, subDate(4), today());
          for (const r of rows) gscRows.set(r.keyword, { impressions: r.impressions, clicks: r.clicks, ctr: r.ctr });
        } catch { /* GSC optional — silently skip */ }
      }

      const checkedAt = today();
      await insertRankings(positions.map(p => {
        const gsc = gscRows.get(p.keyword);
        return {
          site_id:     site.id,
          keyword:     p.keyword,
          position:    p.position,
          page:        p.page,
          impressions: gsc?.impressions ?? null,
          clicks:      gsc?.clicks      ?? null,
          ctr:         gsc?.ctr         ?? null,
          checked_at:  checkedAt,
          source:      gsc ? 'dataforseo+gsc' : 'dataforseo',
        };
      }));

      const top20Count = positions.filter(p => p.position != null && p.position <= 20).length;
      let statusChanged = false;

      if (top20Count > 0 && site.status === 'indexed') {
        await updateSiteStatus(site.id, 'ranking');
        statusChanged = true;
        console.log(`    ✓ ${top20Count} mot(s) top 20 → status 'ranking'`);
      }

      // Alerte sites sans résultats
      const history = await getRankingHistory(site.id);
      const oldestRun = history.at(-1)?.checked_at;
      if (oldestRun) {
        const weeksElapsed = Math.floor(
          (Date.now() - new Date(oldestRun).getTime()) / (7 * 24 * 3600 * 1000)
        );
        const hasAnyTop100 = history.some(r => r.position != null);
        if (!hasAnyTop100 && weeksElapsed >= STALE_WEEKS) {
          console.log(`    ⚠  Aucune position top 100 après ${weeksElapsed} semaines → À revoir`);
        }
      }

      results.push({ siteId: site.id, domain: site.domain, keywordsChecked: keywords.length, top20Count, statusChanged });
      console.log(`    ✓ ${positions.length} positions enregistrées`);

    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : String(e);
      console.error(`    ✗ Erreur : ${error}`);
      results.push({ siteId: site.id, domain: site.domain, keywordsChecked: 0, top20Count: 0, statusChanged: false, error });
    }
  }

  console.log(`\n[cron] Terminé — ${results.filter(r => !r.error).length}/${sites.length} sites traités`);
  return results;
}

// ─── Point d'entrée direct ────────────────────────────────────────────────────

const isDryRun = process.argv.includes('--dry-run');
runRankCron({ dryRun: isDryRun }).catch(e => {
  console.error('[cron] Erreur fatale :', e instanceof Error ? e.message : e);
  process.exit(1);
});
