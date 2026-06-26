'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Script from 'next/script';
import { submitContact } from '@/lib/contact-actions';

const VIOLET = '#5701f3';
const SITE_KEY = process.env['NEXT_PUBLIC_TURNSTILE_SITE_KEY'] ?? '';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
  }
}

const REASONS = [
  'Get a website for my business',
  'Rent a ranked site / get more leads',
  'General question',
  'Partnership / other',
];

const inputCls =
  'w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-[#0a0a0a] ' +
  'placeholder-neutral-400 focus:outline-none focus:ring-2 focus:border-transparent';
const focusRing = { ['--tw-ring-color' as string]: VIOLET } as React.CSSProperties;

export function ContactForm() {
  const [f, setF] = useState({ firstName: '', lastName: '', email: '', phone: '', reason: REASONS[0]!, message: '', website: '' });
  const [token, setToken] = useState('');
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);

  function renderTurnstile() {
    if (!window.turnstile || !widgetRef.current || widgetId.current) return;
    widgetId.current = window.turnstile.render(widgetRef.current, {
      sitekey: SITE_KEY,
      callback: (t: string) => setToken(t),
      'expired-callback': () => setToken(''),
      'error-callback': () => setToken(''),
    });
  }

  useEffect(() => { renderTurnstile(); }, []);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!token) { setErr('Please complete the captcha.'); return; }
    start(async () => {
      const r = await submitContact({ ...f, turnstileToken: token });
      if (r.ok) setDone(true);
      else {
        setErr(r.error ?? 'Something went wrong.');
        window.turnstile?.reset(widgetId.current);
        setToken('');
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full text-white text-2xl" style={{ backgroundColor: VIOLET }}>✓</div>
        <h3 className="text-xl font-bold">Message sent!</h3>
        <p className="mt-2 text-neutral-600">Thanks, we&apos;ll get back to you shortly.</p>
      </div>
    );
  }

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer onLoad={renderTurnstile} />
      <form onSubmit={submit} className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">First name *</label>
            <input required value={f.firstName} onChange={set('firstName')} className={inputCls} style={focusRing} placeholder="John" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Last name *</label>
            <input required value={f.lastName} onChange={set('lastName')} className={inputCls} style={focusRing} placeholder="Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email *</label>
            <input required type="email" value={f.email} onChange={set('email')} className={inputCls} style={focusRing} placeholder="john@business.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Phone</label>
            <input type="tel" value={f.phone} onChange={set('phone')} className={inputCls} style={focusRing} placeholder="(555) 123-4567" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Reason for your message *</label>
          <select required value={f.reason} onChange={set('reason')} className={inputCls} style={focusRing}>
            {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Message *</label>
          <textarea required value={f.message} onChange={set('message')} rows={5} className={inputCls} style={focusRing} placeholder="Tell us about your business and what you need." />
        </div>

        {/* Honeypot - caché aux humains, rempli par les bots */}
        <input type="text" tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')}
          name="website" className="hidden" aria-hidden="true" />

        {/* Cloudflare Turnstile */}
        <div ref={widgetRef} className="min-h-[65px]" />

        {err && <p className="text-sm text-red-600">{err}</p>}

        <button type="submit" disabled={pending}
          className="w-full rounded-lg px-6 py-3 font-semibold text-white shadow-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: VIOLET }}>
          {pending ? 'Sending.' : 'Send message'}
        </button>
      </form>
    </>
  );
}
