import type { DomainCandidate } from './types.js';

const TLDS = ['.ca', '.com'];

// Approximate Namecheap prices (USD/yr) — updated 2026
const TYPICAL_PRICES: Record<string, number> = {
  '.ca':  12.98,
  '.com': 10.98,
};

function strip(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function hyphen(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function generateCandidates(
  niche:   string,
  city:    string,
  topWord: string,
): DomainCandidate[] {
  const nicheNo    = strip(niche);
  const nicheHyp   = hyphen(niche);
  const cityNo     = strip(city.split(' ')[0] ?? city);
  const topWordNo  = strip(topWord.split(' ').slice(0, 2).join(''));

  const patterns: Array<[string, 'exact' | 'partial']> = [
    [`${nicheNo}${cityNo}`,               'exact'],
    [`${nicheHyp}-${cityNo}`,             'exact'],
    [`${topWordNo}${cityNo}`,             'exact'],
    [`urgence${nicheNo}${cityNo}`,        'partial'],
    [`urgence-${nicheHyp}-${cityNo}`,     'partial'],
    [`${nicheNo}pro${cityNo}`,            'partial'],
    [`${nicheNo}expert${cityNo}`,         'partial'],
    [`restauration${nicheNo}${cityNo}`,   'partial'],
  ];

  const seen = new Set<string>();
  const out:  DomainCandidate[] = [];

  for (const [stem, type] of patterns) {
    for (const tld of TLDS) {
      const sld    = stem.replace(/-{2,}/g, '-').slice(0, 60);
      const domain = `${sld}${tld}`;
      if (seen.has(domain) || sld.length < 3) continue;
      seen.add(domain);
      out.push({ domain, tld, type, available: null, price_usd: TYPICAL_PRICES[tld] ?? null });
    }
  }

  return out;
}
