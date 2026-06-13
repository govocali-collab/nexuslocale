import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: [
    '@nexuslocale/db',
    '@nexuslocale/indexer',
    '@nexuslocale/tracker',
  ],
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
};

export default config;
