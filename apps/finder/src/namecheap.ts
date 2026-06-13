import { XMLParser } from 'fast-xml-parser';
import type { DomainCandidate, NamecheapConfig } from './types.js';

const PROD_URL    = 'https://api.namecheap.com/xml.response';
const SANDBOX_URL = 'https://api.sandbox.namecheap.com/xml.response';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', parseAttributeValue: true });

function baseUrl(cfg: NamecheapConfig): string {
  return cfg.sandbox ? SANDBOX_URL : PROD_URL;
}

function baseParams(cfg: NamecheapConfig, command: string): URLSearchParams {
  return new URLSearchParams({
    ApiUser:  cfg.apiUser,
    ApiKey:   cfg.apiKey,
    UserName: cfg.apiUser,
    ClientIp: cfg.clientIp,
    Command:  command,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ncFetch(url: string, params: URLSearchParams): Promise<any> {
  const res = await fetch(`${url}?${params.toString()}`);
  const xml = await res.text();
  const doc = parser.parse(xml);

  const apiResp = doc['ApiResponse'];
  if (!apiResp) throw new Error('Réponse Namecheap invalide (pas d\'ApiResponse)');

  if (apiResp['@_Status'] === 'ERROR') {
    const rawErrors = apiResp['Errors']?.['Error'];
    const arr = Array.isArray(rawErrors) ? rawErrors : (rawErrors ? [rawErrors] : []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = arr.map((e: any) => (typeof e === 'object' ? e['#text'] ?? JSON.stringify(e) : String(e))).join('; ');
    if (/not.*white.?list|IP/i.test(msg)) {
      throw new Error(
        `IP non whitelistée dans Namecheap.\n` +
        `Ajoutez votre IP publique sur https://ap.www.namecheap.com/settings/tools/apiaccess/\n` +
        `Vérifiez la valeur de NAMECHEAP_CLIENT_IP dans .env\n` +
        `Erreur originale : ${msg}`
      );
    }
    throw new Error(`Namecheap API : ${msg}`);
  }

  return apiResp['CommandResponse'];
}

// Vérifie la disponibilité de jusqu'à 50 domaines en une requête
export async function checkDomains(
  domains: string[],
  cfg:     NamecheapConfig,
): Promise<Pick<DomainCandidate, 'domain' | 'available' | 'error'>[]> {
  const results: Pick<DomainCandidate, 'domain' | 'available' | 'error'>[] = [];

  for (let i = 0; i < domains.length; i += 50) {
    const batch  = domains.slice(i, i + 50);
    const params = baseParams(cfg, 'namecheap.domains.check');
    params.set('DomainList', batch.join(','));

    const cmd  = await ncFetch(baseUrl(cfg), params);
    const raw  = cmd?.['DomainCheckResult'];
    const arr  = Array.isArray(raw) ? raw : (raw ? [raw] : []);

    for (const item of arr) {
      results.push({
        domain:    String(item['@_Domain'] ?? ''),
        available: item['@_Available'] === true || item['@_Available'] === 'true',
      });
    }
  }

  return results;
}

// Achète un domaine avec WhoisGuard
export async function purchaseDomain(
  domain: string,
  cfg:    NamecheapConfig,
  contact: {
    firstName: string; lastName:   string; address1:  string;
    city:      string; province:   string; postalCode: string;
    country:   string; phone:      string; email:     string;
  },
): Promise<{ orderId: string; transactionId: string; chargedAmount: number }> {
  const params = baseParams(cfg, 'namecheap.domains.create');
  params.set('DomainName',        domain);
  params.set('Years',             '1');
  params.set('AddFreeWhoisguard', 'yes');
  params.set('WGEnabled',         'yes');

  const roles = ['Registrant', 'Tech', 'Admin', 'AuxBilling'];
  for (const role of roles) {
    params.set(`${role}FirstName`,     contact.firstName);
    params.set(`${role}LastName`,      contact.lastName);
    params.set(`${role}Address1`,      contact.address1);
    params.set(`${role}City`,          contact.city);
    params.set(`${role}StateProvince`, contact.province);
    params.set(`${role}PostalCode`,    contact.postalCode);
    params.set(`${role}Country`,       contact.country);
    params.set(`${role}Phone`,         contact.phone);
    params.set(`${role}EmailAddress`,  contact.email);
  }

  const cmd = await ncFetch(baseUrl(cfg), params);
  const res = cmd?.['DomainCreateResult'];
  return {
    orderId:       String(res?.['@_OrderID']       ?? ''),
    transactionId: String(res?.['@_TransactionID'] ?? ''),
    chargedAmount: parseFloat(String(res?.['@_ChargedAmount'] ?? '0')),
  };
}

// Configure les nameservers Vercel
export async function setVercelNameservers(domain: string, cfg: NamecheapConfig): Promise<void> {
  const sld    = domain.split('.')[0] ?? '';
  const tld    = domain.split('.').slice(1).join('.');
  const params = baseParams(cfg, 'namecheap.domains.dns.setCustom');
  params.set('SLD',         sld);
  params.set('TLD',         tld);
  params.set('Nameservers', 'ns1.vercel-dns.com,ns2.vercel-dns.com');
  await ncFetch(baseUrl(cfg), params);
}
