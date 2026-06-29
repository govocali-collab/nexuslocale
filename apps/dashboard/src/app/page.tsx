import type { Metadata } from 'next';
import { LandingContent } from '@/components/landing/landing-content';

const TITLE = 'NexusLocale | Local websites that rank. More customers from Google.';
const DESC = 'We design and rank websites for local businesses. Your site climbs to the top of Google and the calls come straight to you. No upfront cost. Pay only while you rank.';

export const metadata: Metadata = {
  metadataBase: new URL('https://nexuslocale.com'),
  title: TITLE,
  description: DESC,
  icons: { icon: '/NexusLocale-Fav-v3.png', shortcut: '/NexusLocale-Fav-v3.png', apple: '/NexusLocale-Fav-v3.png' },
  openGraph: {
    title: TITLE,
    description: DESC,
    type: 'website',
    siteName: 'NexusLocale',
    images: [{ url: '/NexusLocale-logo-v2.png', alt: 'NexusLocale' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC, images: ['/NexusLocale-logo-v2.png'] },
};

export default function LandingPage() {
  return <LandingContent />;
}
