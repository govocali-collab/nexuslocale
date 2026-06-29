import crypto from 'node:crypto';
import Twilio from 'twilio';
import { createAdminClient } from '@/lib/admin';

// Webhook Cal.com : reçoit les évènements de réservation.
// - BOOKING_CREATED / RESCHEDULED → stocke le RDV, passe le prospect en « demo_booked »,
//   et PROGRAMME un SMS de rappel ~2h avant via Twilio (aucun cron externe requis).
// - BOOKING_CANCELLED → annule le RDV + le SMS programmé.
// Configurer dans Cal.com → Settings → Webhooks, URL = https://app.nexuslocale.com/api/cal/webhook

export const dynamic = 'force-dynamic';

function verify(rawBody: string, signature: string | null): boolean {
  const secret = process.env['CAL_WEBHOOK_SECRET'];
  if (!secret) return true; // pas de secret configuré → on n'exige pas (à activer en prod)
  if (!signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

function extractZoomUrl(p: Record<string, unknown>): string | null {
  const meta = (p['metadata'] ?? {}) as Record<string, unknown>;
  const vcd = (p['videoCallData'] ?? {}) as Record<string, unknown>;
  const loc = p['location'];
  const candidates = [meta['videoCallUrl'], vcd['url'], typeof loc === 'string' && loc.startsWith('http') ? loc : null];
  return (candidates.find((c) => typeof c === 'string' && c) as string) ?? null;
}

function extractPhone(p: Record<string, unknown>): string | null {
  const responses = (p['responses'] ?? {}) as Record<string, { value?: unknown }>;
  const fromResp = responses['phone']?.value ?? responses['attendeePhoneNumber']?.value ?? responses['smsReminderNumber']?.value;
  if (typeof fromResp === 'string' && fromResp) return fromResp;
  const attendees = (p['attendees'] ?? []) as Array<Record<string, unknown>>;
  const a = attendees[0];
  const ph = a?.['phoneNumber'];
  return typeof ph === 'string' && ph ? ph : null;
}

// Format E.164 (Twilio). Suppose Canada/US si 10 chiffres.
function toE164(raw: string): string | null {
  const d = raw.replace(/[^\d+]/g, '');
  if (d.startsWith('+')) return d;
  const digits = d.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

function twilioClient() {
  const sid = process.env['TWILIO_ACCOUNT_SID'];
  const token = process.env['TWILIO_AUTH_TOKEN'];
  return sid && token ? Twilio(sid, token) : null;
}

// Trois rappels : 3h, 1h et 15 min avant le RDV (texte adapté à chaque moment).
const REMINDERS: Array<{ ms: number; body: (heure: string, zoom: string | null) => string }> = [
  { ms: 3 * 60 * 60 * 1000, body: (h, z) => `Rappel : votre démo Zoom avec NexusLocale est aujourd'hui à ${h}.${z ? ` Lien : ${z}` : ''} À tantôt !` },
  { ms: 1 * 60 * 60 * 1000, body: (h, z) => `Votre démo Zoom avec NexusLocale est dans 1 heure (à ${h}).${z ? ` Lien : ${z}` : ''}` },
  { ms: 15 * 60 * 1000,     body: (h, z) => `Ça commence bientôt ! Votre démo Zoom est dans ~15 minutes.${z ? ` Rejoignez : ${z}` : ''}` },
];

// Programme les rappels SMS (3h / 1h / 15 min avant). Retourne les SID (pour annulation).
// Un rappel est ignoré s'il tombe dans le passé, à <16 min (minimum Twilio) ou à >7 jours.
async function scheduleReminders(phone: string | null, startsAt: string, zoomUrl: string | null): Promise<string[]> {
  const mgSid = process.env['TWILIO_MESSAGING_SERVICE_SID'];
  const client = twilioClient();
  if (!mgSid || !client || !phone) return [];
  const to = toE164(phone);
  if (!to) return [];

  const startMs = new Date(startsAt).getTime();
  const nowMs = Date.now();
  const minMs = nowMs + 16 * 60 * 1000;       // Twilio : min ~15 min dans le futur
  const maxMs = nowMs + 7 * 24 * 3600 * 1000;  // Twilio : max 7 jours
  const heure = new Date(startsAt).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Toronto' });

  const sids: string[] = [];
  for (const r of REMINDERS) {
    const sendAtMs = startMs - r.ms;
    if (sendAtMs < minMs || sendAtMs >= startMs || sendAtMs > maxMs) continue;
    try {
      const msg = await client.messages.create({ messagingServiceSid: mgSid, to, body: r.body(heure, zoomUrl), scheduleType: 'fixed', sendAt: new Date(sendAtMs) });
      sids.push(msg.sid);
    } catch { /* on ignore ce rappel */ }
  }
  return sids;
}

async function cancelReminders(sidStr: string | null | undefined) {
  const client = twilioClient();
  if (!sidStr || !client) return;
  for (const sid of sidStr.split(',').filter(Boolean)) {
    try { await client.messages(sid).update({ status: 'canceled' }); } catch { /* déjà parti/annulé */ }
  }
}

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get('x-cal-signature-256');
  if (!verify(raw, sig)) return new Response('Invalid signature', { status: 401 });

  let body: { triggerEvent?: string; payload?: Record<string, unknown> };
  try { body = JSON.parse(raw); } catch { return new Response('Bad JSON', { status: 400 }); }

  const event = body.triggerEvent ?? '';
  const p = body.payload ?? {};
  const uid = (p['uid'] as string) ?? null;
  if (!uid) return new Response('No uid', { status: 200 });

  const db = createAdminClient();

  if (event === 'BOOKING_CANCELLED') {
    const { data: existing } = await db.from('appointments').select('sms_sid').eq('cal_uid', uid).maybeSingle();
    await cancelReminders(existing?.sms_sid as string | undefined);
    await db.from('appointments').update({ status: 'cancelled' }).eq('cal_uid', uid);
    return Response.json({ ok: true, event });
  }

  if (event === 'BOOKING_CREATED' || event === 'BOOKING_RESCHEDULED') {
    const attendees = (p['attendees'] ?? []) as Array<Record<string, unknown>>;
    const a = attendees[0] ?? {};
    const name = (a['name'] as string) ?? null;
    const email = ((a['email'] as string) ?? '').toLowerCase() || null;
    const phone = extractPhone(p);
    const zoom = extractZoomUrl(p);
    const startsAt = (p['startTime'] as string) ?? null;
    const endsAt = (p['endTime'] as string) ?? null;
    if (!startsAt) return new Response('No startTime', { status: 200 });

    // Si reprogrammation : annule l'ancien SMS programmé.
    const { data: existing } = await db.from('appointments').select('sms_sid').eq('cal_uid', uid).maybeSingle();
    await cancelReminders(existing?.sms_sid as string | undefined);

    // Relie au prospect (par courriel) et le passe en « demo_booked ».
    let prospectId: string | null = null;
    if (email) {
      const { data: prospect } = await db.from('prospects').select('id').ilike('email', email).maybeSingle();
      if (prospect?.id) {
        prospectId = prospect.id as string;
        const patch: Record<string, unknown> = { status: 'demo_booked' };
        if (zoom) patch['demo_url'] = zoom;
        await db.from('prospects').update(patch).eq('id', prospectId);
      }
    }

    // Programme les rappels SMS via Twilio (3h / 1h / 15 min avant).
    const sids = await scheduleReminders(phone, startsAt, zoom);
    const smsSid = sids.length ? sids.join(',') : null;

    await db.from('appointments').upsert(
      {
        cal_uid: uid, prospect_id: prospectId, name, email, phone,
        starts_at: startsAt, ends_at: endsAt, zoom_url: zoom,
        status: 'booked', sms_sid: smsSid, reminder_sent_at: null,
      },
      { onConflict: 'cal_uid' },
    );

    return Response.json({ ok: true, event, prospectId, smsScheduled: sids.length });
  }

  return Response.json({ ok: true, ignored: event });
}
