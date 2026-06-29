import Twilio from 'twilio';

// SMS entrants sur le numéro Twilio → transférés sur le cellulaire de l'agent.
// (Le prospect ne reçoit aucune réponse automatique — réponse vide.)

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
