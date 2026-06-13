import type { Lead, Site, Client } from '@nexuslocale/db';

export type { Lead, Site, Client };

export interface LeadReport {
  site_id: string;
  period:  { from: Date; to: Date };
  stats: {
    total:              number;
    calls:              number;
    sms:                number;
    forms:              number;
    total_duration_sec: number;
    avg_duration_sec:   number;
    recordings:         number;
    after_hours:        number; // leads hors heures d'ouverture (argument upsell)
    missed_calls:       number; // appels sans durée = appels manqués
  };
  leads: Lead[];
}

export interface ProvisionResult {
  phoneNumber: string;
  sid:         string;
  voiceUrl:    string;
  smsUrl:      string;
}
