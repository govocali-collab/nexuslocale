'use server';

import { stripe, dollarsToCents, centsToDollars } from './stripe';

export interface InvoiceLine { description: string; amount: number } // amount en dollars

// Crée une facture FINALISÉE mais NON envoyée → on peut la prévisualiser (PDF)
// avant de cliquer « Envoyer ». L'envoi se fait ensuite via sendInvoiceNow().
export async function createInvoice(input: {
  clientName: string; clientEmail: string; lines: InvoiceLine[]; memo?: string;
}): Promise<{ ok: boolean; error?: string | undefined; number?: string | undefined; hostedUrl?: string | undefined; pdfUrl?: string | undefined; invoiceId?: string | undefined }> {
  const name  = input.clientName.trim();
  const email = input.clientEmail.trim();
  const lines = input.lines.filter((l) => l.description.trim() && Number(l.amount) > 0);
  if (!name || !email) return { ok: false, error: 'Nom et courriel du client requis.' };
  if (lines.length === 0) return { ok: false, error: 'Ajoutez au moins une ligne avec un montant > 0.' };

  try {
    const existing = await stripe.customers.list({ email, limit: 1 });
    const customer = existing.data[0] ?? (await stripe.customers.create({ name, email }));

    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: 'send_invoice',
      days_until_due: 30,
      currency: 'cad',
      auto_advance: false,
      metadata: { emailed: 'no' }, // pas encore envoyée
      ...(input.memo?.trim() ? { description: input.memo.trim() } : {}),
    });
    const invoiceId = invoice.id as string;

    for (const l of lines) {
      await stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoiceId,
        amount: dollarsToCents(Number(l.amount)),
        currency: 'cad',
        description: l.description.trim(),
      });
    }

    // Finalise (génère le PDF + numéro) mais N'ENVOIE PAS → prévisualisation possible.
    const finalized = await stripe.invoices.finalizeInvoice(invoiceId);
    return {
      ok: true,
      number:    finalized.number ?? undefined,
      hostedUrl: finalized.hosted_invoice_url ?? undefined,
      pdfUrl:    finalized.invoice_pdf ?? undefined,
      invoiceId,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur Stripe.' };
  }
}

// Envoie une facture déjà créée (finalisée) au client par courriel.
export async function sendInvoiceNow(invoiceId: string): Promise<{ ok: boolean; error?: string | undefined }> {
  try {
    await stripe.invoices.sendInvoice(invoiceId);
    await stripe.invoices.update(invoiceId, { metadata: { emailed: 'yes' } });
    return { ok: true };
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
    // 1re facture : finalisée SANS auto-progression (auto_advance:false) → Stripe ne
    // l'envoie pas tout seul, tu la prévisualises et l'envoies depuis l'historique.
    // Les factures des mois suivants gardent l'auto_advance par défaut → Stripe les
    // finalise ET les envoie automatiquement chaque mois (aucune action de ta part).
    const inv = sub.latest_invoice;
    if (inv && typeof inv !== 'string' && inv.id && inv.status === 'draft') {
      await stripe.invoices.update(inv.id, { metadata: { emailed: 'no' } });
      await stripe.invoices.finalizeInvoice(inv.id, { auto_advance: false });
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
  needsSend: boolean; // finalisée mais pas encore envoyée au client
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
      // « À envoyer » = UNIQUEMENT les factures qu'on retient pour révision (1re facture
      // d'un montant récurrent + factures à l'unité). Les mensuelles suivantes, envoyées
      // automatiquement par Stripe, n'ont pas cette métadonnée → elles s'affichent « Envoyée ».
      needsSend:     i.metadata?.['emailed'] === 'no' && i.status === 'open',
    }));
  } catch {
    return [];
  }
}
