'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createInvoice, sendInvoiceNow, type InvoiceLine } from '@/lib/billing-actions';

const inputCls =
  'w-full rounded-md bg-[#fafafa] border-[#e5e5e5] text-[#0a0a0a] text-sm ' +
  'placeholder-[#a3a3a3] px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500';

const fmt = (n: number) => '$' + n.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Done = { number?: string | undefined; pdfUrl?: string | undefined; hostedUrl?: string | undefined; invoiceId?: string | undefined };

export function CreateInvoiceForm() {
  const router = useRouter();
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [memo, setMemo]   = useState('');
  const [lines, setLines] = useState<{ description: string; amount: string; detail: string }[]>([{ description: '', amount: '', detail: '' }]);
  const [pending, start]  = useTransition();
  const [sending, startSend] = useTransition();
  const [err, setErr]     = useState('');
  const [done, setDone]   = useState<Done | null>(null);
  const [sent, setSent]   = useState(false);

  const total = lines.reduce((n, l) => n + (Number(l.amount) || 0), 0);

  function setLine(i: number, k: 'description' | 'amount' | 'detail', v: string) {
    setLines((p) => p.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
  }
  const addLine = () => setLines((p) => [...p, { description: '', amount: '', detail: '' }]);
  const rmLine  = (i: number) => setLines((p) => (p.length > 1 ? p.filter((_, j) => j !== i) : p));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setDone(null); setSent(false);
    const payloadLines: InvoiceLine[] = lines.map((l) => ({ description: l.description, amount: Number(l.amount), detail: l.detail }));
    start(async () => {
      const r = await createInvoice({ clientName: name, clientEmail: email, lines: payloadLines, memo });
      if (!r.ok) { setErr(r.error ?? 'Erreur.'); return; }
      setDone({ number: r.number, pdfUrl: r.pdfUrl, hostedUrl: r.hostedUrl, invoiceId: r.invoiceId });
      setName(''); setEmail(''); setMemo(''); setLines([{ description: '', amount: '', detail: '' }]);
      router.refresh();
    });
  }

  function sendIt() {
    if (!done?.invoiceId) return;
    startSend(async () => {
      const r = await sendInvoiceNow(done.invoiceId!);
      if (r.ok) { setSent(true); router.refresh(); }
      else setErr(r.error ?? 'Échec de l\'envoi.');
    });
  }

  if (done) {
    return (
      <div className="card p-6 text-center">
        <div className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-[#5701f3] text-white text-xl">{sent ? '✓' : '👁'}</div>
        <h3 className="font-bold text-[#0a0a0a]">
          {sent ? `Facture ${done.number ?? ''} envoyée au client` : `Facture ${done.number ?? ''} créée — pas encore envoyée`}
        </h3>
        <p className="mt-1 text-sm text-[#525252]">
          {sent ? 'Le client a reçu la facture par courriel.' : 'Prévisualise-la, puis envoie-la au client quand tu es prêt.'}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {done.pdfUrl && <a href={done.pdfUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-[#404040] hover:bg-[#f5f5f5]">Aperçu (PDF)</a>}
          {!sent && <button onClick={sendIt} disabled={sending} className="rounded-md bg-[#5701f3] hover:bg-[#4801cc] disabled:opacity-70 px-4 py-2 text-sm font-medium text-white">{sending ? 'Envoi…' : 'Envoyer au client'}</button>}
          <button onClick={() => { setDone(null); setSent(false); }} className="rounded-md px-4 py-2 text-sm text-[#525252] hover:bg-[#f5f5f5]">Nouvelle facture</button>
        </div>
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-5 space-y-4">
      <p className="label">Nouvelle facture</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label block mb-1">Nom du client *</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Plomberie Tremblay" />
        </div>
        <div>
          <label className="label block mb-1">Courriel du client *</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="client@commerce.com" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="label block">Lignes</label>
        {lines.map((l, i) => (
          <div key={i} className="rounded-md border border-[#f0f0f0] p-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <input value={l.description} onChange={(e) => setLine(i, 'description', e.target.value)} className={`${inputCls} flex-1`} placeholder="Site web" />
              <div className="relative w-32">
                <span className="absolute left-3 top-2 text-sm text-[#a3a3a3]">$</span>
                <input type="number" min={0} step="0.01" value={l.amount} onChange={(e) => setLine(i, 'amount', e.target.value)} className={`${inputCls} pl-6`} placeholder="0.00" />
              </div>
              <button type="button" onClick={() => rmLine(i)} className="text-[#a3a3a3] hover:text-red-600 px-1" aria-label="Retirer">✕</button>
            </div>
            <input value={l.detail} onChange={(e) => setLine(i, 'detail', e.target.value)}
              className="w-full rounded-md bg-[#fafafa] border-[#e5e5e5] text-xs font-normal text-[#525252] placeholder-[#a3a3a3] px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Description détaillée (optionnel) — ex. Refonte 5 pages, optimisé SEO" />
          </div>
        ))}
        <button type="button" onClick={addLine} className="text-xs text-indigo-600 hover:text-indigo-800">+ Ajouter une ligne</button>
      </div>

      <div>
        <label className="label block mb-1">Note (optionnel)</label>
        <input value={memo} onChange={(e) => setMemo(e.target.value)} className={inputCls} placeholder="Merci de votre confiance." />
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-sm text-[#525252]">Total : <span className="font-bold text-[#0a0a0a]">{fmt(total)}</span> CAD</span>
        <button type="submit" disabled={pending} className="rounded-md bg-[#5701f3] hover:bg-[#4801cc] disabled:opacity-70 px-5 py-2 text-sm font-medium text-white">
          {pending ? '…' : 'Créer la facture'}
        </button>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}
    </form>
  );
}
