'use server';

import Twilio from 'twilio';

// Format E.164 (Twilio). Suppose Canada/US si 10 chiffres.
function toE164(raw: string): string | null {
  const d = raw.replace(/[^\d+]/g, '');
  if (d.startsWith('+')) return d;
  const digits = d.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

// Click-to-call : Twilio appelle TON cellulaire (AGENT_PHONE) ; quand tu réponds,
// il compose le numéro du prospect et vous connecte. Le prospect voit ton numéro Twilio.
export async function callProspect(prospectPhone: string): Promise<{ ok: boolean; error?: string | undefined }> {
  const sid    = process.env['TWILIO_ACCOUNT_SID'];
  const token  = process.env['TWILIO_AUTH_TOKEN'];
  const agent  = process.env['AGENT_PHONE'];
  const caller = process.env['TWILIO_CALLER_NUMBER'];
  if (!sid || !token) return { ok: false, error: 'Clés Twilio manquantes.' };
  if (!agent)  return { ok: false, error: 'AGENT_PHONE (ton numéro de cellulaire) non configuré.' };
  if (!caller) return { ok: false, error: 'TWILIO_CALLER_NUMBER non configuré.' };

  const to     = toE164(prospectPhone);
  const agentE = toE164(agent);
  if (!to)     return { ok: false, error: 'Numéro du prospect invalide.' };
  if (!agentE) return { ok: false, error: 'AGENT_PHONE invalide.' };

  try {
    const client = Twilio(sid, token);
    await client.calls.create({
      to: agentE,    // 1) sonne sur ton cellulaire
      from: caller,
      // 2) quand tu réponds → compose le prospect et bridge les deux appels
      twiml: `<Response><Say voice="alice" language="fr-CA">Connexion en cours.</Say><Dial callerId="${caller}"><Number>${to}</Number></Dial></Response>`,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur Twilio.' };
  }
}
