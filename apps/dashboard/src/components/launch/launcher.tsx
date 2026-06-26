'use client';

import { useState, useTransition } from 'react';
import { runFinderScan, runProspectorScan, runDemoGen, generateBeautifulSite, publishBeautifulSite, runGscSubmit, runRank, runCron } from '@/lib/launch-actions';
import type { FinderResult, FinderDomain, ProspectorResult } from '@/lib/launch-actions';

interface Site { id: string; domain: string | null; niche: string; city: string; }
interface ActionQueue {
  toSubmit: Site[];
  toRank:   Site[];
  stale:    { id: string; domain: string | null; weeksOld: number }[];
}

const TABS = [
  { id: 'finder',   label: '🔍 Finder',       desc: 'Scanner une niche pour trouver des domaines' },
  { id: 'prospect', label: '🎯 Prospector',   desc: 'Trouver des commerces à faible présence web' },
  { id: 'generate', label: '🏗️ Générer',      desc: 'Générer le config du site (contenu IA)' },
  { id: 'beau',     label: '🎨 Beau site',    desc: 'Site one-page esthétique (design libre, Opus)' },
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

// CPC : plus c'est élevé, plus le client vaut cher → vert = vaut la peine.
function cpcCls(cpc: number | null) {
  if (cpc == null || cpc <= 0) return 'bg-[#EEEDF9] text-[#9A97C0]';
  return cpc >= 10 ? 'bg-green-100 text-green-700' : cpc >= 5 ? 'bg-amber-100 text-amber-700' : 'bg-[#EEEDF9] text-[#6B6B9E]';
}

type KwSortKey = 'keyword' | 'search_volume' | 'cpc' | 'keyword_difficulty' | 'score';

function KeywordTable({ result, selected, onToggle }: { result: FinderResult; selected: string[]; onToggle: (kw: string) => void }) {
  const [q,        setQ]        = useState('');
  const [minVol,   setMinVol]   = useState('');
  const [maxKd,    setMaxKd]     = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [sort,     setSort]     = useState<{ key: KwSortKey; dir: 'asc' | 'desc' }>({ key: 'score', dir: 'desc' });

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
        <button
          onClick={() => setShowHelp(h => !h)}
          aria-label="Comprendre les colonnes"
          className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold transition-colors ${
            showHelp ? 'bg-indigo-600 text-white' : 'bg-[#EEEDF9] text-[#6B6B9E] hover:bg-indigo-100 hover:text-indigo-700'
          }`}
        >?</button>
      </div>

      {/* Encadré d'aide */}
      {showHelp && (
        <div className="rounded-lg border border-[#D9D7F0] bg-[#F5F4FF] p-3 text-sm space-y-1.5">
          <p><span className="font-semibold text-[#1C1560]">Volume</span> <span className="text-[#6B6B9E]">— combien de fois ce mot-clé est cherché par mois (au Québec). Gros = beaucoup de monde cherche. ⚠️ Peu fiable en local.</span></p>
          <p><span className="font-semibold text-[#1C1560]">CPC</span> <span className="text-[#6B6B9E]">— ce qu'un annonceur paie par clic. 🟢 Élevé = un client vaut cher. <strong>Ton meilleur indicateur.</strong></span></p>
          <p><span className="font-semibold text-[#1C1560]">KD</span> <span className="text-[#6B6B9E]">— difficulté à ranker (0-100). 🟢 Bas (≤30) = facile à atteindre le top de Google.</span></p>
          <p><span className="font-semibold text-[#1C1560]">Score</span> <span className="text-[#6B6B9E]">— note globale = valeur × demande ÷ difficulté. Plus haut = meilleure opportunité.</span></p>
          <p className="pt-1 text-[#1C1560]">👉 <strong>Le combo gagnant : CPC 🟢 vert + KD 🟢 vert.</strong></p>
        </div>
      )}

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
              <th className={`${TH} w-8`}></th>
              {([
                ['keyword',            'Mot-clé', 'text-left'],
                ['search_volume',      'Volume',  'text-right'],
                ['cpc',                'CPC',     'text-right'],
                ['keyword_difficulty', 'KD',      'text-center'],
                ['score',              'Score',   'text-right'],
              ] as [KwSortKey, string, string][]).map(([key, label, align]) => (
                <th key={key} className={`${align} ${TH} whitespace-nowrap`}>
                  <button onClick={() => toggleSort(key)}
                    className="cursor-pointer select-none hover:text-[#1C1560] font-medium">{label}{arrow(key)}</button>
                  {key !== 'keyword' && (
                    <button onClick={() => setShowHelp(true)} aria-label={`Aide : ${label}`}
                      className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full bg-[#EEEDF9] text-[#9A97C0] hover:bg-indigo-100 hover:text-indigo-700 text-[10px] font-bold align-middle">?</button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((k, i) => {
              const isSel = selected.includes(k.keyword);
              return (
              <tr key={k.keyword + i} onClick={() => onToggle(k.keyword)}
                className={`cursor-pointer ${isSel ? 'bg-indigo-50' : 'hover:bg-[#FAFAFF]'}`}>
                <td className={`${TD} text-center`}>
                  <span className={`inline-flex items-center justify-center h-4 w-4 rounded border-2 align-middle text-white text-[10px] font-bold ${isSel ? 'border-indigo-600 bg-indigo-600' : 'border-[#C0BDE0]'}`}>{isSel ? '✓' : ''}</span>
                </td>
                <td className={`${TD} text-[#1C1560] ${isSel ? 'font-semibold' : ''}`}>{k.keyword}</td>
                <td className={`${TD} text-right tabular-nums text-[#3D3D6B]`}>{fmtNum(k.search_volume)}</td>
                <td className={`${TD} text-right`}><Badge text={fmtCpc(k.cpc)} cls={cpcCls(k.cpc)} /></td>
                <td className={`${TD} text-center`}><Badge text={k.keyword_difficulty == null ? '—' : String(k.keyword_difficulty)} cls={kdCls(k.keyword_difficulty)} /></td>
                <td className={`${TD} text-right tabular-nums font-semibold text-[#1C1560]`}>{Math.round(k.score).toLocaleString('fr-CA')}</td>
              </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-[#9A97C0]">
                {result.keywords.length === 0
                  ? "Le scan n'a trouvé aucun mot-clé — vérifie l'orthographe de la niche (ex. « ostéopathe », pas « ostéoathe »)."
                  : 'Aucun mot-clé ne correspond aux filtres.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DomainCard({ candidates }: { candidates: FinderDomain[] }) {
  const available = candidates.filter(d => d.available);
  const taken     = candidates.filter(d => !d.available);
  return (
    <div className="rounded-lg border border-[#D9D7F0] bg-white p-4">
      <p className="label mb-2">🌐 Domaines disponibles ({available.length})</p>
      {available.length === 0 ? (
        <p className="text-sm text-[#9A97C0]">Aucun domaine exact disponible — essaie une variante de niche/ville.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {available.map(d => (
            <li key={d.domain} className="flex items-center justify-between rounded-md bg-[#F5F4FF] px-3 py-1.5">
              <span className="mono text-sm text-[#1C1560]">{d.domain}</span>
              <span className="text-xs text-emerald-600 font-medium whitespace-nowrap">
                {d.price_usd ? `$${d.price_usd.toFixed(2)}/an` : 'dispo'}
              </span>
            </li>
          ))}
        </ul>
      )}
      {taken.length > 0 && (
        <p className="text-xs text-[#C0BDE0] mt-2">Déjà pris : {taken.map(d => d.domain).join(' · ')}</p>
      )}
      {available.length > 0 && (
        <p className="text-[11px] text-[#9A97C0] mt-2">
          Pour réserver : <span className="font-mono text-xs">finder buy {available[0]?.domain}</span> (achat ~13 $).
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

type ProSortKey = 'business_name' | 'rating' | 'review_count' | 'pain_score' | 'prospect_score';

function ProspectTable({ result, onPick }: { result: ProspectorResult; onPick?: ((name: string) => void) | undefined }) {
  const [showHelp,   setShowHelp]   = useState(false);
  const [q,          setQ]          = useState('');
  const [presence,   setPresence]   = useState('');
  const [minPain,    setMinPain]    = useState('');
  const [minReviews, setMinReviews] = useState('');
  const [sort,       setSort]       = useState<{ key: ProSortKey; dir: 'asc' | 'desc' }>({ key: 'prospect_score', dir: 'desc' });

  const minPainNum = minPain    === '' ? null : Number(minPain);
  const minRevNum  = minReviews === '' ? null : Number(minReviews);

  const rows = result.prospects
    .filter(p => {
      if (q && !p.business_name.toLowerCase().includes(q.toLowerCase())) return false;
      if (presence && p.web_presence !== presence) return false;
      if (minPainNum != null && p.pain_score < minPainNum) return false;
      if (minRevNum != null && (p.review_count ?? 0) < minRevNum) return false;
      return true;
    })
    .sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      if (sort.key === 'business_name') return a.business_name.localeCompare(b.business_name) * dir;
      const av = (a[sort.key] as number | null) ?? -Infinity;
      const bv = (b[sort.key] as number | null) ?? -Infinity;
      return (av - bv) * dir;
    });

  function toggleSort(key: ProSortKey) {
    setSort(s => s.key === key
      ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' }
      : { key, dir: key === 'business_name' ? 'asc' : 'desc' });
  }
  const arrow = (key: ProSortKey) => sort.key === key ? (sort.dir === 'desc' ? ' ↓' : ' ↑') : '';
  const hasFilter = q !== '' || presence !== '' || minPain !== '' || minReviews !== '';
  const inputCls = 'rounded-md bg-[#F5F4FF] border-[#D9D7F0] text-[#1C1560] text-sm px-2 py-1 placeholder-[#9A97C0]';

  const HEADERS: { key?: ProSortKey; label: string; align: string; help?: boolean }[] = [
    { key: 'business_name',  label: 'Entreprise',   align: 'text-left' },
    { key: 'rating',         label: 'Note',         align: 'text-center' },
    { key: 'review_count',   label: 'Avis',         align: 'text-right' },
    {                        label: 'Présence web', align: 'text-left',   help: true },
    { key: 'pain_score',     label: 'Pain',         align: 'text-center', help: true },
    { key: 'prospect_score', label: 'Score',        align: 'text-right',  help: true },
    {                        label: 'Problèmes',    align: 'text-left' },
    {                        label: 'Téléphone',    align: 'text-left' },
  ];

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-[#1C1560]">{rows.length} / {result.prospects.length} prospect(s)</span>
        <button
          onClick={() => setShowHelp(h => !h)}
          aria-label="Comprendre les colonnes"
          className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold transition-colors ${
            showHelp ? 'bg-indigo-600 text-white' : 'bg-[#EEEDF9] text-[#6B6B9E] hover:bg-indigo-100 hover:text-indigo-700'
          }`}
        >?</button>
      </div>

      {showHelp && (
        <div className="rounded-lg border border-[#D9D7F0] bg-[#F5F4FF] p-3 text-sm space-y-1.5">
          <p><span className="font-semibold text-[#1C1560]">Note / Avis</span> <span className="text-[#6B6B9E]">— sa note Google (étoiles) et son nombre d'avis. Beaucoup d'avis = commerce établi et occupé.</span></p>
          <p><span className="font-semibold text-[#1C1560]">Présence web</span> <span className="text-[#6B6B9E]">— a-t-il un site? 🔴 « Aucun site » = facile à dépasser sur Google.</span></p>
          <p><span className="font-semibold text-[#1C1560]">Pain</span> <span className="text-[#6B6B9E]">— à quel point son site est faible/absent (0-100). 🔴 Élevé = mauvais ou pas de site → facile à dépasser ET client affamé.</span></p>
          <p><span className="font-semibold text-[#1C1560]">Score</span> <span className="text-[#6B6B9E]">— à quel point c'est un <strong>bon prospect à contacter</strong> = commerce réputé (avis + note) <strong>mais</strong> site faible. Plus haut = à appeler en premier.</span></p>
          <p className="pt-1 text-[#1C1560]">👉 <strong>Le prospect en or : beaucoup d'avis + Pain 🔴 élevé</strong> (un vrai bon commerce sans bon site).</p>
        </div>
      )}

      {/* Barre de filtre */}
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Filtrer une entreprise…"
          className={`${inputCls} flex-1 min-w-[10rem]`} />
        <select value={presence} onChange={e => setPresence(e.target.value)} className={inputCls}>
          <option value="">Toute présence</option>
          <option value="none">Aucun site</option>
          <option value="social_only">Réseaux soc.</option>
          <option value="has_site">A un site</option>
        </select>
        <input value={minPain} onChange={e => setMinPain(e.target.value)} type="number" min={0} max={100} placeholder="Pain min"
          className={`${inputCls} w-24`} />
        <input value={minReviews} onChange={e => setMinReviews(e.target.value)} type="number" min={0} placeholder="Avis min"
          className={`${inputCls} w-24`} />
        {hasFilter && (
          <button onClick={() => { setQ(''); setPresence(''); setMinPain(''); setMinReviews(''); }}
            className="text-xs text-[#9A97C0] hover:text-[#1C1560] underline">Réinitialiser</button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#D9D7F0]">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F4FF]">
            <tr>
              {HEADERS.map(h => (
                <th key={h.label} className={`${h.align} ${TH} whitespace-nowrap`}>
                  {h.key
                    ? <button onClick={() => toggleSort(h.key as ProSortKey)} className="cursor-pointer select-none hover:text-[#1C1560] font-medium">{h.label}{arrow(h.key)}</button>
                    : <span className="font-medium">{h.label}</span>}
                  {h.help && (
                    <button onClick={() => setShowHelp(true)} aria-label={`Aide : ${h.label}`}
                      className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full bg-[#EEEDF9] text-[#9A97C0] hover:bg-indigo-100 hover:text-indigo-700 text-[10px] font-bold align-middle">?</button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => {
              const pres = PRESENCE[p.web_presence] ?? { label: p.web_presence, cls: 'bg-[#EEEDF9] text-[#3D3D6B]' };
              return (
                <tr key={p.business_name + i} className="hover:bg-[#FAFAFF] align-top">
                  <td className={`${TD} text-[#1C1560] font-medium`}>
                    {p.business_name}
                    {onPick && (
                      <button onClick={() => onPick(p.business_name)}
                        className="block mt-0.5 text-[11px] font-normal text-indigo-600 hover:text-indigo-800">→ Générer le site pour ce commerce</button>
                    )}
                  </td>
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
            {rows.length === 0 && <tr><td colSpan={8} className="px-3 py-6 text-center text-[#9A97C0]">Aucun prospect ne correspond aux filtres.</td></tr>}
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
function FinderPanel({ onNext }: { onNext: (niche: string, city: string, keywords?: string[]) => void }) {
  const [niche,    setNiche]    = useState('');
  const [city,     setCity]     = useState('');
  const [limit,    setLimit]    = useState(100);
  const [maxKd,    setMaxKd]    = useState(30);
  const [estimate, setEstimate] = useState(false);
  const [result,   setResult]   = useState<{ out: string; ok: boolean; data: FinderResult | null } | null>(null);
  const [selectedKws, setSelectedKws] = useState<string[]>([]);
  const [pending,  start]       = useTransition();

  const ready = niche.trim() !== '' && city.trim() !== '';

  function toggleKw(kw: string) {
    setSelectedKws(prev => prev.includes(kw) ? prev.filter(x => x !== kw) : [...prev, kw]);
  }

  function launch() {
    if (!ready) return;
    setResult(null);
    setSelectedKws([]);
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

      {result?.data && result.data.keywords.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap rounded-lg bg-emerald-50 border border-emerald-200 p-3">
          <button onClick={() => onNext(niche.trim(), city.trim(), selectedKws)}
            className="rounded-md bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm text-white font-medium transition-colors">
            Prochaine étape : bâtir le site →
          </button>
          <span className="text-xs text-[#3D6B4A]">
            {selectedKws.length > 0
              ? <>🎯 {selectedKws.length} mot(s)-clé cible(s) : <strong>{selectedKws.slice(0, 3).join(', ')}{selectedKws.length > 3 ? '…' : ''}</strong>. </>
              : '👉 Coche un ou plusieurs mots-clés à cibler. '}
            Puis génère le config du site (les clients, ce sera plus tard, une fois le site rangé).
          </span>
        </div>
      )}

      {result?.data && result.data.candidates.length > 0 && <DomainCard candidates={result.data.candidates} />}

      {result?.data
        ? <><KeywordTable result={result.data} selected={selectedKws} onToggle={toggleKw} /><RawLogs out={result.out} ok={result.ok} /></>
        : <Output out={result?.out ?? ''} ok={result?.ok ?? true} pending={pending} />}
    </div>
  );
}

// ── Prospector ──────────────────────────────────────────────────────────────────
function ProspectPanel({ initialNiche, initialCity, onNext }: { initialNiche?: string; initialCity?: string; onNext?: (name: string, city: string) => void }) {
  const [niche,      setNiche]      = useState(initialNiche ?? '');
  const [city,       setCity]       = useState(initialCity ?? '');
  const [limit,      setLimit]      = useState(60);
  const [minReviews, setMinReviews] = useState(0);
  const [simulate,   setSimulate]   = useState(false);
  const [judge,      setJudge]      = useState(false);
  const [result,     setResult]     = useState<{ out: string; ok: boolean; data: ProspectorResult | null } | null>(null);
  const [pending,    start]         = useTransition();

  const ready    = niche.trim() !== '' && city.trim() !== '';
  const estCost  = (Math.ceil(limit / 20) * 0.032 + limit * 0.017).toFixed(2);

  function launch() {
    if (!ready) return;
    setResult(null);
    start(async () => {
      const r = await runProspectorScan(niche.trim(), city.trim(), { limit, minReviews, simulate, judge });
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
        <label className="flex items-center gap-2 cursor-pointer mt-4" title="Claude ouvre les sites « a un site » et juge vieux/cassé">
          <input type="checkbox" checked={judge} onChange={e => setJudge(e.target.checked)}
            className="rounded border-[#D9D7F0] text-indigo-600" />
          <span className="text-sm text-[#3D3D6B]">🤖 Analyse IA des sites</span>
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
        ? <><ProspectTable result={result.data} onPick={onNext ? (name => onNext(name, city.trim())) : undefined} /><RawLogs out={result.out} ok={result.ok} /></>
        : <Output out={result?.out ?? ''} ok={result?.ok ?? true} pending={pending} />}
    </div>
  );
}

// ── GSC Submit ────────────────────────────────────────────────────────────────
// ── Générer le config ───────────────────────────────────────────────────────────
function GenPanel({ initialName, initialCity, initialKeywords, nicheSite }: { initialName?: string; initialCity?: string; initialKeywords?: string[]; nicheSite?: boolean }) {
  const [name,     setName]     = useState(initialName ?? '');
  const [city,     setCity]     = useState(initialCity ?? '');
  const [simulate, setSimulate] = useState(true);
  const [result,   setResult]   = useState<{ out: string; ok: boolean } | null>(null);
  const [pending,  start]       = useTransition();

  const keywords  = initialKeywords ?? [];
  const isNiche   = nicheSite ?? false;

  function launch() {
    setResult(null);
    start(async () => setResult(await runDemoGen(name, city, { simulate, keywords, nicheSite: isNiche })));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#6B6B9E]">
        Génère le <strong className="text-[#1C1560]">config du site</strong> (contenu rédigé par l'IA) pour un commerce.
        Le fichier est écrit dans <span className="mono">configs/</span> et sert ensuite au déploiement.
      </p>
      {keywords.length > 0 && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm">
          <span className="font-medium text-[#1C1560]">🎯 {keywords.length} mot(s)-clé cible(s)</span>
          <span className="text-[#6B6B9E]"> → une page de service par mot-clé : </span>
          <span className="text-[#3D3D6B]">{keywords.join(' · ')}</span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label block mb-1">{isNiche ? 'Niche' : 'Nom du commerce'}</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder={isNiche ? 'plombier' : 'SAM Plomberie'}
            className="w-full rounded-md bg-[#F5F4FF] border-[#D9D7F0] text-[#1C1560] text-sm px-3 py-1.5 placeholder-[#9A97C0] focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div>
          <label className="label block mb-1">Ville</label>
          <input value={city} onChange={e => setCity(e.target.value)} placeholder="Longueuil"
            className="w-full rounded-md bg-[#F5F4FF] border-[#D9D7F0] text-[#1C1560] text-sm px-3 py-1.5 placeholder-[#9A97C0] focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={simulate} onChange={e => setSimulate(e.target.checked)}
          className="rounded border-[#D9D7F0] text-indigo-600" />
        <span className="text-sm text-[#3D3D6B]">--simulate (contenu fictif, gratuit)</span>
      </label>
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={launch} disabled={pending}
          className="rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-sm text-white transition-colors">
          {pending ? 'Génération…' : simulate ? 'Générer (fictif, gratuit)' : 'Générer le config (IA)'}
        </button>
        <span className="text-xs text-[#9A97C0]">
          {simulate
            ? 'Mode fictif — gratuit (le contenu IA et les mots-clés ne s\'appliquent qu\'en mode réel).'
            : isNiche
              ? 'Contenu rédigé par Claude — ~$0.08. Site de niche générique (aucun prospect requis).'
              : 'Contenu rédigé par Claude — ~$0.08. Le commerce doit exister (scan Prospector au préalable).'}
        </span>
      </div>
      <Output out={result?.out ?? ''} ok={result?.ok ?? true} pending={pending} />
    </div>
  );
}

// ── Beau site (générateur design-first, style SiteDrop) ───────────────────────────
function GenBeauPanel() {
  const [name,        setName]        = useState('');
  const [industry,    setIndustry]    = useState('');
  const [description, setDescription] = useState('');
  const [details,     setDetails]     = useState('');
  const [result,      setResult]      = useState<{ html: string; ok: boolean; error?: string } | null>(null);
  const [pending,     start]          = useTransition();
  const [slug,        setSlug]        = useState('');
  const [pub,         setPub]         = useState<{ ok: boolean; url?: string; error?: string } | null>(null);
  const [pubPending,  startPub]       = useTransition();

  const ready  = name.trim() !== '' && industry.trim() !== '' && description.trim() !== '';
  const inCls  = 'w-full rounded-md bg-[#F5F4FF] border-[#D9D7F0] text-ink text-sm px-3 py-1.5 placeholder-[#9A97C0] focus:ring-indigo-500 focus:border-indigo-500';
  const mkSlug = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  function launch() {
    if (!ready) return;
    setResult(null); setPub(null);
    start(async () => {
      const brief = { businessName: name.trim(), industry: industry.trim(), description: description.trim(), details: details.trim() || undefined };
      const r = await generateBeautifulSite(brief);
      setResult(r);
      if (r.ok && !slug) setSlug(mkSlug(name));
    });
  }

  function publish() {
    if (!result?.html || !slug.trim()) return;
    setPub(null);
    startPub(async () => setPub(await publishBeautifulSite(slug, name.trim(), result.html)));
  }

  function download() {
    if (!result?.html) return;
    const blob = new Blob([result.html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `${name.trim().toLowerCase().replace(/\s+/g, '-') || 'site'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        Génère un <strong className="text-ink">beau site one-page</strong> (design libre, Claude Opus) — pour un client qui veut un site esthétique.
        ⚠️ Appel réel ~$0.22, ~1 minute.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label block mb-1">Nom du commerce</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Studio Lumière" className={inCls} />
        </div>
        <div>
          <label className="label block mb-1">Industrie</label>
          <input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="salon de coiffure" className={inCls} />
        </div>
      </div>
      <div>
        <label className="label block mb-1">Ce que fait le commerce</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
          placeholder="Coupe, coloration, soins capillaires haut de gamme à Brossard…" className={inCls} />
      </div>
      <div>
        <label className="label block mb-1">Préférences (optionnel)</label>
        <textarea value={details} onChange={e => setDetails(e.target.value)} rows={2}
          placeholder="Couleurs, ton, sections incontournables, coordonnées…" className={inCls} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={launch} disabled={!ready || pending} className="btn-brand">
          {pending ? 'Génération… (~1 min)' : 'Générer le beau site'}
        </button>
        <span className="text-xs text-[#9A97C0]">Design unique à chaque génération. Pas de SEO multi-pages (c'est l'autre mode).</span>
      </div>

      {pending && <Output out="" ok pending />}
      {result && !result.ok && <Output out={result.error ?? 'Erreur de génération.'} ok={false} pending={false} />}
      {result?.ok && result.html && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-ink">Aperçu</span>
            <button onClick={download} className="text-xs text-indigo-600 hover:underline">⬇ Télécharger le .html</button>
          </div>
          <iframe
            srcDoc={result.html}
            title="Aperçu du site"
            className="w-full h-[640px] rounded-lg border border-zinc-200 bg-white"
            sandbox="allow-scripts"
          />

          {/* Publier (hébergement multi-tenant à /s/<slug>) */}
          <div className="flex items-center gap-2 flex-wrap border-t border-zinc-200 pt-3">
            <span className="text-xs text-zinc-500 whitespace-nowrap">Publier à <span className="font-mono">/s/</span></span>
            <input value={slug} onChange={e => setSlug(mkSlug(e.target.value))} placeholder="studio-lumiere"
              className="rounded-md bg-[#F5F4FF] border-[#D9D7F0] text-ink text-sm px-2 py-1 w-48" />
            <button onClick={publish} disabled={pubPending || !slug.trim()} className="btn-brand py-1.5">
              {pubPending ? 'Publication…' : 'Publier'}
            </button>
            {pub?.ok && pub.url && (
              <a href={pub.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">
                ✓ en ligne → {pub.url}
              </a>
            )}
            {pub && !pub.ok && <span className="text-xs text-red-600">{pub.error}</span>}
          </div>
        </div>
      )}
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
  const [proPrefill, setProPrefill] = useState<{ niche: string; city: string }>({ niche: '', city: '' });
  const [genPrefill, setGenPrefill] = useState<{ name: string; city: string; keywords: string[]; nicheSite: boolean }>({ name: '', city: '', keywords: [], nicheSite: false });

  function goSubmit(siteId: string) { setSubmitSite(siteId); setTab('submit'); }
  function goRank(siteId: string)   { setRankSite(siteId);   setTab('rank'); }
  function goProspector(niche: string, city: string) { setProPrefill({ niche, city }); setTab('prospect'); }
  function goGenerate(name: string, city: string, keywords: string[] = [], nicheSite = false) { setGenPrefill({ name, city, keywords, nicheSite }); setTab('generate'); }

  return (
    <div className="space-y-3">
      {/* Tab selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
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
        {tab === 'finder'   && <FinderPanel onNext={(n, c, k) => goGenerate(n, c, k ?? [], true)} />}
        {tab === 'prospect' && <ProspectPanel key={`${proPrefill.niche}|${proPrefill.city}`} initialNiche={proPrefill.niche} initialCity={proPrefill.city} onNext={goGenerate} />}
        {tab === 'generate' && <GenPanel key={`${genPrefill.name}|${genPrefill.city}|${genPrefill.keywords.join(',')}|${genPrefill.nicheSite}`} initialName={genPrefill.name} initialCity={genPrefill.city} initialKeywords={genPrefill.keywords} nicheSite={genPrefill.nicheSite} />}
        {tab === 'beau'     && <GenBeauPanel />}
        {tab === 'submit'   && <SubmitPanel sites={sites} preselect={submitSite} onPreselect={setSubmitSite} />}
        {tab === 'rank'   && <RankPanel   sites={sites} preselect={rankSite}   onPreselect={setRankSite} />}
        {tab === 'cron'   && <CronPanel />}
      </div>
    </div>
  );
}
