-- Migration 012 : sites publiés (hébergement multi-tenant)
-- Un site « beau » (HTML autonome) = une ligne. Servi publiquement à /s/<slug>.
-- Pas de déploiement Vercel par site — une seule app sert tous les sites.

create table if not exists public.published_sites (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  business_name text not null,
  html          text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists published_sites_slug_idx on public.published_sites (slug);

-- RLS activé sans policy : seul le service_role (route + action serveur) y accède.
-- Le HTML est servi côté serveur, jamais exposé via l'API publique.
alter table public.published_sites enable row level security;
