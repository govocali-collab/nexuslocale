import { createAdminClient } from '@/lib/admin';
import { getActionQueues } from '@/lib/queries';
import { Launcher } from '@/components/launch/launcher';

async function getSites() {
  const { data } = await createAdminClient()
    .from('sites')
    .select('id, domain, niche, city')
    .in('status', ['built', 'indexed', 'ranking', 'rented'])
    .order('created_at', { ascending: false });
  return (data ?? []) as { id: string; domain: string | null; niche: string; city: string }[];
}

export default async function LaunchPage() {
  const [sites, queues] = await Promise.all([getSites(), getActionQueues()]);

  return (
    <div className="space-y-4 max-w-5xl">
      <h1 className="text-lg font-semibold text-[#1C1560]">Lanceur d'actions</h1>

      {/* ── Files d'attente ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* À soumettre GSC */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="label">📤 À soumettre à GSC</p>
            <span className={`text-xs mono font-semibold rounded px-1.5 py-0.5 ${
              queues.toSubmit.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
            }`}>{queues.toSubmit.length}</span>
          </div>
          {queues.toSubmit.length === 0 ? (
            <p className="text-xs text-[#9A97C0]">Aucun site en attente. ✓</p>
          ) : (
            <ul className="space-y-1.5">
              {queues.toSubmit.map(s => (
                <li key={s.id} className="flex items-center justify-between">
                  <span className="text-xs mono text-[#1C1560] truncate">{s.domain ?? s.niche}</span>
                  <span className="text-xs text-[#9A97C0] ml-2 shrink-0">{s.city}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* À tracker */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="label">📊 À tracker (positions)</p>
            <span className={`text-xs mono font-semibold rounded px-1.5 py-0.5 ${
              queues.toRank.length > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
            }`}>{queues.toRank.length}</span>
          </div>
          {queues.toRank.length === 0 ? (
            <p className="text-xs text-[#9A97C0]">Tous les sites sont trackés. ✓</p>
          ) : (
            <ul className="space-y-1.5">
              {queues.toRank.map(s => (
                <li key={s.id} className="flex items-center justify-between">
                  <span className="text-xs mono text-[#1C1560] truncate">{s.domain ?? s.niche}</span>
                  <span className="text-xs text-[#9A97C0] ml-2 shrink-0">{s.city}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sites stagnants */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="label">⚠️ Stagnants (+6 sem)</p>
            <span className={`text-xs mono font-semibold rounded px-1.5 py-0.5 ${
              queues.stale.length > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
            }`}>{queues.stale.length}</span>
          </div>
          {queues.stale.length === 0 ? (
            <p className="text-xs text-[#9A97C0]">Aucun site stagnant. ✓</p>
          ) : (
            <ul className="space-y-1.5">
              {queues.stale.map(s => (
                <li key={s.id} className="flex items-center justify-between">
                  <span className="text-xs mono text-[#1C1560] truncate">{s.domain ?? s.id.slice(0, 8)}</span>
                  <span className="text-xs text-red-500 shrink-0 ml-2">{s.weeksOld} sem</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Workflow reminder ───────────────────────────────────────────────── */}
      <div className="card p-4">
        <p className="label mb-3">Workflow d'un site</p>
        <div className="flex items-center gap-1 flex-wrap text-xs">
          {[
            ['research', 'Finder scan'],
            ['built',    'GSC submit'],
            ['indexed',  'Rank tracker'],
            ['ranking',  'Louer'],
            ['rented',   'Cron hebdo'],
          ].map(([status, action], i, arr) => (
            <div key={status} className="flex items-center gap-1">
              <div className="flex flex-col items-center">
                <span className={`rounded px-2 py-0.5 font-medium ${
                  status === 'research' ? 'bg-slate-100 text-slate-600' :
                  status === 'built'    ? 'bg-sky-100 text-sky-700' :
                  status === 'indexed'  ? 'bg-amber-100 text-amber-700' :
                  status === 'ranking'  ? 'bg-orange-100 text-orange-700' :
                                         'bg-emerald-100 text-emerald-700'
                }`}>{status}</span>
                <span className="text-[#9A97C0] mt-0.5">{action}</span>
              </div>
              {i < arr.length - 1 && <span className="text-[#C0BDE0] mx-1">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Lanceur ─────────────────────────────────────────────────────────── */}
      <div>
        <p className="label mb-3">Lancer une action</p>
        <Launcher sites={sites} initialQueues={queues} />
      </div>
    </div>
  );
}
