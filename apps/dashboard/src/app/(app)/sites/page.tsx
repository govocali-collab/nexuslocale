import Link from 'next/link';
import { getSitesList } from '@/lib/queries';
import { SitesTable } from '@/components/sites/sites-table';

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

      {/* ── Table (sélection + suppression) ──────────────────────────────── */}
      <SitesTable sites={sites} />
    </div>
  );
}
