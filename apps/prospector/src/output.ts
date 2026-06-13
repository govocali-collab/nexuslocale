import Table from 'cli-table3';
import fs from 'node:fs';
import path from 'node:path';
import type { AnalyzedProspect } from './types.js';

const PRESENCE_LABEL: Record<string, string> = {
  none:        'Aucun site   ',
  social_only: 'Réseaux soc. ',
  has_site:    'A un site    ',
};

const PAIN_EMOJI = (score: number) => {
  if (score >= 80) return '💀';
  if (score >= 50) return '🔴';
  if (score >= 20) return '🟡';
  return '🟢';
};

// ─── Tableau terminal ─────────────────────────────────────────────────────────

export function printTable(prospects: AnalyzedProspect[]): void {
  const table = new Table({
    head: [
      'Entreprise', 'Note', 'Avis', 'Présence web',
      'Pain', 'Score', 'Problèmes détectés', 'Téléphone',
    ],
    colWidths: [28, 7, 6, 14, 6, 7, 38, 16],
    style: { head: ['cyan', 'bold'] },
    wordWrap: true,
  });

  for (const p of prospects) {
    const stars    = p.rating ? `⭐ ${p.rating.toFixed(1)}` : 'N/A';
    const presence = PRESENCE_LABEL[p.web_presence] ?? p.web_presence;
    const painStr  = `${PAIN_EMOJI(p.pain_score)} ${p.pain_score}`;
    const issues   = p.detected_issues.slice(0, 3).join(', ') || '—';

    table.push([
      p.business_name,
      stars,
      String(p.review_count ?? '—'),
      presence,
      painStr,
      String(p.prospect_score),
      issues,
      p.phone ?? '—',
    ]);
  }

  console.log('\n' + table.toString());
  console.log(`\n${prospects.length} prospect(s) — classés par score décroissant`);
}

// ─── Export CSV ───────────────────────────────────────────────────────────────

export function exportCsv(prospects: AnalyzedProspect[], niche: string, city: string): string {
  const filename = `prospects-${slugify(niche)}-${slugify(city)}-${dateStamp()}.csv`;
  const filepath = path.join(process.cwd(), filename);

  const headers = [
    'Entreprise', 'Note', 'Avis', 'Présence web', 'Pain score',
    'Prospect score', 'Téléphone', 'Site web', 'Problèmes', 'Maps URL',
  ].join(',');

  const rows = prospects.map((p) =>
    [
      csvEscape(p.business_name),
      p.rating ?? '',
      p.review_count ?? '',
      p.web_presence,
      p.pain_score,
      p.prospect_score,
      csvEscape(p.phone ?? ''),
      csvEscape(p.website ?? ''),
      csvEscape(p.detected_issues.join(' | ')),
      csvEscape(p.maps_url ?? ''),
    ].join(',')
  );

  fs.writeFileSync(filepath, [headers, ...rows].join('\n'), 'utf8');
  return filepath;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function csvEscape(v: string): string {
  if (/[,"\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
