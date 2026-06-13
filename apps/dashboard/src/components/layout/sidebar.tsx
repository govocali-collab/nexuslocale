'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/lib/actions';

const NAV = [
  { href: '/',         label: 'Vue d\'ensemble', icon: '▦' },
  { href: '/sites',    label: 'Portefeuille',    icon: '◈' },
  { href: '/pipeline', label: 'Pipeline',         icon: '⇌' },
  { href: '/launch',   label: 'Lanceur',          icon: '⚡' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-52 flex-col bg-white border-r border-[#D9D7F0]">
      {/* Logo */}
      <div className="flex items-center px-4 py-3 border-b border-[#D9D7F0]">
        <Image
          src="/NexusLocale-logo.png"
          alt="NexusLocale"
          width={161}
          height={46}
          className="object-contain"
          priority
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map(({ href, label, icon }) => {
          const active = href === '/'
            ? pathname === '/'
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-[#6B6B9E] hover:bg-[#F0EFFC] hover:text-[#1C1560]'
              }`}
            >
              <span className="text-xs opacity-70">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Signout */}
      <div className="p-3 border-t border-[#D9D7F0]">
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2 text-left text-sm text-[#9A97C0]
                       hover:bg-[#F0EFFC] hover:text-[#1C1560] transition-colors"
          >
            Déconnexion
          </button>
        </form>
      </div>
    </aside>
  );
}
