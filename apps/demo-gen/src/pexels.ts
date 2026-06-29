/**
 * Recherche de photos réelles via l'API Pexels (gratuit).
 * Pexels indexe surtout en anglais → on traduit la niche FR en terme de recherche EN.
 * Attribution requise par Pexels (photographe conservé).
 */

export interface PexelsPhoto {
  url:               string;  // image paysage 1200 de large
  photographer:      string;
  photographer_url:  string;
}

const BASE = 'https://api.pexels.com/v1/search';

// Métiers FR → requête photo EN (Pexels a peu de résultats en français).
const TRADE_EN: Record<string, string> = {
  plombier: 'plumber', electricien: 'electrician', toiture: 'roofing',
  excavation: 'excavation', renovation: 'home renovation', 'degat d eau': 'water damage restoration',
  cvac: 'hvac technician', chauffage: 'hvac heating', climatisation: 'air conditioning',
  remorquage: 'tow truck', demenagement: 'movers', pavage: 'asphalt paving',
  paysagement: 'landscaping', deneigement: 'snow removal', arbre: 'tree service',
  emondage: 'tree trimming', maconnerie: 'masonry', peinture: 'house painting',
  fondation: 'foundation repair', drainage: 'drainage', menuiserie: 'carpentry',
  serrurier: 'locksmith', extermination: 'pest control', nettoyage: 'cleaning service',
};

function deburr(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Traduit une niche FR en requête de recherche EN (sinon garde tel quel).
export function nicheToQuery(niche: string): string {
  const n = deburr(niche);
  if (TRADE_EN[n]) return TRADE_EN[n];
  // cherche un mot-clé métier connu dans la niche
  for (const [fr, en] of Object.entries(TRADE_EN)) {
    if (n.includes(fr)) return en;
  }
  return niche;
}

// Récupère jusqu'à `count` photos paysage pour une requête.
export async function searchPexelsPhotos(
  query: string,
  apiKey: string,
  count = 6,
): Promise<PexelsPhoto[]> {
  const params = new URLSearchParams({
    query,
    orientation: 'landscape',
    per_page:    String(Math.max(count, 5)),
  });
  try {
    const res = await fetch(`${BASE}?${params}`, { headers: { Authorization: apiKey } });
    if (!res.ok) return [];
    const data = await res.json() as {
      photos?: { src: { landscape: string; large: string }; photographer: string; photographer_url: string }[];
    };
    return (data.photos ?? []).map(p => ({
      url:              p.src.landscape ?? p.src.large,
      photographer:     p.photographer,
      photographer_url: p.photographer_url,
    }));
  } catch {
    return []; // réseau / API indisponible → on continue sans photo
  }
}
