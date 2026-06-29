export type WebPresence = 'none' | 'social_only' | 'has_site';

export interface PlaceResult {
  place_id:     string;
  business_name: string;
  phone:         string | null;
  address:       string | null;
  rating:        number | null;
  review_count:  number | null;
  website:       string | null;
  maps_url:      string | null;
  web_presence:  WebPresence;
}

export interface SiteAnalysis {
  reachable:       boolean;
  isDead:          boolean;   // erreur SSL / timeout / 404 / toute erreur
  hasHttps:        boolean;
  hasViewport:     boolean;
  copyrightYear:   number | null;
  hasOldBuilder:   boolean;
  isLargePage:     boolean;   // > 5 Mo
  issues:          string[];  // descriptions lisibles des problèmes
}

export interface AnalyzedProspect extends PlaceResult {
  pain_score:      number;    // 0-100
  prospect_score:  number;    // calculé
  detected_issues: string[];
}

export interface ScanOptions {
  limit:       number;
  minReviews:  number;
  estimate:    boolean;
  simulate:    boolean;
  json:        boolean;
  judge:       boolean;
  minPain:     number; // ne garder que les prospects dont le pain_score ≥ ce seuil (filtre les bons sites)
}

// Coût approximatif Google Places API (vérifier console.cloud.google.com pour prix actuels)
export const PLACES_API_COST = {
  textSearch:   0.032,  // USD par requête Text Search
  placeDetails: 0.017,  // USD par requête Place Details (Basic)
} as const;
