'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createProspect } from '@/lib/actions';

const inputCls =
  'w-full rounded-md bg-[#fafafa] border-[#e5e5e5] text-[#0a0a0a] text-sm ' +
  'placeholder-[#a3a3a3] px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500';

const EMPTY = { business_name: '', niche: '', city: '', phone: '', notes: '' };

export function AddProspectButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [pending, start] = useTransition();
  const [err, setErr] = useState('');

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  function close() { setOpen(false); setErr(''); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    start(async () => {
      const r = await createProspect(f);
      if (r.error) { setErr(r.error); return; }
      setF(EMPTY);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-[#5701f3] hover:bg-[#4801cc] px-4 py-2 text-sm font-medium text-white transition-colors"
      >
        + Ajouter un prospect
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={close} />
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-neutral-200 shadow-xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0a0a0a]">Nouveau prospect</h2>
              <button onClick={close} className="text-[#a3a3a3] hover:text-[#0a0a0a] text-lg leading-none">✕</button>
            </div>

            <form onSubmit={submit} className="mt-4 space-y-3">
              <div>
                <label className="label block mb-1">Nom du commerce *</label>
                <input required autoFocus value={f.business_name} onChange={set('business_name')} className={inputCls} placeholder="Plomberie Tremblay" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label block mb-1">Niche *</label>
                  <input required value={f.niche} onChange={set('niche')} className={inputCls} placeholder="plombier" />
                </div>
                <div>
                  <label className="label block mb-1">Ville *</label>
                  <input required value={f.city} onChange={set('city')} className={inputCls} placeholder="Longueuil" />
                </div>
              </div>
              <div>
                <label className="label block mb-1">Téléphone</label>
                <input type="tel" value={f.phone} onChange={set('phone')} className={inputCls} placeholder="(514) 555-0000" />
              </div>
              <div>
                <label className="label block mb-1">Notes</label>
                <textarea value={f.notes} onChange={set('notes')} rows={3} className={`${inputCls} resize-none`} placeholder="Rencontré au salon… rappeler jeudi…" />
              </div>

              {err && <p className="text-sm text-red-600">{err}</p>}

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={pending}
                  className="rounded-md bg-[#5701f3] hover:bg-[#4801cc] disabled:opacity-70 px-4 py-2 text-sm font-medium text-white transition-colors">
                  {pending ? 'Ajout…' : 'Ajouter au pipeline'}
                </button>
                <button type="button" onClick={close} className="rounded-md px-4 py-2 text-sm text-[#525252] hover:bg-[#f5f5f5] transition-colors">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
