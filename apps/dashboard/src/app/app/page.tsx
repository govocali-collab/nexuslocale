import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  getOverviewStats,
  getRecentLeads,
  getStaleSites,
  getWonDeals,
} from '@/lib/queries';
import { PIPELINE_STATUSES, PIPELINE_LABELS } from '@/lib/pipeline';
import { SalesByMonth } from '@/components/overview/sales-by-month';

const STATUSES = ['research', 'built', 'indexed', 'ranking', 'rented', 'sold'];
// Reflète toujours le pipeline (source unique @/lib/pipeline).
const PIPELINE = PIPELINE_STATUSES;

function fmtDuration(sec: number | null): string {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m${s.toString().padStart(2, '0')}s`;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-CA', {
    month: 'short', day: 'numeric',
    hour:  '2-digit', minute: '2-digit',
  });
}

function weeksAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (7 * 86400_000));
}

export default async function OverviewPage() {
  const [stats, recentLeads, staleSites, wonDeals] = await Promise.all([
    getOverviewStats(),
    getRecentLeads(10),
    getStaleSites(6),
    getWonDeals(),
  ]);

  const leadsDelta = stats.leadsPrevMonth > 0
    ? Math.round(((stats.leadsThisMonth - stats.leadsPrevMonth) / stats.leadsPrevMonth) * 100)
    : null;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-[#0a0a0a]">Vue d'ensemble</h1>

      {/* ── KPI row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Sites par statut */}
        <div className="card p-4 lg:col-span-3">
          <p className="label mb-3">Sites par statut</p>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map(s => (
              <Link
                key={s}
                href={`/app/sites?status=${s}`}
                className="flex items-center gap-1.5 rounded-md bg-[#f5f5f5] hover:bg-indigo-50
                           px-2.5 py-1.5 transition-colors"
              >
                <Badge value={s} />
                <span className="mono font-semibold text-[#0a0a0a]">
                  {stats.sitesByStatus[s] ?? 0}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Leads ce mois */}
        <div className="card p-4">
          <p className="label mb-1">Leads ce mois</p>
          <p className="text-3xl font-bold mono text-[#0a0a0a]">{stats.leadsThisMonth}</p>
          {leadsDelta !== null && (
            <p className={`text-xs mt-1 ${leadsDelta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {leadsDelta >= 0 ? '+' : ''}{leadsDelta}% vs mois précédent
            </p>
          )}
        </div>

        {/* MRR */}
        <div className="card p-4">
          <p className="label mb-1">Revenu mensuel (MRR)</p>
          <p className="text-3xl font-bold mono text-[#0a0a0a]">
            ${Math.round(stats.mrr).toLocaleString('fr-CA')}
          </p>
          <p className="text-xs mt-1 text-[#a3a3a3]">hébergement récurrent (prospects gagnés + clients)</p>
        </div>

        {/* Ventes de sites — par mois + total */}
        <SalesByMonth deals={wonDeals} />
      </div>

      {/* ── Pipeline prospects ─────────────────────────────────────────────── */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="label">Pipeline prospects</p>
          <Link href="/app/pipeline" className="text-xs text-indigo-600 hover:text-indigo-800">
            Voir tout →
          </Link>
        </div>
        <div className="flex gap-3">
          {PIPELINE.map(s => (
            <div key={s} className="flex-1 text-center">
              <p className="text-2xl font-bold mono text-[#0a0a0a]">
                {stats.prospectsByStatus[s] ?? 0}
              </p>
              <p className="text-xs text-[#525252] mt-1 leading-tight">{PIPELINE_LABELS[s] ?? s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sites à surveiller */}
        <div className="card p-4">
          <p className="label mb-3">
            Sites indexés sans position{' '}
            <span className="text-[#a3a3a3] normal-case font-normal ml-1">(+6 sem)</span>
          </p>
          {staleSites.length === 0 ? (
            <p className="text-sm text-[#a3a3a3]">Aucun site à revoir. ✓</p>
          ) : (
            <ul className="space-y-2">
              {staleSites.map(s => (
                <li key={s.id} className="flex items-center justify-between">
                  <Link
                    href={`/app/sites/${s.id}`}
                    className="text-sm mono text-indigo-600 hover:text-indigo-800"
                  >
                    {s.domain ?? s.id}
                  </Link>
                  <span className="text-xs text-[#a3a3a3]">{weeksAgo(s.created_at)}sem</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Leads récents */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="label">Leads récents</p>
          </div>
          {recentLeads.length === 0 ? (
            <p className="text-sm text-[#a3a3a3]">Aucun lead enregistré.</p>
          ) : (
            <ul className="space-y-2 divide-y divide-[#f0f0f0]">
              {recentLeads.map(l => (
                <li key={l.id} className="flex items-center gap-3 pt-2 first:pt-0">
                  <Badge value={l.type} />
                  <Link
                    href={`/app/sites/${l.site_id}`}
                    className="text-xs mono text-[#404040] hover:text-[#0a0a0a] truncate flex-1"
                  >
                    {l.site_domain ?? l.site_id}
                  </Link>
                  {l.type === 'call' && (
                    <span className="text-xs text-[#a3a3a3] shrink-0">
                      {fmtDuration(l.duration_sec)}
                    </span>
                  )}
                  <span className="text-xs text-[#a3a3a3] shrink-0">{fmtTime(l.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
