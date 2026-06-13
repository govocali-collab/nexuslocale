import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NexusLocale — Dashboard',
  description: 'Poste de pilotage rank-and-rent',
  icons: { icon: '/NexusLocale-fav.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className="h-full bg-[#EEEDF8] text-[#1C1560] antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
