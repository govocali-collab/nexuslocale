import crypto from 'node:crypto';

// Implémentation manuelle de la validation de signature Twilio
// (HMAC-SHA1 du URL + paramètres triés alphabétiquement)
// Réf: https://www.twilio.com/docs/usage/webhooks/webhooks-security

export function validateTwilioSignature(
  authToken: string,
  signature:  string,
  url:        string,
  params:     Record<string, string>,
): boolean {
  if (!signature || !authToken) return false;

  const sorted      = Object.keys(params).sort().map((k) => `${k}${params[k] ?? ''}`).join('');
  const expected    = crypto
    .createHmac('sha1', authToken)
    .update(url + sorted)
    .digest('base64');

  // timingSafeEqual exige des buffers de même longueur
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}
