-- Migration 007 : table upsells

create table upsells (
  id             uuid           primary key default gen_random_uuid(),
  client_id      uuid           not null references clients (id) on delete cascade,
  product        upsell_product not null,
  monthly_price  numeric(10, 2) not null,
  status         upsell_status  not null default 'active',
  created_at     timestamptz    not null default now()
);

create index upsells_client_id_idx on upsells (client_id);

-- RLS
alter table upsells enable row level security;

create policy "service role full access"
  on upsells
  for all
  to service_role
  using (true)
  with check (true);
