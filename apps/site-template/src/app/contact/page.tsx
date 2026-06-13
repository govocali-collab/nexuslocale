import type { Metadata } from 'next';
import { getConfig } from '@/lib/config';
import { PhoneLink } from '@/components/PhoneLink';
import { ContactForm } from '@/components/ContactForm';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  const config = getConfig();
  return {
    title:       `Contact — ${config.business.name}`,
    description: config.pages.contact.intro,
  };
}

export default function ContactPage() {
  const config    = getConfig();
  const { business, pages } = config;

  return (
    <>
      {/* ── Hero ── */}
      <section className="bg-primary text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Contactez-nous</h1>
          <p className="text-white/80 text-lg max-w-xl">{pages.contact.intro}</p>
        </div>
      </section>

      {/* ── Formulaire + infos ── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-10">

          {/* Formulaire */}
          <div className="md:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Décrivez votre projet</h2>
            <ContactForm fields={pages.contact.form_fields} siteDomain={config.domain} />
          </div>

          {/* Infos de contact */}
          <div className="md:col-span-2 space-y-6">
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4">Informations de contact</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-secondary mt-0.5">📞</span>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Téléphone</p>
                    <PhoneLink phone={business.phone} className="font-semibold text-gray-900 hover:text-primary transition-colors">
                      {business.phone}
                    </PhoneLink>
                  </div>
                </div>

                {business.email && (
                  <div className="flex items-start gap-3">
                    <span className="text-secondary mt-0.5">✉️</span>
                    <div>
                      <p className="text-gray-500 text-xs mb-0.5">Courriel</p>
                      <a href={`mailto:${business.email}`} className="font-semibold text-gray-900 hover:text-primary transition-colors">
                        {business.email}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <span className="text-secondary mt-0.5">📍</span>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Adresse</p>
                    <p className="font-semibold text-gray-900">{business.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-secondary mt-0.5">🕐</span>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Heures d'ouverture</p>
                    <p className="font-semibold text-gray-900">{business.hours}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-secondary/5 border-secondary/20">
              <h3 className="font-bold text-gray-900 mb-2">Besoin d'une réponse rapide?</h3>
              <p className="text-sm text-gray-600 mb-4">Appelez-nous directement pour les projets urgents.</p>
              <PhoneLink phone={business.phone} className="btn-primary w-full text-center">
                📞 {business.phone}
              </PhoneLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
