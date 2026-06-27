import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));

const config: NextConfig = {
  // Monorepo pnpm : tracer les fichiers depuis la racine pour que les chemins
  // des dépendances symlinkées (next-server…) soient corrects au déploiement Vercel.
  outputFileTracingRoot: path.join(dir, '../../'),
  // Hybrid : pages statiques (SSG) + API routes serverless sur Vercel
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Expose uniquement les env vars nécessaires au client (pas de secrets)
  env: {
    NEXT_PUBLIC_SITE_MODE: process.env.NEXT_PUBLIC_SITE_MODE ?? 'demo',
  },
};

export default config;
