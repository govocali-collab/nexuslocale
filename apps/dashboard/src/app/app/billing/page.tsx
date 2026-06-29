import { listInvoices, listSubscriptions } from '@/lib/billing-actions';
import { BillingTabs } from '@/components/billing/billing-tabs';

const fmtMoney = (n: number) => '$' + n.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ name?: string; email?: string }> }) {
  const [{ name, email }, invoices, subs] = await Promise.all([searchParams, listInvoices(), listSubscriptions()]);
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

      <BillingTabs invoices={invoices} subs={subs} prefillName={name} prefillEmail={email} />
    </div>
  );
}
