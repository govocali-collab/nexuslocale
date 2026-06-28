'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { Locale } from './i18n';

const VIOLET = '#5701f3';

export type LegalSection = { h: string; paras?: string[]; bullets?: string[] };
export type LegalDoc = { title: string; updated: string; sections: LegalSection[] };
export type LegalContent = Record<Locale, LegalDoc>;

const UI = {
  fr: { back: '← Retour à l’accueil', updated: 'Dernière mise à jour', terms: 'Conditions', privacy: 'Confidentialité' },
  en: { back: '← Back to home', updated: 'Last updated', terms: 'Terms', privacy: 'Privacy' },
};

export function LegalShell({ content }: { content: LegalContent }) {
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

  const doc = content[locale];
  const ui = UI[locale];
  const cls = (l: Locale) => (l === locale ? 'text-[#0a0a0a] font-semibold' : 'text-neutral-400 hover:text-neutral-600');

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a] font-sans antialiased flex flex-col">
      <header className="sticky top-0 z-50 backdrop-blur bg-white/80 border-b border-neutral-200/70">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/NexusLocale-logo.png" alt="NexusLocale" width={842} height={181} priority className="h-[37px] w-auto" />
          </Link>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5 text-sm">
              <button type="button" onClick={() => switchLocale('fr')} className={cls('fr')}>FR</button>
              <span className="text-neutral-300">|</span>
              <button type="button" onClick={() => switchLocale('en')} className={cls('en')}>EN</button>
            </div>
            <Link href="/" className="text-sm font-medium text-neutral-600 hover:text-[#0a0a0a] transition-colors">{ui.back}</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <article className="max-w-3xl mx-auto px-5 py-16">
          <h1 className="text-4xl font-extrabold tracking-tight">{doc.title}</h1>
          <p className="mt-2 text-sm text-neutral-500">{ui.updated}: {doc.updated}</p>
          <div className="mt-10">
            {doc.sections.map((s, i) => (
              <section key={i} className="mb-8">
                <h2 className="text-xl font-bold tracking-tight mb-3" style={{ color: VIOLET }}>{s.h}</h2>
                <div className="space-y-3 text-neutral-700 leading-relaxed">
                  {s.paras?.map((p, j) => <p key={j} className="text-[15px] leading-relaxed">{p}</p>)}
                  {s.bullets && (
                    <ul className="list-disc pl-5 space-y-1.5 text-[15px]">
                      {s.bullets.map((b, j) => <li key={j}>{b}</li>)}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>
        </article>
      </main>

      <footer className="border-t border-neutral-200" style={{ backgroundColor: '#f4f4f4' }}>
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#0a0a0a]/50">
          <Image src="/NexusLocale-logo.png" alt="NexusLocale" width={842} height={181} className="h-7 w-auto" />
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-[#0a0a0a]">{ui.terms}</Link>
            <Link href="/privacy" className="hover:text-[#0a0a0a]">{ui.privacy}</Link>
            <a href="mailto:support@nexuslocale.com" className="hover:text-[#0a0a0a]">support@nexuslocale.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
