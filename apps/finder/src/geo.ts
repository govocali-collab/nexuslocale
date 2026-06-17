import type { KeywordInfo } from './types.js';

// Normalise pour comparaison : minuscules, sans accents, sans ponctuation.
function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Regroupements de villes par région du Québec. Un mot-clé qui mentionne une
// ville HORS du cluster de la ville cible est considéré « autre ville » → écarté.
// (Les termes régionaux comme « rive sud » ne sont pas des villes ici → toujours gardés.)
const CLUSTERS_RAW: string[][] = [
  // Rive-Sud de Montréal (Montérégie)
  ['brossard', 'longueuil', 'saint-hubert', 'boucherville', 'saint-lambert',
   'greenfield park', 'candiac', 'la prairie', 'saint-bruno', 'chambly',
   'carignan', 'sainte-julie', 'varennes', 'beloeil', 'chateauguay', 'delson',
   'sainte-catherine', 'saint-constant', 'saint-jean-sur-richelieu'],
  // Île de Montréal
  ['montreal', 'westmount', 'outremont', 'verdun', 'lachine', 'lasalle', 'anjou',
   'saint-leonard', 'pointe-claire', 'kirkland', 'beaconsfield', 'dorval',
   'dollard-des-ormeaux', 'pointe-aux-trembles'],
  // Laval + Rive-Nord (Laurentides / Lanaudière)
  ['laval', 'terrebonne', 'mascouche', 'repentigny', 'blainville', 'boisbriand',
   'mirabel', 'saint-jerome', 'rosemere', 'lorraine', 'sainte-therese',
   'saint-eustache', 'deux-montagnes', 'joliette', 'charlemagne'],
  // Estrie
  ['sherbrooke', 'granby', 'magog', 'cowansville', 'bromont', 'windsor', 'coaticook'],
  // Capitale-Nationale (Québec)
  ['quebec', 'levis', 'beauport', 'charlesbourg', 'sainte-foy', 'loretteville', 'ancienne-lorette'],
  // Outaouais
  ['gatineau', 'hull', 'aylmer', 'buckingham'],
  // Mauricie
  ['trois-rivieres', 'shawinigan', 'becancour', 'grand-mere'],
  // Saguenay–Lac-Saint-Jean
  ['saguenay', 'chicoutimi', 'jonquiere', 'alma'],
];

const CLUSTERS: Set<string>[] = CLUSTERS_RAW.map(c => new Set(c.map(norm)));
const ALL_CITIES: Set<string> = new Set(CLUSTERS.flatMap(c => [...c]));

// Villes autorisées pour une ville cible = sa ville + les villes de sa région.
function allowedCities(targetCity: string): Set<string> {
  const t = norm(targetCity).replace(/\b(qc|quebec|canada|on|ontario)\b/g, '').trim();
  const allowed = new Set<string>();
  if (t) allowed.add(t);
  for (const cluster of CLUSTERS) {
    const inCluster = [...cluster].some(city => t === city || t.includes(city) || city.includes(t));
    if (inCluster) for (const c of cluster) allowed.add(c);
  }
  return allowed;
}

// Garde les mots-clés géo-neutres + ville cible + même région ; écarte les autres villes.
export function filterByCity(
  keywords: KeywordInfo[],
  targetCity: string,
): { kept: KeywordInfo[]; dropped: number } {
  const allowed = allowedCities(targetCity);
  const kept = keywords.filter(kw => {
    const padded = ` ${norm(kw.keyword)} `;
    for (const city of ALL_CITIES) {
      if (padded.includes(` ${city} `) && !allowed.has(city)) return false;
    }
    return true;
  });
  return { kept, dropped: keywords.length - kept.length };
}
