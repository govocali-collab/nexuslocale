'use server';

import { stripe, dollarsToCents, centsToDollars } from './stripe';

export interface InvoiceLine { description: string; amount: number } // amount en dollars

export async function createInvoice(input: {
  clientName: string; clientEmail: string; lines: InvoiceLine[]; memo?: string; send?: boolean;
}): Promise<{ ok: boolean; error?: string | undefined; url?: string | undefined; number?: string | undefined; sent?: boolean }> {
  const name  = input.clientName.trim();
  const email = input.clientEmail.trim();
  const lines = input.lines.filter((l) => l.description.trim() && Number(l.amount) > 0);
  if (!name || !email) return { ok: false, error: 'Nom et courriel du client requis.' };
  if (lines.length === 0) return { ok: false, error: 'Ajoutez au moins une ligne avec un montant > 0.' };

  try {
    // Réutilise le client Stripe s'il existe (par courriel), sinon le crée.
    const existing = await stripe.customers.list({ email, limit: 1 });
    const customer = existing.data[0] ?? (await stripe.customers.create({ name, email }));

    // Facture brouillon
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: 'send_invoice',
      days_until_due: 30,
      currency: 'cad',
      auto_advance: false,
      ...(input.memo?.trim() ? { description: input.memo.trim() } : {}),
    });
    const invoiceId = invoice.id as string;

    // Lignes attachées à CETTE facture
    for (const l of lines) {
      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoiceId,
        amount: dollarsToCents(Number(l.amount)),
        currency: 'cad',
        description: l.description.trim(),
      });
    }

    // Brouillon : on s'arrête ici (rien d'envoyé, modifiable/supprimable dans Stripe).
    if (!input.send) {
      return { ok: true, sent: false, number: invoice.number ?? undefined, url: undefined };
    }
    // Sinon : on finalise et on envoie le courriel au client.
    const finalized = await stripe.invoices.finalizeInvoice(invoiceId);
    await stripe.invoices.sendInvoice(invoiceId);
    return { ok: true, sent: true, url: finalized.hosted_invoice_url ?? undefined, number: finalized.number ?? undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur Stripe.' };
  }
}

const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://app.nexuslocale.com';

// Crée une session Checkout en mode abonnement → renvoie un lien que le client ouvre
// pour entrer sa carte ; Stripe le charge ensuite automatiquement chaque mois.
export async function createSubscriptionCheckout(input: {
  clientName: string; clientEmail: string; monthlyAmount: number; description: string;
}): Promise<{ ok: boolean; error?: string | undefined; url?: string | undefined }> {
  const name   = input.clientName.trim();
  const email  = input.clientEmail.trim();
  const amount = Number(input.monthlyAmount);
  const desc   = input.description.trim() || 'Abonnement mensuel';
  if (!name || !email) return { ok: false, error: 'Nom et courriel du client requis.' };
  if (!(amount > 0))   return { ok: false, error: 'Montant mensuel (> 0) requis.' };
  try {
    const existing = await stripe.customers.list({ email, limit: 1 });
    const customer = existing.data[0] ?? (await stripe.customers.create({ name, email }));
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: { name: desc },
          unit_amount: dollarsToCents(amount),
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      success_url: `${APP_URL}/app/billing?sub=ok`,
      cancel_url:  `${APP_URL}/app/billing?sub=annule`,
    });
    return { ok: true, url: session.url ?? undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur Stripe.' };
  }
}

export interface SubRow {
  id: string; customerName: string | null; customerEmail: string | null;
  amount: number; status: string; periodEnd: number | null; cancelAtEnd: boolean;
}

export async function listSubscriptions(): Promise<SubRow[]> {
  try {
    const res = await stripe.subscriptions.list({ status: 'all', limit: 50, expand: ['data.customer'] });
    return res.data.map((s) => {
      const cust = s.customer as { name?: string | null; email?: string | null } | string;
      const item = s.items.data[0];
      return {
        id:            s.id,
        customerName:  typeof cust === 'object' ? (cust.name ?? null) : null,
        customerEmail: typeof cust === 'object' ? (cust.email ?? null) : null,
        amount:        centsToDollars(item?.price.unit_amount ?? 0),
        status:        s.status,
        periodEnd:     (s as unknown as { current_period_end?: number }).current_period_end ?? null,
        cancelAtEnd:   s.cancel_at_period_end,
      };
    });
  } catch {
    return [];
  }
}

export async function cancelSubscription(id: string): Promise<{ ok: boolean; error?: string | undefined }> {
  try {
    await stripe.subscriptions.cancel(id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur Stripe.' };
  }
}

export interface InvoiceRow {
  id: string;
  number: string | null;
  customerName: string | null;
  customerEmail: string | null;
  amount: number;
  status: string | null;
  created: number;
  hostedUrl: string | null;
  pdfUrl: string | null;
}

export async function listInvoices(): Promise<InvoiceRow[]> {
  try {
    const res = await stripe.invoices.list({ limit: 50 });
    return res.data.map((i) => ({
      id:            i.id as string,
      number:        i.number ?? null,
      customerName:  i.customer_name ?? null,
      customerEmail: i.customer_email ?? null,
      amount:        centsToDollars(i.total ?? 0),
      status:        i.status ?? null,
      created:       i.created,
      hostedUrl:     i.hosted_invoice_url ?? null,
      pdfUrl:        i.invoice_pdf ?? null,
    }));
  } catch {
    return [];
  }
}
