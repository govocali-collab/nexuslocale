import type { KeywordInfo, Cluster } from './types.js';

const FR_STOP = new Set([
  'de','du','des','d','la','le','les','l','un','une','et','en','sur',
  'à','au','aux','pour','avec','par','dans','qui','que','qu','si','ou',
  'ce','se','est','pas','ne','plus','aussi','comment','mon','ma','mes',
  'notre','votre','leur','leurs','tout','tous','sans','très','quel',
  'quelle','quels','quelles','après','avant','même','autre','autres',
]);

function normalizeStr(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function significantWords(keyword: string): string[] {
  return normalizeStr(keyword).split(' ').filter(w => w.length > 2 && !FR_STOP.has(w));
}

export function computeScore(kw: Pick<KeywordInfo, 'search_volume' | 'cpc' | 'keyword_difficulty'>): number {
  if (!kw.search_volume || kw.search_volume <= 0) return 0;
  if (!kw.cpc || kw.cpc <= 0) return 0;
  const rawKd = kw.keyword_difficulty;
  const kd    = rawKd != null && !isNaN(rawKd) ? rawKd : 50;
  return (kw.cpc * kw.search_volume) / Math.max(kd, 1);
}

export function filterKeywords(
  raw: KeywordInfo[],
  opts: { maxDifficulty?: number } = {},
): KeywordInfo[] {
  return raw
    .filter(kw => {
      if (!kw.search_volume || kw.search_volume <= 0) return false;
      if (!kw.cpc || kw.cpc <= 0) return false;
      if (opts.maxDifficulty !== undefined && kw.keyword_difficulty !== null) {
        if (kw.keyword_difficulty > opts.maxDifficulty) return false;
      }
      return true;
    })
    .map(kw => ({ ...kw, score: computeScore(kw) }))
    .sort((a, b) => b.score - a.score);
}

export function clusterKeywords(keywords: KeywordInfo[], topN = 5): Cluster[] {
  const used     = new Set<string>();
  const clusters: Cluster[] = [];

  for (const kw of keywords) {
    if (used.has(kw.keyword)) continue;
    const wordsA = significantWords(kw.keyword);
    if (wordsA.length === 0) continue;

    const members: KeywordInfo[] = [kw];
    used.add(kw.keyword);

    for (const other of keywords) {
      if (used.has(other.keyword)) continue;
      const wordsB  = significantWords(other.keyword);
      const shared  = wordsA.filter(w => wordsB.includes(w));
      const overlap = Math.min(2, Math.ceil(wordsA.length / 2));
      if (shared.length >= overlap) {
        members.push(other);
        used.add(other.keyword);
      }
    }

    const totalVol = members.reduce((s, k) => s + (k.search_volume ?? 0), 0);
    const avgCpc   = members.reduce((s, k) => s + (k.cpc ?? 0), 0) / members.length;
    const avgScore = members.reduce((s, k) => s + k.score, 0) / members.length;

    clusters.push({
      label:        wordsA.slice(0, 3).join(' '),
      keywords:     members,
      total_volume: totalVol,
      avg_cpc:      Math.round(avgCpc * 100) / 100,
      avg_score:    Math.round(avgScore * 100) / 100,
    });

    if (clusters.length >= topN) break;
  }

  return clusters.sort((a, b) => b.avg_score - a.avg_score);
}
