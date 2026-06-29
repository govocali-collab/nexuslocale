import Link from 'next/link';
import { PhoneLink } from './PhoneLink';
import type { SiteConfig } from '@/schema/config';
import { slugifyCity } from '@/lib/config';

type FooterProps = { config: SiteConfig };

export function Footer({ config }: FooterProps) {
  const { business, pages, branding } = config;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Colonne 1 — identité */}
        <div>
          <p className="text-white font-bold text-lg mb-2">{business.name}</p>
          <p className="text-sm text-gray-400 mb-4">{branding.tagline}</p>
          <PhoneLink
            phone={business.phone}
            className="inline-flex items-center gap-2 text-secondary font-semibold hover:opacity-80 transition-opacity"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            {business.phone}
          </PhoneLink>
          {business.email && (
            <p className="mt-2 text-sm">
              <a href={`mailto:${business.email}`} className="hover:text-white transition-colors">
                {business.email}
              </a>
            </p>
          )}
          <p className="mt-2 text-sm text-gray-400">{business.address}</p>
          <p className="mt-1 text-sm text-gray-400">{business.hours}</p>
        </div>

        {/* Colonne 2 — services */}
        <div>
          <p className="text-white font-semibold mb-3">Services</p>
          <ul className="space-y-2 text-sm">
            {pages.services.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className="hover:text-white transition-colors">
                  {s.nav_label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Colonne 3 — zones */}
        <div>
          <p className="text-white font-semibold mb-3">Zones desservies</p>
          <ul className="space-y-2 text-sm">
            {pages.service_areas.map((z) => (
              <li key={z.city}>
                <Link href={`/zones/${slugifyCity(z.city)}`} className="hover:text-white transition-colors">
                  {z.nav_label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
          <p>© {year} {business.name}. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">Photos : Pexels</a>
            <Link href="/contact" className="hover:text-gray-300 transition-colors">Demander un estimé</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
