-- Migration 015 : courriel du prospect (saisi manuellement dans la fiche).
alter table public.prospects add column if not exists email text;
