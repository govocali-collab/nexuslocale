'use client';

import { useEffect, useState } from 'react';

// N'apparaît que sur le site déployé (pas en local) : le Lanceur a besoin de ta
// machine (pnpm + scripts), donc on offre un lien direct vers la version locale.
export function LocalLauncherBanner() {
  const [isRemote, setIsRemote] = useState(false);

  useEffect(() => {
    const h = window.location.hostname;
    setIsRemote(h !== 'localhost' && h !== '127.0.0.1');
  }, []);

  if (!isRemote) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="text-sm text-amber-900">
        <span className="font-medium">⚠️ Le Lanceur s&apos;exécute sur ta machine.</span>{' '}
        Les scans (Finder, Générer, Prospector…) ont besoin de pnpm + le code local. Ouvre la version locale pour les lancer.
      </div>
      <a
        href="http://localhost:3003/app/launch"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-md bg-[#5701f3] hover:bg-[#4801cc] px-4 py-2 text-sm font-medium text-white whitespace-nowrap"
      >
        Ouvrir en local →
      </a>
    </div>
  );
}
