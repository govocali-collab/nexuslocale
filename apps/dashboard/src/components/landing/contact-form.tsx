'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Script from 'next/script';
import { submitContact } from '@/lib/contact-actions';
import { DICT, type Locale } from './i18n';

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

const inputCls =
  'w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-[#0a0a0a] ' +
  'placeholder-neutral-400 focus:outline-none focus:ring-2 focus:border-transparent';
const focusRing = { ['--tw-ring-color' as string]: VIOLET } as React.CSSProperties;

export function ContactForm({ locale }: { locale: Locale }) {
  const t = DICT[locale].form;

  const [f, setF] = useState({ firstName: '', lastName: '', email: '', phone: '', message: '', website: '' });
  const [reasonIdx, setReasonIdx] = useState(0);
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
      callback: (tok: string) => setToken(tok),
      'expired-callback': () => setToken(''),
      'error-callback': () => setToken(''),
    });
  }

  useEffect(() => { renderTurnstile(); }, []);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!token) { setErr(t.captchaNeeded); return; }
    start(async () => {
      const r = await submitContact({ ...f, reason: t.reasons[reasonIdx]!, turnstileToken: token });
      if (r.ok) setDone(true);
      else {
        setErr(r.error ?? t.genericError);
        window.turnstile?.reset(widgetId.current);
        setToken('');
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full text-white text-2xl" style={{ backgroundColor: VIOLET }}>✓</div>
        <h3 className="text-xl font-bold">{t.sentTitle}</h3>
        <p className="mt-2 text-neutral-600">{t.sentBody}</p>
      </div>
    );
  }

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer onLoad={renderTurnstile} />
      <form onSubmit={submit} className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.firstName} *</label>
            <input required value={f.firstName} onChange={set('firstName')} className={inputCls} style={focusRing} placeholder={t.phFirst} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.lastName} *</label>
            <input required value={f.lastName} onChange={set('lastName')} className={inputCls} style={focusRing} placeholder={t.phLast} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.email} *</label>
            <input required type="email" value={f.email} onChange={set('email')} className={inputCls} style={focusRing} placeholder={t.phEmail} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.phone}</label>
            <input type="tel" value={f.phone} onChange={set('phone')} className={inputCls} style={focusRing} placeholder={t.phPhone} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.reasonLabel} *</label>
          <select required value={reasonIdx} onChange={(e) => setReasonIdx(Number(e.target.value))} className={inputCls} style={focusRing}>
            {t.reasons.map((r, i) => <option key={r} value={i}>{r}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.messageLabel} *</label>
          <textarea required value={f.message} onChange={set('message')} rows={5} className={inputCls} style={focusRing} placeholder={t.phMessage} />
        </div>

        {/* Honeypot */}
        <input type="text" tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} name="website" className="hidden" aria-hidden="true" />

        {/* Cloudflare Turnstile */}
        <div ref={widgetRef} className="min-h-[65px]" />

        {err && <p className="text-sm text-red-600">{err}</p>}

        <button type="submit" disabled={pending}
          className="w-full rounded-lg px-6 py-3 font-semibold text-white shadow-lg hover:opacity-90 disabled:opacity-70 transition-opacity"
          style={{ backgroundColor: VIOLET }}>
          {pending ? t.sending : t.send}
        </button>
      </form>
    </>
  );
}
