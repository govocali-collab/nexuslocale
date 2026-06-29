'use client';

import { useEffect, useState } from 'react';

const GROUPS: { group: string; items: string[] }[] = [
  { group: 'Essentiels (gratuit, en premier)', items: [
    'Google Business Profile', 'Pages Jaunes', 'Bing Places',
    'Apple Business Connect', 'Facebook', 'Yelp Canada',
  ] },
  { group: 'Annuaires CA / QC', items: [
    '411.ca', 'Yellowpages.ca', 'Ourbis', 'Canpages.ca', 'Cylex Canada',
    'N49.com', 'Hotfrog Canada', 'iBegin', 'Foursquare',
  ] },
  { group: 'Métier (réno / construction)', items: [
    'HomeStars', 'Houzz', 'RénoAssistance', 'Chambre de commerce locale', 'Annuaire RBQ',
  ] },
];
const ALL = GROUPS.flatMap(g => g.items);

export function CitationChecklist({ siteId }: { siteId: string }) {
  const key = `citations:${siteId}`;
  const [done,   setDone]   = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  // Charge l'état depuis le navigateur (par site).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setDone(JSON.parse(raw) as Record<string, boolean>);
    } catch { /* localStorage indisponible */ }
    setLoaded(true);
  }, [key]);

  // Sauvegarde à chaque changement.
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(key, JSON.stringify(done)); } catch { /* ignore */ }
  }, [done, loaded, key]);

  const count = ALL.filter(i => done[i]).length;
  const pct   = Math.round((count / ALL.length) * 100);
  const toggle = (i: string) => setDone(d => ({ ...d, [i]: !d[i] }));

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="label">Checklist citations / SEO</p>
        <span className={`text-xs mono font-semibold rounded px-1.5 py-0.5 ${
          count === ALL.length ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
        }`}>{count}/{ALL.length}</span>
      </div>

      <div className="h-1.5 w-full rounded bg-[#f5f5f5] mb-3 overflow-hidden">
        <div className="h-full rounded bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="space-y-3">
        {GROUPS.map(g => (
          <div key={g.group}>
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#a3a3a3] mb-1">{g.group}</p>
            <ul className="space-y-1">
              {g.items.map(i => (
                <li key={i}>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!done[i]}
                      onChange={() => toggle(i)}
                      className="rounded border-[#e5e5e5] text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className={done[i] ? 'line-through text-[#a3a3a3]' : 'text-[#0a0a0a]'}>{i}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-[#a3a3a3] mt-3">
        Règle d'or : <span className="font-medium text-[#a3a3a3]">même Nom · Adresse · Téléphone</span> partout.
      </p>
    </div>
  );
}
