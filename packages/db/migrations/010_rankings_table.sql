-- Migration 010 : table rankings + colonne gsc_property sur sites

ALTER TABLE sites ADD COLUMN IF NOT EXISTS gsc_property TEXT;

CREATE TABLE IF NOT EXISTS rankings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     UUID        NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  keyword     TEXT        NOT NULL,
  position    INTEGER,
  page        TEXT,
  impressions INTEGER,
  clicks      INTEGER,
  ctr         NUMERIC(6,4),
  checked_at  DATE        NOT NULL DEFAULT CURRENT_DATE,
  source      TEXT        NOT NULL DEFAULT 'dataforseo',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rankings_site_kw_date
  ON rankings (site_id, keyword, checked_at DESC);
