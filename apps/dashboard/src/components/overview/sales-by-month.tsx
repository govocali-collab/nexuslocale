'use client';

import { useMemo, useState } from 'react';
import type { WonDeal } from '@/lib/queries';

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y!, m! - 1, 1).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });
}
function prevMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y!, m! - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
const fmt = (n: number) => '$' + Math.round(n).toLocaleString('fr-CA');

export function SalesByMonth({ deals }: { deals: WonDeal[] }) {
  const byMonth = useMemo(() => {
    const m: Record<string, number> = {};
    for (const d of deals) {
      if (!d.date) continue;
      const key = d.date.slice(0, 7); // YYYY-MM
      m[key] = (m[key] ?? 0) + (d.sale_value ?? 0);
    }
    return m;
  }, [deals]);

  const months = useMemo(() => Object.keys(byMonth).sort().reverse(), [byMonth]);
  const total  = useMemo(() => deals.reduce((n, d) => n + (d.sale_value ?? 0), 0), [deals]);
  const [sel, setSel] = useState<string>('total');

  const value   = sel === 'total' ? total : (byMonth[sel] ?? 0);
  const prevVal = sel === 'total' ? null : (byMonth[prevMonth(sel)] ?? 0);
  const delta   = prevVal === null ? null : value - prevVal;

  const selectCls = 'rounded-md bg-[#fafafa] border-[#e5e5e5] text-[#0a0a0a] text-xs py-1 pl-2 pr-6';

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-1 gap-2">
        <p className="label">Ventes de sites</p>
        <select value={sel} onChange={(e) => setSel(e.target.value)} className={selectCls}>
          <option value="total">Total</option>
          {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
      </div>

      <p className="text-3xl font-bold mono text-[#0a0a0a]">{fmt(value)}</p>

      {delta !== null ? (
        <p className={`text-xs mt-1 ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-[#a3a3a3]'}`}>
          {delta >= 0 ? '+' : '−'}{fmt(Math.abs(delta)).slice(1)} vs {monthLabel(prevMonth(sel))}
        </p>
      ) : (
        <p className="text-xs mt-1 text-[#a3a3a3]">sites web vendus (prospects gagnés)</p>
      )}

      {months.length > 0 && (
        <div className="mt-3 pt-3 border-t border-neutral-100 space-y-1">
          {months.slice(0, 6).map((m) => (
            <button
              key={m}
              onClick={() => setSel(m)}
              className={`w-full flex items-center justify-between text-xs rounded px-1.5 py-1 transition-colors
                ${sel === m ? 'bg-indigo-50 text-indigo-700' : 'text-[#525252] hover:bg-[#f5f5f5]'}`}
            >
              <span className="capitalize">{monthLabel(m)}</span>
              <span className="mono">{fmt(byMonth[m] ?? 0)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
