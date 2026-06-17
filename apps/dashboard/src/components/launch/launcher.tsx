'use client';

import { useState, useTransition } from 'react';
import { runFinderScan, runProspectorScan, runGscSubmit, runRank, runCron } from '@/lib/launch-actions';
import type { FinderResult, ProspectorResult } from '@/lib/launch-actions';

interface Site { id: string; domain: string | null; niche: string; city: string; }
interface ActionQueue {
  toSubmit: Site[];
  toRank:   Site[];
  stale:    { id: string; domain: string | null; weeksOld: number }[];
}

const TABS = [
  { id: 'finder',   label: '🔍 Finder',       desc: 'Scanner une niche pour trouver des domaines' },
  { id: 'prospect', label: '🎯 Prospector',   desc: 'Trouver des commerces à faible présence web' },
  { id: 'submit',   label: '📤 Soumettre GSC', desc: 'Vérifier et indexer un site dans Search Console' },
  { id: 'rank',     label: '📊 Tracker',       desc: 'Suivre les positions SERP d\'un site' },
  { id: 'cron',     label: '🔄 Cron',          desc: 'Lancer le suivi hebdomadaire de tous les sites' },
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

// ── Tableaux de résultats ───────────────────────────────────────────────────────
const fmtNum = (n: number | null) => (n == null ? '—' : n.toLocaleString('fr-CA'));
const fmtCpc = (n: number | null) => (n == null ? '—' : `$${n.toFixed(2)}`);

const TH = 'px-3 py-2 font-medium text-[#3D3D6B]';
const TD = 'px-3 py-2 border-t border-[#EEEDF9]';

function Badge({ text, cls }: { text: string; cls: string }) {
  return <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${cls}`}>{text}</span>;
}

function kdCls(kd: number | null) {
  if (kd == null) return 'bg-[#EEEDF9] text-[#9A97C0]';
  return kd <= 30 ? 'bg-green-100 text-green-700' : kd <= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
}

type KwSortKey = 'keyword' | 'search_volume' | 'cpc' | 'keyword_difficulty' | 'score';

function KeywordTable({ result }: { result: FinderResult }) {
  const [q,      setQ]      = useState('');
  const [minVol, setMinVol] = useState('');
  const [maxKd,  setMaxKd]  = useState('');
  const [sort,   setSort]   = useState<{ key: KwSortKey; dir: 'asc' | 'desc' }>({ key: 'score', dir: 'desc' });

  const domains   = (result.candidates ?? []).filter(d => d.available);
  const minVolNum = minVol === '' ? null : Number(minVol);
  const maxKdNum  = maxKd  === '' ? null : Number(maxKd);

  const rows = result.keywords
    .filter(k => {
      if (q && !k.keyword.toLowerCase().includes(q.toLowerCase())) return false;
      if (minVolNum != null && (k.search_volume ?? 0) < minVolNum) return false;
      if (maxKdNum != null && k.keyword_difficulty != null && k.keyword_difficulty > maxKdNum) return false;
      return true;
    })
    .sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      if (sort.key === 'keyword') return a.keyword.localeCompare(b.keyword) * dir;
      const av = (a[sort.key] as number | null) ?? -Infinity;
      const bv = (b[sort.key] as number | null) ?? -Infinity;
      return (av - bv) * dir;
    });

  function toggleSort(key: KwSortKey) {
    setSort(s => s.key === key
      ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' }
      : { key, dir: key === 'keyword' ? 'asc' : 'desc' });
  }
  const arrow = (key: KwSortKey) => sort.key === key ? (sort.dir === 'desc' ? ' ↓' : ' ↑') : '';
  const hasFilter = q !== '' || minVol !== '' || maxKd !== '';
  const inputCls = 'rounded-md bg-[#F5F4FF] border-[#D9D7F0] text-[#1C1560] text-sm px-2 py-1 placeholder-[#9A97C0]';

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-[#1C1560]">{rows.length} / {result.keywords.length} mot(s)-clé</span>
        <Badge text={`Niche score ${result.niche_score}`} cls="bg-indigo-100 text-indigo-700" />
      </div>

      {/* Barre de filtre */}
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Filtrer un mot-clé…"
          className={`${inputCls} flex-1 min-w-[10rem]`} />
        <input value={minVol} onChange={e => setMinVol(e.target.value)} type="number" min={0} placeholder="Volume min"
          className={`${inputCls} w-28`} />
        <input value={maxKd} onChange={e => setMaxKd(e.target.value)} type="number" min={0} max={100} placeholder="KD max"
          className={`${inputCls} w-24`} />
        {hasFilter && (
          <button onClick={() => { setQ(''); setMinVol(''); setMaxKd(''); }}
            className="text-xs text-[#9A97C0] hover:text-[#1C1560] underline">Réinitialiser</button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#D9D7F0]">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F4FF]">
            <tr>
              {([
                ['keyword',            'Mot-clé', 'text-left'],
                ['search_volume',      'Volume',  'text-right'],
                ['cpc',                'CPC',     'text-right'],
                ['keyword_difficulty', 'KD',      'text-center'],
                ['score',              'Score',   'text-right'],
              ] as [KwSortKey, string, string][]).map(([key, label, align]) => (
                <th key={key} onClick={() => toggleSort(key)}
                  className={`${align} ${TH} cursor-pointer select-none hover:text-[#1C1560] whitespace-nowrap`}>
                  {label}{arrow(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((k, i) => (
              <tr key={k.keyword + i} className="hover:bg-[#FAFAFF]">
                <td className={`${TD} text-[#1C1560]`}>{k.keyword}</td>
                <td className={`${TD} text-right tabular-nums text-[#3D3D6B]`}>{fmtNum(k.search_volume)}</td>
                <td className={`${TD} text-right tabular-nums text-[#3D3D6B]`}>{fmtCpc(k.cpc)}</td>
                <td className={`${TD} text-center`}><Badge text={k.keyword_difficulty == null ? '—' : String(k.keyword_difficulty)} cls={kdCls(k.keyword_difficulty)} /></td>
                <td className={`${TD} text-right tabular-nums font-semibold text-[#1C1560]`}>{Math.round(k.score).toLocaleString('fr-CA')}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-[#9A97C0]">Aucun mot-clé ne correspond aux filtres.</td></tr>}
          </tbody>
        </table>
      </div>
      {domains.length > 0 && (
        <p className="text-xs text-[#3D3D6B]">
          <span className="font-medium">Domaines dispo : </span>
          {domains.slice(0, 6).map(d => `${d.domain}${d.price_usd ? ` ($${d.price_usd.toFixed(2)})` : ''}`).join('  ·  ')}
        </p>
      )}
    </div>
  );
}

const PRESENCE: Record<string, { label: string; cls: string }> = {
  none:        { label: 'Aucun site',   cls: 'bg-red-100 text-red-700' },
  social_only: { label: 'Réseaux soc.', cls: 'bg-amber-100 text-amber-700' },
  has_site:    { label: 'A un site',    cls: 'bg-[#EEEDF9] text-[#3D3D6B]' },
};
function painCls(s: number) {
  return s >= 50 ? 'bg-red-100 text-red-700' : s >= 20 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';
}
function painEmoji(s: number) {
  return s >= 80 ? '💀' : s >= 50 ? '🔴' : s >= 20 ? '🟡' : '🟢';
}

function ProspectTable({ result }: { result: ProspectorResult }) {
  const rows = [...result.prospects].sort((a, b) => b.prospect_score - a.prospect_score);
  return (
    <div className="mt-4 space-y-3">
      <span className="text-sm font-medium text-[#1C1560]">{rows.length} prospect(s) — triés par score</span>
      <div className="overflow-x-auto rounded-lg border border-[#D9D7F0]">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F4FF]">
            <tr>
              <th className={`text-left ${TH}`}>Entreprise</th>
              <th className={`text-center ${TH}`}>Note</th>
              <th className={`text-right ${TH}`}>Avis</th>
              <th className={`text-left ${TH}`}>Présence web</th>
              <th className={`text-center ${TH}`}>Pain</th>
              <th className={`text-right ${TH}`}>Score</th>
              <th className={`text-left ${TH}`}>Problèmes</th>
              <th className={`text-left ${TH}`}>Téléphone</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => {
              const pres = PRESENCE[p.web_presence] ?? { label: p.web_presence, cls: 'bg-[#EEEDF9] text-[#3D3D6B]' };
              return (
                <tr key={p.business_name + i} className="hover:bg-[#FAFAFF] align-top">
                  <td className={`${TD} text-[#1C1560] font-medium`}>{p.business_name}</td>
                  <td className={`${TD} text-center text-[#3D3D6B] whitespace-nowrap`}>{p.rating != null ? `⭐ ${p.rating.toFixed(1)}` : '—'}</td>
                  <td className={`${TD} text-right tabular-nums text-[#3D3D6B]`}>{p.review_count ?? '—'}</td>
                  <td className={TD}><Badge text={pres.label} cls={pres.cls} /></td>
                  <td className={`${TD} text-center`}><Badge text={`${painEmoji(p.pain_score)} ${p.pain_score}`} cls={painCls(p.pain_score)} /></td>
                  <td className={`${TD} text-right tabular-nums font-semibold text-[#1C1560]`}>{p.prospect_score}</td>
                  <td className={`${TD} text-xs text-[#6B6B9E] max-w-[18rem]`}>{p.detected_issues.slice(0, 3).join(', ') || '—'}</td>
                  <td className={`${TD} text-[#3D3D6B] whitespace-nowrap`}>{p.phone ?? '—'}</td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={8} className="px-3 py-6 text-center text-[#9A97C0]">Aucun prospect trouvé.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RawLogs({ out, ok }: { out: string; ok: boolean }) {
  if (!out) return null;
  return (
    <details className="mt-3">
      <summary className="text-xs text-[#9A97C0] cursor-pointer hover:text-[#6B6B9E]">Voir les logs bruts</summary>
      <Output out={out} ok={ok} pending={false} />
    </details>
  );
}

// ── Finder ────────────────────────────────────────────────────────────────────
function FinderPanel() {
  const [niche,    setNiche]    = useState('');
  const [city,     setCity]     = useState('');
  const [limit,    setLimit]    = useState(100);
  const [maxKd,    setMaxKd]    = useState(30);
  const [estimate, setEstimate] = useState(false);
  const [result,   setResult]   = useState<{ out: string; ok: boolean; data: FinderResult | null } | null>(null);
  const [pending,  start]       = useTransition();

  const ready = niche.trim() !== '' && city.trim() !== '';

  function launch() {
    if (!ready) return;
    setResult(null);
    start(async () => {
      const r = await runFinderScan(niche.trim(), city.trim(), {
        country: 'CA', lang: 'fr', limit, maxDifficulty: maxKd, estimate,
      });
      setResult(r);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label block mb-1">Niche</label>
          <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="plombier"
            className="w-full rounded-md bg-[#F5F4FF] border-[#D9D7F0] text-[#1C1560] text-sm px-3 py-1.5
                       placeholder-[#9A97C0] focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div>
          <label className="label block mb-1">Ville</label>
          <input value={city} onChange={e => setCity(e.target.value)} placeholder="Brossard"
            className="w-full rounded-md bg-[#F5F4FF] border-[#D9D7F0] text-[#1C1560] text-sm px-3 py-1.5
                       placeholder-[#9A97C0] focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <label className="label block mb-1">Limite mots-clés</label>
          <input type="number" value={limit} onChange={e => setLimit(Number(e.target.value))} min={10} max={500}
            className="w-28 rounded-md bg-[#F5F4FF] border-[#D9D7F0] text-[#1C1560] text-sm px-3 py-1.5" />
        </div>
        <div>
          <label className="label block mb-1">KD max</label>
          <input type="number" value={maxKd} onChange={e => setMaxKd(Number(e.target.value))} min={0} max={100}
            className="w-24 rounded-md bg-[#F5F4FF] border-[#D9D7F0] text-[#1C1560] text-sm px-3 py-1.5" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer mt-4">
          <input type="checkbox" checked={estimate} onChange={e => setEstimate(e.target.checked)}
            className="rounded border-[#D9D7F0] text-indigo-600" />
          <span className="text-sm text-[#3D3D6B]">--estimate (données simulées, gratuit)</span>
        </label>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={launch} disabled={!ready || pending}
          className="rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed
                     px-4 py-2 text-sm text-white transition-colors">
          {pending ? 'Scan en cours…' : estimate ? 'Estimer (gratuit)' : 'Lancer le scan réel'}
        </button>
        <span className="text-xs text-[#9A97C0]">
          {estimate
            ? 'Mode simulé — aucun appel API, aucun coût.'
            : 'Appel DataForSEO réel — ~$0.003 en crédits. Crée le site dans Supabase.'}
        </span>
      </div>

      {result?.data
        ? <><KeywordTable result={result.data} /><RawLogs out={result.out} ok={result.ok} /></>
        : <Output out={result?.out ?? ''} ok={result?.ok ?? true} pending={pending} />}
    </div>
  );
}

// ── Prospector ──────────────────────────────────────────────────────────────────
function ProspectPanel() {
  const [niche,      setNiche]      = useState('');
  const [city,       setCity]       = useState('');
  const [limit,      setLimit]      = useState(60);
  const [minReviews, setMinReviews] = useState(0);
  const [simulate,   setSimulate]   = useState(false);
  const [result,     setResult]     = useState<{ out: string; ok: boolean; data: ProspectorResult | null } | null>(null);
  const [pending,    start]         = useTransition();

  const ready    = niche.trim() !== '' && city.trim() !== '';
  const estCost  = (Math.ceil(limit / 20) * 0.032 + limit * 0.017).toFixed(2);

  function launch() {
    if (!ready) return;
    setResult(null);
    start(async () => {
      const r = await runProspectorScan(niche.trim(), city.trim(), { limit, minReviews, simulate });
      setResult(r);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label block mb-1">Niche</label>
          <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="dégât d'eau"
            className="w-full rounded-md bg-[#F5F4FF] border-[#D9D7F0] text-[#1C1560] text-sm px-3 py-1.5
                       placeholder-[#9A97C0] focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div>
          <label className="label block mb-1">Ville</label>
          <input value={city} onChange={e => setCity(e.target.value)} placeholder="Brossard QC"
            className="w-full rounded-md bg-[#F5F4FF] border-[#D9D7F0] text-[#1C1560] text-sm px-3 py-1.5
                       placeholder-[#9A97C0] focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <label className="label block mb-1">Limite entreprises</label>
          <input type="number" value={limit} onChange={e => setLimit(Number(e.target.value))} min={1} max={200}
            className="w-28 rounded-md bg-[#F5F4FF] border-[#D9D7F0] text-[#1C1560] text-sm px-3 py-1.5" />
        </div>
        <div>
          <label className="label block mb-1">Avis min.</label>
          <input type="number" value={minReviews} onChange={e => setMinReviews(Number(e.target.value))} min={0} max={500}
            className="w-24 rounded-md bg-[#F5F4FF] border-[#D9D7F0] text-[#1C1560] text-sm px-3 py-1.5" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer mt-4">
          <input type="checkbox" checked={simulate} onChange={e => setSimulate(e.target.checked)}
            className="rounded border-[#D9D7F0] text-indigo-600" />
          <span className="text-sm text-[#3D3D6B]">--simulate (fixtures, gratuit)</span>
        </label>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={launch} disabled={!ready || pending}
          className="rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed
                     px-4 py-2 text-sm text-white transition-colors">
          {pending ? 'Scan en cours…' : simulate ? 'Tester (fixtures)' : 'Lancer le scan réel'}
        </button>
        <span className="text-xs text-[#9A97C0]">
          {simulate
            ? 'Mode fixtures — aucun appel API, aucun coût.'
            : `Appel Google Places réel — ~$${estCost} en crédits. Écrit les prospects dans Supabase.`}
        </span>
      </div>

      {result?.data
        ? <><ProspectTable result={result.data} /><RawLogs out={result.out} ok={result.ok} /></>
        : <Output out={result?.out ?? ''} ok={result?.ok ?? true} pending={pending} />}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
export function Launcher({ sites, initialQueues, initialTab }: { sites: Site[]; initialQueues?: ActionQueue; initialTab?: string | undefined }) {
  const startTab = (TABS.some(t => t.id === initialTab) ? initialTab : 'finder') as TabId;
  const [tab,        setTab]        = useState<TabId>(startTab);
  const [submitSite, setSubmitSite] = useState(sites[0]?.id ?? '');
  const [rankSite,   setRankSite]   = useState(sites[0]?.id ?? '');

  function goSubmit(siteId: string) { setSubmitSite(siteId); setTab('submit'); }
  function goRank(siteId: string)   { setRankSite(siteId);   setTab('rank'); }

  return (
    <div className="space-y-3">
      {/* Tab selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
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
        {tab === 'finder'   && <FinderPanel />}
        {tab === 'prospect' && <ProspectPanel />}
        {tab === 'submit'   && <SubmitPanel sites={sites} preselect={submitSite} onPreselect={setSubmitSite} />}
        {tab === 'rank'   && <RankPanel   sites={sites} preselect={rankSite}   onPreselect={setRankSite} />}
        {tab === 'cron'   && <CronPanel />}
      </div>
    </div>
  );
}
