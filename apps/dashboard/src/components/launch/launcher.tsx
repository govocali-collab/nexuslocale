'use client';

import { useState, useTransition } from 'react';
import { runGscSubmit, runRank, runCron } from '@/lib/launch-actions';

interface Site { id: string; domain: string | null; niche: string; city: string; }
interface ActionQueue {
  toSubmit: Site[];
  toRank:   Site[];
  stale:    { id: string; domain: string | null; weeksOld: number }[];
}

const TABS = [
  { id: 'finder',  label: '🔍 Finder',       desc: 'Scanner une niche pour trouver des domaines' },
  { id: 'submit',  label: '📤 Soumettre GSC', desc: 'Vérifier et indexer un site dans Search Console' },
  { id: 'rank',    label: '📊 Tracker',       desc: 'Suivre les positions SERP d\'un site' },
  { id: 'cron',    label: '🔄 Cron',          desc: 'Lancer le suivi hebdomadaire de tous les sites' },
] as const;
type TabId = (typeof TABS)[number]['id'];

function Output({ out, ok, pending }: { out: string; ok: boolean; pending: boolean }) {
  if (pending) return (
    <div className="mt-4 rounded-lg bg-[#F5F4FF] border border-[#D9D7F0] px-4 py-3 text-sm text-[#6B6B9E] flex items-center gap-2">
      <span className="inline-block w-3 h-3 rounded-full bg-indigo-400 animate-pulse" />
      En cours…
    </div>
  );
  if (!out) return null;
  return (
    <div className={`mt-4 rounded-lg border px-4 py-3 ${ok ? 'bg-[#F5F4FF] border-[#D9D7F0]' : 'bg-red-50 border-red-200'}`}>
      <pre className={`text-xs whitespace-pre-wrap font-mono leading-relaxed ${ok ? 'text-[#1C1560]' : 'text-red-700'}`}>
        {out}
      </pre>
    </div>
  );
}

// ── Finder ────────────────────────────────────────────────────────────────────
function FinderPanel() {
  const [niche,    setNiche]    = useState('');
  const [city,     setCity]     = useState('');
  const [limit,    setLimit]    = useState(100);
  const [estimate, setEstimate] = useState(true);

  const cmd = `pnpm --filter @nexuslocale/finder cli scan "${niche || '<niche>'}" "${city || '<ville>'}" --limit ${limit}${estimate ? ' --estimate' : ''}`;

  function copy() { navigator.clipboard.writeText(cmd); }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label block mb-1">Niche</label>
          <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="plombier"
            className="w-full rounded-md bg-[#F5F4FF] border-[#D9D7F0] text-[#1C1560] text-sm px-3 py-1.5
                       placeholder-[#9A97C0] focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div>
          <label className="label block mb-1">Ville</label>
          <input value={city} onChange={e => setCity(e.target.value)} placeholder="Montréal"
            className="w-full rounded-md bg-[#F5F4FF] border-[#D9D7F0] text-[#1C1560] text-sm px-3 py-1.5
                       placeholder-[#9A97C0] focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div>
          <label className="label block mb-1">Limite mots-clés</label>
          <input type="number" value={limit} onChange={e => setLimit(Number(e.target.value))} min={10} max={500}
            className="w-28 rounded-md bg-[#F5F4FF] border-[#D9D7F0] text-[#1C1560] text-sm px-3 py-1.5" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer mt-4">
          <input type="checkbox" checked={estimate} onChange={e => setEstimate(e.target.checked)}
            className="rounded border-[#D9D7F0] text-indigo-600" />
          <span className="text-sm text-[#3D3D6B]">--estimate (coûts seulement)</span>
        </label>
      </div>

      <div>
        <p className="label mb-1">Commande à exécuter dans le terminal</p>
        <div className="flex items-start gap-2">
          <pre className="flex-1 rounded-lg bg-[#1C1560] text-[#E8E6FF] text-xs p-3 font-mono overflow-x-auto whitespace-pre-wrap">
            {cmd}
          </pre>
          <button onClick={copy}
            className="shrink-0 rounded-md bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs text-white transition-colors">
            Copier
          </button>
        </div>
        <p className="text-xs text-[#9A97C0] mt-1.5">
          Le scan crée le site dans Supabase et liste les domaines disponibles.
          Lance depuis la racine du projet.
        </p>
      </div>
    </div>
  );
}

// ── GSC Submit ────────────────────────────────────────────────────────────────
function SubmitPanel({ sites, preselect, onPreselect }: { sites: Site[]; preselect: string; onPreselect: (id: string) => void }) {
  const siteId    = preselect;
  const setSiteId = onPreselect;
  const [estimate,  setEstimate]  = useState(true);
  const [skipVerif, setSkipVerif] = useState(false);
  const [force,     setForce]     = useState(false);
  const [result,    setResult]    = useState<{ out: string; ok: boolean } | null>(null);
  const [pending,   start]        = useTransition();

  function launch() {
    setResult(null);
    start(async () => {
      const r = await runGscSubmit(siteId, { estimate, skipVerify: skipVerif, force });
      setResult(r);
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label block mb-1">Site</label>
        <select value={siteId} onChange={e => setSiteId(e.target.value)}
          className="w-full rounded-md bg-[#F5F4FF] border-[#D9D7F0] text-[#1C1560] text-sm py-1.5">
          {sites.map(s => (
            <option key={s.id} value={s.id}>
              {s.domain ?? s.id} — {s.niche}, {s.city}
            </option>
          ))}
          {sites.length === 0 && <option value="">Aucun site</option>}
        </select>
      </div>

      <div className="flex flex-wrap gap-4">
        {[
          [estimate,  setEstimate,  '--estimate (dry-run, sans appels API)'],
          [skipVerif, setSkipVerif, '--skip-verify (passe la vérif DNS)'],
          [force,     setForce,     '--force (re-soumettre même si déjà indexé)'],
        ].map(([val, set, label]) => (
          <label key={String(label)} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={val as boolean} onChange={e => (set as (v: boolean) => void)(e.target.checked)}
              className="rounded border-[#D9D7F0] text-indigo-600" />
            <span className="text-sm text-[#3D3D6B]">{String(label)}</span>
          </label>
        ))}
      </div>

      <button onClick={launch} disabled={pending || !siteId}
        className="rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-5 py-2
                   text-sm font-medium text-white transition-colors">
        Lancer la soumission
      </button>

      <Output out={result?.out ?? ''} ok={result?.ok ?? true} pending={pending} />
    </div>
  );
}

// ── Rank Tracker ──────────────────────────────────────────────────────────────
function RankPanel({ sites, preselect, onPreselect }: { sites: Site[]; preselect: string; onPreselect: (id: string) => void }) {
  const siteId    = preselect;
  const setSiteId = onPreselect;
  const [estimate, setEstimate] = useState(true);
  const [withGsc,  setWithGsc] = useState(false);
  const [top,      setTop]     = useState(20);
  const [result,   setResult]  = useState<{ out: string; ok: boolean } | null>(null);
  const [pending,  start]      = useTransition();

  function launch() {
    setResult(null);
    start(async () => {
      const r = await runRank(siteId, { estimate, withGsc, top });
      setResult(r);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label block mb-1">Site</label>
          <select value={siteId} onChange={e => setSiteId(e.target.value)}
            className="w-full rounded-md bg-[#F5F4FF] border-[#D9D7F0] text-[#1C1560] text-sm py-1.5">
            {sites.map(s => (
              <option key={s.id} value={s.id}>
                {s.domain ?? s.id} — {s.niche}
              </option>
            ))}
            {sites.length === 0 && <option value="">Aucun site</option>}
          </select>
        </div>
        <div>
          <label className="label block mb-1">Top N positions</label>
          <input type="number" value={top} onChange={e => setTop(Number(e.target.value))} min={1} max={100}
            className="w-full rounded-md bg-[#F5F4FF] border-[#D9D7F0] text-[#1C1560] text-sm px-3 py-1.5" />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {[
          [estimate, setEstimate, '--estimate (dry-run, sans appels SERP)'],
          [withGsc,  setWithGsc,  '--with-gsc (inclure données GSC)'],
        ].map(([val, set, label]) => (
          <label key={String(label)} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={val as boolean} onChange={e => (set as (v: boolean) => void)(e.target.checked)}
              className="rounded border-[#D9D7F0] text-indigo-600" />
            <span className="text-sm text-[#3D3D6B]">{String(label)}</span>
          </label>
        ))}
      </div>

      <button onClick={launch} disabled={pending || !siteId}
        className="rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-5 py-2
                   text-sm font-medium text-white transition-colors">
        Tracker les positions
      </button>

      <Output out={result?.out ?? ''} ok={result?.ok ?? true} pending={pending} />
    </div>
  );
}

// ── Cron ──────────────────────────────────────────────────────────────────────
function CronPanel() {
  const [dryRun, setDryRun] = useState(true);
  const [result, setResult] = useState<{ out: string; ok: boolean } | null>(null);
  const [pending, start]    = useTransition();

  function launch() {
    setResult(null);
    start(async () => {
      const r = await runCron(dryRun);
      setResult(r);
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#6B6B9E]">
        Lance le suivi des positions pour tous les sites avec statut{' '}
        <span className="mono text-[#1C1560]">indexed</span>,{' '}
        <span className="mono text-[#1C1560]">ranking</span> ou{' '}
        <span className="mono text-[#1C1560]">rented</span>.
        Alerte les sites sans position après 6 semaines.
      </p>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)}
          className="rounded border-[#D9D7F0] text-indigo-600" />
        <span className="text-sm text-[#3D3D6B]">--dry-run (simulation, aucune écriture en base)</span>
      </label>

      <button onClick={launch} disabled={pending}
        className={`rounded-md px-5 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50
          ${dryRun ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
        {dryRun ? 'Simuler le cron' : '🚀 Lancer le cron (réel)'}
      </button>

      <Output out={result?.out ?? ''} ok={result?.ok ?? true} pending={pending} />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function Launcher({ sites, initialQueues }: { sites: Site[]; initialQueues?: ActionQueue }) {
  const [tab,        setTab]        = useState<TabId>('finder');
  const [submitSite, setSubmitSite] = useState(sites[0]?.id ?? '');
  const [rankSite,   setRankSite]   = useState(sites[0]?.id ?? '');

  function goSubmit(siteId: string) { setSubmitSite(siteId); setTab('submit'); }
  function goRank(siteId: string)   { setRankSite(siteId);   setTab('rank'); }

  return (
    <div className="space-y-3">
      {/* Tab selector */}
      <div className="grid grid-cols-4 gap-2">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg border px-3 py-3 text-left transition-all ${
              tab === t.id
                ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200'
                : 'card hover:border-indigo-200 hover:bg-[#F5F4FF]'
            }`}
          >
            <p className="text-sm font-medium text-[#1C1560]">{t.label}</p>
            <p className="text-xs text-[#9A97C0] mt-0.5 leading-snug">{t.desc}</p>
          </button>
        ))}
      </div>

      {/* Active panel */}
      <div className="card p-5">
        {tab === 'finder' && <FinderPanel />}
        {tab === 'submit' && <SubmitPanel sites={sites} preselect={submitSite} onPreselect={setSubmitSite} />}
        {tab === 'rank'   && <RankPanel   sites={sites} preselect={rankSite}   onPreselect={setRankSite} />}
        {tab === 'cron'   && <CronPanel />}
      </div>
    </div>
  );
}
