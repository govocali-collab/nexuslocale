-- Migration 005 : table rankings

create table rankings (
  id         uuid primary key default gen_random_uuid(),
  site_id    uuid not null references sites (id) on delete cascade,
  keyword    text not null,
  position   int  not null,
  checked_at date not null default current_date
);

create index rankings_site_id_idx on rankings (site_id);

-- RLS
alter table rankings enable row level security;

create policy "service role full access"
  on rankings
  for all
  to service_role
  using (true)
  with check (true);
