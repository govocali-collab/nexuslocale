import type { Metadata } from 'next';
import type React from 'react';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import '../styles/globals.css';
import { getConfig } from '@/lib/config';

// Police premium : Sora pour les titres (caractère), Plus Jakarta Sans pour le corps.
const display = Sora({ subsets: ['latin'], variable: '--font-display', weight: ['600', '700', '800'] });
const body    = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-body' });
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SchemaLD } from '@/components/SchemaLD';
import { buildLocalBusinessLd } from '@/lib/schema-ld';

export async function generateMetadata(): Promise<Metadata> {
  const config = getConfig();
  const isDemo = config.mode === 'demo';

  return {
    title: {
      default:  config.business.name,
      template: `%s | ${config.business.name}`,
    },
    description: config.branding.tagline,
    // Noindex sur tout le site en mode démo
    robots: isDemo
      ? { index: false, follow: false }
      : { index: true,  follow: true },
    metadataBase: new URL(`https://${config.domain}`),
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const config = getConfig();

  const cssVars = {
    '--color-primary':   config.branding.primary_color,
    '--color-secondary': config.branding.secondary_color,
  } as React.CSSProperties;

  return (
    <html lang="fr" style={cssVars} className={`${display.variable} ${body.variable}`}>
      <head>
        <SchemaLD data={buildLocalBusinessLd(config)} />
        {/* Bandeau démo visible en haut du site — supprimé en production */}
        {config.mode === 'demo' && (
          <style>{`
            body::before {
              content: "⚠️ DÉMO — Ce site est une démonstration non indexée";
              display: block;
              background: #f59e0b;
              color: #1c1917;
              text-align: center;
              padding: 6px 12px;
              font-size: 13px;
              font-weight: 600;
              font-family: system-ui, sans-serif;
            }
          `}</style>
        )}
      </head>
      <body className="flex flex-col min-h-screen">
        <Header config={config} />
        <main className="flex-1">{children}</main>
        <Footer config={config} />
      </body>
    </html>
  );
}
