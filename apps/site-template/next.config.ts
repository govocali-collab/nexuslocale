import type { NextConfig } from 'next';

const config: NextConfig = {
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
