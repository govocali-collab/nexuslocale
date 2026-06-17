#!/usr/bin/env tsx
/**
 * NexusLocale — Deploy CLI
 *
 * Usage :
 *   pnpm deploy configs/mon-site.json --demo
 *   pnpm deploy configs/mon-site.json --prod
 *
 * Étapes :
 *   1. Validation Zod du config
 *   2. Génération des images de marque (Satori)
 *   3. Build Next.js (next build)
 *   4. Création/récupération du projet Vercel via API
 *   5. Déploiement (vercel deploy --prebuilt)
 *   6. Ajout du domaine personnalisé si --prod
 *   7. Upsert de la table `sites` dans Supabase
 *   8. Affichage de l'URL déployée
 */

import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

// Résolution des chemins depuis la racine du monorepo
const ROOT = path.resolve(import.meta.dirname, '..');
const SITE_TEMPLATE_PATH = path.join(ROOT, 'apps', 'site-template');

// ─── 1. Parsing des arguments ─────────────────────────────────────────────────

const { positionals, values: flags } = parseArgs({
  args:    process.argv.slice(2),
  options: {
    demo: { type: 'boolean', default: false },
    prod: { type: 'boolean', default: false },
  },
  allowPositionals: true,
  strict: true,
});

const configArg = positionals[0];

if (!configArg) {
  console.error('Usage : pnpm deploy <config.json> [--demo|--prod]');
  console.error('Exemple : pnpm deploy configs/excavation-granby.json --demo');
  process.exit(1);
}

if (!flags.demo && !flags.prod) {
  console.error('Spécifiez --demo ou --prod.');
  process.exit(1);
}

const isDemo = flags.demo === true;

// ─── 2. Variables d'environnement requises ────────────────────────────────────

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`[deploy] Variable manquante : ${name}`);
    process.exit(1);
  }
  return v;
}

const VERCEL_TOKEN     = requireEnv('VERCEL_TOKEN');
const SUPABASE_URL     = requireEnv('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = requireEnv('SUPABASE_SERVICE_KEY');

// ─── 3. Validation Zod du config ─────────────────────────────────────────────

console.log('\n[1/7] Validation du config…');

const configPath = path.resolve(ROOT, configArg);
if (!fs.existsSync(configPath)) {
  console.error(`Config introuvable : ${configPath}`);
  process.exit(1);
}

// Import dynamique du schéma (tsx résout les imports TypeScript à la volée)
const { SiteConfigSchema } = await import(
  path.join(SITE_TEMPLATE_PATH, 'src', 'schema', 'config.ts')
);

const rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const parseResult = SiteConfigSchema.safeParse(rawConfig);

if (!parseResult.success) {
  console.error('[deploy] ✗ Config invalide :');
  parseResult.error.issues.forEach((issue: { path: string[]; message: string }) => {
    console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

const config = parseResult.data;
console.log(`[1/7] ✓ Config valide — ${config.domain} (${isDemo ? 'démo' : 'production'})`);

// ─── 4. Génération des images de marque ──────────────────────────────────────

console.log('\n[2/7] Génération des images de marque…');

const imagesOutDir = path.join(SITE_TEMPLATE_PATH, 'public', 'images', 'brand');
fs.mkdirSync(imagesOutDir, { recursive: true });

// Build du générateur d'images si pas encore compilé
const imagesDistPath = path.join(ROOT, 'packages', 'images', 'dist', 'generate.js');
if (!fs.existsSync(imagesDistPath)) {
  run('pnpm --filter @nexuslocale/images build', ROOT);
}

const imgResult = spawnSync(
  'node',
  [imagesDistPath, configPath, imagesOutDir],
  { stdio: 'inherit', cwd: ROOT }
);
if (imgResult.status !== 0) {
  console.warn('[2/7] ⚠ Génération images échouée — build continue sans images');
} else {
  console.log('[2/7] ✓ Images générées');
}

// ─── 5. Build Next.js ─────────────────────────────────────────────────────────

console.log('\n[3/7] Build Next.js…');

// Injecter le mode dans le config temporaire si nécessaire
const effectiveConfig = { ...rawConfig, mode: isDemo ? 'demo' : 'production' };
const tmpConfigPath = path.join(ROOT, `.tmp-deploy-config-${Date.now()}.json`);
fs.writeFileSync(tmpConfigPath, JSON.stringify(effectiveConfig));

try {
  run(
    `SITE_CONFIG_PATH="${tmpConfigPath}" npx next build`,
    SITE_TEMPLATE_PATH,
    { SITE_CONFIG_PATH: tmpConfigPath }
  );
  console.log('[3/7] ✓ Build Next.js réussi');
} finally {
  fs.rmSync(tmpConfigPath, { force: true });
}

// ─── 6. Création / récupération du projet Vercel ─────────────────────────────

console.log('\n[4/7] Configuration du projet Vercel…');

const projectName = isDemo
  ? `demo-${slugify(config.domain)}`
  : slugify(config.domain);

const { projectId, orgId } = await getOrCreateVercelProject(projectName, VERCEL_TOKEN);
console.log(`[4/7] ✓ Projet Vercel : ${projectName} (${projectId})`);

// Écrire .vercel/project.json pour que la CLI sache quel projet utiliser
const vercelDir = path.join(SITE_TEMPLATE_PATH, '.vercel');
fs.mkdirSync(vercelDir, { recursive: true });
fs.writeFileSync(
  path.join(vercelDir, 'project.json'),
  JSON.stringify({ projectId, orgId }, null, 2)
);

// ─── 7. Déploiement Vercel ────────────────────────────────────────────────────

console.log('\n[5/7] Déploiement sur Vercel…');

const vercelBin = path.join(ROOT, 'node_modules', '.bin', 'vercel');

// Build via Vercel (crée .vercel/output) — vercelBin entre guillemets (le chemin peut contenir des espaces)
run(
  `"${vercelBin}" build ${isDemo ? '' : '--prod'} --token="${VERCEL_TOKEN}" --yes`,
  SITE_TEMPLATE_PATH,
  { SITE_CONFIG_PATH: configPath }
);

// Deploy le prebuilt
const deployOutput = execSync(
  `"${vercelBin}" deploy --prebuilt ${isDemo ? '' : '--prod'} --token="${VERCEL_TOKEN}" --yes`,
  { cwd: SITE_TEMPLATE_PATH, encoding: 'utf8' }
).trim();

// L'URL est la dernière ligne de la sortie vercel deploy
const deployedUrl = deployOutput.split('\n').filter(Boolean).at(-1) ?? deployOutput;
console.log(`[5/7] ✓ Déployé : ${deployedUrl}`);

// ─── 8. Domaine personnalisé (production uniquement) ─────────────────────────

if (!isDemo) {
  console.log('\n[6/7] Configuration du domaine…');
  await addVercelDomain(projectId, config.domain, VERCEL_TOKEN);
  console.log(`[6/7] ✓ Domaine ajouté : ${config.domain}`);
} else {
  console.log('\n[6/7] Mode démo — domaine Vercel par défaut conservé');
}

// ─── 9. Upsert dans Supabase `sites` ─────────────────────────────────────────

console.log('\n[7/7] Mise à jour Supabase…');

const { createClient } = await import('@supabase/supabase-js');
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const siteRecord = {
  domain:          config.domain,
  type:            config.type as 'rent' | 'client' | 'demo',
  niche:           config.niche,
  city:            config.city,
  status:          'built' as const,
  vercel_project:  projectName,
};

const { error } = await db
  .from('sites')
  .upsert(siteRecord, { onConflict: 'domain' });

if (error) {
  console.warn(`[7/7] ⚠ Supabase non mis à jour : ${error.message}`);
} else {
  console.log('[7/7] ✓ Table sites mise à jour');
}

// ─── Résumé final ─────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(50));
console.log('✓ Déploiement terminé');
console.log(`  Mode    : ${isDemo ? 'DÉMO (noindex)' : 'PRODUCTION'}`);
console.log(`  Site    : ${config.business.name}`);
console.log(`  URL     : ${deployedUrl}`);
if (!isDemo) console.log(`  Domaine : https://${config.domain}`);
console.log('─'.repeat(50) + '\n');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\./g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function run(
  cmd: string,
  cwd: string,
  extraEnv: Record<string, string> = {}
): void {
  execSync(cmd, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });
}

// ─── Vercel API helpers ───────────────────────────────────────────────────────

async function vercelFetch(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`https://api.vercel.com${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
}

async function getOrCreateVercelProject(
  name: string,
  token: string
): Promise<{ projectId: string; orgId: string }> {
  // Récupère l'ID utilisateur (orgId pour les comptes personnels)
  const userRes = await vercelFetch('/v2/user', token);
  const { user } = (await userRes.json()) as { user: { id: string } };
  const orgId = user.id;

  // Vérifie si le projet existe déjà
  const getRes = await vercelFetch(`/v9/projects/${encodeURIComponent(name)}`, token);
  if (getRes.ok) {
    const project = (await getRes.json()) as { id: string };
    return { projectId: project.id, orgId };
  }

  // Crée le projet
  const createRes = await vercelFetch('/v9/projects', token, {
    method: 'POST',
    body: JSON.stringify({ name, framework: 'nextjs' }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    console.error(`[deploy] Impossible de créer le projet Vercel : ${err}`);
    process.exit(1);
  }

  const project = (await createRes.json()) as { id: string };
  return { projectId: project.id, orgId };
}

async function addVercelDomain(
  projectId: string,
  domain: string,
  token: string
): Promise<void> {
  const res = await vercelFetch(
    `/v9/projects/${projectId}/domains`,
    token,
    {
      method:  'POST',
      body:    JSON.stringify({ name: domain }),
    }
  );
  if (!res.ok) {
    const err = await res.json() as { error?: { message: string } };
    // Domaine déjà ajouté = pas une erreur bloquante
    if ((err.error?.message ?? '').includes('already')) return;
    console.warn(`[deploy] Domaine non configuré : ${err.error?.message ?? 'erreur inconnue'}`);
  }
}
