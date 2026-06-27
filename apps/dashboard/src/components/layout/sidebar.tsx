'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/lib/actions';

const NAV = [
  { href: '/app',          label: 'Vue d\'ensemble', icon: '▦' },
  { href: '/app/sites',    label: 'Portefeuille',    icon: '◈' },
  { href: '/app/pipeline', label: 'Pipeline',         icon: '⇌' },
  { href: '/app/launch',   label: 'Lanceur',          icon: '⚡' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/app' ? pathname === '/app' : pathname.startsWith(href);

  const NavLinks = ({ onNavigate = () => {} }: { onNavigate?: () => void }) => (
    <nav className="flex-1 px-2 py-3 space-y-0.5">
      {NAV.map(({ href, label, icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
            isActive(href)
              ? 'bg-indigo-50 text-indigo-700 font-medium'
              : 'text-[#525252] hover:bg-[#f5f5f5] hover:text-[#0a0a0a]'
          }`}
        >
          <span className="text-xs opacity-70">{icon}</span>
          {label}
        </Link>
      ))}
    </nav>
  );

  const SignOut = () => (
    <div className="p-3 border-t border-[#e5e5e5]">
      <form action={signOut}>
        <button
          type="submit"
          className="w-full rounded-md px-3 py-2 text-left text-sm text-[#a3a3a3]
                     hover:bg-[#f5f5f5] hover:text-[#0a0a0a] transition-colors"
        >
          Déconnexion
        </button>
      </form>
    </div>
  );

  const Logo = () => (
    <Image
      src="/NexusLocale-logo.png"
      alt="NexusLocale"
      width={161}
      height={46}
      className="object-contain h-8 w-auto md:h-auto"
      priority
    />
  );

  return (
    <>
      {/* ── Barre du haut (mobile uniquement) ─────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-[#e5e5e5] px-4 py-2">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          className="rounded-md p-2 text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors text-lg leading-none"
        >
          ☰
        </button>
      </div>

      {/* ── Tiroir mobile + fond ──────────────────────────────────────────── */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 max-w-[80%] flex flex-col bg-white border-r border-[#e5e5e5] shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5]">
              <Logo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
                className="rounded-md p-2 text-[#a3a3a3] hover:bg-[#f5f5f5] hover:text-[#0a0a0a] transition-colors leading-none"
              >
                ✕
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <SignOut />
          </aside>
        </div>
      )}

      {/* ── Sidebar fixe (desktop) ────────────────────────────────────────── */}
      <aside className="hidden md:flex h-full w-52 flex-col bg-white border-r border-[#e5e5e5]">
        <div className="flex items-center px-4 py-3 border-b border-[#e5e5e5]">
          <Logo />
        </div>
        <NavLinks />
        <SignOut />
      </aside>
    </>
  );
}
