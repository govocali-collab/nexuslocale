export interface KeywordInfo {
  keyword:            string;
  search_volume:      number | null;
  cpc:                number | null;
  competition:        number | null;
  keyword_difficulty: number | null;
  score:              number;
}

export interface Cluster {
  label:        string;
  keywords:     KeywordInfo[];
  total_volume: number;
  avg_cpc:      number;
  avg_score:    number;
}

export interface DomainCandidate {
  domain:    string;
  tld:       string;
  type:      'exact' | 'partial';
  available: boolean | null;
  price_usd: number | null;
  error?:    string;
}

export interface ScanResult {
  niche:       string;
  city:        string;
  country:     string;
  lang:        string;
  keywords:    KeywordInfo[];
  clusters:    Cluster[];
  candidates:  DomainCandidate[];
  niche_score: number;
  best_domain: DomainCandidate | null;
  scanned_at:  string;
}

export interface NamecheapConfig {
  apiUser:  string;
  apiKey:   string;
  clientIp: string;
  sandbox:  boolean;
}
