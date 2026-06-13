import type { Request, Response } from 'express';
import {
  buildVoiceTwiml, buildVoiceStatusTwiml,
  getTwilioClient, validateTwilioSignature,
} from '@nexuslocale/tracker';
import { notifyNewLead } from '@nexuslocale/tracker';
import {
  getSiteByTwilioNumber, insertLead, getClientById,
} from '../db.js';

const SKIP_SIG = process.env['SKIP_TWILIO_SIGNATURE'] === 'true';

function assertValidSignature(req: Request, res: Response): boolean {
  if (SKIP_SIG) return true;

  const authToken = process.env['TWILIO_AUTH_TOKEN'] ?? '';
  const signature = (req.headers['x-twilio-signature'] as string) ?? '';
  const url       = `${process.env['TRACKER_WEBHOOK_URL']}${req.originalUrl}`;
  const params    = req.body as Record<string, string>;

  if (!validateTwilioSignature(authToken, signature, url, params)) {
    res.status(403).send('Invalid Twilio signature');
    return false;
  }
  return true;
}

// POST /webhooks/voice — appel entrant Twilio
export async function handleVoiceIncoming(req: Request, res: Response): Promise<void> {
  if (!assertValidSignature(req, res)) return;

  const { To, From, CallSid } = req.body as Record<string, string>;
  const site = To ? await getSiteByTwilioNumber(To) : null;

  if (!site) {
    // Numéro inconnu — raccroche poliment
    res.type('text/xml').send(buildVoiceTwiml({ forwardTo: null, statusCallbackUrl: '' }));
    return;
  }

  const webhookBase    = process.env['TRACKER_WEBHOOK_URL'] ?? '';
  const statusCallback = `${webhookBase}/webhooks/voice/status`;
  const consent        = process.env['CALL_RECORDING_NOTICE'] ?? null;

  // Si pas de forward_to : log immédiat + message vocal + raccroché
  if (!site.forward_to) {
    await insertLead({
      site_id:       site.id,
      type:          'call',
      caller_number: From ?? null,
      duration_sec:  null,
      recording_url: null,
      payload:       { call_sid: CallSid, status: 'no_forward_configured' },
    }).catch((e: unknown) => console.error('[voice] insertLead:', e));

    res.type('text/xml').send(
      buildVoiceTwiml({ forwardTo: null, statusCallbackUrl: statusCallback, consentMessage: consent }),
    );
    return;
  }

  // Redirige + enregistre — le lead sera écrit dans /voice/status
  res.type('text/xml').send(
    buildVoiceTwiml({
      forwardTo:         site.forward_to,
      statusCallbackUrl: statusCallback,
      consentMessage:    consent,
    }),
  );
}

// POST /webhooks/voice/status — fin d'appel après <Dial>
export async function handleVoiceStatus(req: Request, res: Response): Promise<void> {
  if (!assertValidSignature(req, res)) return;

  const body = req.body as Record<string, string>;
  const { To, From, CallSid, DialCallStatus, DialCallDuration, RecordingUrl } = body;

  const site = To ? await getSiteByTwilioNumber(To) : null;
  if (!site) { res.sendStatus(200); return; }

  const durationSec = DialCallDuration ? parseInt(DialCallDuration, 10) : null;

  const lead = await insertLead({
    site_id:       site.id,
    type:          'call',
    caller_number: From ?? null,
    duration_sec:  durationSec,
    recording_url: RecordingUrl ?? null,
    payload:       { call_sid: CallSid, dial_status: DialCallStatus },
  }).catch((e: unknown) => { console.error('[voice/status] insertLead:', e); return null; });

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
      console.error('[voice/status] notify:', e);
    }
  }

  res.type('text/xml').send(buildVoiceStatusTwiml());
}
