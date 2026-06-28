'use server';

import { stripe, dollarsToCents, centsToDollars } from './stripe';

export interface InvoiceLine { description: string; amount: number } // amount en dollars

export async function createInvoice(input: {
  clientName: string; clientEmail: string; lines: InvoiceLine[]; memo?: string;
}): Promise<{ ok: boolean; error?: string | undefined; url?: string | undefined; number?: string | undefined }> {
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

    const finalized = await stripe.invoices.finalizeInvoice(invoiceId);
    await stripe.invoices.sendInvoice(invoiceId); // envoie le courriel au client
    return { ok: true, url: finalized.hosted_invoice_url ?? undefined, number: finalized.number ?? undefined };
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
