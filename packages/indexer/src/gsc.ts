import { getGoogleToken } from './auth.js';

const VERIFY_BASE  = 'https://www.googleapis.com/siteVerification/v1';
const WMT_BASE     = 'https://www.googleapis.com/webmasters/v3';
const INSPECT_BASE = 'https://searchconsole.googleapis.com/v1';

async function gFetch(
  url:    string,
  token:  string,
  method: string,
  body?:  unknown,
): Promise<unknown> {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  const label = url.split('?')[0]?.split('/').slice(-2).join('/') ?? url;
  if (!res.ok) {
    throw new Error(`Google API ${res.status} [${method} ${label}]: ${text.slice(0, 300)}`);
  }
  return text ? (JSON.parse(text) as unknown) : null;
}

// ─── Site Verification ────────────────────────────────────────────────────────

export interface VerificationInfo {
  token:           string;
  txtRecord:       string;
  dnsInstructions: string;
}

/** Gets a DNS TXT verification token for a bare domain (e.g. "example.ca"). */
export async function getDnsVerificationToken(domain: string): Promise<VerificationInfo> {
  const token = await getGoogleToken();
  const data  = await gFetch(
    `${VERIFY_BASE}/token?verificationMethod=DNS_TXT`,
    token, 'POST',
    { site: { type: 'INET_DOMAIN', identifier: domain } },
  ) as { token: string };
  return {
    token:     data.token,
    txtRecord: `google-site-verification=${data.token}`,
    dnsInstructions: [
      `Ajoutez ce TXT record au DNS de ${domain} :`,
      `  Hôte  : @  (racine du domaine)`,
      `  Type  : TXT`,
      `  Valeur: google-site-verification=${data.token}`,
      ``,
      `  → Namecheap : Domain List → Manage → Advanced DNS → Add New Record`,
      `  → Vercel DNS : Settings → Domains → (domaine) → DNS Records`,
      ``,
      `  Attendez 1-5 min pour la propagation avant de continuer.`,
    ].join('\n'),
  };
}

/** Completes DNS TXT verification (call after record has propagated). */
export async function verifySiteDns(domain: string): Promise<void> {
  const token = await getGoogleToken();
  await gFetch(
    `${VERIFY_BASE}/webResource?verificationMethod=DNS_TXT`,
    token, 'POST',
    { site: { type: 'INET_DOMAIN', identifier: domain } },
  );
}

// ─── Search Console ───────────────────────────────────────────────────────────

/** Adds a domain property to Search Console. Returns the sc-domain: property URL. */
export async function addGscProperty(domain: string): Promise<string> {
  const token    = await getGoogleToken();
  const siteUrl  = `sc-domain:${domain}`;
  await gFetch(`${WMT_BASE}/sites/${encodeURIComponent(siteUrl)}`, token, 'PUT');
  return siteUrl;
}

/** Submits a sitemap to Search Console. */
export async function submitSitemap(siteUrl: string, sitemapUrl: string): Promise<void> {
  const token = await getGoogleToken();
  await gFetch(
    `${WMT_BASE}/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`,
    token, 'PUT',
  );
}

// ─── URL Inspection ───────────────────────────────────────────────────────────

export interface InspectResult {
  url:             string;
  verdict:         string; // 'PASS' | 'FAIL' | 'NEUTRAL' | 'UNKNOWN'
  coverageState:   string;
  indexingState:   string;
  robotsTxtState:  string;
  crawledAs:       string | null;
  lastCrawlTime:   string | null;
}

/** Inspects a single URL via the URL Inspection API.
 *  Site must be verified in GSC before calling this. */
export async function inspectUrl(siteUrl: string, inspectionUrl: string): Promise<InspectResult> {
  const token = await getGoogleToken();
  const data  = await gFetch(`${INSPECT_BASE}/urlInspection/index:inspect`, token, 'POST', {
    inspectionUrl,
    siteUrl,
    languageCode: 'fr-CA',
  }) as { inspectionResult: { indexStatusResult: Record<string, string> } };
  const idx = data.inspectionResult?.indexStatusResult ?? {};
  return {
    url:            inspectionUrl,
    verdict:        idx['verdict']        ?? 'UNKNOWN',
    coverageState:  idx['coverageState']  ?? 'UNKNOWN',
    indexingState:  idx['indexingState']  ?? 'UNKNOWN',
    robotsTxtState: idx['robotsTxtState'] ?? 'UNKNOWN',
    crawledAs:      (idx['crawledAs']    as string | undefined) ?? null,
    lastCrawlTime:  (idx['lastCrawlTime'] as string | undefined) ?? null,
  };
}

// ─── Search Analytics ─────────────────────────────────────────────────────────

export interface SearchAnalyticsRow {
  keyword:     string;
  position:    number;
  impressions: number;
  clicks:      number;
  ctr:         number;
}

/** Queries GSC Search Analytics for actual click/impression/position data.
 *  Data has a ~3-day lag. Complements DataForSEO SERP for real traffic metrics. */
export async function getSearchAnalytics(
  siteUrl:   string,
  startDate: string, // YYYY-MM-DD
  endDate:   string,
  rowLimit   = 500,
): Promise<SearchAnalyticsRow[]> {
  const token = await getGoogleToken();
  const data  = await gFetch(
    `${WMT_BASE}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    token, 'POST',
    {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit,
    },
  ) as { rows?: Array<{ keys: string[]; position: number; impressions: number; clicks: number; ctr: number }> };
  return (data.rows ?? []).map(row => ({
    keyword:     row.keys[0] ?? '',
    position:    Math.round(row.position),
    impressions: row.impressions,
    clicks:      row.clicks,
    ctr:         row.ctr,
  }));
}
