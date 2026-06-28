import crypto from 'node:crypto';
import { createAdminClient } from '@/lib/admin';

// Webhook Cal.com : reçoit les évènements de réservation.
// - BOOKING_CREATED / RESCHEDULED → stocke le RDV + passe le prospect en « demo_booked »
// - BOOKING_CANCELLED → marque le RDV annulé
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

// Cal.com place le lien Zoom à divers endroits selon la version — on essaie tout.
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

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get('x-cal-signature-256');
  if (!verify(raw, sig)) {
    return new Response('Invalid signature', { status: 401 });
  }

  let body: { triggerEvent?: string; payload?: Record<string, unknown> };
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  const event = body.triggerEvent ?? '';
  const p = body.payload ?? {};
  const uid = (p['uid'] as string) ?? null;
  if (!uid) return new Response('No uid', { status: 200 });

  const db = createAdminClient();

  if (event === 'BOOKING_CANCELLED') {
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

    // Tente de relier au prospect existant (par courriel) et le passe en « demo_booked ».
    let prospectId: string | null = null;
    if (email) {
      const { data: prospect } = await db
        .from('prospects')
        .select('id')
        .ilike('email', email)
        .maybeSingle();
      if (prospect?.id) {
        prospectId = prospect.id as string;
        const patch: Record<string, unknown> = { status: 'demo_booked' };
        if (zoom) patch['demo_url'] = zoom;
        await db.from('prospects').update(patch).eq('id', prospectId);
      }
    }

    await db.from('appointments').upsert(
      {
        cal_uid: uid,
        prospect_id: prospectId,
        name,
        email,
        phone,
        starts_at: startsAt,
        ends_at: endsAt,
        zoom_url: zoom,
        status: 'booked',
        reminder_sent_at: null,
      },
      { onConflict: 'cal_uid' },
    );

    return Response.json({ ok: true, event, prospectId });
  }

  return Response.json({ ok: true, ignored: event });
}
