# NexusLocale

Plateforme de production et gestion de sites web locaux, monétisés par
**rank-and-rent** (louer le site à un business local) et **vente directe**.

---

## Structure du monorepo

```
nexuslocale/
├── apps/
│   ├── prospector/      # Scrape Google Places, score et contacte les prospects
│   ├── finder/          # Détecte les niches locales via keyword research (DataForSEO)
│   ├── dashboard/       # Interface web centrale (sites, leads, rankings, clients)
│   └── site-template/   # Template de site local déployable sur Vercel
├── packages/
│   ├── db/              # ★ Client Supabase typé + helpers CRUD + migrations SQL
│   ├── tracker/         # Call tracking Twilio — log appels/SMS dans Supabase
│   ├── indexer/         # Ping GSC, vérifie indexation, lance ranking checks
│   └── images/          # Sourcing et optimisation d'images pour les sites
├── configs/             # Fichiers de config JSON par site (domaine, niche, ville…)
├── .env.example         # Variables d'environnement requises (voir le fichier)
└── README.md
```

---

## Les 6 tables Supabase

| Table | Rôle |
|---|---|
| **sites** | Un site local = une ligne. Contient domaine, niche, ville, statut, numéro Twilio, projet Vercel, propriété GSC, loyer mensuel et lien client. |
| **leads** | Chaque appel, SMS ou soumission de formulaire entrant sur un site. Lié à `sites`. |
| **rankings** | Historique des positions de ranking par keyword et par date. Lié à `sites`. |
| **prospects** | Businesses locaux identifiés par le Prospector. Score de douleur + score de prospect pour prioriser la prospection. |
| **clients** | Clients ayant loué ou acheté un site. Lié à `sites` (relation bi-directionnelle avec FK différée). |
| **upsells** | Services additionnels vendus aux clients (call tracking, SMS, AI chatbot, réceptionniste vocal). Lié à `clients`. |

---

## Les 5 modules

1. **finder** — Trouve les niches rentables (volume de recherche élevé, concurrence faible). Lance des keyword checks via DataForSEO, détecte les domaines disponibles via RDAP.
2. **prospector** — Scrape Google Places, calcule un `prospect_score` basé sur la faiblesse de présence web, les avis, la niche, et envoie des démos automatiques.
3. **tracker** — Webhook Twilio : reçoit les appels/SMS redirigés depuis les sites et insère un lead dans Supabase avec durée, numéro appelant et enregistrement.
4. **indexer** — Soumet les URLs à GSC, vérifie l'indexation, lance des ranking checks DataForSEO quotidiens et met à jour la table `rankings`.
5. **dashboard** — Interface Next.js/Remix qui affiche tout : pipeline de sites, leads entrants, courbes de ranking, pipeline CRM prospects → clients, MRR.

---

## Ordre de build

```
packages/db  →  packages/tracker
                packages/indexer
                packages/images
             →  apps/site-template
             →  apps/finder
             →  apps/prospector
             →  apps/dashboard
```

`@nexuslocale/db` est la seule dépendance partagée obligatoire — tout le reste peut
se construire en parallèle après lui.

---

## Appliquer les migrations Supabase

Les fichiers SQL sont dans `packages/db/migrations/`, numérotés dans l'ordre
d'application. Il y a une dépendance circulaire volontairement résolue en deux
étapes : `clients` est créé sans FK vers `sites`, puis la contrainte est ajoutée
dans la migration de `sites`.

### Méthode 1 — SQL Editor (Supabase Dashboard) — recommandé pour démarrer

1. Ouvre ton projet Supabase → **SQL Editor**
2. Colle et exécute chaque fichier **dans l'ordre** :
   - `001_enums.sql`
   - `002_clients.sql`
   - `003_sites.sql`
   - `004_leads.sql`
   - `005_rankings.sql`
   - `006_prospects.sql`
   - `007_upsells.sql`

### Méthode 2 — Supabase CLI

```bash
# Installer la CLI
brew install supabase/tap/supabase

# Se connecter
supabase login

# Lier au projet (trouver le project-ref dans les settings Supabase)
supabase link --project-ref <ton-project-ref>

# Appliquer les migrations dans l'ordre
for f in packages/db/migrations/*.sql; do
  echo "→ $f"
  supabase db push --file "$f"
done
```

### Méthode 3 — psql direct

```bash
# Récupérer l'URL de connexion dans Supabase → Settings → Database
psql "$DATABASE_URL" -f packages/db/migrations/001_enums.sql
psql "$DATABASE_URL" -f packages/db/migrations/002_clients.sql
psql "$DATABASE_URL" -f packages/db/migrations/003_sites.sql
psql "$DATABASE_URL" -f packages/db/migrations/004_leads.sql
psql "$DATABASE_URL" -f packages/db/migrations/005_rankings.sql
psql "$DATABASE_URL" -f packages/db/migrations/006_prospects.sql
psql "$DATABASE_URL" -f packages/db/migrations/007_upsells.sql
```

---

## Démarrage rapide

```bash
# 1. Copier les variables d'env
cp .env.example .env
# Remplir SUPABASE_URL et SUPABASE_SERVICE_KEY au minimum

# 2. Installer les dépendances
pnpm install

# 3. Builder le package db
pnpm --filter @nexuslocale/db build
```
