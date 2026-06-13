-- Migration 003 : table sites

create table sites (
  id              uuid primary key default gen_random_uuid(),
  domain          text not null unique,
  type            site_type   not null,
  niche           text        not null,
  city            text        not null,
  status          site_status not null default 'research',
  twilio_number   text,
  forward_to      text,
  vercel_project  text,
  gsc_property    text,
  monthly_rent    numeric(10, 2),
  client_id       uuid references clients (id) on delete set null,
  created_at      timestamptz not null default now()
);

create index sites_client_id_idx on sites (client_id);

-- Lier clients.site_id → sites (FK différée pour éviter la dépendance circulaire)
alter table clients
  add constraint clients_site_id_fkey
  foreign key (site_id) references sites (id) on delete set null;

create index clients_site_id_idx on clients (site_id);

-- RLS
alter table sites enable row level security;

create policy "service role full access"
  on sites
  for all
  to service_role
  using (true)
  with check (true);
