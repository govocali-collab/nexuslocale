-- Migration 016 : date de conversion (« Gagné ») pour attribuer les ventes au bon mois.
alter table public.prospects add column if not exists won_at timestamptz;
