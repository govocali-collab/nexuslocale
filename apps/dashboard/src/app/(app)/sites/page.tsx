import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { getSitesList } from '@/lib/queries';

const STATUS_ORDER = ['research', 'built', 'indexed', 'ranking', 'rented', 'sold'];
const TYPES        = ['rent', 'client', 'demo'];

export default async function SitesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; q?: string }>;
}) {
  const filters = await searchParams;
  const sites   = await getSitesList(filters);

  return (
    <div className="space-y-4 max-w-7xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[#1C1560]">
          Portefeuille <span className="text-[#9A97C0] text-base font-normal ml-1">({sites.length})</span>
        </h1>
      </div>

      {/* ── Filtres ──────────────────────────────────────────────────────── */}
      <form method="GET" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={filters.q}
          placeholder="Domaine ou niche…"
          className="rounded-md bg-white border-[#D9D7F0] text-[#1C1560] text-sm
                     placeholder-[#9A97C0] px-3 py-1.5 w-48 focus:ring-indigo-500 focus:border-indigo-500"
        />

        <select
          name="status"
          defaultValue={filters.status ?? ''}
          className="rounded-md bg-white border-[#D9D7F0] text-[#1C1560] text-sm py-1.5"
        >
          <option value="">Tous les statuts</option>
          {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          name="type"
          defaultValue={filters.type ?? ''}
          className="rounded-md bg-white border-[#D9D7F0] text-[#1C1560] text-sm py-1.5"
        >
          <option value="">Tous les types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <button
          type="submit"
          className="rounded-md bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-sm text-white transition-colors"
        >
          Filtrer
        </button>
        {(filters.status || filters.type || filters.q) && (
          <Link
            href="/sites"
            className="rounded-md px-3 py-1.5 text-sm text-[#9A97C0] hover:text-[#1C1560] transition-colors"
          >
            Effacer
          </Link>
        )}
      </form>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-[#D9D7F0] text-left bg-[#F5F4FF]">
              <th className="px-4 py-2.5 label">Domaine</th>
              <th className="px-3 py-2.5 label">Type</th>
              <th className="px-3 py-2.5 label">Niche / Ville</th>
              <th className="px-3 py-2.5 label">Statut</th>
              <th className="px-3 py-2.5 label text-right">Leads/mois</th>
              <th className="px-3 py-2.5 label text-right">Top pos.</th>
              <th className="px-3 py-2.5 label text-right">Loyer/mois</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAE8F8]">
            {sites.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[#9A97C0]">
                  Aucun site trouvé.
                </td>
              </tr>
            ) : sites.map(s => (
              <tr key={s.id} className="hover:bg-[#F5F4FF] transition-colors">
                <td className="px-4 py-2.5">
                  <Link href={`/sites/${s.id}`} className="mono text-indigo-600 hover:text-indigo-800">
                    {s.domain ?? <span className="text-[#9A97C0] italic">sans domaine</span>}
                  </Link>
                </td>
                <td className="px-3 py-2.5"><Badge value={s.type} /></td>
                <td className="px-3 py-2.5 text-[#3D3D6B] text-xs">
                  <span className="font-medium">{s.niche}</span>
                  <span className="text-[#9A97C0] ml-1">· {s.city}</span>
                </td>
                <td className="px-3 py-2.5"><Badge value={s.status} /></td>
                <td className="px-3 py-2.5 text-right mono text-[#3D3D6B]">
                  {s.leads_month > 0 ? s.leads_month : <span className="text-[#C0BDE0]">—</span>}
                </td>
                <td className="px-3 py-2.5 text-right mono">
                  {s.best_position != null
                    ? <span className="text-emerald-600 font-medium">#{s.best_position}</span>
                    : <span className="text-[#C0BDE0]">—</span>}
                </td>
                <td className="px-3 py-2.5 text-right mono text-[#3D3D6B]">
                  {s.monthly_rent != null
                    ? `$${s.monthly_rent}/m`
                    : <span className="text-[#C0BDE0]">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
