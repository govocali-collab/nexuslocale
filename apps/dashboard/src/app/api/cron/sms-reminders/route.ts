import Twilio from 'twilio';
import { createAdminClient } from '@/lib/admin';

// Cron (Vercel) : envoie un SMS de rappel ~2h avant chaque RDV démo Zoom.
// Programmé dans vercel.json. Sécurisé par CRON_SECRET.

export const dynamic = 'force-dynamic';

interface Appt {
  id: string; name: string | null; phone: string | null; starts_at: string; zoom_url: string | null;
}

// Met le numéro au format E.164 (Twilio). Suppose le Canada/US si 10 chiffres.
function toE164(raw: string): string | null {
  const d = raw.replace(/[^\d+]/g, '');
  if (d.startsWith('+')) return d;
  const digits = d.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

export async function GET(req: Request) {
  const secret = process.env['CRON_SECRET'];
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const from = process.env['TWILIO_FROM_NUMBER'];
  const sid = process.env['TWILIO_ACCOUNT_SID'];
  const token = process.env['TWILIO_AUTH_TOKEN'];
  if (!from || !sid || !token) {
    return Response.json({ ok: false, error: 'TWILIO_FROM_NUMBER / clés Twilio manquantes' });
  }

  const db = createAdminClient();
  const now = Date.now();
  const horizon = new Date(now + 2 * 60 * 60 * 1000).toISOString(); // dans 2h

  const { data } = await db
    .from('appointments')
    .select('id, name, phone, starts_at, zoom_url')
    .eq('status', 'booked')
    .is('reminder_sent_at', null)
    .gte('starts_at', new Date(now).toISOString())
    .lte('starts_at', horizon)
    .limit(50);

  const appts = (data ?? []) as Appt[];
  if (appts.length === 0) return Response.json({ ok: true, sent: 0 });

  const client = Twilio(sid, token);
  let sent = 0;
  const errors: string[] = [];

  for (const a of appts) {
    if (!a.phone) continue;
    const to = toE164(a.phone);
    if (!to) { errors.push(`${a.id}: numéro invalide`); continue; }
    const heure = new Date(a.starts_at).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
    const body = `Rappel : votre démo Zoom avec NexusLocale est aujourd'hui à ${heure}.${a.zoom_url ? ` Lien : ${a.zoom_url}` : ''} À tantôt !`;
    try {
      await client.messages.create({ to, from, body });
      await db.from('appointments').update({ reminder_sent_at: new Date().toISOString() }).eq('id', a.id);
      sent++;
    } catch (e) {
      errors.push(`${a.id}: ${e instanceof Error ? e.message : 'erreur SMS'}`);
    }
  }

  return Response.json({ ok: true, sent, errors });
}
