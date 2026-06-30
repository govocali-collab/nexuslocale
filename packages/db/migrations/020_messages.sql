-- Migration 020 : table messages (SMS envoyés + reçus), pour la section Messages.

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  prospect_id uuid references public.prospects(id) on delete set null,
  name        text,                       -- nom du contact (dénormalisé pour l'affichage)
  phone       text not null,              -- numéro du client (E.164)
  direction   text not null,              -- 'out' (envoyé) | 'in' (reçu)
  body        text not null,
  status      text,                       -- statut Twilio (sent/delivered/failed) pour les envois
  twilio_sid  text,
  created_at  timestamptz not null default now()
);

create index if not exists messages_created_at_idx on public.messages (created_at desc);
create index if not exists messages_phone_idx on public.messages (phone);

alter table public.messages enable row level security;

create policy "service role full access"
  on public.messages for all to service_role using (true) with check (true);

grant all on table public.messages to service_role, anon, authenticated;
