#!/usr/bin/env node
import { program } from 'commander';
import {
  getTwilioClient, areaCodesForCity,
  findAvailableNumber, purchaseNumber,
  releaseNumber, findNumberSid,
  listProvisionedNumbers, getLeadsForSite, buildReport,
} from '@nexuslocale/tracker';
import {
  getDb, getSiteById, getSitesWithTracking,
  updateSiteTwilioNumber,
} from './db.js';

// ─── tracker provision <site_id> ─────────────────────────────────────────────

program
  .command('provision <site_id>')
  .description('Achète un numéro Twilio et le configure sur le site')
  .option('--area-code <code>', 'Indicatif régional (ex: 450)', parseInt)
  .option('--country <code>',   'Code pays ISO (défaut: CA)', 'CA')
  .option('--dry-run',          'Simule sans acheter')
  .action(async (siteId: string, opts: { areaCode?: number; country: string; dryRun?: boolean }) => {
    const webhookBase = process.env['TRACKER_WEBHOOK_URL'];
    if (!webhookBase) {
      console.error('❌ TRACKER_WEBHOOK_URL requis (URL publique du serveur de webhooks)');
      process.exit(1);
    }

    const site = await getSiteById(siteId);
    if (!site) { console.error(`❌ Site ${siteId} introuvable`); process.exit(1); }

    if (site.twilio_number) {
      console.log(`⚠  Ce site a déjà un numéro : ${site.twilio_number}`);
      console.log('   Utilisez `tracker release` d\'abord pour le libérer.');
      process.exit(1);
    }

    if (!site.forward_to) {
      console.warn(`⚠  forward_to vide — les appels seront loggés mais pas redirigés.`);
      console.warn(`   Mettez à jour sites.forward_to dans Supabase pour activer la redirection.`);
    }

    // Détermine l'indicatif régional
    const areaCodes = opts.areaCode ? [opts.areaCode] : areaCodesForCity(site.city);
    const client    = getTwilioClient();

    let phoneNumber: string | null = null;
    for (const code of areaCodes) {
      process.stdout.write(`[provision] Recherche numéro ${opts.country}+${code}…\n`);
      phoneNumber = await findAvailableNumber(code, opts.country, client);
      if (phoneNumber) break;
    }

    if (!phoneNumber) {
      console.error(`❌ Aucun numéro disponible avec les indicatifs ${areaCodes.join('/')}`);
      process.exit(1);
    }

    if (opts.dryRun) {
      console.log(`\n✅ [DRY-RUN] Numéro trouvé : ${phoneNumber}`);
      console.log(`   Aucun achat effectué.`);
      return;
    }

    process.stdout.write(`[provision] Achat de ${phoneNumber}…\n`);
    const result = await purchaseNumber(phoneNumber, webhookBase, client);

    await updateSiteTwilioNumber(siteId, result.phoneNumber);

    console.log(`
✅ Numéro provisionné : ${result.phoneNumber}
   SID       : ${result.sid}
   Voice URL : ${result.voiceUrl}
   SMS URL   : ${result.smsUrl}
   Site      : ${site.domain} (${siteId})

   ⚡ Mettez à jour business.phone dans le config du site :
      "${result.phoneNumber}"
   pour activer le call tracking sur le site publié.`);
  });

// ─── tracker release <site_id> ───────────────────────────────────────────────

program
  .command('release <site_id>')
  .description('Libère le numéro Twilio du site')
  .action(async (siteId: string) => {
    const site = await getSiteById(siteId);
    if (!site) { console.error(`❌ Site ${siteId} introuvable`); process.exit(1); }
    if (!site.twilio_number) { console.log('⚠  Ce site n\'a pas de numéro Twilio.'); return; }

    const client = getTwilioClient();
    const sid    = await findNumberSid(site.twilio_number, client);

    if (!sid) {
      console.warn(`⚠  Numéro ${site.twilio_number} introuvable dans Twilio. Nettoyage Supabase uniquement.`);
    } else {
      await releaseNumber(sid, client);
      console.log(`✅ Numéro ${site.twilio_number} libéré dans Twilio.`);
    }

    await updateSiteTwilioNumber(siteId, null);
    console.log(`   Supabase mis à jour — twilio_number = null`);
  });

// ─── tracker list ─────────────────────────────────────────────────────────────

program
  .command('list')
  .description('Tous les sites avec un numéro de tracking actif')
  .action(async () => {
    const sites = await getSitesWithTracking();
    if (sites.length === 0) { console.log('Aucun site avec numéro Twilio actif.'); return; }

    console.log(`\n${'Domaine'.padEnd(35)} ${'Twilio'.padEnd(18)} ${'Forward'.padEnd(18)} Type`);
    console.log('─'.repeat(80));
    for (const s of sites) {
      console.log(
        `${s.domain.padEnd(35)} ${(s.twilio_number ?? '—').padEnd(18)} ${(s.forward_to ?? '—').padEnd(18)} ${s.type}`,
      );
    }
    console.log();
  });

// ─── tracker report <site_id> ─────────────────────────────────────────────────

program
  .command('report <site_id>')
  .description('Rapport de leads pour un site')
  .option('--days <n>', 'Période en jours (défaut: 30)', parseInt, 30)
  .action(async (siteId: string, opts: { days: number }) => {
    const to   = new Date();
    const from = new Date(Date.now() - opts.days * 24 * 60 * 60 * 1000);

    const db    = getDb();
    const leads = await getLeadsForSite(db, siteId, { from, to });
    const report = buildReport(leads, siteId, { from, to });

    const site = await getSiteById(siteId);
    console.log(`\n📊 Rapport — ${site?.domain ?? siteId}`);
    console.log(`   Période : ${from.toLocaleDateString('fr-CA')} → ${to.toLocaleDateString('fr-CA')}`);
    console.log(`\n   Total       : ${report.stats.total}`);
    console.log(`   Appels      : ${report.stats.calls} (manqués: ${report.stats.missed_calls})`);
    console.log(`   SMS         : ${report.stats.sms}`);
    console.log(`   Formulaires : ${report.stats.forms}`);
    console.log(`   Durée moy.  : ${report.stats.avg_duration_sec}s`);
    console.log(`   Enregistrem.: ${report.stats.recordings}`);
    console.log(`   Hors heures : ${report.stats.after_hours} (leads manqués potentiels)`);

    if (report.stats.after_hours > 0) {
      console.log(`\n   💡 Argument upsell : ${report.stats.after_hours} leads reçus hors heures`);
      console.log(`      → réceptionniste IA ou SMS automatique`);
    }
    console.log();
  });

// ─── tracker numbers ─────────────────────────────────────────────────────────

program
  .command('numbers')
  .description('Liste tous les numéros actifs dans le compte Twilio')
  .action(async () => {
    const client  = getTwilioClient();
    const numbers = await listProvisionedNumbers(client);
    if (numbers.length === 0) { console.log('Aucun numéro dans ce compte Twilio.'); return; }

    console.log(`\n${'Numéro'.padEnd(18)} ${'SID'.padEnd(36)} Voice URL`);
    console.log('─'.repeat(90));
    for (const n of numbers) {
      console.log(`${n.phoneNumber.padEnd(18)} ${n.sid.padEnd(36)} ${n.voiceUrl ?? '—'}`);
    }
    console.log();
  });

program.name('tracker').parse();
