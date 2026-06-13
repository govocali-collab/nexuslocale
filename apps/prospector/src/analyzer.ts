import type { PlaceResult, SiteAnalysis, AnalyzedProspect } from './types.js';

const FETCH_TIMEOUT_MS = 10_000;
const LARGE_PAGE_BYTES = 5 * 1024 * 1024; // 5 Mo
const STALE_YEAR       = 2022;
const BATCH_SIZE       = 8;

// ─── Signatures de builders datés ────────────────────────────────────────────

const OLD_BUILDER_PATTERNS: RegExp[] = [
  // Wix
  /wixstatic\.com/i,
  /wix\.com\/lpviral/i,
  /cdn\.wix\.com/i,
  // GoDaddy Website Builder
  /secureserver\.net/i,
  /godaddy\.com\/website-builder/i,
  // Vieux thèmes WordPress
  /wp-content\/themes\/twenty(ten|eleven|twelve|thirteen|fourteen|fifteen)\b/i,
  // Weebly / Jimdo
  /weebly\.com/i,
  /jimdosite\.com|jimdofree\.com/i,
  // Squarespace (souvent mal optimisé)
  /squarespace\.com/i,
];

// Regex copyright — cherche un an entre 2010 et l'année courante dans les 5000 derniers chars
const COPYRIGHT_RE = /(?:©|&copy;|copyright)\s*(\d{4})/gi;

// ─── Analyse d'un site ────────────────────────────────────────────────────────

export async function analyzeSite(url: string): Promise<SiteAnalysis> {
  const issues: string[] = [];

  // ── Vérification HTTPS ───────────────────────────────────────────────────
  const hasHttps = url.startsWith('https://');
  if (!hasHttps) issues.push('Pas de HTTPS');

  // ── Requête avec timeout ─────────────────────────────────────────────────
  let html   = '';
  let isDead = false;
  let isLargePage = false;

  try {
    const controller = new AbortController();
    const timer      = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(url, {
      signal:  controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NexusLocale-Prospector/1.0)' },
      redirect: 'follow',
    });
    clearTimeout(timer);

    if (!res.ok) {
      isDead = true;
      issues.push(`Erreur HTTP ${res.status}`);
    } else {
      // Taille de page
      const contentLength = Number(res.headers.get('content-length') ?? '0');
      if (contentLength > LARGE_PAGE_BYTES) {
        isLargePage = true;
        issues.push(`Page trop lourde (${(contentLength / 1024 / 1024).toFixed(1)} Mo)`);
      }

      // Lire le corps — limité à 8 Mo pour ne pas bloquer
      const buf = await res.arrayBuffer();
      if (buf.byteLength > LARGE_PAGE_BYTES) {
        isLargePage = true;
        if (!issues.find((i) => i.startsWith('Page trop lourde'))) {
          issues.push(`Page trop lourde (${(buf.byteLength / 1024 / 1024).toFixed(1)} Mo)`);
        }
      }
      html = new TextDecoder().decode(buf.slice(0, 500_000)); // Parse max 500 KB
    }
  } catch (err: unknown) {
    isDead = true;
    const msg = (err as Error).message ?? '';
    if (msg.includes('aborted') || msg.includes('timeout')) {
      issues.push('Timeout — site trop lent ou inaccessible');
    } else if (msg.toLowerCase().includes('ssl') || msg.toLowerCase().includes('certificate')) {
      issues.push('Certificat SSL invalide ou expiré');
    } else {
      issues.push(`Lien mort ou erreur réseau`);
    }
  }

  if (isDead) {
    return {
      reachable: false, isDead: true,
      hasHttps, hasViewport: false,
      copyrightYear: null, hasOldBuilder: false,
      isLargePage: false, issues,
    };
  }

  // ── Analyse HTML ─────────────────────────────────────────────────────────

  // Viewport
  const hasViewport = /<meta[^>]+name\s*=\s*["']viewport["']/i.test(html);
  if (!hasViewport) issues.push('Pas de version mobile (viewport manquant)');

  // Copyright year
  let copyrightYear: number | null = null;
  const tail = html.slice(-5000); // On cherche dans le bas de page
  let match: RegExpExecArray | null;
  const yearRe = new RegExp(COPYRIGHT_RE.source, 'gi');
  while ((match = yearRe.exec(tail)) !== null) {
    const y = Number(match[1]);
    if (y >= 2010 && y <= new Date().getFullYear()) {
      if (copyrightYear === null || y < copyrightYear) copyrightYear = y;
    }
  }
  if (copyrightYear !== null && copyrightYear < STALE_YEAR) {
    issues.push(`Copyright ${copyrightYear} — site non maintenu`);
  }

  // Builder daté
  const hasOldBuilder = OLD_BUILDER_PATTERNS.some((re) => re.test(html));
  if (hasOldBuilder) issues.push('Builder daté ou générique (Wix, GoDaddy, Squarespace…)');

  return {
    reachable: true, isDead: false,
    hasHttps, hasViewport,
    copyrightYear, hasOldBuilder,
    isLargePage, issues,
  };
}

// ─── Pain score ───────────────────────────────────────────────────────────────

function painScore(place: PlaceResult, analysis: SiteAnalysis | null): number {
  if (place.web_presence === 'none' || place.web_presence === 'social_only') return 100;
  if (!analysis) return 50; // analyse échouée = douleur inconnue, score médian

  let score = 0;
  if (analysis.isDead)       score += 40;
  if (!analysis.hasHttps)    score += 20;
  if (!analysis.hasViewport) score += 20;
  if (analysis.copyrightYear !== null && analysis.copyrightYear < STALE_YEAR) score += 10;
  if (analysis.hasOldBuilder || analysis.isLargePage)                          score += 10;

  return Math.min(score, 100);
}

// ─── Analyse en lots parallèles ───────────────────────────────────────────────

async function analyzeBatch(places: PlaceResult[]): Promise<AnalyzedProspect[]> {
  return Promise.all(
    places.map(async (place): Promise<AnalyzedProspect> => {
      let analysis: SiteAnalysis | null = null;

      if (place.web_presence === 'has_site' && place.website) {
        try {
          analysis = await analyzeSite(place.website);
        } catch {
          analysis = null;
        }
      }

      const pain     = painScore(place, analysis);
      const detected = analysis?.issues ?? (place.web_presence === 'none'
        ? ['Aucun site web']
        : ['Présence web limitée aux réseaux sociaux']);

      return {
        ...place,
        pain_score:      pain,
        prospect_score:  0, // calculé après dans scorer.ts
        detected_issues: detected,
      };
    })
  );
}

export async function analyzeAll(places: PlaceResult[]): Promise<AnalyzedProspect[]> {
  const results: AnalyzedProspect[] = [];
  let done = 0;

  for (let i = 0; i < places.length; i += BATCH_SIZE) {
    const batch        = places.slice(i, i + BATCH_SIZE);
    const batchResults = await analyzeBatch(batch);
    results.push(...batchResults);
    done += batch.length;
    process.stdout.write(`\r[analyzer] Sites analysés : ${done}/${places.length}`);
  }

  process.stdout.write('\n');
  return results;
}
