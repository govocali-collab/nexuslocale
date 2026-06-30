import Twilio from 'twilio';
import { createAdminClient } from '@/lib/admin';

// SMS entrants sur le numéro Twilio → (1) enregistrés en base (section Messages)
// et (2) transférés sur le cellulaire de l'agent. Aucune réponse auto au client.

export const dynamic = 'force-dynamic';

const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response/>';

export async function POST(req: Request) {
  const agent  = process.env['AGENT_PHONE'];
  const caller = process.env['TWILIO_CALLER_NUMBER'];
  const sid    = process.env['TWILIO_ACCOUNT_SID'];
  const token  = process.env['TWILIO_AUTH_TOKEN'];

  try {
    const form = await req.formData();
    const from = form.get('From')?.toString() ?? '';
    const body = form.get('Body')?.toString() ?? '';

    // 1) Enregistre le message reçu (et tente de relier au prospect par numéro).
    try {
      const db = createAdminClient();
      const last10 = from.replace(/\D/g, '').slice(-10);
      let prospectId: string | null = null;
      let name: string | null = null;
      if (last10.length === 10) {
        const { data } = await db.from('prospects').select('id, business_name, phone').not('phone', 'is', null);
        const match = (data ?? []).find((p) => ((p.phone as string) || '').replace(/\D/g, '').slice(-10) === last10);
        if (match) { prospectId = match.id as string; name = match.business_name as string; }
      }
      await db.from('messages').insert({ prospect_id: prospectId, name, phone: from, direction: 'in', body });
    } catch { /* table pas encore migrée — on continue */ }

    // 2) Transfère sur le cellulaire de l'agent.
    if (agent && caller && sid && token) {
      await Twilio(sid, token).messages.create({
        to: agent,
        from: caller,
        body: `📩 SMS de ${from} :\n${body}`,
      });
    }
  } catch { /* on ignore — on renvoie quand même une réponse vide */ }

  return new Response(EMPTY_TWIML, { headers: { 'Content-Type': 'text/xml' } });
}
