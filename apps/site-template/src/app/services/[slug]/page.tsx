import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getConfig } from '@/lib/config';
import { PhoneLink } from '@/components/PhoneLink';
import { SchemaLD } from '@/components/SchemaLD';
import { buildFaqLd, buildBreadcrumbLd } from '@/lib/schema-ld';
import { serviceImageUrl } from '@/lib/images';

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getConfig().pages.services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const service  = getConfig().pages.services.find((s) => s.slug === slug);
  if (!service) return {};
  return {
    title:       service.meta_title,
    description: service.meta_description,
  };
}

export default async function ServicePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const config   = getConfig();
  const service  = config.pages.services.find((s) => s.slug === slug);
  if (!service) notFound();

  const faqs = service.local_data.faqs ?? [];
  const { business } = config;

  const breadcrumbs = [
    { name: 'Accueil',   url: `https://${config.domain}/` },
    { name: 'Services',  url: `https://${config.domain}/services/` },
    { name: service.nav_label, url: `https://${config.domain}/services/${slug}/` },
  ];

  return (
    <>
      <SchemaLD data={buildBreadcrumbLd(breadcrumbs)} />
      {faqs.length > 0 && <SchemaLD data={buildFaqLd(faqs)!} />}

      {/* ── Hero service ── */}
      <section className="relative text-white py-20 px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={service.image_url ?? serviceImageUrl(slug)}
          alt={service.h1}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative max-w-4xl mx-auto">
          <nav className="text-sm text-white/60 mb-4">
            <Link href="/" className="hover:text-white">Accueil</Link>
            {' › '}
            <span>Services</span>
            {' › '}
            <span className="text-white">{service.nav_label}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 drop-shadow-lg">{service.h1}</h1>
          <PhoneLink
            phone={business.phone}
            className="inline-flex items-center gap-2 bg-secondary text-white font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            📞 Estimé gratuit — {business.phone}
          </PhoneLink>
        </div>
      </section>

      {/* ── Sections de contenu ── */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto space-y-10">
          {service.sections.map((sec, i) => (
            <div key={i}>
              <h2 className="text-xl font-bold text-gray-900 mb-3">{sec.heading}</h2>
              <p className="text-gray-600 leading-relaxed">{sec.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Contenu local unique ── */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">

          {service.local_data.neighborhoods && service.local_data.neighborhoods.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-3">Secteurs desservis</h3>
              <ul className="space-y-1">
                {service.local_data.neighborhoods.map((n) => (
                  <li key={n} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-secondary">•</span> {n}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {service.local_data.price_context && (
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-3">À propos des coûts</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{service.local_data.price_context}</p>
            </div>
          )}

          {service.local_data.local_landmarks && service.local_data.local_landmarks.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-3">Zone d'intervention</h3>
              <ul className="space-y-1">
                {service.local_data.local_landmarks.map((l) => (
                  <li key={l} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-secondary">📍</span> {l}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {service.local_data.competitor_context && (
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-3">Notre positionnement</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{service.local_data.competitor_context}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ ── */}
      {faqs.length > 0 && (
        <section className="py-12 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="section-heading mb-8">Questions fréquentes</h2>
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

      {/* ── CTA bas de page ── */}
      <section className="py-12 px-4 bg-primary text-white text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">Prêt à démarrer votre projet?</h2>
          <p className="text-white/70 mb-6">Estimé gratuit et sans engagement. Réponse sous 24h.</p>
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
