'use server';

import Twilio from 'twilio';
import { createAdminClient } from './admin';

function toE164(raw: string): string | null {
  const d = raw.replace(/[^\d+]/g, '');
  if (d.startsWith('+')) return d;
  const digits = d.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

export interface MessageRow {
  id: string;
  prospect_id: string | null;
  name: string | null;
  phone: string;
  direction: string;   // 'out' | 'in'
  body: string;
  status: string | null;
  created_at: string;
}

export async function sendSms(input: { phone: string; body: string; prospectId?: string | null; name?: string | null }): Promise<{ ok: boolean; error?: string | undefined }> {
  const sid   = process.env['TWILIO_ACCOUNT_SID'];
  const token = process.env['TWILIO_AUTH_TOKEN'];
  const mg    = process.env['TWILIO_MESSAGING_SERVICE_SID'];
  if (!sid || !token || !mg) return { ok: false, error: 'Twilio non configuré (clés / Messaging Service manquants).' };

  const to = toE164(input.phone);
  if (!to) return { ok: false, error: 'Numéro de téléphone invalide.' };
  if (!input.body.trim()) return { ok: false, error: 'Le message est vide.' };

  try {
    const msg = await Twilio(sid, token).messages.create({ to, messagingServiceSid: mg, body: input.body.trim() });
    const db = createAdminClient();
    await db.from('messages').insert({
      prospect_id: input.prospectId ?? null,
      name: input.name ?? null,
      phone: to,
      direction: 'out',
      body: input.body.trim(),
      status: msg.status,
      twilio_sid: msg.sid,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur Twilio.' };
  }
}

export async function listMessages(): Promise<MessageRow[]> {
  try {
    const db = createAdminClient();
    const { data } = await db
      .from('messages')
      .select('id, prospect_id, name, phone, direction, body, status, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    return (data ?? []) as MessageRow[];
  } catch {
    return [];
  }
}
