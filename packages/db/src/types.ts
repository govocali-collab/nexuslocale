// ─── Enums ────────────────────────────────────────────────────────────────────

export type SiteType = 'rent' | 'client' | 'demo';
export type SiteStatus = 'research' | 'built' | 'indexed' | 'ranking' | 'rented' | 'sold';

export type LeadType = 'call' | 'sms' | 'form';

export type WebPresence = 'none' | 'social_only' | 'has_site';
export type ProspectStatus = 'new' | 'demo_sent' | 'negotiating' | 'won' | 'lost';

export type UpsellProduct = 'call_tracking' | 'sms_automation' | 'ai_chatbot' | 'voice_receptionist';
export type UpsellStatus = 'active' | 'paused' | 'cancelled';

// ─── Tables ───────────────────────────────────────────────────────────────────

export interface Site {
  id: string;
  domain: string;
  type: SiteType;
  niche: string;
  city: string;
  status: SiteStatus;
  twilio_number: string | null;
  forward_to: string | null;
  vercel_project: string | null;
  gsc_property: string | null;
  monthly_rent: number | null;
  client_id: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  site_id: string;
  type: LeadType;
  caller_number: string | null;
  duration_sec: number | null;
  recording_url: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export interface Ranking {
  id:          string;
  site_id:     string;
  keyword:     string;
  position:    number | null;
  page:        string | null;
  impressions: number | null;
  clicks:      number | null;
  ctr:         number | null;
  checked_at:  string;
  source:      string;
  created_at:  string;
}

export interface Prospect {
  id: string;
  business_name: string;
  niche: string;
  city: string;
  phone: string | null;
  rating: number | null;
  review_count: number | null;
  web_presence: WebPresence;
  pain_score: number | null;
  prospect_score: number | null;
  status: ProspectStatus;
  demo_url: string | null;
  // Colonnes ajoutées par migration 008
  website: string | null;
  maps_url: string | null;
  detected_issues: string[] | null;
  created_at: string;
}

export interface Client {
  id: string;
  business_name: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  site_id: string | null;
  sale_price: number | null;
  hosting_monthly: number | null;
  stripe_subscription_id: string | null;
  created_at: string;
}

export interface Upsell {
  id: string;
  client_id: string;
  product: UpsellProduct;
  monthly_price: number;
  status: UpsellStatus;
  created_at: string;
}

// ─── Insert / Update variants (sans id ni created_at) ────────────────────────

export type SiteInsert = Omit<Site, 'id' | 'created_at'>;
export type SiteUpdate = Partial<SiteInsert>;

export type LeadInsert = Omit<Lead, 'id' | 'created_at'>;
export type LeadUpdate = Partial<LeadInsert>;

export type RankingInsert = Omit<Ranking, 'id' | 'created_at'>;
export type RankingUpdate = Partial<RankingInsert>;

export type ProspectInsert = Omit<Prospect, 'id' | 'created_at'>;
export type ProspectUpdate = Partial<ProspectInsert>;

export type ClientInsert = Omit<Client, 'id' | 'created_at'>;
export type ClientUpdate = Partial<ClientInsert>;

export type UpsellInsert = Omit<Upsell, 'id' | 'created_at'>;
export type UpsellUpdate = Partial<UpsellInsert>;

// ─── Database schema (pour Supabase generics) ─────────────────────────────────

export interface Database {
  public: {
    Tables: {
      sites: {
        Row: Site;
        Insert: SiteInsert;
        Update: SiteUpdate;
      };
      leads: {
        Row: Lead;
        Insert: LeadInsert;
        Update: LeadUpdate;
      };
      rankings: {
        Row: Ranking;
        Insert: RankingInsert;
        Update: RankingUpdate;
      };
      prospects: {
        Row: Prospect;
        Insert: ProspectInsert;
        Update: ProspectUpdate;
      };
      clients: {
        Row: Client;
        Insert: ClientInsert;
        Update: ClientUpdate;
      };
      upsells: {
        Row: Upsell;
        Insert: UpsellInsert;
        Update: UpsellUpdate;
      };
    };
    Enums: {
      site_type: SiteType;
      site_status: SiteStatus;
      lead_type: LeadType;
      web_presence: WebPresence;
      prospect_status: ProspectStatus;
      upsell_product: UpsellProduct;
      upsell_status: UpsellStatus;
    };
  };
}
