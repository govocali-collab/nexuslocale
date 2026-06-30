'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { sendSms, type MessageRow } from '@/lib/sms-actions';

interface Contact { id: string; name: string; phone: string }

const TEMPLATES = [
  'Bonjour, c\'est Jonathan de NexusLocale. Je vous rappelle dans 2 minutes.',
  'Bonjour ! Voici le lien de votre démo : ',
  'Petit suivi suite à notre appel — êtes-vous toujours intéressé ?',
];

const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function MessagesView({ contacts, messages }: { contacts: Contact[]; messages: MessageRow[] }) {
  const router = useRouter();
  const [contactId, setContactId] = useState('');     // '' = numéro manuel
  const [phone, setPhone]         = useState('');
  const [name, setName]           = useState<string | null>(null);
  const [body, setBody]           = useState('');
  const [pending, start]          = useTransition();
  const [err, setErr]             = useState('');
  const [sent, setSent]           = useState(false);

  function pickContact(id: string) {
    setContactId(id);
    const c = contacts.find((x) => x.id === id);
    if (c) { setPhone(c.phone); setName(c.name); }
    else { setName(null); }
  }

  const segments = Math.max(1, Math.ceil(body.length / 160));

  function send() {
    setErr(''); setSent(false);
    if (!phone.trim() || !body.trim()) { setErr('Choisis un destinataire et écris un message.'); return; }
    start(async () => {
      const r = await sendSms({ phone: phone.trim(), body, prospectId: contactId || null, name });
      if (r.ok) { setSent(true); setBody(''); setTimeout(() => setSent(false), 3000); router.refresh(); }
      else setErr(r.error ?? 'Échec de l\'envoi.');
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl">
      {/* Composer */}
      <div className="card p-5 space-y-3 h-fit">
        <p className="label">Nouveau message</p>

        <div className="space-y-1.5">
          <label className="label block">À qui ?</label>
          <select value={contactId} onChange={(e) => pickContact(e.target.value)}
            className="w-full rounded-md bg-[#fafafa] border-[#e5e5e5] text-[#0a0a0a] text-sm py-1.5">
            <option value="">— Numéro manuel —</option>
            {contacts.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
          </select>
          {!contactId && (
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+15145550000"
              className="w-full rounded-md bg-[#fafafa] border-[#e5e5e5] text-[#0a0a0a] text-sm placeholder-[#a3a3a3] px-3 py-1.5 focus:ring-indigo-500 focus:border-indigo-500" />
          )}
        </div>

        <div className="space-y-1.5">
          <label className="label block">Message</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5}
            placeholder="Bonjour, c'est Jonathan de NexusLocale…"
            className="w-full rounded-md bg-[#fafafa] border-[#e5e5e5] text-[#0a0a0a] text-sm placeholder-[#a3a3a3] px-3 py-2 resize-none focus:ring-indigo-500 focus:border-indigo-500" />
          <p className="text-[11px] text-[#a3a3a3]">{body.length} caractères · {segments} SMS</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {TEMPLATES.map((t, i) => (
            <button key={i} type="button" onClick={() => setBody(t)}
              className="text-[11px] rounded-full border border-[#e5e5e5] px-2.5 py-1 text-[#525252] hover:bg-[#f5f5f5]">
              {t.length > 32 ? t.slice(0, 32) + '…' : t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button onClick={send} disabled={pending}
            className="rounded-md bg-[#5701f3] hover:bg-[#4801cc] disabled:opacity-70 px-4 py-2 text-sm font-medium text-white">
            {pending ? 'Envoi…' : '📤 Envoyer le texto'}
          </button>
          {sent && <span className="text-sm text-emerald-600 font-medium">✓ Envoyé</span>}
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>
        <p className="text-[11px] text-[#a3a3a3]">Envoie surtout à des clients qui ont consenti (LCAP). Le client peut répondre « STOP » pour se désabonner.</p>
      </div>

      {/* Historique / conversations */}
      <div className="card overflow-hidden h-fit">
        <div className="px-4 py-3 border-b border-neutral-200"><p className="label">Messages</p></div>
        {messages.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[#a3a3a3]">Aucun message pour l&apos;instant.</p>
        ) : (
          <ul className="divide-y divide-[#f0f0f0] max-h-[32rem] overflow-y-auto">
            {messages.map((m) => {
              const out = m.direction === 'out';
              return (
                <li key={m.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-sm font-medium text-[#0a0a0a]">
                      {out ? '→ ' : '← '}{m.name ?? m.phone}
                    </span>
                    <span className="text-[11px] text-[#a3a3a3] whitespace-nowrap">{fmtWhen(m.created_at)}</span>
                  </div>
                  <p className={`text-sm whitespace-pre-wrap leading-snug ${out ? 'text-[#525252]' : 'text-[#0a0a0a]'}`}>{m.body}</p>
                  {!out && <span className="text-[10px] text-emerald-600 font-medium">reçu</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
