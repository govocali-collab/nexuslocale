import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'NexusLocale — Dashboard',
  description: 'Poste de pilotage rank-and-rent',
  icons: { icon: '/NexusLocale-fav.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`h-full ${geistSans.variable} ${geistMono.variable}`}>
      <body className="h-full bg-app text-ink antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
