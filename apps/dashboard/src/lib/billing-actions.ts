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

// Crée un abonnement mensuel en mode « facture envoyée » : Stripe finalise et
// ENVOIE une vraie facture par courriel au client chaque mois (ton branding, INV-),
// payable via la page Stripe — et ça se répète automatiquement.
export async function createSubscription(input: {
  clientName: string; clientEmail: string; monthlyAmount: number; description: string;
}): Promise<{ ok: boolean; error?: string | undefined }> {
  const name   = input.clientName.trim();
  const email  = input.clientEmail.trim();
  const amount = Number(input.monthlyAmount);
  const desc   = input.description.trim() || 'Abonnement mensuel';
  if (!name || !email) return { ok: false, error: 'Nom et courriel du client requis.' };
  if (!(amount > 0))   return { ok: false, error: 'Montant mensuel (> 0) requis.' };
  try {
    const existing = await stripe.customers.list({ email, limit: 1 });
    const customer = existing.data[0] ?? (await stripe.customers.create({ name, email }));
    const product  = await stripe.products.create({ name: desc });
    const sub = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price_data: {
        currency: 'cad',
        product: product.id,
        unit_amount: dollarsToCents(amount),
        recurring: { interval: 'month' },
      } }],
      collection_method: 'send_invoice',
      days_until_due: 14,
      expand: ['latest_invoice'],
    });
    // Envoie la 1re facture tout de suite (sinon Stripe attendrait ~1h).
    // Les factures des mois suivants sont finalisées + envoyées par Stripe automatiquement.
    const inv = sub.latest_invoice;
    if (inv && typeof inv !== 'string' && inv.id && inv.status === 'draft') {
      await stripe.invoices.finalizeInvoice(inv.id);
      await stripe.invoices.sendInvoice(inv.id);
    }
    return { ok: true };
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
