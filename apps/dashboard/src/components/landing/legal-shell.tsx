import Link from 'next/link';
import Image from 'next/image';
import type React from 'react';

const VIOLET = '#5701f3';

export function LegalShell({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-[#0a0a0a] font-sans antialiased flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 backdrop-blur bg-white/80 border-b border-neutral-200/70">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/NexusLocale-logo.png" alt="NexusLocale" width={161} height={46} priority className="h-8 w-auto" />
          </Link>
          <Link href="/" className="text-sm font-medium text-neutral-600 hover:text-[#0a0a0a] transition-colors">← Back to home</Link>
        </div>
      </header>

      {/* Contenu */}
      <main className="flex-1">
        <article className="max-w-3xl mx-auto px-5 py-16">
          <h1 className="text-4xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-neutral-500">Last updated: {updated}</p>
          <div className="mt-10">{children}</div>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200" style={{ backgroundColor: '#f4f4f4' }}>
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#0a0a0a]/50">
          <Image src="/NexusLocale-logo.png" alt="NexusLocale" width={140} height={40} className="h-7 w-auto" />
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-[#0a0a0a]">Terms</Link>
            <Link href="/privacy" className="hover:text-[#0a0a0a]">Privacy</Link>
            <a href="mailto:support@nexuslocale.com" className="hover:text-[#0a0a0a]">support@nexuslocale.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold tracking-tight mb-3" style={{ color: VIOLET }}>{title}</h2>
      <div className="space-y-3 text-neutral-700 leading-relaxed">{children}</div>
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-relaxed">{children}</p>;
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5 text-[15px]">
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  );
}
