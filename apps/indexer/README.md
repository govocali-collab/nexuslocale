# @nexuslocale/indexer-cli

Soumet les sites à Google Search Console et suit leurs positions SERP hebdomadairement.

---

## Flux

```
indexer submit <site_id>   →  vérification GSC + sitemap + inspection URLs → status: indexed
indexer rank   <site_id>   →  positions DataForSEO + données GSC → table rankings
indexer cron               →  rank de TOUS les sites indexed/ranking/rented (hebdo)
indexer history <site_id>  →  affiche l'historique des positions
```

---

## Variables d'environnement

```env
# Google Search Console
GSC_CLIENT_EMAIL=gsc-indexer@<project>.iam.gserviceaccount.com
GSC_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----

# DataForSEO (même que pour finder)
DATAFORSEO_LOGIN=app@nexuslocale.com
DATAFORSEO_PASSWORD=<mot de passe API>

# Supabase (même que les autres modules)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_…

# Cron (pour la route Vercel, optionnel)
CRON_SECRET=<secret aléatoire>
```

---

## Setup Google Service Account

### 1. Créer le projet et le service account

1. [console.cloud.google.com](https://console.cloud.google.com) → nouveau projet (ou projet existant)
2. **APIs & Services → Library** → activer :
   - **Google Search Console API** (Webmasters API)
   - **Google Site Verification API**
3. **IAM & Admin → Service Accounts** → Créer un service account
   - Nom : `gsc-indexer`
   - Rôle : aucun rôle Cloud nécessaire (on n'a pas besoin d'accès GCP)
4. Dans le service account → **Keys → Add Key → JSON** → télécharger le fichier
5. Extraire du JSON :
   - `client_email` → `GSC_CLIENT_EMAIL`
   - `private_key`  → `GSC_PRIVATE_KEY` (copiez la valeur telle quelle, `\n` inclus)

### 2. Ajouter le service account à chaque propriété GSC

Pour chaque site que vous indexez :

1. [search.google.com/search-console](https://search.google.com/search-console)
2. Sélectionnez la propriété (ou attendez que `indexer submit` la crée)
3. **Paramètres → Utilisateurs et autorisations → Ajouter un utilisateur**
4. Email : `GSC_CLIENT_EMAIL` → Rôle : **Propriétaire**

> **Important** : sans ce rôle, l'API URL Inspection refusera les requêtes (403).

### 3. Vérification DNS

`indexer submit` utilise la **vérification par enregistrement DNS TXT** (méthode `INET_DOMAIN`).

- Avantage : couvre tous les sous-domaines + HTTP/HTTPS (propriété de domaine)
- Inconvénient : nécessite un accès aux DNS (1-5 min de propagation)

Alternative non implémentée : vérification HTML (fichier servi par le site).
Si vous préférez cette méthode, vérifiez manuellement dans GSC puis utilisez `--skip-verify`.

---

## Limite de l'Indexing API Google

L'**API Google Indexing** (`https://indexing.googleapis.com/v3/urlNotifications:publish`)
supporte officiellement **uniquement** les types de pages :

- `JobPosting` (offres d'emploi avec balisage Schema.org)
- `BroadcastEvent` + `VideoObject` (streaming en direct)

Pour des pages locales classiques (rank-and-rent), cette API **n'est pas garantie** de fonctionner.
Elle peut indexer d'autres pages dans la pratique, mais Google peut l'ignorer ou retourner une erreur.

**Notre approche** (recommandée par Google pour les sites classiques) :
1. Soumettre le sitemap → Google le crawle selon son propre calendrier
2. URL Inspection API pour vérifier le statut d'indexation
3. GSC Search Analytics pour suivre les impressions/clics réels

Le flag `--use-indexing-api` appelle quand même l'API pour chaque URL si vous voulez tester,
mais il est isolé pour ne pas bloquer le flux principal.

---

## Commandes

```bash
# Alias pratique (depuis la racine)
alias indexer="npx dotenv -e .env -- pnpm --filter @nexuslocale/indexer-cli cli"

# Dry-run (aucun appel API)
indexer submit <site_id> --estimate
indexer rank   <site_id> --estimate

# Soumission réelle à GSC
indexer submit <site_id>

# Si le site est déjà vérifié dans GSC
indexer submit <site_id> --skip-verify

# Rank tracking ponctuel
indexer rank <site_id>

# Rank tracking + données GSC (clics/impressions réels)
indexer rank <site_id> --with-gsc

# Historique des positions
indexer history <site_id>
indexer history <site_id> --keyword "dégât d'eau sherbrooke"

# Cron manuel (tous les sites)
npx dotenv -e .env -- pnpm --filter @nexuslocale/indexer-cli cron

# Cron dry-run
npx dotenv -e .env -- pnpm --filter @nexuslocale/indexer-cli cron -- --dry-run
```

---

## Setup Cron

### Option A — GitHub Actions (recommandé)

Créez `.github/workflows/rank-cron.yml` :

```yaml
name: Rank tracking hebdomadaire
on:
  schedule:
    - cron: '0 8 * * 1'  # Lundi 8h UTC
  workflow_dispatch:       # déclenchement manuel aussi

jobs:
  rank:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install
      - run: pnpm --filter @nexuslocale/indexer-cli cron
        env:
          SUPABASE_URL:          ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY:  ${{ secrets.SUPABASE_SERVICE_KEY }}
          DATAFORSEO_LOGIN:      ${{ secrets.DATAFORSEO_LOGIN }}
          DATAFORSEO_PASSWORD:   ${{ secrets.DATAFORSEO_PASSWORD }}
          GSC_CLIENT_EMAIL:      ${{ secrets.GSC_CLIENT_EMAIL }}
          GSC_PRIVATE_KEY:       ${{ secrets.GSC_PRIVATE_KEY }}
```

### Option B — Vercel Cron

Ajoutez dans `apps/dashboard/vercel.json` :

```json
{
  "crons": [{ "path": "/api/cron/rank", "schedule": "0 8 * * 1" }]
}
```

Puis dans `apps/dashboard/src/app/api/cron/rank/route.ts` :

```typescript
import { runRankCron } from '@nexuslocale/indexer-cli/cron';  // à exporter
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env['CRON_SECRET']) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const results = await runRankCron();
  return NextResponse.json({ results });
}
```

---

## Migration Supabase

Appliquez `packages/db/migrations/010_rankings_table.sql` dans le SQL Editor Supabase :

```sql
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
```
