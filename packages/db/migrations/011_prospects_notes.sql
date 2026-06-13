-- Migration 011 : champ notes sur prospects
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS notes TEXT;
