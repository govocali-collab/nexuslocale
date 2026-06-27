'use client';

import { useState, useEffect, useTransition } from 'react';
import type { Prospect } from '@/lib/queries';
import { updateProspect } from '@/lib/actions';

const STATUSES = ['new', 'demo_sent', 'negotiating', 'won', 'lost'];
const STATUS_LABELS: Record<string, string> = {
  new: 'Nouveau', demo_sent: 'Démo envoyée',
  negotiating: 'Négociation', won: 'Gagné', lost: 'Perdu',
};

interface Props {
  prospect: Prospect | null;
  onClose: () => void;
  onSaved: (updated: Partial<Prospect> & { id: string }) => void;
}

export function ProspectPanel({ prospect, onClose, onSaved }: Props) {
  const [notes,    setNotes]    = useState('');
  const [phone,    setPhone]    = useState('');
  const [demoUrl,  setDemoUrl]  = useState('');
  const [status,   setStatus]   = useState('');
  const [errMsg,   setErrMsg]   = useState('');
  const [saved,    setSaved]    = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!prospect) return;
    setNotes(prospect.notes    ?? '');
    setPhone(prospect.phone    ?? '');
    setDemoUrl(prospect.demo_url ?? '');
    setStatus(prospect.status);
    setSaved(false);
    setErrMsg('');
  }, [prospect?.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleSave() {
    if (!prospect) return;
    setErrMsg('');
    startTransition(async () => {
      const result = await updateProspect(prospect.id, {
        notes:    notes    || null as unknown as string,
        phone:    phone    || null as unknown as string,
        demo_url: demoUrl  || null as unknown as string,
        status,
      });
      if (result.error) {
        setErrMsg(result.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onSaved({ id: prospect.id, notes, phone, demo_url: demoUrl, status });
    });
  }

  if (!prospect) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      <aside className="fixed right-0 top-0 h-full w-96 max-w-[88%] bg-white border-l border-[#e5e5e5]
                        shadow-xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#e5e5e5] bg-[#fafafa]">
          <div className="min-w-0">
            <h2 className="font-semibold text-[#0a0a0a] truncate">{prospect.business_name}</h2>
            <p className="text-xs text-[#a3a3a3] mt-0.5">{prospect.niche} · {prospect.city}</p>
          </div>
          <button onClick={onClose} className="ml-3 shrink-0 text-[#a3a3a3] hover:text-[#0a0a0a] text-lg leading-none">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Infos lecture seule */}
          <div className="space-y-2">
            <p className="label">Informations</p>
            <dl className="space-y-1.5 text-sm">
              {[
                ['Score',       prospect.prospect_score != null ? Math.round(prospect.prospect_score) : '—'],
                ['Douleur',     prospect.pain_score     ?? '—'],
                ['Google',      prospect.rating != null ? `${prospect.rating} ⭐ (${prospect.review_count ?? 0})` : '—'],
                ['Web',         prospect.web_presence],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between">
                  <dt className="text-[#a3a3a3]">{k}</dt>
                  <dd className="text-[#0a0a0a] font-medium mono text-xs">{String(v)}</dd>
                </div>
              ))}
              {prospect.website && (
                <div className="flex justify-between">
                  <dt className="text-[#a3a3a3]">Site actuel</dt>
                  <dd>
                    <a href={prospect.website} target="_blank" rel="noopener noreferrer"
                       className="text-xs text-indigo-600 hover:text-indigo-800 mono">↗ visiter</a>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Statut */}
          <div className="space-y-1.5">
            <label className="label">Statut</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full rounded-md bg-[#fafafa] border-[#e5e5e5] text-[#0a0a0a] text-sm py-1.5">
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>

          {/* Téléphone */}
          <div className="space-y-1.5">
            <label className="label">Téléphone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+15145550000"
              className="w-full rounded-md bg-[#fafafa] border-[#e5e5e5] text-[#0a0a0a] text-sm
                         placeholder-[#a3a3a3] px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>

          {/* Démo URL */}
          <div className="space-y-1.5">
            <label className="label">URL de démo</label>
            <input type="url" value={demoUrl} onChange={e => setDemoUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-md bg-[#fafafa] border-[#e5e5e5] text-[#0a0a0a] text-sm
                         placeholder-[#a3a3a3] px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="label">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={7}
              placeholder="Intéressé par le SEO local… rappeler jeudi… budget ~300$/mois…"
              className="w-full rounded-md bg-[#fafafa] border-[#e5e5e5] text-[#0a0a0a] text-sm
                         placeholder-[#a3a3a3] px-3 py-2 resize-none
                         focus:ring-indigo-500 focus:border-indigo-500" />
          </div>

          {errMsg && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              Erreur : {errMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#e5e5e5] flex items-center gap-3">
          <button onClick={handleSave} disabled={isPending}
            className="flex-1 rounded-md bg-[#5701f3] hover:bg-[#4801cc] disabled:opacity-90
                       px-4 py-2 text-sm font-medium text-white transition-colors">
            {isPending ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
          {saved && <span className="text-xs text-emerald-600 font-medium shrink-0">✓ Sauvegardé</span>}
        </div>
      </aside>
    </>
  );
}
