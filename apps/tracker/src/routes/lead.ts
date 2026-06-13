import type { Request, Response } from 'express';
import { getSiteByDomain, insertLead } from '../db.js';

// ─── Rate limiter en mémoire (par IP) ────────────────────────────────────────

interface RateEntry { count: number; resetAt: number }
const ipMap = new Map<string, RateEntry>();
const RATE_MAX    = 20;
const RATE_WINDOW = 15 * 60 * 1000; // 15 min

// Nettoyage périodique pour éviter la croissance mémoire
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipMap) {
    if (now > entry.resetAt) ipMap.delete(ip);
  }
}, 60 * 60 * 1000);

function isAllowed(ip: string): boolean {
  const now   = Date.now();
  const entry = ipMap.get(ip);
  if (!entry || now > entry.resetAt) { ipMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW }); return true; }
  if (entry.count >= RATE_MAX) return false;
  entry.count++;
  return true;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

interface FormBody {
  site_domain?:  string;
  name?:         string;
  phone?:        string;
  email?:        string;
  message?:      string;
  service?:      string;
  city?:         string;
  _confirm?:     string; // honeypot — doit rester vide
  [key: string]: unknown;
}

// POST /api/lead — soumission de formulaire depuis le site-template
export async function handleFormLead(req: Request, res: Response): Promise<void> {
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
    ?? req.socket.remoteAddress
    ?? 'unknown';

  // Rate limiting
  if (!isAllowed(ip)) {
    res.status(429).json({ error: 'Trop de requêtes' });
    return;
  }

  const body = req.body as FormBody;

  // Honeypot — les bots remplissent ce champ, les humains non
  if (body._confirm !== '' && body._confirm !== undefined) {
    res.json({ ok: true }); // Réponse silencieuse au bot
    return;
  }

  const domain = body.site_domain;
  if (!domain) {
    res.status(422).json({ error: 'site_domain requis' });
    return;
  }

  const site = await getSiteByDomain(domain).catch(() => null);
  if (!site) {
    res.status(404).json({ error: `Site "${domain}" introuvable` });
    return;
  }

  // Reconstruit le payload sans les champs système
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { site_domain, _confirm, ...formData } = body;
  const phone = typeof body.phone === 'string' ? body.phone : null;

  await insertLead({
    site_id:       site.id,
    type:          'form',
    caller_number: phone,
    duration_sec:  null,
    recording_url: null,
    payload:       formData as Record<string, unknown>,
  }).catch((e: unknown) => console.error('[lead] insertLead:', e));

  res.json({ ok: true, received_at: new Date().toISOString() });
}
