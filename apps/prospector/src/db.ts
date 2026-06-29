import { createClient } from '@supabase/supabase-js';
import type { AnalyzedProspect } from './types.js';

function getDb() {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_KEY'];
  if (!url || !key) return null; // DB optionnelle — le CLI fonctionne sans
  return createClient(url, key, { auth: { persistSession: false } });
}

// Clé normalisée (nom + ville) pour repérer un doublon, insensible à la casse/accents.
export function prospectKey(name: string, city: string): string {
  const n = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  return `${n(name)}|${n(city)}`;
}

// Récupère les clés (nom|ville) de tous les prospects déjà en base, pour éviter
// de re-télécharger/ré-analyser une entreprise déjà trouvée lors d'un scan précédent.
export async function getExistingKeys(): Promise<Set<string>> {
  const db = getDb();
  if (!db) return new Set();
  const { data, error } = await db.from('prospects').select('business_name, city');
  if (error) {
    console.warn(`[dedup] lecture des prospects existants échouée : ${error.message}`);
    return new Set();
  }
  return new Set((data ?? []).map((r) => prospectKey(r.business_name as string, r.city as string)));
}

export async function upsertProspects(
  prospects: AnalyzedProspect[],
  niche: string,
  city: string
): Promise<{ written: number; skipped: number }> {
  const db = getDb();

  if (!db) {
    console.warn('[db] SUPABASE_URL / SUPABASE_SERVICE_KEY absents — écriture ignorée');
    return { written: 0, skipped: prospects.length };
  }

  let written = 0;
  let skipped = 0;

  for (const p of prospects) {
    const record = {
      business_name:   p.business_name,
      niche,
      city,
      phone:           p.phone,
      rating:          p.rating,
      review_count:    p.review_count,
      web_presence:    p.web_presence as 'none' | 'social_only' | 'has_site',
      pain_score:      p.pain_score,
      prospect_score:  p.prospect_score,
      status:          'new' as const,
      website:         p.website,
      maps_url:        p.maps_url,
      detected_issues: p.detected_issues,
    };

    const { error } = await db
      .from('prospects')
      .upsert(record, { onConflict: 'business_name,city', ignoreDuplicates: false });

    if (error) {
      console.warn(`[db] ⚠ ${p.business_name} : ${error.message}`);
      skipped++;
    } else {
      written++;
    }
  }

  return { written, skipped };
}
