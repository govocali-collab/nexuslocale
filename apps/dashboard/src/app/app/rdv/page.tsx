import { createAdminClient } from '@/lib/admin';
import { CalEmbed } from '@/components/rdv/cal-embed';

export const dynamic = 'force-dynamic';

interface Appt {
  id: string; name: string | null; email: string | null; phone: string | null;
  starts_at: string; zoom_url: string | null; status: string; reminder_sent_at: string | null;
}

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('fr-CA', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default async function RdvPage() {
  const calLink = process.env['NEXT_PUBLIC_CAL_LINK'] ?? '';

  let upcoming: Appt[] = [];
  try {
    const db = createAdminClient();
    const { data } = await db
      .from('appointments')
      .select('id, name, email, phone, starts_at, zoom_url, status, reminder_sent_at')
      .eq('status', 'booked')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(20);
    upcoming = (data ?? []) as Appt[];
  } catch { /* table pas encore migrée */ }

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-lg font-semibold text-[#0a0a0a]">Rendez-vous démo Zoom</h1>

      {/* RDV à venir */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200">
          <p className="label">Prochains rendez-vous</p>
        </div>
        {upcoming.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[#a3a3a3]">Aucun rendez-vous à venir.</p>
        ) : (
          <ul className="divide-y divide-[#f0f0f0]">
            {upcoming.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-[#0a0a0a]">{a.name ?? a.email ?? 'Client'}</div>
                  <div className="text-xs text-[#a3a3a3]">{fmtDateTime(a.starts_at)}{a.phone ? ` · ${a.phone}` : ''}</div>
                </div>
                <div className="flex items-center gap-3">
                  {a.reminder_sent_at && <span className="text-xs text-emerald-600">SMS envoyé ✓</span>}
                  {a.zoom_url && <a href={a.zoom_url} target="_blank" rel="noopener noreferrer" className="rounded-md bg-[#5701f3] hover:bg-[#4801cc] px-3 py-1.5 text-xs text-white">Rejoindre Zoom</a>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Calendrier de réservation */}
      {calLink ? (
        <CalEmbed calLink={calLink} />
      ) : (
        <div className="card p-6 text-sm text-[#525252] space-y-2">
          <p className="font-medium text-[#0a0a0a]">Calendrier non configuré</p>
          <p>Ajoute la variable <span className="mono">NEXT_PUBLIC_CAL_LINK</span> (ex. <span className="mono">ton-nom/demo-zoom</span>) pour afficher le calendrier de réservation Cal.com ici.</p>
        </div>
      )}
    </div>
  );
}
