#!/usr/bin/env node
import { program }           from 'commander';
import * as readline         from 'readline';
import {
  hasGscCredentials,
  getDnsVerificationToken,
  verifySiteDns,
  addGscProperty,
  submitSitemap,
  inspectUrl,
  getSearchAnalytics,
  fetchSitemapUrls,
  trackKeywordPositions,
  SERP_COST_PER_KEYWORD_USD,
  getSiteById,
  getSitesForRanking,
  updateSiteGsc,
  updateSiteStatus,
  insertRankings,
  getRankingHistory,
  type IndexerSite,
  type SerpPosition,
} from '@nexuslocale/indexer';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad(s: string, n: number): string {
  return s.slice(0, n).padEnd(n);
}

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(`\n${question} [y/N] `, ans => { rl.close(); resolve(ans.trim().toLowerCase() === 'y'); });
  });
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function subDate(weeksAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - weeksAgo * 7);
  return d.toISOString().slice(0, 10);
}

function extractKeywords(site: IndexerSite, topN = 20): string[] {
  const kws = site.research_data?.keywords ?? [];
  return kws
    .filter(k => k.score > 0 && k.search_volume != null && k.search_volume > 0)
    .slice(0, topN)
    .map(k => k.keyword);
}

// ─── Mock data (--estimate / dry-run) ────────────────────────────────────────

function mockSite(id: string): IndexerSite {
  return {
    id,
    domain:       'degatdeausherbrooke.ca',
    status:       'built',
    gsc_property: null,
    research_data: {
      niche: "dégât d'eau",
      city:  'Sherbrooke QC',
      keywords: [
        { keyword: "dégât d'eau sherbrooke", search_volume: 880,  cpc: 22.60, keyword_difficulty: null, score: 398 },
        { keyword: "dégât d eau",            search_volume: 880,  cpc: 22.60, keyword_difficulty: null, score: 398 },
        { keyword: "degat des eaux",         search_volume: 90,   cpc: 25.34, keyword_difficulty: null, score: 46  },
        { keyword: "urgence dégât d'eau",    search_volume: 70,   cpc: 23.46, keyword_difficulty: null, score: 33  },
        { keyword: "restauration dégât eau", search_volume: 50,   cpc: 18.00, keyword_difficulty: null, score: 18  },
      ],
    },
  };
}

function mockSitemapUrls(domain: string): string[] {
  return [
    `https://${domain}/`,
    `https://${domain}/services`,
    `https://${domain}/contact`,
    `https://${domain}/devis`,
  ];
}

// ─── Affichage positions ──────────────────────────────────────────────────────

function printPositions(positions: SerpPosition[]): void {
  console.log('\n── Positions ─────────────────────────────────────────────────────────');
  console.log('  ' + pad('Mot-clé', 44) + pad('Pos.', 6) + 'Page');
  console.log('  ' + '─'.repeat(80));
  for (const p of positions) {
    const pos  = p.position != null ? String(p.position) : '—';
    const page = p.page ? p.page.replace(/^https?:\/\/[^/]+/, '') || '/' : '(hors top 100)';
    console.log('  ' + pad(p.keyword, 44) + pad(pos, 6) + page);
  }
}

// Sortie JSON consommée par le dashboard (Tracker) — entre marqueurs.
function emitRankJson(
  siteId: string,
  domain: string | null,
  estimate: boolean,
  positions: SerpPosition[],
  gsc?: Map<string, { impressions: number; clicks: number; ctr: number }>,
): void {
  const rows = positions.map(p => {
    const g = gsc?.get(p.keyword);
    return {
      keyword:     p.keyword,
      position:    p.position,
      page:        p.page ? (p.page.replace(/^https?:\/\/[^/]+/, '') || '/') : null,
      clicks:      g?.clicks      ?? null,
      impressions: g?.impressions ?? null,
      ctr:         g?.ctr         ?? null,
    };
  });
  console.log('__NEXUS_JSON__' + JSON.stringify({ site_id: siteId, domain, estimate, positions: rows }) + '__NEXUS_END__');
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMANDE : submit
// ═══════════════════════════════════════════════════════════════════════════════

program
  .command('submit <site_id>')
  .description('Soumet un site à Google Search Console : vérification, sitemap, inspection URLs')
  .option('--estimate',        'Montre les étapes sans appeler les API')
  .option('--skip-verify',     'Saute la vérification DNS (site déjà vérifié dans GSC)')
  .option('--force',           'Re-soumet même si gsc_property est déjà renseigné')
  .option('--use-indexing-api','Appelle aussi Google Indexing API (limité aux pages Job/BroadcastEvent)')
  .option('--json',            'Émet aussi le plan en JSON (pour le dashboard)')
  .action(async (siteId: string, opts: {
    estimate: boolean; skipVerify: boolean; force: boolean; useIndexingApi: boolean; json: boolean;
  }) => {
    console.log(`\n🚀 indexer submit ${siteId}${opts.estimate ? ' [ESTIMATE]' : ''}`);

    // ── Récupération du site ──────────────────────────────────────────────────
    let site: IndexerSite;
    if (opts.estimate) {
      site = mockSite(siteId);
      console.log(`   [mock] Site : ${site.domain} (données fictives — --estimate)`);
    } else {
      site = await getSiteById(siteId);
      console.log(`   Site   : ${site.domain ?? '(domaine non défini)'}`);
      console.log(`   Status : ${site.status}`);
    }

    if (!site.domain) {
      console.error('❌ Ce site n\'a pas encore de domaine. Achetez d\'abord avec finder buy.');
      process.exit(1);
    }

    if (site.gsc_property && !opts.force) {
      console.log(`   GSC    : déjà configuré (${site.gsc_property})`);
      console.log('   → Utilisez --force pour re-soumettre.');
    }

    const domain     = site.domain;
    const sitemapUrl = `https://${domain}/sitemap.xml`;
    const siteUrl    = `sc-domain:${domain}`;

    // ── Mode estimate ─────────────────────────────────────────────────────────
    if (opts.estimate) {
      const urls = mockSitemapUrls(domain);
      const kws  = extractKeywords(site);

      console.log('\n── Estimation — aucun appel API ──────────────────────────────────────');
      console.log(`\n  Étape 1 : Vérification DNS TXT`);
      console.log(`    → Récupère un token Google via Site Verification API`);
      console.log(`    → Vous affichez les instructions pour ajouter un TXT record`);
      console.log(`    → Vous confirmez, puis l'API vérifie la propriété`);
      console.log(`\n  Étape 2 : Ajout propriété Search Console`);
      console.log(`    → PUT sc-domain:${domain}`);
      console.log(`\n  Étape 3 : Soumission sitemap`);
      console.log(`    → ${sitemapUrl}`);
      console.log(`\n  Étape 4 : Inspection URL (${urls.length} URLs)`);
      for (const u of urls) console.log(`    → ${u}`);
      console.log(`\n  Étape 5 : Supabase`);
      console.log(`    → sites.gsc_property = "${siteUrl}"`);
      console.log(`    → sites.status       : built → indexed`);
      console.log(`\n  Mots-clés qui seront trackés ensuite (${kws.length}) :`);
      for (const k of kws.slice(0, 5)) console.log(`    · ${k}`);
      if (kws.length > 5) console.log(`    … et ${kws.length - 5} autres`);
      if (opts.useIndexingApi) {
        console.log('\n  ⚠  --use-indexing-api : Google Indexing API supporte officiellement');
        console.log('     UNIQUEMENT JobPosting et BroadcastEvent. Pour des pages ordinaires,');
        console.log('     cette option peut fonctionner mais n\'est pas garantie par Google.');
      }
      console.log('\n  ℹ  Retirez --estimate pour exécuter réellement.');
      if (opts.json) {
        const steps = [
          { title: 'Vérification DNS TXT', details: ['Token Google via Site Verification API', 'Ajout d\'un enregistrement TXT', 'Vérification de la propriété'] },
          { title: 'Ajout propriété Search Console', details: [`PUT sc-domain:${domain}`] },
          { title: 'Soumission du sitemap', details: [sitemapUrl] },
          { title: `Inspection des URLs (${urls.length})`, details: urls },
          { title: 'Mise à jour Supabase', details: [`gsc_property = "${siteUrl}"`, 'status : built → indexed'] },
        ];
        console.log('__NEXUS_JSON__' + JSON.stringify({ kind: 'submit', site_id: siteId, domain, estimate: true, sitemap: sitemapUrl, steps, urls, keywords: kws }) + '__NEXUS_END__');
      }
      return;
    }

    // ── Vérification des credentials ─────────────────────────────────────────
    if (!hasGscCredentials()) {
      console.error('❌ GSC_CLIENT_EMAIL et GSC_PRIVATE_KEY requis dans .env');
      console.error('   Voir apps/indexer/README.md → Setup Google Service Account');
      process.exit(1);
    }

    // ── Étape 1 : Vérification DNS ────────────────────────────────────────────
    if (!opts.skipVerify && (!site.gsc_property || opts.force)) {
      console.log('\n── Étape 1 : Vérification DNS TXT ───────────────────────────────────');
      process.stdout.write('[gsc] Récupération du token de vérification…');
      const verif = await getDnsVerificationToken(domain);
      console.log(' ✓');
      console.log('\n' + verif.dnsInstructions);

      const go = await confirm('DNS TXT record ajouté et propagé ? Lancer la vérification ?');
      if (!go) { console.log('Annulé. Relancez une fois le record DNS ajouté.'); return; }

      process.stdout.write('[gsc] Vérification du site…');
      await verifySiteDns(domain);
      console.log(' ✓');
    } else {
      console.log('\n── Étape 1 : Vérification DNS — ignorée (--skip-verify ou déjà fait)');
    }

    // ── Étape 2 : Propriété GSC ───────────────────────────────────────────────
    console.log('\n── Étape 2 : Propriété Search Console ───────────────────────────────');
    process.stdout.write(`[gsc] Ajout propriété sc-domain:${domain}…`);
    const gscProp = await addGscProperty(domain);
    console.log(' ✓');
    await updateSiteGsc(siteId, gscProp);

    // ── Étape 3 : Sitemap ─────────────────────────────────────────────────────
    console.log('\n── Étape 3 : Soumission sitemap ─────────────────────────────────────');
    process.stdout.write(`[gsc] ${sitemapUrl}…`);
    await submitSitemap(gscProp, sitemapUrl);
    console.log(' ✓');

    // ── Étape 4 : Inspection URLs ─────────────────────────────────────────────
    console.log('\n── Étape 4 : Inspection des URLs ────────────────────────────────────');
    process.stdout.write(`[sitemap] Lecture de ${sitemapUrl}…`);
    let urls: string[];
    try {
      urls = await fetchSitemapUrls(sitemapUrl);
      console.log(` ✓ (${urls.length} URLs)`);
    } catch {
      console.log(' ✗ Sitemap inaccessible — le site est-il déployé ?');
      urls = [];
    }

    if (opts.useIndexingApi) {
      console.log('  ⚠  --use-indexing-api activé (limité JobPosting/BroadcastEvent officiellement)');
    }

    let indexable = 0;
    for (const url of urls) {
      process.stdout.write(`  ↳ ${url.padEnd(60)}`);
      try {
        // 200 ms entre chaque requête pour respecter les quotas GSC
        await new Promise(r => setTimeout(r, 200));
        const result = await inspectUrl(gscProp, url);
        const icon   = result.verdict === 'PASS' ? '✓' : result.verdict === 'FAIL' ? '✗' : '~';
        console.log(`${icon} ${result.verdict} (${result.coverageState})`);
        if (result.verdict === 'PASS') indexable++;
      } catch (e: unknown) {
        console.log(`✗ ${e instanceof Error ? e.message.slice(0, 60) : e}`);
      }
    }

    // ── Étape 5 : Mise à jour status ──────────────────────────────────────────
    console.log('\n── Résultat ──────────────────────────────────────────────────────────');
    console.log(`  ${indexable}/${urls.length} URLs indexables`);
    await updateSiteStatus(siteId, 'indexed');
    console.log(`  sites.status → 'indexed'  ✓`);
    console.log(`\n  Prochaine étape : indexer rank ${siteId}`);
    console.log();
  });

// ═══════════════════════════════════════════════════════════════════════════════
// COMMANDE : rank
// ═══════════════════════════════════════════════════════════════════════════════

program
  .command('rank <site_id>')
  .description('Vérifie les positions SERP pour un site via DataForSEO')
  .option('--estimate',  'Montre le coût estimé sans appeler DataForSEO')
  .option('--with-gsc',  'Enrichit avec les données GSC Search Analytics (clics/impressions)')
  .option('--top <n>',   'Nombre de mots-clés à vérifier (défaut: 20)', parseInt, 20)
  .option('--json',      'Émet aussi les positions en JSON (pour le dashboard)')
  .action(async (siteId: string, opts: { estimate: boolean; withGsc: boolean; top: number; json: boolean }) => {
    console.log(`\n📊 indexer rank ${siteId}${opts.estimate ? ' [ESTIMATE]' : ''}`);

    // ── Récupération du site ──────────────────────────────────────────────────
    let site: IndexerSite;
    if (opts.estimate) {
      site = mockSite(siteId);
      console.log(`   [mock] Site : ${site.domain} (données fictives)`);
    } else {
      site = await getSiteById(siteId);
      console.log(`   Site   : ${site.domain ?? '(sans domaine)'}`);
    }

    if (!site.domain) {
      console.error('❌ Pas de domaine sur ce site.');
      process.exit(1);
    }

    const keywords = extractKeywords(site, opts.top);
    if (keywords.length === 0) {
      console.error('❌ Aucun mot-clé dans research_data. Lancez d\'abord finder scan.');
      process.exit(1);
    }

    const estimatedCost = keywords.length * SERP_COST_PER_KEYWORD_USD;
    console.log(`   Domaine        : ${site.domain}`);
    console.log(`   Mots-clés      : ${keywords.length}`);
    console.log(`   Coût estimé    : ~$${estimatedCost.toFixed(4)} USD`);

    // ── Mode estimate ─────────────────────────────────────────────────────────
    if (opts.estimate) {
      console.log('\n── Mots-clés qui seraient vérifiés ──────────────────────────────────');
      for (const kw of keywords) console.log(`  · ${kw}`);
      console.log(`\n── Résultat simulé ───────────────────────────────────────────────────`);
      const mock: SerpPosition[] = keywords.map((kw, i) => ({
        keyword:  kw,
        position: i < 2 ? Math.floor(Math.random() * 30) + 1 : null,
        page:     i < 2 ? `https://${site.domain}/` : null,
      }));
      printPositions(mock);
      console.log('\n  ℹ  Positions fictives. Retirez --estimate pour les vraies métriques.');
      if (opts.json) emitRankJson(siteId, site.domain, true, mock);
      return;
    }

    // ── Credentials ───────────────────────────────────────────────────────────
    const dfsLogin    = process.env['DATAFORSEO_LOGIN'];
    const dfsPassword = process.env['DATAFORSEO_PASSWORD'];
    if (!dfsLogin || !dfsPassword) {
      console.error('❌ DATAFORSEO_LOGIN et DATAFORSEO_PASSWORD requis dans .env');
      process.exit(1);
    }

    const ok = await confirm(`Lancer le rank tracking (~$${estimatedCost.toFixed(4)} USD) ?`);
    if (!ok) { console.log('Annulé.'); return; }

    // ── DataForSEO SERP ───────────────────────────────────────────────────────
    const research    = site.research_data;
    const locationName = research?.country === 'CA' ? 'Canada' : (research?.country ?? 'Canada');
    const languageName = research?.lang === 'fr' ? 'French' : 'English';

    console.log(`\n[serp] Soumission ${keywords.length} tâches…`);
    const positions = await trackKeywordPositions({
      domain:       site.domain,
      keywords,
      locationName,
      languageName,
      login:        dfsLogin,
      password:     dfsPassword,
    });

    // ── GSC Search Analytics (optionnel) ──────────────────────────────────────
    const gscRows = new Map<string, { impressions: number; clicks: number; ctr: number }>();
    if (opts.withGsc && hasGscCredentials() && site.gsc_property) {
      process.stdout.write('[gsc] Search Analytics…');
      try {
        const rows = await getSearchAnalytics(site.gsc_property, subDate(4), today());
        for (const r of rows) {
          gscRows.set(r.keyword, { impressions: r.impressions, clicks: r.clicks, ctr: r.ctr });
        }
        console.log(` ✓ (${rows.length} mots-clés avec données GSC)`);
      } catch (e: unknown) {
        console.log(` ✗ ${e instanceof Error ? e.message.slice(0, 80) : e}`);
      }
    }

    // ── Affichage ─────────────────────────────────────────────────────────────
    printPositions(positions);
    if (opts.json) emitRankJson(siteId, site.domain, false, positions, gscRows);

    // ── Sauvegarde dans rankings ──────────────────────────────────────────────
    const checkedAt = today();
    const rows = positions.map(p => {
      const gsc = gscRows.get(p.keyword);
      return {
        site_id:     siteId,
        keyword:     p.keyword,
        position:    p.position,
        page:        p.page,
        impressions: gsc?.impressions ?? null,
        clicks:      gsc?.clicks      ?? null,
        ctr:         gsc?.ctr         ?? null,
        checked_at:  checkedAt,
        source:      opts.withGsc && gsc ? 'dataforseo+gsc' : 'dataforseo',
      };
    });

    await insertRankings(rows);
    console.log(`\n[rank] ${rows.length} lignes enregistrées dans rankings (${checkedAt})  ✓`);

    // ── Mise à jour status si top 20 ──────────────────────────────────────────
    const top20 = positions.filter(p => p.position != null && p.position <= 20);
    if (top20.length > 0 && site.status === 'indexed') {
      await updateSiteStatus(siteId, 'ranking');
      console.log(`[rank] ${top20.length} mot(s) dans le top 20 → status 'ranking'  ✓`);
    }

    // ── Alerte si aucune position ─────────────────────────────────────────────
    const history = await getRankingHistory(siteId);
    const oldestRun = history.at(-1)?.checked_at;
    if (oldestRun) {
      const weeksElapsed = Math.floor(
        (Date.now() - new Date(oldestRun).getTime()) / (7 * 24 * 3600 * 1000)
      );
      const hasAnyTop100 = history.some(r => r.position != null);
      if (!hasAnyTop100 && weeksElapsed >= 4) {
        console.log(`\n  ⚠  Aucune position top 100 après ${weeksElapsed} semaines.`);
        console.log('     → Envisagez d\'ajouter des pages longue traîne ou des citations locales.');
      }
    }

    console.log();
  });

// ═══════════════════════════════════════════════════════════════════════════════
// COMMANDE : history
// ═══════════════════════════════════════════════════════════════════════════════

program
  .command('history <site_id>')
  .description('Affiche l\'historique des positions pour un site')
  .option('--keyword <kw>', 'Filtre sur un mot-clé spécifique')
  .option('--limit <n>',    'Nombre de lignes max', parseInt, 50)
  .action(async (siteId: string, opts: { keyword?: string; limit: number }) => {
    const rows = await getRankingHistory(siteId, opts.keyword);
    const display = rows.slice(0, opts.limit);

    if (display.length === 0) {
      console.log('Aucun historique trouvé.');
      return;
    }

    console.log('\n── Historique des positions ──────────────────────────────────────────');
    console.log('  ' + pad('Date', 12) + pad('Mot-clé', 40) + pad('Pos.', 6) + 'Source');
    console.log('  ' + '─'.repeat(72));
    for (const r of display) {
      const pos = r.position != null ? String(r.position) : '—';
      console.log('  ' + pad(r.checked_at, 12) + pad(r.keyword, 40) + pad(pos, 6) + r.source);
    }
    if (rows.length > opts.limit) {
      console.log(`  … et ${rows.length - opts.limit} autres lignes`);
    }
    console.log();
  });

program.name('indexer').parse();
