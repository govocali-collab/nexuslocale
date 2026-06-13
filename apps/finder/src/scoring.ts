import type { KeywordInfo, DomainCandidate } from './types.js';

export function computeNicheScore(
  keywords:   KeywordInfo[],
  candidates: DomainCandidate[],
): number {
  if (keywords.length === 0) return 0;

  const topN     = Math.min(10, keywords.length);
  const avgScore = keywords.slice(0, topN).reduce((s, k) => s + k.score, 0) / topN;

  // Bonus +20% si un domaine exact .ca disponible à prix normal
  const hasGoodExact = candidates.some(
    c => c.type === 'exact' && c.available === true && (c.price_usd ?? 99) <= 20,
  );

  return Math.round(avgScore * (hasGoodExact ? 1.2 : 1.0) * 100) / 100;
}

export function pickBestDomain(candidates: DomainCandidate[]): DomainCandidate | null {
  const available = candidates.filter(c => c.available === true);
  if (available.length === 0) return null;

  return available.sort((a, b) => {
    // Priorité : .ca > .com, exact > partial, prix croissant
    const caA   = a.tld === '.ca' ? 2 : 0;
    const caB   = b.tld === '.ca' ? 2 : 0;
    const typA  = a.type === 'exact' ? 1 : 0;
    const typB  = b.type === 'exact' ? 1 : 0;
    const score = (caB + typB) - (caA + typA);
    if (score !== 0) return score;
    return (a.price_usd ?? 99) - (b.price_usd ?? 99);
  })[0] ?? null;
}
