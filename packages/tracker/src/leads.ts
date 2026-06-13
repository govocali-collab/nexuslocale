import type { SupabaseClient } from '@supabase/supabase-js';
import type { Lead, LeadReport } from './types.js';

// ─── Requêtes Supabase ────────────────────────────────────────────────────────

export async function getLeadsForSite(
  db:      SupabaseClient,
  siteId:  string,
  options?: { from?: Date; to?: Date },
): Promise<Lead[]> {
  let query = db
    .from('leads')
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false });

  if (options?.from) query = query.gte('created_at', options.from.toISOString());
  if (options?.to)   query = query.lte('created_at', options.to.toISOString());

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Lead[];
}

// ─── Rapport ─────────────────────────────────────────────────────────────────

export function buildReport(
  leads:  Lead[],
  siteId: string,
  period: { from: Date; to: Date },
): LeadReport {
  const calls = leads.filter((l) => l.type === 'call');
  const sms   = leads.filter((l) => l.type === 'sms');
  const forms = leads.filter((l) => l.type === 'form');

  const totalDuration = calls.reduce((sum, l) => sum + (l.duration_sec ?? 0), 0);
  const recordings    = calls.filter((l) => l.recording_url).length;
  const missedCalls   = calls.filter((l) => !l.duration_sec || l.duration_sec === 0).length;
  const afterHours    = leads.filter((l) => isAfterHours(l.created_at)).length;

  return {
    site_id: siteId,
    period,
    stats: {
      total:              leads.length,
      calls:              calls.length,
      sms:                sms.length,
      forms:              forms.length,
      total_duration_sec: totalDuration,
      avg_duration_sec:   calls.length > 0 ? Math.round(totalDuration / calls.length) : 0,
      recordings,
      after_hours:  afterHours,
      missed_calls: missedCalls,
    },
    leads,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Hors heures = weekend ou avant 8h / après 17h (heure de l'Est, Canada)
function isAfterHours(createdAt: string): boolean {
  const date = new Date(createdAt);
  const parts = new Intl.DateTimeFormat('en-CA', {
    hour:     'numeric',
    hour12:   false,
    weekday:  'short',
    timeZone: 'America/Toronto',
  }).formatToParts(date);

  const hour    = parseInt(parts.find((p) => p.type === 'hour')?.value    ?? '12', 10);
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const isWeekend = weekday === 'Sat' || weekday === 'Sun';

  return isWeekend || hour < 8 || hour >= 17;
}
