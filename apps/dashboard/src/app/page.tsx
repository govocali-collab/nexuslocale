import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ContactForm } from '@/components/landing/contact-form';

const TITLE = 'NexusLocale — Local websites that rank. More customers from Google.';
const DESC = 'We design and rank websites for local businesses. Your site climbs to the top of Google and the calls come straight to you. No upfront cost — pay only while you rank.';

export const metadata: Metadata = {
  metadataBase: new URL('https://nexuslocale.com'),
  title: TITLE,
  description: DESC,
  icons: { icon: '/NexusLocale-fav.png', shortcut: '/NexusLocale-fav.png', apple: '/NexusLocale-fav.png' },
  openGraph: {
    title: TITLE,
    description: DESC,
    type: 'website',
    siteName: 'NexusLocale',
    images: [{ url: '/NexusLocale-logo.png', alt: 'NexusLocale' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC, images: ['/NexusLocale-logo.png'] },
};

// Ce qu'on fait, pour le commerce local (rank-and-rent + web design).
// icon = chemins SVG lucide (rendus dans un <svg> stroke).
const BENEFITS = [
  { t: 'Designed for your trade', d: 'A clean, professional website built around your local business — plumbing, electrical, excavation and more.',
    icon: <><rect width="18" height="7" x="3" y="3" rx="1" /><rect width="9" height="7" x="3" y="14" rx="1" /><rect width="5" height="7" x="16" y="14" rx="1" /></> },
  { t: 'Built to rank', d: 'Local SEO is baked in from day one, targeting the exact searches people make in your city.',
    icon: <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></> },
  { t: 'More calls & leads', d: 'The people searching for your service on Google find you first — and reach out directly.',
    icon: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /> },
  { t: 'No upfront cost', d: 'Rank-and-rent model: you pay only while your site ranks and brings you business.',
    icon: <><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></> },
  { t: 'Fully managed', d: 'Domain, hosting, updates, technical work — we handle everything so you don\'t have to.',
    icon: <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></> },
  { t: 'Real, trackable results', d: 'Follow your Google rankings and incoming leads. You see exactly what you\'re paying for.',
    icon: <><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></> },
];

// Le modèle rank-and-rent en 3 étapes (remplace le « pricing » SaaS).
const STEPS = [
  { n: '1', t: 'We build & rank',         d: 'We design a website optimized for your trade and city, engineered to climb to the top of Google.' },
  { n: '2', t: 'It reaches the top',      d: 'Your site ranks for the local searches that matter — like “plumber in your city”.' },
  { n: '3', t: 'You rent it, get leads',  d: 'Every call and request comes straight to you. You pay only while the site keeps ranking.' },
];

const VIOLET = '#5701f3';   // brand-500
const VIOLET_DARK = '#4801cc'; // brand-600
const VIOLET_400 = '#a78bfa';  // accent clair sur fond sombre
const INK = '#0a0a0a';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#0a0a0a] font-sans antialiased">
      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur bg-white/80 border-b border-neutral-200/70">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/NexusLocale-logo.png" alt="NexusLocale" width={161} height={46} priority className="h-8 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-600">
            <a href="#why" className="hover:text-[#0a0a0a] transition-colors">Why us</a>
            <a href="#how" className="hover:text-[#0a0a0a] transition-colors">How it works</a>
            <a href="#contact" className="hover:text-[#0a0a0a] transition-colors">Contact</a>
            <Link href="/login" className="hover:text-[#0a0a0a] transition-colors">Sign in</Link>
            <Link href="/login" className="rounded-lg px-4 py-2 text-white font-semibold shadow-sm hover:opacity-90 transition-opacity" style={{ backgroundColor: VIOLET }}>Get started</Link>
          </nav>
          <Link href="/login" className="md:hidden rounded-lg px-4 py-2 text-white text-sm font-semibold" style={{ backgroundColor: VIOLET }}>Get started</Link>
        </div>
      </header>

      {/* ── Hero (sombre, comme nexuslocale.com) ─────────────────────────── */}
      <section className="relative overflow-hidden text-white" style={{ backgroundColor: INK }}>
        {/* glow violet flou en haut */}
        <div aria-hidden className="absolute left-1/2 top-[-10rem] size-[36rem] -translate-x-1/2 rounded-full blur-3xl" style={{ backgroundColor: `${VIOLET}33` }} />
        <div className="relative mx-auto max-w-6xl px-5 py-24 sm:py-32 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium" style={{ color: '#ddd0fd' }}>
            ✦ Local websites that rank on Google
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-extrabold tracking-tight sm:text-7xl">
            Get found on Google. Get more <span style={{ color: VIOLET_400 }}>customers</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-neutral-300 sm:text-xl leading-relaxed">
            We design and rank websites for local businesses. Your site climbs to the top of Google
            — and the calls come straight to you.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login" className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white shadow-lg transition-colors" style={{ backgroundColor: VIOLET }}>
              Get more customers <span aria-hidden>→</span>
            </Link>
            <a href="#how" className="rounded-lg border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10 transition-colors">
              How it works
            </a>
          </div>
          <p className="mt-4 text-xs text-neutral-400">No upfront cost • Pay only while you rank</p>
        </div>
      </section>

      {/* ── Why us (bénéfices) — fond BLANC ──────────────────────────────── */}
      <section id="why" className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Websites that bring you business</h2>
            <p className="mt-3 text-neutral-600">Beautiful design and local SEO, built to turn Google searches into customers.</p>
          </div>
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((f) => (
              <div key={f.t} className="rounded-2xl border border-neutral-200 bg-white p-6 transition-shadow hover:shadow-md">
                <div className="grid size-10 place-items-center rounded-xl mb-4" style={{ backgroundColor: '#f0ebfe', color: VIOLET_DARK }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-5">{f.icon}</svg>
              </div>
                <h3 className="font-semibold text-[#0a0a0a]">{f.t}</h3>
                <p className="mt-1.5 text-sm text-neutral-600 leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works — fond GRIS #f4f4f4 ─────────────────────────────── */}
      <section id="how" className="py-24" style={{ backgroundColor: '#f4f4f4' }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">How it works</h2>
            <p className="mt-3 text-neutral-600">We do the building and the ranking. You get the customers.</p>
          </div>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-neutral-200 bg-white p-7 shadow-sm">
                <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold mb-5" style={{ backgroundColor: VIOLET }}>{s.n}</div>
                <h3 className="text-lg font-bold">{s.t}</h3>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final — fond BLANC ───────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="rounded-3xl px-8 py-14 text-center text-white" style={{ background: `linear-gradient(135deg, ${VIOLET}, #4801cc)` }}>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Ready to own Google in your city?</h2>
            <p className="mt-3 text-white/80 max-w-xl mx-auto">No upfront cost, no risk. We rank it first — you only pay while it brings you customers.</p>
            <Link href="/login" className="mt-7 inline-block rounded-xl bg-white px-7 py-3.5 font-semibold shadow-lg hover:-translate-y-0.5 transition-transform" style={{ color: VIOLET }}>
              Get started
            </Link>
          </div>
        </div>
      </section>

      {/* ── Contact — fond GRIS #f4f4f4 ──────────────────────────────────── */}
      <section id="contact" className="py-24" style={{ backgroundColor: '#f4f4f4' }}>
        <div className="max-w-2xl mx-auto px-5">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Let&apos;s get you more customers</h2>
            <p className="mt-3 text-neutral-600">Tell us about your business — we&apos;ll show you what ranking on Google can do.</p>
          </div>
          <ContactForm />
        </div>
      </section>

      {/* ── Footer — fond BLANC ──────────────────────────────────────────── */}
      <footer className="border-t border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#0a0a0a]/50">
          <Image src="/NexusLocale-logo.png" alt="NexusLocale" width={140} height={40} className="h-7 w-auto" />
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-[#0a0a0a]">Terms</Link>
            <Link href="/login" className="hover:text-[#0a0a0a]">Privacy</Link>
            <a href="mailto:support@nexuslocale.com" className="hover:text-[#0a0a0a]">support@nexuslocale.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
