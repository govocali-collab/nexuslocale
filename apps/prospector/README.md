# @nexuslocale/prospector

CLI qui scanne Google Places, détecte les entreprises avec une présence web faible,
les score et les écrit dans Supabase comme prospects de vente.

## Setup

1. Ajoute ta clé Google Places dans `.env` à la racine :
   ```
   GOOGLE_PLACES_API_KEY=AIza...
   ```

2. Active l'API dans Google Cloud Console :
   **APIs & Services → Places API (New)**

## Commandes

```bash
# Depuis la racine du monorepo
cd apps/prospector

# Scan réel (consomme l'API)
npx tsx src/index.ts scan "excavation" "Granby QC"

# Estimation du coût AVANT de lancer
npx tsx src/index.ts scan "excavation" "Granby QC" --estimate

# Test sans API (données simulées)
npx tsx src/index.ts scan "excavation" "Granby QC" --simulate

# Limiter à 20 entreprises, minimum 10 avis
npx tsx src/index.ts scan "plombier" "Sherbrooke QC" --limit 20 --min-reviews 10
```

## Flags

| Flag | Description | Défaut |
|---|---|---|
| `--estimate` | Affiche le coût API estimé et demande confirmation | — |
| `--simulate` | Utilise les fixtures locales (sans appel API) | — |
| `--limit <n>` | Max d'entreprises analysées | 60 |
| `--min-reviews <n>` | Exclure les entreprises sous ce seuil d'avis | 0 |

## Scoring

```
prospect_score = rating_factor × review_count × presence_factor

rating_factor  = 1.0 si rating ≥ 4.3, sinon 0.3
presence_factor:
  none        → 2.0   (aucun site = douleur max)
  social_only → 1.8   (Facebook/Instagram seulement)
  has_site    → pain_score / 50  (site mauvais = score élevé)
```

**Cible idéale** : bien noté (4.3+), beaucoup d'avis, aucun site web.

## Pain score (0–100)

| Problème détecté | Points |
|---|---|
| Lien mort / erreur SSL / timeout / 404 | +40 |
| Pas de HTTPS | +20 |
| Pas de balise viewport (non responsive) | +20 |
| Copyright < 2022 dans le footer | +10 |
| Builder daté (Wix, GoDaddy…) ou page > 5 Mo | +10 |

Pour `none` et `social_only` : pain_score = 100 automatiquement.

## Sortie

- **Terminal** : tableau classé par score décroissant avec émojis pain (💀🔴🟡🟢)
- **CSV** : `prospects-{niche}-{ville}-{date}.csv` dans le dossier courant
- **Supabase** : upsert dans la table `prospects` (déduplique sur business_name + city)

## Ajouter des fixtures

Pour tester une nouvelle niche sans API :

```bash
cp fixtures/granby-excavation.json fixtures/sherbrooke-plombier.json
# Édite les données dans le nouveau fichier
npx tsx src/index.ts scan "plombier" "Sherbrooke QC" --simulate
```
