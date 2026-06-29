// Appels entrants sur le numéro Twilio → redirige vers le cellulaire de l'agent.
// Twilio appelle cet endpoint (voiceUrl du numéro) et exécute le TwiML retourné.

export const dynamic = 'force-dynamic';

function xml(body: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { 'Content-Type': 'text/xml' },
  });
}

export async function POST(req: Request) {
  const agent  = process.env['AGENT_PHONE'];
  const caller = process.env['TWILIO_CALLER_NUMBER'] ?? '';
  if (!agent) {
    return xml('<Say voice="alice" language="fr-CA">Ce numéro n\'est pas configuré pour le moment.</Say>');
  }
  // callerId = numéro Twilio possédé (fiable, jamais rejeté). Ton cell verra ce numéro
  // sonner → tu sais que c'est un appel d'affaires via ta ligne NexusLocale.
  return xml(`<Dial callerId="${caller}" timeout="25"><Number>${agent}</Number></Dial>`);
}
