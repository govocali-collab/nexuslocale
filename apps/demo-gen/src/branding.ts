interface NicheColors { primary: string; secondary: string }

// Couleurs par défaut selon la niche — sobres et professionnelles
const NICHE_PALETTE: Array<[string[], NicheColors]> = [
  [['excavation', 'terrassement', 'fondation'], { primary: '#1a3a5c', secondary: '#e87c22' }],
  [['toiture', 'couverture', 'bardeau'],        { primary: '#7f1d1d', secondary: '#fbbf24' }],
  [['plomberie', 'plombier', 'plomberie'],      { primary: '#1e3a5f', secondary: '#60a5fa' }],
  [['electricien', 'electricite', 'electrique'], { primary: '#713f12', secondary: '#facc15' }],
  [['paysagement', 'paysagiste', 'gazon'],      { primary: '#14532d', secondary: '#4ade80' }],
  [['beton', 'dalle', 'pavage', 'asphalte'],    { primary: '#374151', secondary: '#9ca3af' }],
  [['menuiserie', 'charpentier', 'bois'],       { primary: '#78350f', secondary: '#f59e0b' }],
  [['peinture', 'peintre'],                      { primary: '#1e1b4b', secondary: '#818cf8' }],
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function nicheColors(niche: string): NicheColors {
  const n = normalize(niche);
  for (const [keywords, colors] of NICHE_PALETTE) {
    if (keywords.some((k) => n.includes(k) || k.includes(n))) return colors;
  }
  return { primary: '#1f2937', secondary: '#3b82f6' };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function demoSubdomain(businessName: string): string {
  return `demo-${slugify(businessName)}.nexuslocale.com`;
}

const UNSPLASH = 'https://images.unsplash.com';

const NICHE_HERO_IDS: Array<[string[], string]> = [
  [['excavation', 'terrassement', 'fondation', 'beton', 'demolition'],
    'photo-1504307651254-35680f356dfd'],
  [['toiture', 'couverture', 'bardeau'],
    'photo-1558618666-fcd25c85cd64'],
  [['plomberie', 'plombier', 'drain'],
    'photo-1581578731548-c64695cc6952'],
  [['paysagement', 'gazon', 'paysagiste'],
    'photo-1416879595882-3373a0480b5b'],
  [['electricien', 'electricite'],
    'photo-1558618047-3c8c76ca7d13'],
];

export function nicheHeroImage(niche: string): string {
  const n = normalize(niche);
  for (const [keys, id] of NICHE_HERO_IDS) {
    if (keys.some((k) => n.includes(k))) {
      return `${UNSPLASH}/${id}?w=1600&h=900&q=80&auto=format&fit=crop&crop=center`;
    }
  }
  return `${UNSPLASH}/photo-1541888946425-d81bb19240f5?w=1600&h=900&q=80&auto=format&fit=crop&crop=center`;
}
