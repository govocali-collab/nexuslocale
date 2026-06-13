import type { PlaceReview, ProspectFull } from './types.js';

const BASE = 'https://maps.googleapis.com/maps/api/place';

const DETAILS_FIELDS = [
  'name', 'formatted_phone_number', 'formatted_address',
  'rating', 'user_ratings_total', 'website', 'url',
  'types', 'opening_hours', 'reviews', 'place_id',
].join(',');

const SKIP_TYPES = new Set([
  'point_of_interest', 'establishment', 'general_contractor',
  'local_government_office', 'premise',
]);

interface DetailsResult {
  name:                    string;
  formatted_phone_number?: string;
  formatted_address?:      string;
  rating?:                 number;
  user_ratings_total?:     number;
  website?:                string;
  url?:                    string;
  place_id?:               string;
  types?:                  string[];
  opening_hours?:          { weekday_text?: string[] };
  reviews?:                Array<{ rating: number; text: string; time: number }>;
}

async function fetchDetails(placeId: string, apiKey: string): Promise<DetailsResult | null> {
  const params = new URLSearchParams({
    place_id: placeId,
    fields:   DETAILS_FIELDS,
    key:      apiKey,
    language: 'fr',
  });
  const res  = await fetch(`${BASE}/details/json?${params}`);
  const data = await res.json() as { result?: DetailsResult; status: string };
  return data.status === 'OK' ? (data.result ?? null) : null;
}

async function findPlaceId(name: string, city: string, apiKey: string): Promise<string | null> {
  const params = new URLSearchParams({
    query:    `${name} ${city}`,
    key:      apiKey,
    language: 'fr',
    fields:   'place_id',
  });
  const res  = await fetch(`${BASE}/findplacefromtext/json?${params}&inputtype=textquery`);
  const data = await res.json() as {
    candidates?: Array<{ place_id: string }>;
    status: string;
  };
  return data.candidates?.[0]?.place_id ?? null;
}

// Tente d'enrichir un prospect avec des données fraîches de Places API.
// Ne lève pas d'erreur si l'enrichissement échoue — retourne le prospect intact.
export async function enrichFromPlaces(
  prospect: ProspectFull,
  apiKey: string,
): Promise<ProspectFull> {
  try {
    // 1) Résolution du place_id
    let placeId = prospect.place_id ?? null;

    if (!placeId) {
      placeId = await findPlaceId(prospect.business_name, prospect.city, apiKey);
    }
    if (!placeId) return prospect;

    // 2) Détails complets
    const detail = await fetchDetails(placeId, apiKey);
    if (!detail) return prospect;

    // 3) Avis récents — max 3, texte > 30 car.
    const reviews: PlaceReview[] = (detail.reviews ?? [])
      .filter((r) => r.text.trim().length > 30)
      .slice(0, 3)
      .map((r) => ({ rating: r.rating, text: r.text, time: r.time }));

    // 4) Horaires formatées
    const opening_hours = detail.opening_hours?.weekday_text?.join(' | ') ?? null;

    // 5) Types de services (filtrage des generics)
    const serviceTypes = (detail.types ?? [])
      .filter((t) => !SKIP_TYPES.has(t))
      .map((t) => t.replace(/_/g, ' '));

    return {
      ...prospect,
      place_id:      placeId,
      address:       detail.formatted_address ?? prospect.address ?? null,
      opening_hours,
      place_reviews: reviews,
    };
  } catch {
    return prospect;
  }
}
