'use server';

export interface ContactInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  reason: string;
  message: string;
  // Anti-robot
  turnstileToken: string; // jeton Cloudflare Turnstile
  website: string; // honeypot — doit rester vide
}

const TO = process.env['CONTACT_TO'] ?? 'contact@nexuslocale.com';
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!));

export async function submitContact(input: ContactInput): Promise<{ ok: boolean; error?: string }> {
  // 1. Honeypot : un bot remplit ce champ caché → on fait semblant que c'est envoyé.
  if (input.website.trim() !== '') return { ok: true };

  // 2. Validation des champs
  if (!input.firstName.trim() || !input.lastName.trim() || !input.email.trim() || !input.message.trim()) {
    return { ok: false, error: 'Veuillez remplir les champs requis.' };
  }
  if (!EMAIL_RE.test(input.email.trim())) {
    return { ok: false, error: 'Adresse courriel invalide.' };
  }

  // 3. Captcha Cloudflare Turnstile
  const secret = process.env['TURNSTILE_SECRET_KEY'];
  if (!secret) return { ok: false, error: 'Captcha non configuré (TURNSTILE_SECRET_KEY manquant).' };
  if (!input.turnstileToken) return { ok: false, error: 'Veuillez compléter le captcha.' };
  try {
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: input.turnstileToken }),
    });
    const outcome = (await verify.json()) as { success: boolean };
    if (!outcome.success) return { ok: false, error: 'Échec du captcha, veuillez réessayer.' };
  } catch {
    return { ok: false, error: 'Impossible de vérifier le captcha.' };
  }

  // 4. Envoi via Resend
  const apiKey = process.env['RESEND_API_KEY'];
  if (!apiKey) {
    return { ok: false, error: "Service courriel non configuré (RESEND_API_KEY manquant dans .env)." };
  }
  const from = process.env['CONTACT_FROM'] ?? 'NexusLocale <onboarding@resend.dev>';

  const html = `
    <h2>Nouveau message — NexusLocale</h2>
    <p><strong>Raison :</strong> ${esc(input.reason)}</p>
    <p><strong>Nom :</strong> ${esc(input.firstName)} ${esc(input.lastName)}</p>
    <p><strong>Courriel :</strong> ${esc(input.email)}</p>
    <p><strong>Téléphone :</strong> ${esc(input.phone) || '—'}</p>
    <hr />
    <p style="white-space:pre-wrap">${esc(input.message)}</p>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [TO],
        reply_to: input.email.trim(),
        subject: `Nouveau message (${input.reason}) — ${input.firstName} ${input.lastName}`,
        html,
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      return { ok: false, error: `Échec de l'envoi (${res.status}). ${detail.slice(0, 120)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Échec de l'envoi." };
  }
}
