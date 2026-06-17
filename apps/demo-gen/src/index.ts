#!/usr/bin/env node
import { program } from 'commander';
import { fetchProspectByName, fetchTopProspects } from './db.js';
import { enrichFromPlaces } from './enrich.js';
import { generateContent } from './generator.js';
import { generateMockContent, MOCK_PROSPECT } from './mock.js';
import { assembleAndWrite } from './assembler.js';
import { ANTHROPIC_COST, type ProspectFull } from './types.js';

// ─── Coût estimé ─────────────────────────────────────────────────────────────

function printEstimate(count: number): void {
  const { INPUT_PER_MTOK, OUTPUT_PER_MTOK, EST_INPUT_TOKENS, EST_OUTPUT_TOKENS } = ANTHROPIC_COST;
  const costPerConfig =
    (EST_INPUT_TOKENS  / 1_000_000) * INPUT_PER_MTOK +
    (EST_OUTPUT_TOKENS / 1_000_000) * OUTPUT_PER_MTOK;

  console.log(`
── Estimation du coût Anthropic (claude-sonnet-4-6) ──────────
  Input estimé    : ~${EST_INPUT_TOKENS.toLocaleString()} tokens  → $${((EST_INPUT_TOKENS / 1_000_000) * INPUT_PER_MTOK).toFixed(4)}
  Output estimé   : ~${EST_OUTPUT_TOKENS.toLocaleString()} tokens  → $${((EST_OUTPUT_TOKENS / 1_000_000) * OUTPUT_PER_MTOK).toFixed(4)}
  Coût par config : ~$${costPerConfig.toFixed(4)} USD
  Configs à générer : ${count}
  Total estimé    : ~$${(costPerConfig * count).toFixed(4)} USD
  ⚠  Tarifs approximatifs — vérifier console.anthropic.com
──────────────────────────────────────────────────────────────`);
}

function askConfirmation(): Promise<boolean> {
  return new Promise((resolve) => {
    process.stdout.write('\nContinuer? [o/N] ');
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (chunk) => {
      resolve(String(chunk).trim().toLowerCase() === 'o');
    });
  });
}

// ─── Génération d'un config ───────────────────────────────────────────────────

async function genOne(
  prospect: ProspectFull,
  opts: { simulate: boolean; apiKey?: string | undefined; placesKey?: string | undefined },
): Promise<void> {
  const { simulate, apiKey, placesKey } = opts;

  // Enrichissement Places (optionnel)
  let enriched = prospect;
  if (!simulate && placesKey) {
    process.stdout.write(`[places] Enrichissement "${prospect.business_name}"…\n`);
    enriched = await enrichFromPlaces(prospect, placesKey);
  }

  // Génération du contenu
  let generated;
  if (simulate) {
    process.stdout.write('[gen] Mode --simulate : contenu fictif (sans API)\n');
    generated = generateMockContent(enriched);
  } else {
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY absent. Utilisez --simulate pour générer sans API.',
      );
    }
    process.stdout.write(`[gen] Génération via claude-sonnet-4-6…\n`);
    try {
      generated = await generateContent(enriched, apiKey);
    } catch (err) {
      const msg = (err as Error).message;
      process.stderr.write(`[gen] Échec : ${msg}\n[gen] Nouvelle tentative…\n`);
      generated = await generateContent(enriched, apiKey, `Précédente tentative invalide : ${msg}`);
    }
  }

  // Assemblage + validation + écriture
  const result = assembleAndWrite(enriched, generated);

  console.log(`
✅ ${prospect.business_name}
   Fichier   : ${result.filePath}
   Domaine   : ${result.domain}
   Services  : ${result.pages} pages
   Zones     : ${result.zones} villes

   Prochaine étape :
   npx dotenv -e .env -- npx tsx apps/site-template/scripts/deploy.mts \\
     configs/${result.filePath.split('/configs/')[1] ?? ''} --demo`);
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

program
  .name('demo-gen')
  .description('Génère un config.json de démo personnalisé pour un prospect')
  .argument('[name]', 'Nom de l\'entreprise (guillemets si plusieurs mots)')
  .argument('[city]', 'Ville (ex: "Granby QC")')
  .option('--top <n>',   'Prendre les N meilleurs prospects (status=new)', parseInt)
  .option('--estimate',  'Afficher le coût API estimé avant de lancer')
  .option('--simulate',  'Générer sans API (contenu fictif, pour tester)')
  .action(async (name?: string, city?: string, options?: {
    top?: number;
    estimate?: boolean;
    simulate?: boolean;
  }) => {
    const simulate = options?.simulate ?? false;
    const apiKey   = process.env['ANTHROPIC_API_KEY'] || undefined;
    const placesKey = process.env['GOOGLE_PLACES_API_KEY'] || undefined;

    // Résolution des prospects
    let prospects: ProspectFull[] = [];

    if (simulate && !name && !options?.top) {
      // Mode démo pure sans aucun arg → prospect fictif intégré
      prospects = [MOCK_PROSPECT];
    } else if (options?.top) {
      prospects = await fetchTopProspects(options.top);
    } else if (name && city) {
      prospects = [await fetchProspectByName(name, city)];
    } else if (name && !city) {
      console.error('Usage : demo-gen "<nom>" "<ville>"  ou  demo-gen --top <n>');
      process.exit(1);
    } else {
      console.error('Usage : demo-gen "<nom>" "<ville>"  ou  demo-gen --top <n>  ou  demo-gen --simulate');
      process.exit(1);
    }

    // Estimation du coût
    if (options?.estimate && !simulate) {
      printEstimate(prospects.length);
      const ok = await askConfirmation();
      if (!ok) { console.log('Annulé.'); process.exit(0); }
    }

    // Génération
    let success = 0;
    for (const p of prospects) {
      try {
        await genOne(p, { simulate, apiKey, placesKey });
        success++;
      } catch (err) {
        console.error(`\n❌ ${p.business_name} : ${(err as Error).message}`);
      }
    }

    if (prospects.length > 1) {
      console.log(`\n${success}/${prospects.length} config(s) généré(s).`);
    }
  });

program.parse();
