'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, type ReactNode } from 'react';
import { ContactForm } from './contact-form';
import { DICT, type Locale } from './i18n';

const VIOLET = '#5701f3';
const VIOLET_DARK = '#4801cc';
const VIOLET_400 = '#a78bfa';
const INK = '#0a0a0a';

// Icônes (indépendantes de la langue), alignées sur l'ordre de why.items.
const ICONS: ReactNode[] = [
  <><rect width="18" height="7" x="3" y="3" rx="1" /><rect width="9" height="7" x="3" y="14" rx="1" /><rect width="5" height="7" x="16" y="14" rx="1" /></>,
  <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></>,
  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />,
  <><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></>,
  <><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></>,
];

function LangToggle({ locale, onChange }: { locale: Locale; onChange: (l: Locale) => void }) {
  const cls = (l: Locale) => (l === locale ? 'text-[#0a0a0a] font-semibold' : 'text-neutral-400 hover:text-neutral-600');
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <button type="button" onClick={() => onChange('fr')} className={cls('fr')} aria-label="Français">FR</button>
      <span className="text-neutral-300">|</span>
      <button type="button" onClick={() => onChange('en')} className={cls('en')} aria-label="English">EN</button>
    </div>
  );
}

export function LandingContent() {
  const [locale, setLocale] = useState<Locale>('fr');

  useEffect(() => {
    const saved = localStorage.getItem('locale');
    if (saved === 'en' || saved === 'fr') setLocale(saved);
  }, []);

  function switchLocale(l: Locale) {
    setLocale(l);
    localStorage.setItem('locale', l);
    document.documentElement.lang = l;
  }

  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  const t = DICT[locale];

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a] font-sans antialiased">
      {/* Nav */}
      <header className="sticky top-0 z-50 backdrop-blur bg-white/80 border-b border-neutral-200/70">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/NexusLocale-logo.png" alt="NexusLocale" width={863} height={191} priority className="h-[37px] w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-600">
            <a href="#why" className="hover:text-[#0a0a0a] transition-colors">{t.nav.why}</a>
            <a href="#how" className="hover:text-[#0a0a0a] transition-colors">{t.nav.how}</a>
            <a href="#websites" className="hover:text-[#0a0a0a] transition-colors">{t.nav.websites}</a>
            <a href="#contact" className="hover:text-[#0a0a0a] transition-colors">{t.nav.contact}</a>
            <LangToggle locale={locale} onChange={switchLocale} />
            <Link href="#contact" className="rounded-lg px-4 py-2 text-white font-semibold shadow-sm hover:opacity-90 transition-opacity" style={{ backgroundColor: VIOLET }}>{t.nav.getStarted}</Link>
          </nav>
          <div className="md:hidden flex items-center gap-3">
            <LangToggle locale={locale} onChange={switchLocale} />
            <button type="button" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu" aria-expanded={menuOpen}
              className="p-1.5 text-2xl leading-none text-[#0a0a0a]">{menuOpen ? '✕' : '☰'}</button>
          </div>
        </div>

        {/* Menu mobile */}
        {menuOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-white">
            <nav className="max-w-6xl mx-auto px-5 py-3 flex flex-col text-sm font-medium text-neutral-700">
              <a href="#why" onClick={closeMenu} className="py-2.5 border-b border-neutral-100">{t.nav.why}</a>
              <a href="#how" onClick={closeMenu} className="py-2.5 border-b border-neutral-100">{t.nav.how}</a>
              <a href="#websites" onClick={closeMenu} className="py-2.5 border-b border-neutral-100">{t.nav.websites}</a>
              <a href="#contact" onClick={closeMenu} className="py-2.5 border-b border-neutral-100">{t.nav.contact}</a>
              <Link href="#contact" onClick={closeMenu} className="mt-2 rounded-lg px-4 py-3 text-center text-white font-semibold" style={{ backgroundColor: VIOLET }}>{t.nav.getStarted}</Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden text-white" style={{ backgroundColor: INK }}>
        <div aria-hidden className="absolute left-1/2 top-[-10rem] size-[36rem] -translate-x-1/2 rounded-full blur-3xl" style={{ backgroundColor: `${VIOLET}33` }} />
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-32 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium" style={{ color: '#ddd0fd' }}>
            {t.hero.badge}
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            {t.hero.titleL1}<br />{t.hero.titleL2Pre}<span style={{ color: VIOLET_400 }}>{t.hero.titleAccent}</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-neutral-300 sm:text-xl leading-relaxed">{t.hero.subtitle}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="#contact" className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white shadow-lg transition-colors" style={{ backgroundColor: VIOLET }}>
              {t.hero.ctaPrimary} <span aria-hidden>→</span>
            </Link>
            <a href="#how" className="rounded-lg border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10 transition-colors">{t.hero.ctaSecondary}</a>
          </div>
        </div>
      </section>

      {/* Why us - blanc */}
      <section id="why" className="bg-white py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{t.why.heading}</h2>
            <p className="mt-3 text-neutral-600">{t.why.sub}</p>
          </div>
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {t.why.items.map((f, i) => (
              <div key={f.t} className="rounded-2xl border border-neutral-200 bg-white p-6 transition-shadow hover:shadow-md">
                <div className="grid size-10 place-items-center rounded-xl mb-4" style={{ backgroundColor: '#f0ebfe', color: VIOLET_DARK }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-5">{ICONS[i]}</svg>
                </div>
                <h3 className="font-semibold text-[#0a0a0a]">{f.t}</h3>
                <p className="mt-1.5 text-sm text-neutral-600 leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works - gris */}
      <section id="how" className="py-16 sm:py-24" style={{ backgroundColor: '#f4f4f4' }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{t.how.heading}</h2>
            <p className="mt-3 text-neutral-600">{t.how.sub}</p>
          </div>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
            {t.how.steps.map((s) => (
              <div key={s.n} className="rounded-2xl border border-neutral-200 bg-white p-7 shadow-sm">
                <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold mb-5" style={{ backgroundColor: VIOLET }}>{s.n}</div>
                <h3 className="text-lg font-bold">{s.t}</h3>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Websites - blanc */}
      <section id="websites" className="bg-white py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-5">
          <div className="rounded-3xl border border-neutral-200 p-8 sm:p-12" style={{ backgroundColor: '#faf9ff' }}>
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: VIOLET }}>{t.websites.eyebrow}</span>
                <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">{t.websites.heading}</h2>
                <p className="mt-4 text-neutral-600 leading-relaxed">{t.websites.text}</p>
                <p className="mt-3 text-neutral-600 leading-relaxed">{t.websites.text2}</p>
                <a href="#contact" className="mt-7 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white shadow-lg hover:opacity-90 transition-opacity" style={{ backgroundColor: VIOLET }}>
                  {t.websites.cta} <span aria-hidden>→</span>
                </a>
                <p className="mt-4 text-sm text-neutral-500">{t.websites.perfectFor}</p>
              </div>
              <ul className="space-y-3">
                {t.websites.points.map((it) => (
                  <li key={it} className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
                    <span className="mt-0.5 grid size-5 flex-none place-items-center rounded-full text-white text-xs" style={{ backgroundColor: VIOLET }}>✓</span>
                    <span className="text-sm font-medium text-[#0a0a0a]">{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - gris */}
      <section className="py-20" style={{ backgroundColor: '#f4f4f4' }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="rounded-3xl px-8 py-14 text-center text-white" style={{ background: `linear-gradient(135deg, ${VIOLET}, #4801cc)` }}>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{t.finalCta.heading}</h2>
            <p className="mt-3 text-white/80 max-w-xl mx-auto">{t.finalCta.text}</p>
            <Link href="#contact" className="mt-7 inline-block rounded-xl bg-white px-7 py-3.5 font-semibold shadow-lg hover:-translate-y-0.5 transition-transform" style={{ color: VIOLET }}>{t.finalCta.button}</Link>
          </div>
        </div>
      </section>

      {/* Contact - blanc */}
      <section id="contact" className="bg-white py-16 sm:py-24">
        <div className="max-w-2xl mx-auto px-5">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{t.contact.heading}</h2>
            <p className="mt-3 text-neutral-600">{t.contact.sub}</p>
          </div>
          <ContactForm locale={locale} />
        </div>
      </section>

      {/* Footer - gris */}
      <footer className="border-t border-neutral-200" style={{ backgroundColor: '#f4f4f4' }}>
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#0a0a0a]/50">
          <Image src="/NexusLocale-logo.png" alt="NexusLocale" width={863} height={191} className="h-7 w-auto" />
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-[#0a0a0a]">{t.footer.terms}</Link>
            <Link href="/privacy" className="hover:text-[#0a0a0a]">{t.footer.privacy}</Link>
            <a href="mailto:support@nexuslocale.com" className="hover:text-[#0a0a0a]">support@nexuslocale.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
