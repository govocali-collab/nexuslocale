-- Migration 009 : colonnes research pour le FINDER
-- Permet domain = NULL (avant achat) et stocke métriques DataForSEO + candidats Namecheap

ALTER TABLE sites
  ALTER COLUMN domain DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS research_data     JSONB,
  ADD COLUMN IF NOT EXISTS candidate_domains JSONB;
