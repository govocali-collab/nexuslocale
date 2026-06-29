// Appels entrants sur le numéro Twilio → redirige vers le cellulaire de l'agent.
// Twilio appelle cet endpoint (voiceUrl du numéro) et exécute le TwiML retourné.

export const dynamic = 'force-dynamic';

function xml(body: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { 'Content-Type': 'text/xml' },
  });
}

export async function POST(req: Request) {
  const agent = process.env['AGENT_PHONE'];
  const fallback = process.env['TWILIO_CALLER_NUMBER'] ?? '';
  if (!agent) {
    return xml('<Say voice="alice" language="fr-CA">Ce numéro n\'est pas configuré pour le moment.</Say>');
  }
  let from = fallback;
  try {
    const form = await req.formData();
    from = (form.get('From')?.toString()) || fallback; // affiche le vrai appelant sur ton cell
  } catch { /* garde le fallback */ }

  // callerId doit être un numéro Twilio possédé OU l'appelant ; on tente l'appelant, sinon le numéro Twilio.
  const callerId = from || fallback;
  return xml(`<Dial callerId="${callerId}" timeout="25"><Number>${agent}</Number></Dial>`);
}
