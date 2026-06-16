#!/usr/bin/env node
import { program }                               from 'commander';
import * as readline                             from 'readline';
import { runKeywordScan, ESTIMATED_COST_USD }   from './dataforseo.js';
import { filterKeywords, clusterKeywords }      from './keywords.js';
import { generateCandidates }                   from './domains.js';
import { checkDomains, purchaseDomain,
         setVercelNameservers }                 from './namecheap.js';
import { computeNicheScore, pickBestDomain }   from './scoring.js';
import { upsertSite, updateSiteDomain }         from './db.js';
import { exportResults }                         from './export.js';
import { buildMockResult }                       from './mock.js';
import type { NamecheapConfig, ScanResult,
              DomainCandidate }                  from './types.js';

// ─── Affichage ────────────────────────────────────────────────────────────────

function pad(s: string, n: number): string { return s.slice(0, n).padEnd(n); }

function printKeywordsTable(kws: ScanResult['keywords']): void {
  console.log('\n┌─────────────────────────────────────────────┬──────────┬────────┬──────┬──────────┐');
  console.log('│ Mot-clé                                     │ Volume   │  CPC $ │  KD  │  Score   │');
  console.log('├─────────────────────────────────────────────┼──────────┼────────┼──────┼──────────┤');
  for (const k of kws.slice(0, 20)) {
    const kw  = pad(k.keyword, 43);
    const vol = String(k.search_volume ?? '—').padStart(8);
    const cpc = (k.cpc != null ? k.cpc.toFixed(2) : '—').padStart(6);
    const kd  = (k.keyword_difficulty != null ? String(k.keyword_difficulty) : '—').padStart(4);
    const sc  = k.score.toFixed(0).padStart(8);
    console.log(`│ ${kw} │${vol} │${cpc} │${kd} │${sc} │`);
  }
  console.log('└─────────────────────────────────────────────┴──────────┴────────┴──────┴──────────┘');
  if (kws.length > 20) console.log(`  … et ${kws.length - 20} autres (voir fichier JSON/CSV)`);
}

function printClusters(clusters: ScanResult['clusters']): void {
  console.log('\n── Clusters ──────────────────────────────────────────────────────────');
  for (const c of clusters) {
    console.log(`  [${c.label}]`);
    console.log(`    Vol. total ${c.total_volume}  ·  CPC moy. $${c.avg_cpc}  ·  Score ${c.avg_score}`);
    console.log(`    ${c.keywords.slice(0, 5).map(k => k.keyword).join(' · ')}`);
  }
}

function printDomains(candidates: DomainCandidate[]): void {
  console.log('\n── Domaines candidats ────────────────────────────────────────────────');
  console.log('  ' + 'Domaine'.padEnd(48) + 'Dispo   Prix $     Type');
  console.log('  ' + '─'.repeat(72));
  for (const d of candidates) {
    const avail = d.available === true ? '✓' : d.available === false ? '✗' : '?';
    const price = d.price_usd != null ? `$${d.price_usd.toFixed(2)}` : '—';
    console.log('  ' + pad(d.domain, 48) + avail.padEnd(8) + price.padEnd(11) + d.type);
  }
}

// ─── Confirmation interactive ─────────────────────────────────────────────────

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(`\n${question} [y/N] `, ans => { rl.close(); resolve(ans.toLowerCase() === 'y'); });
  });
}

// ─── Helpers config ───────────────────────────────────────────────────────────

function getNamecheapConfig(sandbox: boolean): NamecheapConfig {
  const apiUser  = process.env['NAMECHEAP_API_USER'];
  const apiKey   = process.env['NAMECHEAP_API_KEY'];
  const clientIp = process.env['NAMECHEAP_CLIENT_IP'];
  if (!apiUser || !apiKey || !clientIp) {
    throw new Error(
      'Variables Namecheap manquantes : NAMECHEAP_API_USER, NAMECHEAP_API_KEY, NAMECHEAP_CLIENT_IP\n' +
      'Voir apps/finder/README.md → Setup Namecheap.',
    );
  }
  return { apiUser, apiKey, clientIp, sandbox };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMANDE : scan
// ═══════════════════════════════════════════════════════════════════════════════

program
  .command('scan <niche> <city>')
  .description('Keyword research DataForSEO + domaines Namecheap')
  .option('--country <code>',       'Code pays (défaut: CA)', 'CA')
  .option('--lang <code>',          'Langue (fr|en, défaut: fr)', 'fr')
  .option('--max-difficulty <n>',   'KD maximum (0-100)', v => parseInt(v, 10))
  .option('--limit <n>',            'Nb max de mots-clés retournés', v => parseInt(v, 10), 100)
  .option('--sandbox',              'Namecheap sandbox (aucun achat réel)')
  .option('--estimate',             'Estime les coûts sans appeler les API')
  .option('--yes',                  'Confirme automatiquement le coût (non-interactif)')
  .option('--no-db',                'Ne pas écrire dans Supabase')
  .action(async (
    niche: string,
    city:  string,
    opts: { country: string; lang: string; maxDifficulty?: number; limit: number; sandbox: boolean; estimate: boolean; yes: boolean; db: boolean },
  ) => {
    console.log(`\n🔍 finder scan "${niche}" / "${city}"`);
    console.log(`   Pays: ${opts.country}  Langue: ${opts.lang}  KD max: ${opts.maxDifficulty ?? 'illimité'}  Limit: ${opts.limit}`);

    // ── Mode estimate ──────────────────────────────────────────────────────────
    if (opts.estimate) {
      console.log('\n── Estimation des coûts ──────────────────────────────────────────────');
      console.log(`  DataForSEO Labs (keyword_ideas, standard/async) :`);
      console.log(`    → ~$${ESTIMATED_COST_USD.toFixed(4)} USD par scan (jusqu'à ${opts.limit} mots-clés)`);
      console.log(`    → Crédits requis dans le tableau de bord DataForSEO`);
      console.log(`    → Durée de traitement estimée : 30-180 secondes`);
      console.log(`  Namecheap (vérification disponibilité) :`);
      console.log(`    → Gratuit (aucun frais pour namecheap.domains.check)`);
      console.log(`  Achat de domaine (si éligible) :`);
      console.log(`    → .ca : ~$12.98/an  ·  .com : ~$10.98/an (prix Namecheap standard)`);
      console.log('\n── Sortie simulée (données fictives) ─────────────────────────────────');

      const mock = buildMockResult(niche, city);
      printKeywordsTable(mock.keywords);
      printClusters(mock.clusters);
      printDomains(mock.candidates);

      console.log('\n── Recommandation ────────────────────────────────────────────────────');
      console.log(`  Niche score    : ${mock.niche_score}`);
      if (mock.best_domain) {
        const bd = mock.best_domain;
        console.log(`  Meilleur domaine : ${bd.domain} ($${bd.price_usd?.toFixed(2) ?? '?'}/an)`);
        console.log(`  → finder buy ${bd.domain}`);
      }
      console.log('\n  ℹ  Données simulées. Retirez --estimate pour les vraies métriques.');
      return;
    }

    // ── Credentials DataForSEO ────────────────────────────────────────────────
    const dfsLogin    = process.env['DATAFORSEO_LOGIN'];
    const dfsPassword = process.env['DATAFORSEO_PASSWORD'];
    if (!dfsLogin || !dfsPassword) {
      console.error('❌ DATAFORSEO_LOGIN et DATAFORSEO_PASSWORD requis dans .env');
      process.exit(1);
    }

    // ── Confirmation coût ─────────────────────────────────────────────────────
    const ok = opts.yes
      || await confirm(`Cette opération coûte ~$${ESTIMATED_COST_USD.toFixed(4)} USD en crédits DataForSEO. Continuer?`);
    if (!ok) { console.log('Annulé.'); return; }

    // ── DataForSEO ────────────────────────────────────────────────────────────
    const langName   = opts.lang === 'fr' ? 'French' : 'English';
    const rawKeywords = await runKeywordScan({
      seedKeywords: [niche, `${niche} ${city}`],
      locationName: opts.country === 'CA' ? 'Canada' : opts.country,
      languageName: langName,
      limit:        opts.limit,
      login:        dfsLogin,
      password:     dfsPassword,
    });

    const filterOpts = opts.maxDifficulty !== undefined ? { maxDifficulty: opts.maxDifficulty } : {};
    const keywords = filterKeywords(rawKeywords, filterOpts);
    console.log(`[keywords] ${keywords.length} / ${rawKeywords.length} retenus après filtrage`);
    const clusters = clusterKeywords(keywords);

    // ── Domaines ──────────────────────────────────────────────────────────────
    const topWord    = keywords[0]?.keyword.split(' ')[0] ?? niche;
    let   candidates = generateCandidates(niche, city, topWord);

    try {
      const ncCfg   = getNamecheapConfig(opts.sandbox);
      process.stdout.write(`[namecheap] Vérification ${candidates.length} domaines${opts.sandbox ? ' [sandbox]' : ''}…`);
      const checks = await checkDomains(candidates.map(c => c.domain), ncCfg);
      candidates = candidates.map(c => {
        const ch = checks.find(x => x.domain === c.domain);
        return ch ? { ...c, available: ch.available } : c;
      });
      console.log(' ✓');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`\n⚠  Namecheap ignoré — ${msg.split('\n')[0]}`);
    }

    // ── Score + assemblage ────────────────────────────────────────────────────
    const nicheScore = computeNicheScore(keywords, candidates);
    const best       = pickBestDomain(candidates);

    const result: ScanResult = {
      niche, city, country: opts.country, lang: opts.lang,
      keywords, clusters, candidates,
      niche_score: nicheScore,
      best_domain: best,
      scanned_at:  new Date().toISOString(),
    };

    // ── Affichage ─────────────────────────────────────────────────────────────
    printKeywordsTable(keywords);
    printClusters(clusters);
    printDomains(candidates);

    console.log('\n── Recommandation ────────────────────────────────────────────────────');
    console.log(`  Niche score : ${nicheScore}`);
    if (best) {
      console.log(`  Meilleur domaine : ${best.domain} ($${best.price_usd?.toFixed(2) ?? '?'}/an)`);
      console.log(`  → finder buy ${best.domain}`);
    } else {
      console.log('  Aucun domaine exact disponible détecté.');
    }

    // ── Export ────────────────────────────────────────────────────────────────
    const { jsonPath, csvPath } = exportResults(result);
    console.log(`\n  Exporté : ${jsonPath}  |  ${csvPath}`);

    // ── Supabase ──────────────────────────────────────────────────────────────
    if (opts.db !== false) {
      try {
        const siteId = await upsertSite(result, best?.domain ?? null);
        console.log(`  Supabase : upsert site → ${siteId}`);
      } catch (e: unknown) {
        console.warn(`  ⚠  Supabase : ${e instanceof Error ? e.message : e}`);
      }
    }
    console.log();
  });

// ═══════════════════════════════════════════════════════════════════════════════
// COMMANDE : buy
// ═══════════════════════════════════════════════════════════════════════════════

program
  .command('buy <domain>')
  .description('Achète un domaine Namecheap (confirmation avant tout achat)')
  .option('--site-id <id>',  'UUID Supabase du site à mettre à jour')
  .option('--sandbox',       'Namecheap sandbox — aucun achat réel')
  .option('--set-dns',       'Configure automatiquement les DNS Vercel après achat')
  .action(async (domain: string, opts: { siteId?: string; sandbox: boolean; setDns: boolean }) => {
    console.log(`\n🛒 finder buy ${domain}${opts.sandbox ? ' [SANDBOX]' : ''}`);

    const ncCfg = getNamecheapConfig(opts.sandbox);

    // Vérifier dispo
    process.stdout.write('[namecheap] Vérification disponibilité…');
    const checks = await checkDomains([domain], ncCfg);
    const check  = checks[0];
    console.log(' ✓');

    if (!check?.available) {
      console.error(`❌ ${domain} n'est pas disponible (ou Namecheap n'a pas répondu).`);
      process.exit(1);
    }

    const tld   = '.' + (domain.split('.').pop() ?? '');
    const price = check.available ? ({ '.ca': 12.98, '.com': 10.98 }[tld] ?? null) : null;

    console.log(`\n  Domaine  : ${domain}`);
    console.log(`  Statut   : disponible ✓`);
    console.log(`  Prix est.: ${price != null ? '$' + price.toFixed(2) + ' USD/an' : 'inconnu'}`);
    if (opts.sandbox) console.log(`  ⚠  MODE SANDBOX — aucun débit réel`);

    const ok = await confirm(`Confirmer l'achat de ${domain}${price != null ? ` pour $${price.toFixed(2)}` : ''}?`);
    if (!ok) { console.log('Annulé.'); return; }

    const contact = {
      firstName: process.env['NC_FIRST_NAME']  ?? 'Jonathan',
      lastName:  process.env['NC_LAST_NAME']   ?? 'Hebert',
      address1:  process.env['NC_ADDRESS']     ?? '123 Rue Principale',
      city:      process.env['NC_CITY']        ?? 'Sherbrooke',
      province:  process.env['NC_PROVINCE']    ?? 'Quebec',
      postalCode: process.env['NC_POSTAL']     ?? 'J1H 1A1',
      country:   process.env['NC_COUNTRY']     ?? 'CA',
      phone:     process.env['NC_PHONE']       ?? '+1.8195550000',
      email:     process.env['NC_EMAIL']       ?? 'contact@nexuslocale.com',
    };

    console.log('\n[namecheap] Achat en cours…');
    const result = await purchaseDomain(domain, ncCfg, contact);

    console.log(`\n✅ Domaine acheté !`);
    console.log(`   Order ID       : ${result.orderId}`);
    console.log(`   Transaction ID : ${result.transactionId}`);
    console.log(`   Montant débité : $${result.chargedAmount.toFixed(2)} USD`);

    // DNS
    if (opts.setDns) {
      console.log('\n[namecheap] Configuration DNS Vercel…');
      await setVercelNameservers(domain, ncCfg);
      console.log('✅ DNS Vercel configurés (ns1/ns2.vercel-dns.com).');
    } else {
      console.log('\n── Étape DNS manuelle ────────────────────────────────────────────────');
      console.log('   Namecheap → Domain List → Manage → Nameservers → Custom DNS :');
      console.log('     ns1.vercel-dns.com');
      console.log('     ns2.vercel-dns.com');
      console.log('   Ou relancez avec : finder buy <domain> --set-dns');
    }

    // Supabase
    if (opts.siteId) {
      await updateSiteDomain(opts.siteId, domain);
      console.log(`\n   Supabase mis à jour : sites.domain = ${domain} (id: ${opts.siteId})`);
    }
    console.log();
  });

program.name('finder').parse();
