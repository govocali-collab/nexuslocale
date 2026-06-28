-- Migration 017 : table appointments (RDV démo Zoom bookés via Cal.com)
-- Alimentée par le webhook Cal.com ; sert aussi aux rappels SMS pré-RDV.

create table if not exists public.appointments (
  id               uuid primary key default gen_random_uuid(),
  prospect_id      uuid references public.prospects(id) on delete set null,
  name             text,
  email            text,
  phone            text,
  starts_at        timestamptz not null,
  ends_at          timestamptz,
  zoom_url         text,
  cal_uid          text unique,           -- identifiant Cal.com (idempotence + annulation)
  status           text not null default 'booked', -- booked | cancelled
  reminder_sent_at timestamptz,           -- null tant que le SMS de rappel n'est pas envoyé
  created_at       timestamptz not null default now()
);

create index if not exists appointments_starts_at_idx on public.appointments (starts_at);
create index if not exists appointments_status_idx on public.appointments (status);

alter table public.appointments enable row level security;

create policy "service role full access"
  on public.appointments
  for all
  to service_role
  using (true)
  with check (true);
