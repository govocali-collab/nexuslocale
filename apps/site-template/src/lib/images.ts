const UNSPLASH = 'https://images.unsplash.com';

// Photos Unsplash sélectionnées par niche — fond hero + service pages
const NICHE_HERO: Array<[string[], string]> = [
  [['excavation', 'terrassement', 'fondation', 'beton', 'demolition'],
    'photo-1504307651254-35680f356dfd'],
  [['toiture', 'couverture', 'bardeau', 'toit'],
    'photo-1558618666-fcd25c85cd64'],
  [['plomberie', 'plombier', 'drain', 'chauffage'],
    'photo-1581578731548-c64695cc6952'],
  [['paysagement', 'gazon', 'amenagement', 'paysagiste'],
    'photo-1416879595882-3373a0480b5b'],
  [['electricien', 'electricite', 'electrique'],
    'photo-1558618047-3c8c76ca7d13'],
];

const DEFAULT_HERO = 'photo-1541888946425-d81bb19240f5';

// Mapping slug → photo pour les cartes et pages de service
const SERVICE_SLUGS: Array<[RegExp, string]> = [
  [/fondation|excavation/,             'photo-1504307651254-35680f356dfd'],
  [/terrassement|nivellement|deblai/,  'photo-1590674899484-d5640e854abe'],
  [/drain|drainage|eau|pluvial|souter/, 'photo-1558618047-3c8c76ca7d13'],
  [/demolition|beton|dalle/,           'photo-1558618666-fcd25c85cd64'],
  [/toiture|couverture|bardeau/,       'photo-1558618666-fcd25c85cd64'],
  [/chemin|stationnement|asphalte|pav/, 'photo-1519451241324-5f6abff40b22'],
  [/commercial|industriel/,            'photo-1541888946425-d81bb19240f5'],
  [/electrici/,                         'photo-1558618047-3c8c76ca7d13'],
];

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function cdn(id: string, w: number, h: number): string {
  return `${UNSPLASH}/${id}?w=${w}&h=${h}&q=80&auto=format&fit=crop&crop=center`;
}

// Retourne l'URL du hero : config en priorité, sinon niche, sinon défaut
export function heroImageUrl(niche: string, configUrl?: string | null): string {
  if (configUrl) return configUrl;
  const n = norm(niche);
  for (const [keys, id] of NICHE_HERO) {
    if (keys.some((k) => n.includes(k))) return cdn(id, 1600, 900);
  }
  return cdn(DEFAULT_HERO, 1600, 900);
}

// Retourne l'URL d'une image pour un service donné (basé sur le slug)
export function serviceImageUrl(slug: string): string {
  const n = norm(slug);
  for (const [re, id] of SERVICE_SLUGS) {
    if (re.test(n)) return cdn(id, 800, 500);
  }
  return cdn(DEFAULT_HERO, 800, 500);
}
