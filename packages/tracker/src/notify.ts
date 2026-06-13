import type { TwilioClient } from './twilio.js';
import type { Lead, Site, Client } from './types.js';

interface NotifyOptions {
  client:     TwilioClient;
  lead:       Lead;
  site:       Site;
  tenant?:    Client | null;     // client assigné au site (type='client')
  ownerPhone: string;            // OWNER_PHONE — pour les sites type='rent'
  fromNumber: string;            // numéro Twilio expéditeur (tracking du site)
}

export async function notifyNewLead(opts: NotifyOptions): Promise<void> {
  const { client, lead, site, tenant, ownerPhone, fromNumber } = opts;

  // Destination : client assigné (si type='client') sinon proprio (type='rent')
  const toNumber = site.type === 'client'
    ? (tenant?.phone ?? ownerPhone)
    : ownerPhone;

  if (!toNumber) return; // Pas de destination configurée

  const emoji    = lead.type === 'call' ? '📞' : lead.type === 'sms' ? '💬' : '📝';
  const caller   = lead.caller_number ?? '(inconnu)';
  const duration = lead.type === 'call' && lead.duration_sec
    ? ` — ${lead.duration_sec}s`
    : '';
  const missed   = lead.type === 'call' && !lead.duration_sec ? ' [MANQUÉ]' : '';

  const body = `${emoji} Nouveau lead [${lead.type}]${missed} — ${site.domain} — ${caller}${duration}`
    .slice(0, 160); // SMS max 160 car.

  await client.messages.create({ to: toNumber, from: fromNumber, body });
}
