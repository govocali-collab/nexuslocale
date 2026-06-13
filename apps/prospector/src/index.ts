#!/usr/bin/env tsx
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import readline from 'node:readline';
import { program } from 'commander';

import { collectPlaces } from './places.js';
import { analyzeAll } from './analyzer.js';
import { scoreAll } from './scorer.js';
import { upsertProspects } from './db.js';
import { printTable, exportCsv } from './output.js';
import type { PlaceResult, ScanOptions } from './types.js';
import { PLACES_API_COST } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── CLI ─────────────────────────────────────────────────────────────────────

program
  .name('prospector')
  .description('Scanne Google Places, score les prospects, écrit dans Supabase');

program
  .command('scan <niche> <location>')
  .description('Lance un scan de prospects pour une niche et une ville')
  .option('--estimate',          'Affiche le coût API estimé et demande confirmation')
  .option('--simulate',          'Utilise les données de fixtures (sans appeler l\'API)')
  .option('--limit <n>',         'Nombre max d\'entreprises analysées', '60')
  .option('--min-reviews <n>',   'Exclure les entreprises sous ce nombre d\'avis', '0')
  .action(async (niche: string, location: string, opts: Record<string, string | boolean>) => {
    const options: ScanOptions = {
      limit:      Number(opts['limit']      ?? 60),
      minReviews: Number(opts['minReviews'] ?? 0),
      estimate:   Boolean(opts['estimate']),
      simulate:   Boolean(opts['simulate']),
    };

    await runScan(niche, location, options);
  });

program.parse(process.argv);

// ─── Scan principal ───────────────────────────────────────────────────────────

async function runScan(niche: string, location: string, options: ScanOptions) {
  const city = location.replace(/\s*,?\s*(QC|ON|BC|AB|MB|SK|NS|NB|PE|NL|NT|NU|YT)\s*$/i, '').trim();

  // ── Estimation coût ────────────────────────────────────────────────────
  if (options.estimate || !options.simulate) {
    const pages       = Math.ceil(options.limit / 20);
    const searchCost  = pages        * PLACES_API_COST.textSearch;
    const detailCost  = options.limit * PLACES_API_COST.placeDetails;
    const totalCost   = searchCost + detailCost;

    console.log('\n── Estimation du coût Google Places API ──────────────────');
    console.log(`  Niche          : ${niche}`);
    console.log(`  Localisation   : ${location}`);
    console.log(`  Limite         : ${options.limit} entreprises (${pages} page(s) Text Search)`);
    console.log(`  Text Search    : ${pages} × $${PLACES_API_COST.textSearch}  = $${searchCost.toFixed(3)}`);
    console.log(`  Place Details  : ${options.limit} × $${PLACES_API_COST.placeDetails} = $${detailCost.toFixed(3)}`);
    console.log(`  Total estimé   : ~$${totalCost.toFixed(2)} USD`);
    console.log('  ⚠  Tarifs approximatifs — vérifier console.cloud.google.com');
    console.log('──────────────────────────────────────────────────────────\n');

    if (options.estimate && !options.simulate) {
      const confirmed = await confirm('Lancer le scan ? (o/N) : ');
      if (!confirmed) {
        console.log('Scan annulé.');
        process.exit(0);
      }
    }
  }

  // ── Collecte des données ───────────────────────────────────────────────
  let places: PlaceResult[];

  if (options.simulate) {
    places = await loadFixtures(niche, location);
    console.log(`\n[simulate] ${places.length} résultats chargés depuis les fixtures`);
  } else {
    const apiKey = process.env['GOOGLE_PLACES_API_KEY'];
    if (!apiKey) {
      console.error('[error] GOOGLE_PLACES_API_KEY manquant dans .env');
      console.error('        Utilisez --simulate pour un test sans API key.');
      process.exit(1);
    }
    places = await collectPlaces(niche, location, apiKey, {
      limit:      options.limit,
      minReviews: options.minReviews,
    });
  }

  // Filtre min-reviews sur les fixtures aussi
  if (options.minReviews > 0) {
    places = places.filter((p) => (p.review_count ?? 0) >= options.minReviews);
    console.log(`[filter] ${places.length} après --min-reviews ${options.minReviews}`);
  }

  if (places.length === 0) {
    console.log('Aucun résultat après filtrage.');
    process.exit(0);
  }

  // ── Analyse des sites web ──────────────────────────────────────────────
  console.log(`\n[analyzer] Analyse de ${places.length} site(s) web…`);

  // En mode simulate, on génère des analyses fictives cohérentes
  const analyzed = options.simulate
    ? simulateAnalysis(places)
    : await analyzeAll(places);

  // ── Scoring ────────────────────────────────────────────────────────────
  const scored = scoreAll(analyzed);

  // ── Tableau terminal ───────────────────────────────────────────────────
  printTable(scored);

  // ── Export CSV ─────────────────────────────────────────────────────────
  const csvPath = exportCsv(scored, niche, city);
  console.log(`\n📄 CSV exporté : ${csvPath}`);

  // ── Écriture Supabase ──────────────────────────────────────────────────
  if (!options.simulate) {
    console.log('\n[db] Écriture dans Supabase…');
    const { written, skipped } = await upsertProspects(scored, niche, city);
    console.log(`[db] ✓ ${written} écrit(s), ${skipped} ignoré(s)`);
  } else {
    console.log('\n[simulate] Écriture Supabase ignorée en mode --simulate');
  }
}

// ─── Analyse simulée (pour --simulate sans appels réseau) ────────────────────

function simulateAnalysis(places: PlaceResult[]) {
  const { analyzeAll: _unused, ..._ } = { analyzeAll: null }; // évite import inutilisé
  void _unused; void _;

  // Données d'analyse précalculées cohérentes avec les fixtures
  const analysisMap: Record<string, { pain: number; issues: string[] }> = {
    'Excavation Lapointe':          { pain: 30, issues: ['Pas de HTTPS', 'Copyright 2019 — site non maintenu'] },
    'Excavation Roy':               { pain: 40, issues: ['Lien mort ou erreur réseau'] },
    "Services d'excavation Cloutier": { pain: 30, issues: ['Builder daté ou générique (Wix, GoDaddy, Squarespace…)', 'Pas de version mobile (viewport manquant)'] },
    'Excavation Gagnon & Associés': { pain: 20, issues: ['Pas de HTTPS', 'Copyright 2020 — site non maintenu'] },
    'Excavation Bergeron':          { pain: 0,  issues: [] },
  };

  return places.map((p) => {
    if (p.web_presence === 'none') {
      return { ...p, pain_score: 100, prospect_score: 0, detected_issues: ['Aucun site web'] };
    }
    if (p.web_presence === 'social_only') {
      return { ...p, pain_score: 100, prospect_score: 0, detected_issues: ['Présence web limitée aux réseaux sociaux'] };
    }
    const a = analysisMap[p.business_name] ?? { pain: 15, issues: ['Site fonctionnel'] };
    return { ...p, pain_score: a.pain, prospect_score: 0, detected_issues: a.issues };
  });
}

// ─── Chargement des fixtures ──────────────────────────────────────────────────

async function loadFixtures(niche: string, location: string): Promise<PlaceResult[]> {
  // Cherche un fichier fixture correspondant à la niche + ville
  const slug    = `${niche.toLowerCase()}-${location.toLowerCase().split(' ')[0]}`;
  const require = createRequire(import.meta.url);
  const paths   = [
    path.join(__dirname, '..', 'fixtures', `${slug}.json`),
    path.join(__dirname, '..', 'fixtures', 'granby-excavation.json'), // fallback
  ];

  for (const p of paths) {
    try {
      return require(p) as PlaceResult[];
    } catch {
      continue;
    }
  }

  throw new Error(`Aucune fixture trouvée pour "${niche}" "${location}". Créez fixtures/${slug}.json`);
}

// ─── Confirmation interactive ─────────────────────────────────────────────────

function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'o');
    });
  });
}
