const STATUS_STYLES: Record<string, string> = {
  research:    'bg-slate-100 text-slate-600',
  built:       'bg-sky-100 text-sky-700',
  indexed:     'bg-amber-100 text-amber-700',
  ranking:     'bg-orange-100 text-orange-700',
  rented:      'bg-emerald-100 text-emerald-700',
  sold:        'bg-violet-100 text-violet-700',
  // lead types
  call:        'bg-sky-100 text-sky-700',
  sms:         'bg-violet-100 text-violet-700',
  form:        'bg-emerald-100 text-emerald-700',
  // prospect status
  new:         'bg-slate-100 text-slate-600',
  demo_booked: 'bg-violet-100 text-violet-700',
  demo_sent:   'bg-sky-100 text-sky-700',
  negotiating: 'bg-amber-100 text-amber-700',
  won:         'bg-emerald-100 text-emerald-700',
  lost:        'bg-red-100 text-red-700',
  // site type
  rent:        'bg-indigo-100 text-indigo-700',
  client:      'bg-teal-100 text-teal-700',
  demo:        'bg-slate-100 text-slate-600',
};

export function Badge({ value }: { value: string }) {
  const cls = STATUS_STYLES[value] ?? 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
      {value}
    </span>
  );
}
