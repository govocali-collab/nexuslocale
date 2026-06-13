-- Migration 008 : colonnes supplémentaires sur prospects
-- Requis par apps/prospector (étapes 15-17)

alter table prospects
  add column if not exists website          text,
  add column if not exists maps_url         text,
  add column if not exists detected_issues  jsonb;

-- Contrainte unique pour l'upsert du prospector (business_name + city)
-- PostgreSQL ne supporte pas IF NOT EXISTS sur ADD CONSTRAINT — on utilise un DO block
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'prospects_business_city_unique'
  ) then
    alter table prospects
      add constraint prospects_business_city_unique
      unique (business_name, city);
  end if;
end $$;
