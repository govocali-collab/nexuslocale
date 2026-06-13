import type { AnalyzedProspect } from './types.js';

// Facteurs de présence web (plus le site est mauvais, plus on multiplie)
const PRESENCE_FACTOR: Record<string, (painScore: number) => number> = {
  none:        () => 2.0,
  social_only: () => 1.8,
  has_site:    (pain) => pain / 50,
};

export function scoreProspect(prospect: AnalyzedProspect): number {
  const ratingFactor = (prospect.rating ?? 0) >= 4.3 ? 1.0 : 0.3;
  const reviews      = prospect.review_count ?? 0;
  const presenceFn   = PRESENCE_FACTOR[prospect.web_presence] ?? (() => 0);
  const score        = ratingFactor * reviews * presenceFn(prospect.pain_score);
  return Math.round(score * 10) / 10; // 1 décimale
}

export function scoreAll(prospects: AnalyzedProspect[]): AnalyzedProspect[] {
  return prospects
    .map((p) => ({ ...p, prospect_score: scoreProspect(p) }))
    .sort((a, b) => b.prospect_score - a.prospect_score);
}
