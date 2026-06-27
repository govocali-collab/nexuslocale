'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { deleteSites } from '@/lib/site-actions';
import type { SiteRow } from '@/lib/queries';

export function SitesTable({ sites }: { sites: SiteRow[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const [err, setErr] = useState('');

  const allChecked = sites.length > 0 && sel.size === sites.length;

  function toggle(id: string) {
    setSel(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    setSel(allChecked ? new Set() : new Set(sites.map(s => s.id)));
  }
  function remove() {
    const ids = [...sel];
    if (ids.length === 0) return;
    if (!confirm(`Supprimer ${ids.length} site(s) ? Cette action est définitive.`)) return;
    setErr('');
    start(async () => {
      const r = await deleteSites(ids);
      if (r.ok) { setSel(new Set()); router.refresh(); }
      else setErr(r.error ?? 'Échec de la suppression.');
    });
  }

  return (
    <div className="space-y-2">
      {/* Barre de suppression — visible quand au moins une ligne est cochée */}
      {sel.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
          <span className="text-sm text-red-700 font-medium">{sel.size} sélectionné(s)</span>
          <button onClick={remove} disabled={pending}
            className="rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-80 px-3 py-1 text-sm text-white transition-colors">
            {pending ? 'Suppression…' : '🗑 Supprimer'}
          </button>
          <button onClick={() => setSel(new Set())} className="text-xs text-red-500 hover:text-red-700 underline">Annuler</button>
          {err && <span className="text-xs text-red-600">{err}</span>}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="border-b border-[#e5e5e5] text-left bg-[#fafafa]">
              <th className="px-3 py-2.5 w-10">
                <input type="checkbox" checked={allChecked} onChange={toggleAll}
                  className="rounded border-[#e5e5e5] text-indigo-600" aria-label="Tout sélectionner" />
              </th>
              <th className="px-4 py-2.5 label">Domaine</th>
              <th className="px-3 py-2.5 label">Type</th>
              <th className="px-3 py-2.5 label">Niche / Ville</th>
              <th className="px-3 py-2.5 label">Statut</th>
              <th className="px-3 py-2.5 label text-right">Top mot-clé /mois</th>
              <th className="px-3 py-2.5 label text-right">Niche score</th>
              <th className="px-3 py-2.5 label text-right">Leads/mois</th>
              <th className="px-3 py-2.5 label text-right">Top pos.</th>
              <th className="px-3 py-2.5 label text-right">Loyer/mois</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f0]">
            {sites.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-[#a3a3a3]">Aucun site trouvé.</td></tr>
            ) : sites.map(s => {
              const checked = sel.has(s.id);
              return (
              <tr key={s.id} className={`transition-colors ${checked ? 'bg-indigo-50' : 'hover:bg-[#fafafa]'}`}>
                <td className="px-3 py-2.5">
                  <input type="checkbox" checked={checked} onChange={() => toggle(s.id)}
                    className="rounded border-[#e5e5e5] text-indigo-600" aria-label={`Sélectionner ${s.domain ?? s.id}`} />
                </td>
                <td className="px-4 py-2.5">
                  <Link href={`/app/sites/${s.id}`} className="mono text-indigo-600 hover:text-indigo-800">
                    {s.domain ?? <span className="text-[#a3a3a3] italic">sans domaine</span>}
                  </Link>
                </td>
                <td className="px-3 py-2.5"><Badge value={s.type} /></td>
                <td className="px-3 py-2.5 text-[#404040] text-xs">
                  <span className="font-medium">{s.niche}</span>
                  <span className="text-[#a3a3a3] ml-1">· {s.city}</span>
                </td>
                <td className="px-3 py-2.5"><Badge value={s.status} /></td>
                <td className="px-3 py-2.5 text-right mono text-[#404040]">
                  {s.top_volume != null
                    ? <>{s.top_volume.toLocaleString('fr-CA')}<span className="text-[#d4d4d4] text-xs"> · {s.keyword_count} mc</span></>
                    : <span className="text-[#d4d4d4]">—</span>}
                </td>
                <td className="px-3 py-2.5 text-right mono">
                  {s.niche_score != null
                    ? <span className="text-indigo-600 font-medium">{Math.round(s.niche_score).toLocaleString('fr-CA')}</span>
                    : <span className="text-[#d4d4d4]">—</span>}
                </td>
                <td className="px-3 py-2.5 text-right mono text-[#404040]">
                  {s.leads_month > 0 ? s.leads_month : <span className="text-[#d4d4d4]">—</span>}
                </td>
                <td className="px-3 py-2.5 text-right mono">
                  {s.best_position != null
                    ? <span className="text-emerald-600 font-medium">#{s.best_position}</span>
                    : <span className="text-[#d4d4d4]">—</span>}
                </td>
                <td className="px-3 py-2.5 text-right mono text-[#404040]">
                  {s.monthly_rent != null ? `$${s.monthly_rent}/m` : <span className="text-[#d4d4d4]">—</span>}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
