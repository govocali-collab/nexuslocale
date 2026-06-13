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
): Promise<{ results: TextSearchResult[]; nextToken?: string }> {
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
    // Google exige un délai avant de réutiliser un page_token
    if (pageToken) await sleep(2200);

    const { results: pageResults, nextToken } = await textSearchPage(query, apiKey, pageToken);
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

  // Filtre préliminaire sur les avis (évite des appels Place Details inutiles)
  const filtered = searchResults.filter(
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
