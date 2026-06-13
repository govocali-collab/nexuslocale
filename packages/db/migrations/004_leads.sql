-- Migration 004 : table leads

create table leads (
  id             uuid primary key default gen_random_uuid(),
  site_id        uuid        not null references sites (id) on delete cascade,
  type           lead_type   not null,
  caller_number  text,
  duration_sec   int,
  recording_url  text,
  payload        jsonb,
  created_at     timestamptz not null default now()
);

create index leads_site_id_idx on leads (site_id);

-- RLS
alter table leads enable row level security;

create policy "service role full access"
  on leads
  for all
  to service_role
  using (true)
  with check (true);
