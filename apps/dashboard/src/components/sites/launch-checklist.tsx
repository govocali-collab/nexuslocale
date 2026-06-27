'use client';

import { useEffect, useState } from 'react';

const GROUPS: { phase: string; items: string[] }[] = [
  { phase: '1 · Recherche', items: [
    'Choisir une niche (métier Tier 1)',
    'Valider la demande — Finder (CPC 🟢 + KD 🟢)',
    'Vérifier qu\'il y a un marché (assez de commerces dans la niche)',
  ] },
  { phase: '2 · Mise en ligne', items: [
    'Acheter le domaine',
    'Créer le config du site',
    'Déployer le site (Vercel)',
    'Soumettre à Google (GSC)',
  ] },
  { phase: '3 · Ranking (2–6 mois)', items: [
    'Faire les citations (voir checklist citations)',
    'Activer le suivi des positions (Tracker + Cron)',
    'Atteindre le top 3 sur Google',
  ] },
  { phase: '4 · Monétisation', items: [
    'Brancher le call tracking (Twilio)',
    '~1 mois d\'appels — accumuler la preuve',
    'Trouver les clients — Prospector (commerces à Pain élevé)',
    'Contacter avec la preuve (« X appels/mois »)',
    'Louer le site 💰',
  ] },
];
const ALL = GROUPS.flatMap(g => g.items);

export function LaunchChecklist({ siteId }: { siteId: string }) {
  const key = `launch:${siteId}`;
  const [done,   setDone]   = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setDone(JSON.parse(raw) as Record<string, boolean>);
    } catch { /* indisponible */ }
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(key, JSON.stringify(done)); } catch { /* ignore */ }
  }, [done, loaded, key]);

  const count  = ALL.filter(i => done[i]).length;
  const pct    = Math.round((count / ALL.length) * 100);
  const toggle = (i: string) => setDone(d => ({ ...d, [i]: !d[i] }));

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="label">Checklist de lancement</p>
        <span className={`text-xs mono font-semibold rounded px-1.5 py-0.5 ${
          count === ALL.length ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
        }`}>{count}/{ALL.length}</span>
      </div>

      <div className="h-1.5 w-full rounded bg-[#f5f5f5] mb-4 overflow-hidden">
        <div className="h-full rounded bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {GROUPS.map(g => (
          <div key={g.phase}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-500 mb-2">{g.phase}</p>
            <ul className="space-y-1.5">
              {g.items.map(i => (
                <li key={i}>
                  <label className="flex items-start gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!done[i]}
                      onChange={() => toggle(i)}
                      className="mt-0.5 rounded border-[#e5e5e5] text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className={done[i] ? 'line-through text-[#a3a3a3]' : 'text-[#0a0a0a]'}>{i}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
