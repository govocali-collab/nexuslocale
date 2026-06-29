export type WebPresence = 'none' | 'social_only' | 'has_site';

export interface PlaceReview {
  rating: number;
  text:   string;
  time:   number; // unix timestamp
}

export interface ProspectFull {
  id?:             string;
  business_name:   string;
  niche:           string;
  city:            string;
  phone:           string | null;
  rating:          number | null;
  review_count:    number | null;
  web_presence:    WebPresence;
  pain_score:      number | null;
  prospect_score:  number | null;
  status:          string;
  demo_url?:       string | null;
  website?:        string | null;
  maps_url?:       string | null;
  detected_issues?: string[] | null;
  // enriched via Places Details
  address?:        string | null;
  opening_hours?:  string | null;
  place_reviews?:  PlaceReview[];
  place_id?:       string | null;
}

// Contenu généré par l'API Anthropic
export interface GeneratedContent {
  branding: {
    tagline:         string;
    primary_color:   string;
    secondary_color: string;
  };
  pages: {
    home: {
      hero_title:    string;
      hero_subtitle: string;
      intro:         string;
      sections: Array<{
        type:      'content' | 'services_grid' | 'service_areas' | 'faq' | 'cta';
        heading?:  string;
        body?:     string;
        subtitle?: string;
      }>;
    };
    services: Array<{
      slug:             string;
      nav_label:        string;
      h1:               string;
      meta_title:       string;
      meta_description: string;
      image_query?:     string;
      sections:  Array<{ heading: string; body: string }>;
      local_data: {
        neighborhoods?:      string[];
        price_context?:      string;
        faqs?:               Array<{ q: string; a: string }>;
        competitor_context?: string;
        local_landmarks?:    string[];
      };
    }>;
    service_areas: Array<{
      city:            string;
      nav_label:       string;
      neighborhoods:   string[];
      local_context:   string;
      faqs?:           Array<{ q: string; a: string }>;
      local_landmarks?: string[];
    }>;
    contact: {
      intro: string;
      form_fields: Array<{
        name:     string;
        label:    string;
        type:     'text' | 'email' | 'tel' | 'textarea' | 'select';
        required: boolean;
        options?: string[];
      }>;
    };
  };
  local_data: {
    neighborhoods?:      string[];
    price_context?:      string;
    faqs?:               Array<{ q: string; a: string }>;
    competitor_context?: string;
    local_landmarks?:    string[];
  };
}

// Tarifs approximatifs claude-sonnet-4-6 (vérifier console.anthropic.com)
export const ANTHROPIC_COST = {
  INPUT_PER_MTOK:    3.00,
  OUTPUT_PER_MTOK:   15.00,
  EST_INPUT_TOKENS:  2500,
  EST_OUTPUT_TOKENS: 4500,
} as const;
