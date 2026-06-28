'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { sendInvoiceNow, type InvoiceRow } from '@/lib/billing-actions';

const fmtMoney = (n: number) => '$' + n.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate  = (unix: number) => new Date(unix * 1000).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });

function statusBadge(i: InvoiceRow): { label: string; cls: string } {
  if (i.status === 'paid')          return { label: 'Payée',         cls: 'bg-emerald-100 text-emerald-700' };
  if (i.status === 'void')          return { label: 'Annulée',       cls: 'bg-[#f5f5f5] text-[#a3a3a3]' };
  if (i.status === 'uncollectible') return { label: 'Irrécouvrable', cls: 'bg-red-100 text-red-700' };
  if (i.status === 'draft')         return { label: 'Brouillon',     cls: 'bg-[#f5f5f5] text-[#525252]' };
  if (i.needsSend)                  return { label: 'À envoyer',     cls: 'bg-amber-100 text-amber-700' };
  return { label: 'Envoyée', cls: 'bg-sky-100 text-sky-700' };
}

export function InvoicesTable({ invoices }: { invoices: InvoiceRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function send(id: string) {
    if (!confirm('Envoyer cette facture au client par courriel ?')) return;
    start(async () => { await sendInvoiceNow(id); router.refresh(); });
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-200">
        <p className="label">Historique des factures</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-[#fafafa]">
            <tr className="text-left">
              <th className="px-4 py-2.5 label">Numéro</th>
              <th className="px-3 py-2.5 label">Client</th>
              <th className="px-3 py-2.5 label text-right">Montant</th>
              <th className="px-3 py-2.5 label">Statut</th>
              <th className="px-3 py-2.5 label">Date</th>
              <th className="px-3 py-2.5 label text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f0]">
            {invoices.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#a3a3a3]">Aucune facture pour l&apos;instant.</td></tr>
            ) : invoices.map((i) => {
              const s = statusBadge(i);
              return (
                <tr key={i.id} className="hover:bg-[#fafafa]">
                  <td className="px-4 py-2.5 mono text-[#0a0a0a]">{i.number ?? '—'}</td>
                  <td className="px-3 py-2.5 text-[#404040]">
                    <div>{i.customerName ?? '—'}</div>
                    <div className="text-xs text-[#a3a3a3]">{i.customerEmail}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right mono text-[#0a0a0a]">{fmtMoney(i.amount)}</td>
                  <td className="px-3 py-2.5"><span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span></td>
                  <td className="px-3 py-2.5 text-[#525252]">{fmtDate(i.created)}</td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    {i.pdfUrl && <a href={i.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-xs">Aperçu</a>}
                    {i.needsSend && (
                      <button onClick={() => send(i.id)} disabled={pending}
                        className="ml-3 rounded bg-[#5701f3] hover:bg-[#4801cc] disabled:opacity-60 px-2.5 py-1 text-xs text-white">
                        Envoyer
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
