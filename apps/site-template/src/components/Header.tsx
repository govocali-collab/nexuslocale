import Link from 'next/link';
import { PhoneLink } from './PhoneLink';
import type { SiteConfig } from '@/schema/config';
import { slugifyCity } from '@/lib/config';

type HeaderProps = { config: SiteConfig };

export function Header({ config }: HeaderProps) {
  const { business, pages, branding } = config;

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">

        {/* Logo / nom */}
        <Link href="/" className="flex items-center gap-3 font-bold text-lg hover:opacity-90 transition-opacity">
          {branding.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logo_url} alt={business.name} className="h-10 w-auto" />
          ) : (
            <span className="text-xl">{business.name}</span>
          )}
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-secondary transition-colors">Accueil</Link>

          {/* Services — nav_label, jamais le h1 */}
          <div className="relative group">
            <button className="hover:text-secondary transition-colors flex items-center gap-1">
              Services
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="absolute top-full left-0 mt-1 hidden group-hover:block bg-white text-gray-800 rounded-lg shadow-xl min-w-48 z-50 py-1">
              {pages.services.map((s) => (
                <Link
                  key={s.slug}
                  href={`/services/${s.slug}`}
                  className="block px-4 py-2 hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  {s.nav_label}
                </Link>
              ))}
            </div>
          </div>

          {/* Zones */}
          <div className="relative group">
            <button className="hover:text-secondary transition-colors flex items-center gap-1">
              Zones desservies
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="absolute top-full left-0 mt-1 hidden group-hover:block bg-white text-gray-800 rounded-lg shadow-xl min-w-44 z-50 py-1">
              {pages.service_areas.map((z) => (
                <Link
                  key={z.city}
                  href={`/zones/${slugifyCity(z.city)}`}
                  className="block px-4 py-2 hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  {z.nav_label}
                </Link>
              ))}
            </div>
          </div>

          <Link href="/contact" className="hover:text-secondary transition-colors">Contact</Link>
        </nav>

        {/* CTA téléphone — source unique : config.business.phone */}
        <PhoneLink
          phone={business.phone}
          className="hidden sm:flex items-center gap-2 bg-secondary hover:opacity-90 transition-opacity text-white font-bold px-4 py-2 rounded-lg text-sm"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          {business.phone}
        </PhoneLink>

        {/* Burger mobile */}
        <MobileMenu config={config} />
      </div>
    </header>
  );
}

function MobileMenu({ config }: HeaderProps) {
  const { business, pages } = config;
  return (
    <details className="md:hidden group">
      <summary className="list-none cursor-pointer p-2 rounded-lg hover:bg-white/10 transition-colors">
        <svg className="w-6 h-6 group-open:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg className="w-6 h-6 hidden group-open:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </summary>
      <div className="absolute top-full left-0 right-0 bg-primary border-t border-white/10 z-50 px-4 py-4 space-y-2">
        <Link href="/" className="block py-2 border-b border-white/10">Accueil</Link>
        <div className="py-2 border-b border-white/10">
          <p className="text-sm text-white/60 mb-1">Services</p>
          {pages.services.map((s) => (
            <Link key={s.slug} href={`/services/${s.slug}`} className="block py-1 pl-2 text-sm hover:text-secondary">
              {s.nav_label}
            </Link>
          ))}
        </div>
        <div className="py-2 border-b border-white/10">
          <p className="text-sm text-white/60 mb-1">Zones desservies</p>
          {pages.service_areas.map((z) => (
            <Link key={z.city} href={`/zones/${slugifyCity(z.city)}`} className="block py-1 pl-2 text-sm hover:text-secondary">
              {z.nav_label}
            </Link>
          ))}
        </div>
        <Link href="/contact" className="block py-2 border-b border-white/10">Contact</Link>
        <PhoneLink phone={business.phone} className="btn-primary w-full text-center mt-2">
          Appeler maintenant
        </PhoneLink>
      </div>
    </details>
  );
}
