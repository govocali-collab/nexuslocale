import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { CitationChecklist } from '@/components/sites/citation-checklist';
import { PositionChart, type ChartPoint } from '@/components/charts/position-chart';
import {
  getSiteDetail, getSiteLeads, getSiteRankings, updateSiteField,
} from '@/lib/queries';

const STATUSES = ['research', 'built', 'indexed', 'ranking', 'rented', 'sold'];

function fmtDuration(sec: number | null): string {
  if (!sec) return '—';
  return `${Math.floor(sec / 60)}m${(sec % 60).toString().padStart(2, '0')}s`;
}

function fmtDatetime(iso: string): string {
  return new Date(iso).toLocaleString('fr-CA', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

async function handleUpdateStatus(siteId: string, formData: FormData) {
  'use server';
  const status = formData.get('status') as string;
  await updateSiteField(siteId, 'status', status);
  redirect(`/sites/${siteId}`);
}

async function handleUpdateForwardTo(siteId: string, formData: FormData) {
  'use server';
  const forwardTo = formData.get('forward_to') as string;
  await updateSiteField(siteId, 'forward_to', forwardTo);
  redirect(`/sites/${siteId}`);
}

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [site, leads, rankings] = await Promise.all([
    getSiteDetail(id),
    getSiteLeads(id, 50),
    getSiteRankings(id),
  ]);

  if (!site) notFound();

  const keywords = [...new Set(rankings.map(r => r.keyword))];
  const byDate   = new Map<string, Record<string, number | null>>();
  for (const r of rankings) {
    if (!byDate.has(r.checked_at)) byDate.set(r.checked_at, {});
    byDate.get(r.checked_at)![r.keyword] = r.position;
  }
  const chartData: ChartPoint[] = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, kws]) => ({ date, ...kws }));

  const updateStatus    = handleUpdateStatus.bind(null, id);
  const updateForwardTo = handleUpdateForwardTo.bind(null, id);

  const calls       = leads.filter(l => l.type === 'call');
  const totalDurSec = calls.reduce((n, l) => n + (l.duration_sec ?? 0), 0);
  const missedCalls = calls.filter(l => !l.duration_sec || l.duration_sec === 0).length;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/sites" className="text-xs text-[#9A97C0] hover:text-[#1C1560]">
            ← Portefeuille
          </Link>
          <h1 className="mt-1 text-xl font-semibold mono text-[#1C1560]">
            {site.domain ?? <span className="text-[#9A97C0] italic">sans domaine</span>}
          </h1>
          <p className="text-sm text-[#6B6B9E] mt-0.5">{site.niche} · {site.city}</p>
        </div>
        <Badge value={site.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Infos + édition ──────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Infos */}
          <div className="card p-4 space-y-3">
            <p className="label">Informations</p>
            <dl className="space-y-2 text-sm">
              {[
                ['Type',    <Badge key="t" value={site.type} />],
                ['Twilio',  site.twilio_number ?? <span key="tw" className="text-[#9A97C0]">—</span>],
                ['GSC',     site.gsc_property  ?? <span key="gsc" className="text-[#9A97C0]">—</span>],
                ['Vercel',  site.vercel_project ?? <span key="v" className="text-[#9A97C0]">—</span>],
                ['Créé le', fmtDatetime(site.created_at)],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex items-start justify-between gap-2">
                  <dt className="text-[#9A97C0] shrink-0">{k}</dt>
                  <dd className="text-[#1C1560] text-right mono text-xs">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Modifier statut */}
          <div className="card p-4">
            <p className="label mb-2">Modifier le statut</p>
            <form action={updateStatus} className="flex gap-2">
              <select
                name="status"
                defaultValue={site.status}
                className="flex-1 rounded bg-[#F5F4FF] border-[#D9D7F0] text-[#1C1560] text-sm py-1.5"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button
                type="submit"
                className="rounded bg-indigo-600 hover:bg-indigo-700 px-3 text-sm text-white transition-colors"
              >
                OK
              </button>
            </form>
          </div>

          {/* Modifier forward_to */}
          <div className="card p-4">
            <p className="label mb-2">Redirection appels</p>
            <form action={updateForwardTo} className="flex gap-2">
              <input
                name="forward_to"
                defaultValue={site.forward_to ?? ''}
                placeholder="+15145550000"
                className="flex-1 rounded bg-[#F5F4FF] border-[#D9D7F0] text-[#1C1560] text-sm
                           placeholder-[#9A97C0] py-1.5 px-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="submit"
                className="rounded bg-[#EEEDF8] hover:bg-[#D9D7F0] px-3 text-sm text-[#1C1560] transition-colors"
              >
                OK
              </button>
            </form>
          </div>

          {/* Rapport résumé */}
          <div className="card p-4">
            <p className="label mb-3">Rapport d'appels</p>
            <dl className="space-y-2 text-sm">
              {[
                ['Total appels',   calls.length],
                ['Durée totale',   fmtDuration(totalDurSec)],
                ['Appels manqués', missedCalls],
                ['Formulaires',    leads.filter(l => l.type === 'form').length],
                ['SMS',            leads.filter(l => l.type === 'sms').length],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between">
                  <dt className="text-[#9A97C0]">{k}</dt>
                  <dd className="mono text-[#1C1560] font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Checklist citations / SEO */}
          <CitationChecklist siteId={id} />
        </div>

        {/* ── Droite : courbe + leads ───────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Courbe de positions */}
          <div className="card p-4">
            <p className="label mb-4">Positions dans le temps</p>
            <PositionChart data={chartData} keywords={keywords} />
            {keywords.length > 0 && (
              <p className="text-xs text-[#B0ADCC] mt-2">
                {keywords.length} mot(s)-clé · axe Y = position (1 = meilleur)
              </p>
            )}
          </div>

          {/* Leads */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-[#D9D7F0] bg-[#F5F4FF]">
              <p className="label">Leads ({leads.length})</p>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-[#EAE8F8] text-left">
                  <th className="px-4 py-2 label">Type</th>
                  <th className="px-3 py-2 label">Numéro</th>
                  <th className="px-3 py-2 label text-right">Durée</th>
                  <th className="px-3 py-2 label text-right">Date</th>
                  <th className="px-3 py-2 label"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE8F8]">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-[#9A97C0]">
                      Aucun lead pour ce site.
                    </td>
                  </tr>
                ) : leads.map(l => (
                  <tr key={l.id} className="hover:bg-[#F5F4FF]">
                    <td className="px-4 py-2"><Badge value={l.type} /></td>
                    <td className="px-3 py-2 mono text-xs text-[#3D3D6B]">
                      {l.caller_number ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-right mono text-xs text-[#6B6B9E]">
                      {fmtDuration(l.duration_sec)}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-[#9A97C0]">
                      {fmtDatetime(l.created_at)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {l.recording_url && (
                        <a
                          href={l.recording_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          ▶ Écouter
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
