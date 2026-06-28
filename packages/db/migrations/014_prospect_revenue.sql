-- Migration 014 : valeur $ par prospect (pour suivre les revenus depuis la fiche)
-- sale_value    = montant unique d'une vente de site web (one-time)
-- monthly_value = revenu mensuel récurrent (hébergement / location rank-and-rent)
alter table public.prospects add column if not exists sale_value    numeric;
alter table public.prospects add column if not exists monthly_value numeric;
