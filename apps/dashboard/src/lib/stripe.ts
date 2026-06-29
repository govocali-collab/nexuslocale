import Stripe from 'stripe';

// Client Stripe côté serveur (clé secrète). Mode test tant que sk_test_… est utilisé.
export const stripe: Stripe = new Stripe(process.env['STRIPE_SECRET_KEY'] ?? '');

export const dollarsToCents = (d: number) => Math.round(d * 100);
export const centsToDollars = (c: number) => c / 100;
