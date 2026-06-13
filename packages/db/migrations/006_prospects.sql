-- Migration 006 : table prospects

create table prospects (
  id               uuid primary key default gen_random_uuid(),
  business_name    text             not null,
  niche            text             not null,
  city             text             not null,
  phone            text,
  rating           numeric(3, 1),
  review_count     int,
  web_presence     web_presence     not null default 'none',
  pain_score       int,
  prospect_score   numeric(5, 2),
  status           prospect_status  not null default 'new',
  demo_url         text,
  created_at       timestamptz      not null default now()
);

-- RLS
alter table prospects enable row level security;

create policy "service role full access"
  on prospects
  for all
  to service_role
  using (true)
  with check (true);
