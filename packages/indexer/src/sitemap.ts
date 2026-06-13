import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({ ignoreAttributes: false });

/** Fetches and parses a sitemap (standard or index), returns all <loc> URLs. */
export async function fetchSitemapUrls(sitemapUrl: string, depth = 0): Promise<string[]> {
  if (depth > 2) return []; // guard against deeply nested sitemap indexes

  const res = await fetch(sitemapUrl, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Sitemap HTTP ${res.status}: ${sitemapUrl}`);

  const xml = await res.text();
  const doc = parser.parse(xml) as Record<string, unknown>;

  // Standard sitemap: <urlset><url><loc>...</loc></url></urlset>
  const urlset = doc['urlset'] as Record<string, unknown> | undefined;
  if (urlset) {
    const urls = urlset['url'];
    const arr  = Array.isArray(urls) ? urls : (urls != null ? [urls] : []);
    return arr.map((u: Record<string, unknown>) => String(u['loc'] ?? '')).filter(Boolean);
  }

  // Sitemap index: <sitemapindex><sitemap><loc>...</loc></sitemap></sitemapindex>
  const idx = doc['sitemapindex'] as Record<string, unknown> | undefined;
  if (idx) {
    const sitemaps = idx['sitemap'];
    const arr = Array.isArray(sitemaps) ? sitemaps : (sitemaps != null ? [sitemaps] : []);
    const nested = await Promise.all(
      arr.map((s: Record<string, unknown>) => fetchSitemapUrls(String(s['loc'] ?? ''), depth + 1))
    );
    return nested.flat();
  }

  return [];
}
