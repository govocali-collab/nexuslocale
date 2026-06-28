import { listInvoices, listSubscriptions } from '@/lib/billing-actions';
import { CreateInvoiceForm } from '@/components/billing/create-invoice-form';
import { Subscriptions } from '@/components/billing/subscriptions';

const STATUS: Record<string, { label: string; cls: string }> = {
  draft:         { label: 'Brouillon',     cls: 'bg-[#f5f5f5] text-[#525252]' },
  open:          { label: 'Envoyée',       cls: 'bg-amber-100 text-amber-700' },
  paid:          { label: 'Payée',         cls: 'bg-emerald-100 text-emerald-700' },
  void:          { label: 'Annulée',       cls: 'bg-[#f5f5f5] text-[#a3a3a3]' },
  uncollectible: { label: 'Irrécouvrable', cls: 'bg-red-100 text-red-700' },
};

const fmtMoney = (n: number) => '$' + n.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate  = (unix: number) => new Date(unix * 1000).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });

export default async function BillingPage() {
  const [invoices, subs] = await Promise.all([listInvoices(), listSubscriptions()]);
  const paid = invoices.filter((i) => i.status === 'paid').reduce((n, i) => n + i.amount, 0);
  const open = invoices.filter((i) => i.status === 'open').reduce((n, i) => n + i.amount, 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-[#0a0a0a]">Facturation</h1>
        <span className="text-xs rounded-md bg-amber-100 text-amber-700 px-2 py-1 font-medium">Mode test</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="label mb-1">Payé</p>
          <p className="text-2xl font-bold mono text-[#0a0a0a]">{fmtMoney(paid)}</p>
        </div>
        <div className="card p-4">
          <p className="label mb-1">En attente</p>
          <p className="text-2xl font-bold mono text-[#0a0a0a]">{fmtMoney(open)}</p>
        </div>
      </div>

      {/* ── Abonnements récurrents (hébergement / rank-and-rent) ─────────── */}
      <h2 className="text-base font-semibold text-[#0a0a0a] pt-1">Abonnements récurrents</h2>
      <Subscriptions subs={subs} />

      {/* ── Factures à l'unité (sites web, etc.) ─────────────────────────── */}
      <h2 className="text-base font-semibold text-[#0a0a0a] pt-2">Factures à l&apos;unité</h2>
      <CreateInvoiceForm />

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200">
          <p className="label">Historique des factures</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead className="bg-[#fafafa]">
              <tr className="text-left">
                <th className="px-4 py-2.5 label">Numéro</th>
                <th className="px-3 py-2.5 label">Client</th>
                <th className="px-3 py-2.5 label text-right">Montant</th>
                <th className="px-3 py-2.5 label">Statut</th>
                <th className="px-3 py-2.5 label">Date</th>
                <th className="px-3 py-2.5 label text-right">Liens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {invoices.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-[#a3a3a3]">Aucune facture pour l&apos;instant.</td></tr>
              ) : invoices.map((i) => {
                const s = STATUS[i.status ?? 'draft'] ?? STATUS.draft!;
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
                      {i.hostedUrl && <a href={i.hostedUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-xs">Voir</a>}
                      {i.pdfUrl && <a href={i.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-xs ml-3">PDF</a>}
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
