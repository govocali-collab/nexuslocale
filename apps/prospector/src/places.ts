import type { PlaceResult, WebPresence } from './types.js';

const BASE = 'https://maps.googleapis.com/maps/api/place';

// Domaines réseaux sociaux → web_presence = 'social_only'
const SOCIAL_DOMAINS = [
  'facebook.com', 'fb.com', 'instagram.com', 'twitter.com', 'x.com',
  'linkedin.com', 'linktree.com', 'linktr.ee', 'bio.site', 'beacons.ai',
  'youtube.com', 'tiktok.com',
];

function classifyWebPresence(website: string | null | undefined): WebPresence {
  if (!website) return 'none';
  try {
    const host = new URL(website).hostname.replace(/^www\./, '');
    if (SOCIAL_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) {
      return 'social_only';
    }
  } catch {
    return 'none';
  }
  return 'has_site';
}

// ─── Filtre de pertinence (types Google Places) ──────────────────────────────

// Métiers de service locaux ciblés par le rank-and-rent → toujours pertinents.
const SERVICE_TYPES = new Set([
  'plumber', 'general_contractor', 'roofing_contractor', 'electrician',
  'painter', 'locksmith', 'moving_company', 'car_repair', 'hardware_store',
]);

// Catégories clairement hors-sujet → écartées (santé, resto, commerce, loisirs…).
const IRRELEVANT_TYPES = new Set([
  'restaurant', 'food', 'cafe', 'bar', 'meal_takeaway', 'meal_delivery', 'bakery',
  'health', 'doctor', 'hospital', 'dentist', 'pharmacy', 'physiotherapist', 'veterinary_care',
  'spa', 'beauty_salon', 'hair_care', 'gym',
  'school', 'university', 'library', 'museum', 'park', 'tourist_attraction',
  'lodging', 'bank', 'finance', 'insurance_agency', 'real_estate_agency', 'travel_agency',
  'car_dealer', 'gas_station', 'supermarket', 'grocery_or_supermarket', 'shopping_mall',
  'clothing_store', 'shoe_store', 'jewelry_store', 'book_store', 'store',
  'church', 'place_of_worship', 'night_club', 'movie_theater',
]);

const deburr = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function nicheWords(niche: string): string[] {
  const stop = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'et', 'en', 'au', 'aux', 'pour', 'dans', 'qc']);
  return deburr(niche).replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length >= 4 && !stop.has(w));
}

// Pertinent si : (a) un type métier de service, sinon (b) pas un type hors-sujet
// et le nom contient un mot de la niche. Les commerces/santé/loisirs sont écartés.
function isRelevantPlace(name: string, types: string[] | undefined, words: string[]): boolean {
  const t = types ?? [];
  if (t.some(x => SERVICE_TYPES.has(x)))    return true;
  if (t.some(x => IRRELEVANT_TYPES.has(x))) return false;
  const n = deburr(name);
  return words.some(w => n.includes(w));
}

// ─── Retry avec backoff exponentiel ──────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url: string, retries = 3, delayMs = 500): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429 && attempt < retries) {
        await sleep(delayMs * Math.pow(2, attempt));
        continue;
      }
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(delayMs * Math.pow(2, attempt));
    }
  }
  throw new Error('Max retries exceeded');
}

// ─── Types réponse Google Places ─────────────────────────────────────────────

interface TextSearchResult {
  place_id:            string;
  name:                string;
  formatted_address:   string;
  rating?:             number;
  user_ratings_total?: number;
  types?:              string[];
}

interface TextSearchResponse {
  results:         TextSearchResult[];
  next_page_token?: string;
  status:          string;
  error_message?:  string;
}

interface PlaceDetailsResponse {
  result?: {
    place_id:                 string;
    name:                     string;
    formatted_phone_number?:  string;
    formatted_address?:       string;
    rating?:                  number;
    user_ratings_total?:      number;
    website?:                 string;
    url?:                     string;
  };
  status:         string;
  error_message?: string;
}

// ─── Text Search (jusqu'à 3 pages = 60 résultats) ────────────────────────────

async function textSearchPage(
  query: string,
  apiKey: string,
  pageToken?: string
): Promise<{ results: TextSearchResult[]; nextToken?: string | undefined }> {
  const params = new URLSearchParams({
    query,
    key:      apiKey,
    language: 'fr',
    ...(pageToken ? { pagetoken: pageToken } : {}),
  });

  const res  = await fetchWithRetry(`${BASE}/textsearch/json?${params}`);
  const data = (await res.json()) as TextSearchResponse;

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places Text Search : ${data.status} — ${data.error_message ?? ''}`);
  }

  return { results: data.results, nextToken: data.next_page_token };
}

export async function fetchTextSearch(
  niche: string,
  location: string,
  apiKey: string,
  maxResults = 60
): Promise<TextSearchResult[]> {
  const query   = `${niche} ${location}`;
  const results: TextSearchResult[] = [];
  let pageToken: string | undefined;
  let page = 0;

  while (results.length < maxResults && page < 3) {
    // Google exige un délai avant qu'un page_token devienne valide
    if (pageToken) await sleep(2200);

    let pageResults: TextSearchResult[];
    let nextToken: string | undefined;
    try {
      ({ results: pageResults, nextToken } = await textSearchPage(query, apiKey, pageToken));
    } catch (err) {
      if (page === 0) throw err; // page 0 = vraie erreur (clé, requête, quota…)
      // Les page_token de l'API Places legacy renvoient souvent INVALID_REQUEST.
      // On réessaie une fois après un délai plus long, sinon on garde l'acquis.
      await sleep(3000);
      try {
        ({ results: pageResults, nextToken } = await textSearchPage(query, apiKey, pageToken));
      } catch {
        console.warn(`[places] pagination arrêtée (page ${page + 1}) — ${results.length} résultat(s) conservé(s)`);
        break;
      }
    }

    results.push(...pageResults);
    pageToken = nextToken;
    page++;

    if (!nextToken) break;
  }

  return results.slice(0, maxResults);
}

// ─── Place Details (téléphone + site web) ────────────────────────────────────

const DETAILS_FIELDS = [
  'name', 'formatted_phone_number', 'formatted_address',
  'rating', 'user_ratings_total', 'website', 'url', 'place_id',
].join(',');

async function fetchPlaceDetails(
  placeId: string,
  apiKey: string
): Promise<PlaceDetailsResponse['result']> {
  const params = new URLSearchParams({
    place_id: placeId,
    fields:   DETAILS_FIELDS,
    key:      apiKey,
    language: 'fr',
  });

  const res  = await fetchWithRetry(`${BASE}/details/json?${params}`);
  const data = (await res.json()) as PlaceDetailsResponse;

  if (data.status !== 'OK') {
    throw new Error(`Place Details ${placeId} : ${data.status}`);
  }
  return data.result;
}

// ─── Collecte complète ────────────────────────────────────────────────────────

export async function collectPlaces(
  niche: string,
  location: string,
  apiKey: string,
  options: { limit: number; minReviews: number }
): Promise<PlaceResult[]> {
  process.stdout.write(`\n[places] Recherche "${niche}" à "${location}"…\n`);

  const searchResults = await fetchTextSearch(niche, location, apiKey, options.limit);
  process.stdout.write(`[places] ${searchResults.length} résultats trouvés\n`);

  // Filtre de pertinence : on écarte les commerces hors-sujet (santé, resto, magasins…)
  // que Google ajoute quand la recherche texte est floue.
  const words    = nicheWords(niche);
  const onTopic  = searchResults.filter((r) => isRelevantPlace(r.name, r.types, words));
  // Repli : si le filtre vide tout (niche au type Google inhabituel), on garde l'original.
  const relevant = onTopic.length > 0 ? onTopic : searchResults;
  process.stdout.write(
    `[places] ${relevant.length} pertinents (${searchResults.length - relevant.length} hors-sujet écartés)\n`
  );

  // Filtre préliminaire sur les avis (évite des appels Place Details inutiles)
  const filtered = relevant.filter(
    (r) => (r.user_ratings_total ?? 0) >= options.minReviews
  );
  process.stdout.write(
    `[places] ${filtered.length} après filtre --min-reviews ${options.minReviews}\n`
  );

  const places: PlaceResult[] = [];
  let done = 0;

  for (const r of filtered) {
    try {
      const detail = await fetchPlaceDetails(r.place_id, apiKey);
      if (!detail) continue;

      const website     = detail.website ?? null;
      const presence    = classifyWebPresence(website);

      places.push({
        place_id:      detail.place_id,
        business_name: detail.name,
        phone:         detail.formatted_phone_number ?? null,
        address:       detail.formatted_address     ?? r.formatted_address ?? null,
        rating:        detail.rating                ?? r.rating            ?? null,
        review_count:  detail.user_ratings_total    ?? r.user_ratings_total ?? null,
        website,
        maps_url:      detail.url ?? null,
        web_presence:  presence,
      });

      done++;
      process.stdout.write(`\r[places] Détails récupérés : ${done}/${filtered.length}`);

      // Légère pause pour éviter le rate limiting
      await sleep(150);
    } catch (err) {
      process.stderr.write(`\n[places] ⚠ ${r.name} : ${(err as Error).message}\n`);
    }
  }

  process.stdout.write('\n');
  return places;
}
