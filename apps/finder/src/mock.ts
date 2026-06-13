import type { KeywordInfo, Cluster, DomainCandidate, ScanResult } from './types.js';

function strip(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}
function hyphen(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function buildMockResult(niche: string, city: string): ScanResult {
  const n = niche.toLowerCase();
  const c = city.split(' ')[0]?.toLowerCase() ?? city;

  const keywords: KeywordInfo[] = [
    { keyword: `${n} ${c}`,                  search_volume: 720,  cpc: 12.50, competition: 0.45, keyword_difficulty: 18, score: 500.0  },
    { keyword: `restauration ${n} ${c}`,     search_volume: 390,  cpc: 15.20, competition: 0.52, keyword_difficulty: 22, score: 268.9  },
    { keyword: `urgence ${n}`,               search_volume: 880,  cpc:  8.30, competition: 0.38, keyword_difficulty: 25, score: 292.2  },
    { keyword: `compagnie ${n} ${c}`,        search_volume: 210,  cpc: 14.80, competition: 0.61, keyword_difficulty: 15, score: 207.2  },
    { keyword: `${n} résidentiel`,           search_volume: 1200, cpc:  6.50, competition: 0.42, keyword_difficulty: 31, score: 251.6  },
    { keyword: `expert ${n} ${c}`,           search_volume: 170,  cpc: 18.90, competition: 0.71, keyword_difficulty: 12, score: 267.8  },
    { keyword: `nettoyage après ${n}`,       search_volume: 290,  cpc:  9.40, competition: 0.35, keyword_difficulty: 20, score: 136.3  },
    { keyword: `assurance ${n}`,             search_volume: 1800, cpc:  5.20, competition: 0.29, keyword_difficulty: 38, score: 246.3  },
    { keyword: `prix ${n} ${c}`,             search_volume: 260,  cpc:  7.80, competition: 0.44, keyword_difficulty: 16, score: 126.75 },
    { keyword: `soumission ${n}`,            search_volume: 320,  cpc: 11.20, competition: 0.55, keyword_difficulty: 23, score: 155.8  },
  ];

  const clusters: Cluster[] = [
    {
      label:        `${n} ${c}`,
      keywords:     keywords.slice(0, 4),
      total_volume: 1510,
      avg_cpc:      12.63,
      avg_score:    310.78,
    },
    {
      label:        `urgence ${n}`,
      keywords:     keywords.slice(4, 7),
      total_volume: 2370,
      avg_cpc:       8.03,
      avg_score:    218.37,
    },
  ];

  const nicheNo  = strip(niche);
  const nicheHyp = hyphen(niche);
  const cityNo   = strip(city.split(' ')[0] ?? city);

  const candidates: DomainCandidate[] = [
    { domain: `${nicheNo}${cityNo}.ca`,         tld: '.ca',  type: 'exact',   available: true,  price_usd: 12.98 },
    { domain: `${nicheNo}${cityNo}.com`,        tld: '.com', type: 'exact',   available: false, price_usd: null  },
    { domain: `${nicheHyp}-${cityNo}.ca`,       tld: '.ca',  type: 'exact',   available: true,  price_usd: 12.98 },
    { domain: `urgence${nicheNo}${cityNo}.ca`,  tld: '.ca',  type: 'partial', available: true,  price_usd: 12.98 },
    { domain: `${nicheNo}pro${cityNo}.ca`,      tld: '.ca',  type: 'partial', available: false, price_usd: null  },
    { domain: `${nicheNo}expert${cityNo}.ca`,   tld: '.ca',  type: 'partial', available: true,  price_usd: 12.98 },
  ];

  const best = candidates.find(c => c.available && c.type === 'exact' && c.tld === '.ca') ?? null;

  return {
    niche, city,
    country:     'CA',
    lang:        'fr',
    keywords,
    clusters,
    candidates,
    niche_score: Math.round(310.78 * 1.2 * 100) / 100,
    best_domain: best,
    scanned_at:  new Date().toISOString(),
  };
}
