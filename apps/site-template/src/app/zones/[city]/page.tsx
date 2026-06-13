import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getConfig, slugifyCity } from '@/lib/config';
import { PhoneLink } from '@/components/PhoneLink';
import { SchemaLD } from '@/components/SchemaLD';
import { buildFaqLd, buildBreadcrumbLd } from '@/lib/schema-ld';

type Params = { city: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getConfig().pages.service_areas.map((z) => ({ city: slugifyCity(z.city) }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { city: citySlug } = await params;
  const config = getConfig();
  const zone = config.pages.service_areas.find((z) => slugifyCity(z.city) === citySlug);
  if (!zone) return {};
  return {
    title:       `${config.niche.charAt(0).toUpperCase() + config.niche.slice(1)} à ${zone.city} | ${config.business.name}`,
    description: zone.local_context.slice(0, 160),
  };
}

export default async function ZonePage({ params }: { params: Promise<Params> }) {
  const { city: citySlug } = await params;
  const config = getConfig();
  const zone   = config.pages.service_areas.find((z) => slugifyCity(z.city) === citySlug);
  if (!zone) notFound();

  const { business, niche, pages } = config;
  const faqs = zone.faqs ?? [];

  const breadcrumbs = [
    { name: 'Accueil',     url: `https://${config.domain}/` },
    { name: 'Zones',       url: `https://${config.domain}/zones/` },
    { name: zone.nav_label, url: `https://${config.domain}/zones/${citySlug}/` },
  ];

  return (
    <>
      <SchemaLD data={buildBreadcrumbLd(breadcrumbs)} />
      {faqs.length > 0 && <SchemaLD data={buildFaqLd(faqs)!} />}

      {/* ── Hero zone ── */}
      <section className="bg-primary text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <nav className="text-sm text-white/60 mb-4">
            <Link href="/" className="hover:text-white">Accueil</Link>
            {' › '}
            <span className="text-white">{zone.nav_label}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {niche.charAt(0).toUpperCase() + niche.slice(1)} à {zone.city}
          </h1>
          <p className="text-white/80 mb-6 max-w-2xl">
            {zone.local_context}
          </p>
          <PhoneLink
            phone={business.phone}
            className="inline-flex items-center gap-2 bg-secondary text-white font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            📞 {business.phone}
          </PhoneLink>
        </div>
      </section>

      {/* ── Quartiers desservis ── */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-heading">Quartiers desservis à {zone.city}</h2>
          <div className="flex flex-wrap gap-3 mt-4">
            {zone.neighborhoods.map((n) => (
              <span key={n} className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700 font-medium">
                📍 {n}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Points de repère locaux ── */}
      {zone.local_landmarks && zone.local_landmarks.length > 0 && (
        <section className="py-8 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Notre zone d'intervention</h2>
            <ul className="grid sm:grid-cols-2 gap-2">
              {zone.local_landmarks.map((l) => (
                <li key={l} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-secondary font-bold">•</span> {l}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Services disponibles dans cette zone ── */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-heading">Services disponibles à {zone.city}</h2>
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            {pages.services.map((s) => (
              <Link key={s.slug} href={`/services/${s.slug}`} className="card group">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                  {s.nav_label}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{s.meta_description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ zone ── */}
      {faqs.length > 0 && (
        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="section-heading mb-8">Questions fréquentes — {zone.city}</h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <details key={i} className="card">
                  <summary className="cursor-pointer font-semibold text-gray-900 list-none flex justify-between items-center">
                    {faq.q}
                    <span className="text-secondary ml-4 flex-shrink-0">+</span>
                  </summary>
                  <p className="mt-3 text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="py-12 px-4 bg-primary text-white text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">Vous avez un projet à {zone.city}?</h2>
          <p className="text-white/70 mb-6">Estimé gratuit — réponse sous 24h les jours ouvrables.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <PhoneLink phone={business.phone} className="btn-primary">
              📞 {business.phone}
            </PhoneLink>
            <Link href="/contact" className="btn-outline">Formulaire</Link>
          </div>
        </div>
      </section>
    </>
  );
}
