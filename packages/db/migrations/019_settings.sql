-- Migration 019 : table settings (clé/valeur) — ex. le script d'appel global,
-- partagé et éditable depuis n'importe quelle fiche prospect.

create table if not exists public.settings (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

create policy "service role full access"
  on public.settings for all to service_role using (true) with check (true);

grant all on table public.settings to service_role, anon, authenticated;
