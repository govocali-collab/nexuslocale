'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSubscription, cancelSubscription, type SubRow } from '@/lib/billing-actions';

const inputCls =
  'w-full rounded-md bg-[#fafafa] border-[#e5e5e5] text-[#0a0a0a] text-sm ' +
  'placeholder-[#a3a3a3] px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500';

const SUB_STATUS: Record<string, { label: string; cls: string }> = {
  active:     { label: 'Actif',      cls: 'bg-emerald-100 text-emerald-700' },
  trialing:   { label: 'Essai',      cls: 'bg-sky-100 text-sky-700' },
  past_due:   { label: 'En retard',  cls: 'bg-red-100 text-red-700' },
  unpaid:     { label: 'Impayé',     cls: 'bg-red-100 text-red-700' },
  incomplete: { label: 'Incomplet',  cls: 'bg-amber-100 text-amber-700' },
  canceled:   { label: 'Annulé',     cls: 'bg-[#f5f5f5] text-[#a3a3a3]' },
};

const fmtMoney = (n: number) => '$' + n.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate  = (unix: number | null) => unix ? new Date(unix * 1000).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export function Subscriptions({ subs }: { subs: SubRow[] }) {
  const router = useRouter();
  const [name, setName]     = useState('');
  const [email, setEmail]   = useState('');
  const [amount, setAmount] = useState('');
  const [desc, setDesc]     = useState('Hébergement mensuel');
  const [pending, start]    = useTransition();
  const [err, setErr]       = useState('');
  const [sent, setSent]     = useState(false);

  function create(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setSent(false);
    start(async () => {
      const r = await createSubscription({ clientName: name, clientEmail: email, monthlyAmount: Number(amount), description: desc });
      if (!r.ok) { setErr(r.error ?? 'Erreur.'); return; }
      setSent(true);
      setName(''); setEmail(''); setAmount(''); setDesc('Hébergement mensuel');
      setTimeout(() => setSent(false), 6000);
      router.refresh();
    });
  }

  function cancel(id: string) {
    if (!confirm('Annuler cet abonnement ? Le client ne sera plus chargé.')) return;
    start(async () => { await cancelSubscription(id); router.refresh(); });
  }

  const mrr = subs.filter((s) => s.status === 'active' || s.status === 'trialing').reduce((n, s) => n + s.amount, 0);

  return (
    <div className="space-y-4">
      {/* Créer un abonnement */}
      <form onSubmit={create} className="card p-5 space-y-4">
        <p className="label">Nouvel abonnement (récurrent mensuel)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label block mb-1">Nom du client *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Plomberie Tremblay" />
          </div>
          <div>
            <label className="label block mb-1">Courriel du client *</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="client@commerce.com" />
          </div>
          <div>
            <label className="label block mb-1">Description</label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} className={inputCls} placeholder="Hébergement mensuel" />
          </div>
          <div>
            <label className="label block mb-1">Montant ($/mois) *</label>
            <input required type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} placeholder="97.00" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          {sent
            ? <span className="text-sm text-emerald-700 font-medium">✓ Abonnement créé — première facture envoyée au client par courriel.</span>
            : <span className="text-xs text-[#a3a3a3]">Stripe envoie une facture chaque mois, automatiquement.</span>}
          <button type="submit" disabled={pending} className="rounded-md bg-[#5701f3] hover:bg-[#4801cc] disabled:opacity-70 px-5 py-2 text-sm font-medium text-white whitespace-nowrap">
            {pending ? '…' : 'Créer et envoyer'}
          </button>
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
      </form>

      {/* Liste des abonnements */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
          <p className="label">Abonnements actifs</p>
          <p className="text-xs text-[#525252]">MRR : <span className="font-bold text-[#0a0a0a]">{fmtMoney(mrr)}</span>/mois</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[620px]">
            <thead className="bg-[#fafafa]">
              <tr className="text-left">
                <th className="px-4 py-2.5 label">Client</th>
                <th className="px-3 py-2.5 label text-right">$/mois</th>
                <th className="px-3 py-2.5 label">Statut</th>
                <th className="px-3 py-2.5 label">Prochain prélèvement</th>
                <th className="px-3 py-2.5 label text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {subs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[#a3a3a3]">Aucun abonnement pour l&apos;instant.</td></tr>
              ) : subs.map((s) => {
                const st = SUB_STATUS[s.status] ?? { label: s.status, cls: 'bg-[#f5f5f5] text-[#525252]' };
                const cancellable = s.status === 'active' || s.status === 'trialing' || s.status === 'past_due';
                return (
                  <tr key={s.id} className="hover:bg-[#fafafa]">
                    <td className="px-4 py-2.5 text-[#404040]">
                      <div>{s.customerName ?? '—'}</div>
                      <div className="text-xs text-[#a3a3a3]">{s.customerEmail}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right mono text-[#0a0a0a]">{fmtMoney(s.amount)}</td>
                    <td className="px-3 py-2.5"><span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span></td>
                    <td className="px-3 py-2.5 text-[#525252]">{s.cancelAtEnd ? 'Annulé en fin de période' : fmtDate(s.periodEnd)}</td>
                    <td className="px-3 py-2.5 text-right">
                      {cancellable && <button onClick={() => cancel(s.id)} disabled={pending} className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50">Annuler</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
