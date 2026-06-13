import type { Request, Response } from 'express';
import {
  buildSmsEmptyTwiml, getTwilioClient,
  validateTwilioSignature,
} from '@nexuslocale/tracker';
import { notifyNewLead } from '@nexuslocale/tracker';
import { getSiteByTwilioNumber, insertLead, getClientById } from '../db.js';

const SKIP_SIG = process.env['SKIP_TWILIO_SIGNATURE'] === 'true';

// POST /webhooks/sms — SMS entrant Twilio
export async function handleSmsIncoming(req: Request, res: Response): Promise<void> {
  if (!SKIP_SIG) {
    const authToken = process.env['TWILIO_AUTH_TOKEN'] ?? '';
    const signature = (req.headers['x-twilio-signature'] as string) ?? '';
    const url       = `${process.env['TRACKER_WEBHOOK_URL']}${req.originalUrl}`;
    const params    = req.body as Record<string, string>;

    if (!validateTwilioSignature(authToken, signature, url, params)) {
      res.status(403).send('Invalid Twilio signature');
      return;
    }
  }

  const { To, From, Body, MessageSid } = req.body as Record<string, string>;
  const site = To ? await getSiteByTwilioNumber(To) : null;

  if (!site) { res.type('text/xml').send(buildSmsEmptyTwiml()); return; }

  const lead = await insertLead({
    site_id:       site.id,
    type:          'sms',
    caller_number: From ?? null,
    duration_sec:  null,
    recording_url: null,
    payload:       { body: Body ?? '', message_sid: MessageSid },
  }).catch((e: unknown) => { console.error('[sms] insertLead:', e); return null; });

  // Notification
  if (lead && site.twilio_number) {
    try {
      const twilioClient = getTwilioClient();
      const tenant = site.client_id ? await getClientById(site.client_id) : null;
      await notifyNewLead({
        client:     twilioClient,
        lead,
        site,
        tenant,
        ownerPhone: process.env['OWNER_PHONE'] ?? '',
        fromNumber: site.twilio_number,
      });
    } catch (e) {
      console.error('[sms] notify:', e);
    }
  }

  res.type('text/xml').send(buildSmsEmptyTwiml());
}
