'use client';

import { useState, useEffect, useTransition } from 'react';
import type { Prospect } from '@/lib/queries';
import { updateProspect } from '@/lib/actions';
import { PIPELINE_STATUSES, PIPELINE_LABELS } from '@/lib/pipeline';
import { sellingArguments } from '@/lib/selling-points';
import { callProspect } from '@/lib/call-actions';
import { saveCallScript, DEFAULT_CALL_SCRIPT } from '@/lib/settings-actions';

// Remplace les variables du script par les infos du prospect.
function renderScript(tpl: string, p: Prospect): string {
  return tpl
    .replaceAll('{entreprise}', p.business_name)
    .replaceAll('{ville}', p.city)
    .replaceAll('{niche}', p.niche);
}

// Étapes = source unique partagée (cf. @/lib/pipeline) → reste synchro avec le kanban.
const STATUSES = PIPELINE_STATUSES;
const STATUS_LABELS = PIPELINE_LABELS;

interface Props {
  prospect: Prospect | null;
  onClose: () => void;
  onSaved: (updated: Partial<Prospect> & { id: string }) => void;
  initialScript?: string | undefined;
}

export function ProspectPanel({ prospect, onClose, onSaved, initialScript }: Props) {
  // Script global partagé : modifié une fois → change dans toutes les fiches.
  const [script,        setScript]        = useState(initialScript ?? DEFAULT_CALL_SCRIPT);
  const [scriptEditing, setScriptEditing] = useState(false);
  const [scriptDraft,   setScriptDraft]   = useState('');
  const [scriptSaved,   setScriptSaved]   = useState(false);
  const [scriptErr,     setScriptErr]     = useState('');
  const [scriptSaving,  startScriptSave]  = useTransition();
  const [notes,    setNotes]    = useState('');
  const [phone,    setPhone]    = useState('');
  const [email,    setEmail]    = useState('');
  const [demoUrl,  setDemoUrl]  = useState('');
  const [status,   setStatus]   = useState('');
  const [saleValue,    setSaleValue]    = useState('');
  const [monthlyValue, setMonthlyValue] = useState('');
  const [errMsg,   setErrMsg]   = useState('');
  const [saved,    setSaved]    = useState(false);
  const [copied,   setCopied]   = useState(false);
  const [callMsg,  setCallMsg]  = useState('');
  const [isPending, startTransition] = useTransition();
  const [calling,   startCall]       = useTransition();

  useEffect(() => {
    if (!prospect) return;
    setNotes(prospect.notes    ?? '');
    setPhone(prospect.phone    ?? '');
    setEmail(prospect.email    ?? '');
    setDemoUrl(prospect.demo_url ?? '');
    setStatus(prospect.status);
    setSaleValue(prospect.sale_value    != null ? String(prospect.sale_value)    : '');
    setMonthlyValue(prospect.monthly_value != null ? String(prospect.monthly_value) : '');
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
      const saleNum    = saleValue.trim()    === '' ? null : Number(saleValue);
      const monthlyNum = monthlyValue.trim() === '' ? null : Number(monthlyValue);
      const result = await updateProspect(prospect.id, {
        notes:    notes    || null as unknown as string,
        phone:    phone    || null as unknown as string,
        demo_url: demoUrl  || null as unknown as string,
        status,
        email:         email.trim() || null,
        sale_value:    saleNum,
        monthly_value: monthlyNum,
      });
      if (result.error) {
        setErrMsg(result.error);
        return;
      }
      onSaved({ id: prospect.id, notes, phone, demo_url: demoUrl, status, email: email.trim() || null, sale_value: saleNum, monthly_value: monthlyNum });
      onClose();
    });
  }

  if (!prospect) return null;

  const args = sellingArguments(prospect);

  // Lien de réservation Cal.com pré-rempli avec le prospect (à ouvrir ou à lui envoyer).
  const calLink = process.env.NEXT_PUBLIC_CAL_LINK ?? '';
  const bookingUrl = calLink
    ? `https://cal.com/${calLink}?name=${encodeURIComponent(prospect.business_name)}${email.trim() ? `&email=${encodeURIComponent(email.trim())}` : ''}`
    : '';
  // Lien vers la facturation, pré-rempli avec ce client.
  const billingUrl = `/app/billing?name=${encodeURIComponent(prospect.business_name)}${email.trim() ? `&email=${encodeURIComponent(email.trim())}` : ''}`;
  function copyBooking() {
    if (!bookingUrl) return;
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function call() {
    if (!phone.trim()) return;
    setCallMsg('');
    startCall(async () => {
      const r = await callProspect(phone.trim());
      setCallMsg(r.ok ? '📞 Ton cellulaire va sonner — réponds pour être connecté au prospect.' : (r.error ?? 'Échec de l’appel.'));
      setTimeout(() => setCallMsg(''), 6000);
    });
  }

  function saveScript() {
    setScriptErr('');
    startScriptSave(async () => {
      const r = await saveCallScript(scriptDraft);
      if (r.ok) {
        setScript(scriptDraft);
        setScriptEditing(false);
        setScriptSaved(true);
        setTimeout(() => setScriptSaved(false), 2500);
      } else {
        setScriptErr(r.error ?? 'Échec de la sauvegarde.');
      }
    });
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      <aside className="fixed right-0 top-0 h-screen w-[36rem] max-w-[94%] bg-white border-l border-[#e5e5e5]
                        shadow-xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#e5e5e5] bg-[#fafafa]">
          <div className="min-w-0">
            <h2 className="font-semibold text-[#0a0a0a] text-base truncate">{prospect.business_name}</h2>
            <p className="text-xs text-[#a3a3a3] mt-0.5">
              {prospect.niche} · {prospect.city}
              {prospect.rating != null && <span className="text-amber-600"> · ⭐ {prospect.rating} ({prospect.review_count ?? 0})</span>}
            </p>
          </div>
          <button onClick={onClose} className="ml-3 shrink-0 text-[#a3a3a3] hover:text-[#0a0a0a] text-lg leading-none">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* ═══ 1 · Actions rapides ═══ */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={call} disabled={!phone.trim() || calling}
                className="rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-3 py-1.5 text-sm font-medium text-white">
                {calling ? '…' : '📞 Appeler'}
              </button>
              {bookingUrl && (
                <a href={bookingUrl} target="_blank" rel="noopener noreferrer"
                  className="rounded-md bg-[#5701f3] hover:bg-[#4801cc] px-3 py-1.5 text-sm font-medium text-white">
                  📅 Réserver démo
                </a>
              )}
              {bookingUrl && (
                <button type="button" onClick={copyBooking}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-[#404040] hover:bg-[#f5f5f5]">
                  {copied ? 'Lien copié ✓' : 'Copier lien démo'}
                </button>
              )}
              {prospect.website && (
                <a href={prospect.website.startsWith('http') ? prospect.website : `https://${prospect.website}`} target="_blank" rel="noopener noreferrer"
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-[#404040] hover:bg-[#f5f5f5]">
                  🌐 Voir le site
                </a>
              )}
              <a href={billingUrl}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-[#404040] hover:bg-[#f5f5f5]">
                🧾 Facturer
              </a>
            </div>
            {callMsg && <p className="text-xs text-[#525252]">{callMsg}</p>}
          </div>

          {/* ═══ 2 · Arguments de vente ═══ */}
          {args.length > 0 && (
            <div className="space-y-2 rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
              <p className="label text-indigo-700">💡 Arguments de vente</p>
              <ul className="space-y-2">
                {args.map((a, i) => (
                  <li key={i} className="flex gap-2 text-sm text-[#404040] leading-snug">
                    <span className="shrink-0">{a.icon}</span>
                    <span>{a.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ═══ Script d'appel (global, éditable) ═══ */}
          <details className="rounded-lg border border-[#e5e5e5] group">
            <summary className="px-3 py-2 cursor-pointer select-none list-none flex items-center justify-between text-sm font-medium text-[#0a0a0a]">
              📜 Script d&apos;appel <span className="text-[#d4d4d4] group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="px-3 pb-3 space-y-2">
              {scriptEditing ? (
                <>
                  <textarea value={scriptDraft} onChange={e => setScriptDraft(e.target.value)} rows={14}
                    className="w-full rounded-md bg-[#fafafa] border-[#e5e5e5] text-[#0a0a0a] text-xs px-3 py-2 leading-relaxed focus:ring-indigo-500 focus:border-indigo-500" />
                  <p className="text-[11px] text-[#a3a3a3]">Variables : <span className="mono">{'{entreprise}'}</span> · <span className="mono">{'{ville}'}</span> · <span className="mono">{'{niche}'}</span> — remplacées dans chaque fiche.</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button type="button" onClick={saveScript} disabled={scriptSaving}
                      className="rounded-md bg-[#5701f3] hover:bg-[#4801cc] disabled:opacity-70 px-3 py-1.5 text-sm font-medium text-white">
                      {scriptSaving ? '…' : 'Sauvegarder (toutes les fiches)'}
                    </button>
                    <button type="button" onClick={() => setScriptEditing(false)} className="text-xs text-[#525252] hover:text-[#0a0a0a]">Annuler</button>
                    {scriptSaved && <span className="text-xs text-emerald-600 font-medium">✓ Sauvegardé</span>}
                    {scriptErr && <span className="text-xs text-red-600">{scriptErr}</span>}
                  </div>
                </>
              ) : (
                <>
                  <div className="whitespace-pre-wrap text-sm text-[#404040] leading-relaxed">{renderScript(script, prospect)}</div>
                  <button type="button" onClick={() => { setScriptDraft(script); setScriptEditing(true); }}
                    className="text-xs text-indigo-600 hover:text-indigo-800">✏️ Éditer le script</button>
                </>
              )}
            </div>
          </details>

          {/* ═══ 3 · Suivi ═══ */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#a3a3a3] border-b border-[#f0f0f0] pb-1.5">Suivi</p>

            <div className="space-y-1.5">
              <label className="label">Statut</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full rounded-md bg-[#fafafa] border-[#e5e5e5] text-[#0a0a0a] text-sm py-1.5">
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="label">Téléphone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+15145550000"
                  className="w-full rounded-md bg-[#fafafa] border-[#e5e5e5] text-[#0a0a0a] text-sm placeholder-[#a3a3a3] px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div className="space-y-1.5">
                <label className="label">Courriel</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="prospect@commerce.com"
                  className="w-full rounded-md bg-[#fafafa] border-[#e5e5e5] text-[#0a0a0a] text-sm placeholder-[#a3a3a3] px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="label">URL de démo (site bâti pour lui)</label>
              <input type="url" value={demoUrl} onChange={e => setDemoUrl(e.target.value)} placeholder="https://…"
                className="w-full rounded-md bg-[#fafafa] border-[#e5e5e5] text-[#0a0a0a] text-sm placeholder-[#a3a3a3] px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>

            <div className="space-y-1.5">
              <label className="label">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={5}
                placeholder="Intéressé par le SEO local… rappeler jeudi… budget ~300$/mois…"
                className="w-full rounded-md bg-[#fafafa] border-[#e5e5e5] text-[#0a0a0a] text-sm placeholder-[#a3a3a3] px-3 py-2 resize-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
          </div>

          {/* ═══ 4 · Valeur du deal ═══ */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#a3a3a3] border-b border-[#f0f0f0] pb-1.5">Valeur du deal</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input type="number" min={0} step="1" value={saleValue} onChange={e => setSaleValue(e.target.value)} placeholder="Vente unique"
                  className="w-full rounded-md bg-[#fafafa] border-[#e5e5e5] text-[#0a0a0a] text-sm placeholder-[#a3a3a3] px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500" />
                <p className="text-[11px] text-[#a3a3a3] mt-1">💻 Site vendu (unique)</p>
              </div>
              <div>
                <input type="number" min={0} step="1" value={monthlyValue} onChange={e => setMonthlyValue(e.target.value)} placeholder="Mensuel"
                  className="w-full rounded-md bg-[#fafafa] border-[#e5e5e5] text-[#0a0a0a] text-sm placeholder-[#a3a3a3] px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500" />
                <p className="text-[11px] text-[#a3a3a3] mt-1">🔁 Hébergement ($/mois)</p>
              </div>
            </div>
            <p className="text-[11px] text-[#a3a3a3]">Compté dans la vue d&apos;ensemble quand le statut est « Gagné ».</p>
          </div>

          {/* ═══ 5 · Détails (lecture seule) ═══ */}
          <details className="group">
            <summary className="text-[11px] font-semibold uppercase tracking-wide text-[#a3a3a3] cursor-pointer select-none border-b border-[#f0f0f0] pb-1.5 list-none flex items-center justify-between">
              Détails <span className="text-[#d4d4d4] group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <dl className="space-y-1.5 text-sm pt-2">
              {[
                ['Score',        prospect.prospect_score != null ? Math.round(prospect.prospect_score) : '—'],
                ['Douleur',      prospect.pain_score ?? '—'],
                ['Présence web', prospect.web_presence],
                ['Ajouté le',    new Date(prospect.created_at).toLocaleDateString('fr-CA')],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between">
                  <dt className="text-[#a3a3a3]">{k}</dt>
                  <dd className="text-[#0a0a0a] font-medium mono text-xs">{String(v)}</dd>
                </div>
              ))}
            </dl>
          </details>

          {errMsg && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              Erreur : {errMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pt-3 pb-6 border-t border-[#e5e5e5] flex items-center gap-3">
          <button onClick={handleSave} disabled={isPending}
            className="flex-1 rounded-md bg-[#5701f3] hover:bg-[#4801cc] disabled:opacity-70
                       px-4 py-2 text-sm font-medium text-white transition-colors">
            {isPending ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
          {saved && <span className="text-xs text-emerald-600 font-medium shrink-0">✓ Sauvegardé</span>}
        </div>
      </aside>
    </>
  );
}
