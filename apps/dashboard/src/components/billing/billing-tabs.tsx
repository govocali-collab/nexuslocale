'use client';

import { useState } from 'react';
import { CreateInvoiceForm } from './create-invoice-form';
import { Subscriptions } from './subscriptions';
import { InvoicesTable } from './invoices-table';
import type { InvoiceRow, SubRow } from '@/lib/billing-actions';

type TabId = 'unit' | 'recurring' | 'history';

export function BillingTabs({ invoices, subs, prefillName, prefillEmail }: { invoices: InvoiceRow[]; subs: SubRow[]; prefillName?: string | undefined; prefillEmail?: string | undefined }) {
  const [tab, setTab] = useState<TabId>('unit');

  const activeRecurring = subs.filter((s) => s.status === 'active' || s.status === 'trialing').length;

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'unit',      label: 'Factures à l\'unité' },
    { id: 'recurring', label: 'Montants récurrents', count: activeRecurring },
    { id: 'history',   label: 'Historique des factures', count: invoices.length },
  ];

  return (
    <div>
      <div className="flex gap-1 border-b border-neutral-200 mb-4 overflow-x-auto">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active ? 'border-[#5701f3] text-[#5701f3]' : 'border-transparent text-[#525252] hover:text-[#0a0a0a]'
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${active ? 'bg-indigo-100 text-indigo-700' : 'bg-[#f0f0f0] text-[#a3a3a3]'}`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === 'unit'      && <CreateInvoiceForm initialName={prefillName} initialEmail={prefillEmail} />}
      {tab === 'recurring' && <Subscriptions subs={subs} />}
      {tab === 'history'   && <InvoicesTable invoices={invoices} />}
    </div>
  );
}
