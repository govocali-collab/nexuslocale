import type { SiteConfig, Faq } from '@/schema/config';

export function buildLocalBusinessLd(config: SiteConfig) {
  const { business, niche, pages } = config;

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name:    business.name,
    telephone: business.phone,
    email:   business.email ?? undefined,
    address: {
      '@type':           'PostalAddress',
      addressLocality:   config.city,
      addressRegion:     'QC',
      addressCountry:    'CA',
      streetAddress:     business.address,
    },
    openingHours: business.hours,
    areaServed: pages.service_areas.map((z) => ({
      '@type': 'City',
      name:    z.city,
    })),
    knowsAbout: niche,
    url: `https://${config.domain}`,
  };
}

export function buildFaqLd(faqs: Faq[]) {
  if (faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type':    'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type':          'Question',
      name:             f.q,
      acceptedAnswer:   { '@type': 'Answer', text: f.a },
    })),
  };
}

export function buildBreadcrumbLd(crumbs: { name: string; url: string }[]) {
  return {
    '@context':        'https://schema.org',
    '@type':           'BreadcrumbList',
    itemListElement:   crumbs.map((c, i) => ({
      '@type':    'ListItem',
      position:   i + 1,
      name:       c.name,
      item:       c.url,
    })),
  };
}
