-- Migration 002 : table clients
-- Doit être créée AVANT sites (sites.client_id → clients.id)

create table clients (
  id                     uuid primary key default gen_random_uuid(),
  business_name          text not null,
  contact                text,
  phone                  text,
  email                  text,
  site_id                uuid,           -- FK ajoutée après création de sites (migration 004)
  sale_price             numeric(10, 2),
  hosting_monthly        numeric(10, 2),
  stripe_subscription_id text,
  created_at             timestamptz not null default now()
);

-- RLS
alter table clients enable row level security;

create policy "service role full access"
  on clients
  for all
  to service_role
  using (true)
  with check (true);
