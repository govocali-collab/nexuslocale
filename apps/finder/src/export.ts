import { writeFileSync } from 'fs';
import type { ScanResult } from './types.js';

function slugify(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function exportResults(result: ScanResult): { jsonPath: string; csvPath: string } {
  const slug     = `finder-${slugify(result.niche)}-${slugify(result.city)}`;
  const jsonPath = `${slug}.json`;
  const csvPath  = `${slug}.csv`;

  writeFileSync(jsonPath, JSON.stringify(result, null, 2));

  const lines = [
    '# Mots-clés',
    'keyword,search_volume,cpc,keyword_difficulty,score',
    ...result.keywords.map(k =>
      [`"${k.keyword.replace(/"/g, '""')}"`, k.search_volume ?? '', k.cpc ?? '', k.keyword_difficulty ?? '', k.score.toFixed(2)].join(',')
    ),
    '',
    '# Domaines',
    'domain,available,price_usd,type',
    ...result.candidates.map(d =>
      [d.domain, d.available ?? 'unknown', d.price_usd ?? '', d.type].join(',')
    ),
  ];

  writeFileSync(csvPath, lines.join('\n'));
  return { jsonPath, csvPath };
}
