-- Migration 016 : date de conversion (« Gagné »).
-- Permet d'attribuer chaque vente au mois exact où le prospect est marqué « Gagnés ».
alter table public.prospects add column if not exists won_at timestamptz;
