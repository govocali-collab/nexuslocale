import Link from 'next/link';
import type { Metadata } from 'next';
import { getConfig, slugifyCity } from '@/lib/config';
import { PhoneLink } from '@/components/PhoneLink';
import { SchemaLD } from '@/components/SchemaLD';
import { buildFaqLd } from '@/lib/schema-ld';
import { heroImageUrl, serviceImageUrl } from '@/lib/images';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  const { business, branding, city, niche } = getConfig();
  return {
    title:       `${business.name} — ${niche} à ${city}`,
    description: branding.tagline,
  };
}

export default function HomePage() {
  const config   = getConfig();
  const { business, pages, local_data, niche, branding, city } = config;
  const faqs     = local_data.faqs ?? [];
  const heroImg  = heroImageUrl(niche, branding.hero_image_url);

  return (
    <>
      {faqs.length > 0 && <SchemaLD data={buildFaqLd(faqs)!} />}

      {/* ── Hero ── */}
      <section className="relative text-white py-24 px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImg}
          alt={`${niche} à ${city}`}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight drop-shadow-lg">
            {pages.home.hero_title}
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow">
            {pages.home.hero_subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <PhoneLink
              phone={business.phone}
              className="btn-primary text-lg px-8 py-4"
            >
              📞 {business.phone}
            </PhoneLink>
            <Link href="/contact" className="btn-outline text-lg px-8 py-4">
              Demander un estimé
            </Link>
          </div>
        </div>
      </section>

      {/* ── Sections dynamiques depuis config ── */}
      {pages.home.sections.map((section, i) => {
        switch (section.type) {
          case 'content':
            return (
              <section key={i} className="py-16 px-4 bg-white">
                <div className="max-w-4xl mx-auto">
                  {section.heading && <h2 className="section-heading">{section.heading}</h2>}
                  {section.body && <p className="prose-local text-gray-600">{section.body}</p>}
                </div>
              </section>
            );

          case 'services_grid':
            return (
              <section key={i} className="py-16 px-4 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                  {section.heading && <h2 className="section-heading text-center mb-10">{section.heading}</h2>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pages.services.map((s) => (
                      <Link key={s.slug} href={`/services/${s.slug}`} className="card group overflow-hidden p-0">
                        <div className="relative h-44 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={s.image_url ?? serviceImageUrl(s.slug)}
                            alt={`${s.nav_label} à ${city}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        </div>
                        <div className="p-5">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors mb-2">
                            {s.nav_label}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{s.meta_description}</p>
                          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-secondary">
                            En savoir plus →
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            );

          case 'service_areas':
            return (
              <section key={i} className="py-16 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                  {section.heading && <h2 className="section-heading text-center mb-8">{section.heading}</h2>}
                  <div className="flex flex-wrap gap-3 justify-center">
                    {pages.service_areas.map((z) => (
                      <Link
                        key={z.city}
                        href={`/zones/${slugifyCity(z.city)}`}
                        className="px-4 py-2 bg-gray-100 hover:bg-primary hover:text-white rounded-full text-sm font-medium transition-colors"
                      >
                        📍 {z.nav_label}
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            );

          case 'faq':
            if (faqs.length === 0) return null;
            return (
              <section key={i} className="py-16 px-4 bg-gray-50">
                <div className="max-w-3xl mx-auto">
                  {section.heading && <h2 className="section-heading text-center mb-10">{section.heading}</h2>}
                  <div className="space-y-4">
                    {faqs.map((faq, j) => (
                      <details key={j} className="card group">
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
            );

          case 'cta':
            return (
              <section key={i} className="py-16 px-4 bg-secondary text-white text-center">
                <div className="max-w-2xl mx-auto">
                  {section.heading && <h2 className="text-3xl font-bold mb-3">{section.heading}</h2>}
                  {section.subtitle && <p className="text-white/80 mb-8">{section.subtitle}</p>}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <PhoneLink phone={business.phone} className="btn-outline">
                      📞 {business.phone}
                    </PhoneLink>
                    <Link href="/contact" className="bg-white text-secondary font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
                      Formulaire de contact
                    </Link>
                  </div>
                </div>
              </section>
            );

          default:
            return null;
        }
      })}

      {/* ── Intro texte ── */}
      <section className="py-12 px-4 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto prose-local text-gray-600">
          <p>{pages.home.intro}</p>
        </div>
      </section>
    </>
  );
}
