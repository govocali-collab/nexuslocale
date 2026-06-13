import TwilioSDK from 'twilio';
const Twiml = TwilioSDK.twiml;
import type { ProvisionResult } from './types.js';

export type TwilioClient = TwilioSDK.Twilio;

// ─── Indicatifs régionaux par ville (Québec) ─────────────────────────────────

const AREA_CODE_MAP: Array<[string[], number[]]> = [
  [['montreal', 'laval', 'brossard', 'longueuil', 'saint-hubert'],   [514, 438]],
  [['granby', 'sherbrooke', 'drummondville', 'saint-hyacinthe',
    'saint-jean', 'valleyfield', 'sorel', 'bromont', 'waterloo',
    'cowansville', 'farnham'],                                         [450, 579]],
  [['gatineau', 'hull', 'aylmer', 'outaouais', 'abitibi',
    'sherbrooke', 'trois-rivieres', 'shawinigan'],                     [819, 873]],
  [['quebec', 'levis', 'beauport', 'saguenay', 'chicoutimi',
    'jonquiere', 'rimouski', 'baie-comeau'],                           [418, 581]],
];

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '-');
}

export function areaCodesForCity(city: string): number[] {
  const n = normalize(city);
  for (const [keys, codes] of AREA_CODE_MAP) {
    if (keys.some((k) => n.includes(k) || k.includes(n.split('-')[0] ?? n))) return codes;
  }
  return [450, 579]; // Défaut Québec
}

// ─── Client Twilio ────────────────────────────────────────────────────────────

export function getTwilioClient(): TwilioClient {
  const sid   = process.env['TWILIO_ACCOUNT_SID'];
  const token = process.env['TWILIO_AUTH_TOKEN'];
  if (!sid || !token) throw new Error('TWILIO_ACCOUNT_SID et TWILIO_AUTH_TOKEN requis');
  return TwilioSDK(sid, token);
}

// ─── Provisionnement ─────────────────────────────────────────────────────────

export async function findAvailableNumber(
  areaCode: number,
  country: string,
  client: TwilioClient,
): Promise<string | null> {
  const numbers = await client
    .availablePhoneNumbers(country)
    .local
    .list({ areaCode, limit: 5 });
  return numbers[0]?.phoneNumber ?? null;
}

export async function purchaseNumber(
  phoneNumber: string,
  webhookBaseUrl: string,
  client: TwilioClient,
): Promise<ProvisionResult> {
  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber,
    voiceUrl:             `${webhookBaseUrl}/webhooks/voice`,
    smsUrl:               `${webhookBaseUrl}/webhooks/sms`,
    voiceMethod:          'POST',
    smsMethod:            'POST',
    // status callback pour les appels qui arrivent sur le numéro
    statusCallback:       `${webhookBaseUrl}/webhooks/voice/status`,
    statusCallbackMethod: 'POST',
  });
  return {
    phoneNumber: purchased.phoneNumber,
    sid:         purchased.sid,
    voiceUrl:    `${webhookBaseUrl}/webhooks/voice`,
    smsUrl:      `${webhookBaseUrl}/webhooks/sms`,
  };
}

export async function releaseNumber(sid: string, client: TwilioClient): Promise<void> {
  await client.incomingPhoneNumbers(sid).remove();
}

export async function findNumberSid(
  phoneNumber: string,
  client: TwilioClient,
): Promise<string | null> {
  const numbers = await client.incomingPhoneNumbers.list({ phoneNumber });
  return numbers[0]?.sid ?? null;
}

export async function listProvisionedNumbers(client: TwilioClient): Promise<
  Array<{ sid: string; phoneNumber: string; voiceUrl: string | null }>
> {
  const numbers = await client.incomingPhoneNumbers.list();
  return numbers.map((n: { sid: string; phoneNumber: string; voiceUrl: string | null }) => ({
    sid:         n.sid,
    phoneNumber: n.phoneNumber,
    voiceUrl:    n.voiceUrl,
  }));
}

// ─── TwiML ────────────────────────────────────────────────────────────────────

const DEFAULT_CONSENT =
  'Bonjour. Cet appel peut être enregistré à des fins de qualité de service. Veuillez patienter.';
const DEFAULT_NO_FORWARD =
  'Bonjour. Merci de votre appel. Veuillez nous contacter via notre site web ou rappeler ultérieurement. Au revoir.';

export function buildVoiceTwiml(opts: {
  forwardTo:         string | null;
  statusCallbackUrl: string;
  consentMessage?:   string | null;
}): string {
  const response = new Twiml.VoiceResponse();

  const consent = opts.consentMessage ?? DEFAULT_CONSENT;
  response.say({ voice: 'alice', language: 'fr-CA' }, consent);

  if (opts.forwardTo) {
    const dial = response.dial({
      action: opts.statusCallbackUrl,
      method: 'POST',
      record: 'record-from-answer',
      trim:   'trim-silence',
    });
    dial.number(opts.forwardTo);
  } else {
    response.say({ voice: 'alice', language: 'fr-CA' }, DEFAULT_NO_FORWARD);
    response.hangup();
  }

  return response.toString();
}

export function buildVoiceStatusTwiml(): string {
  // Réponse vide après la fin de l'appel — raccroche proprement
  return new Twiml.VoiceResponse().toString();
}

export function buildSmsEmptyTwiml(): string {
  return new Twiml.MessagingResponse().toString();
}
