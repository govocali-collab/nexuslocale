# @nexuslocale/demo-gen

Génère un `config.json` de démo personnalisé à partir d'un prospect Supabase.
Pont entre le **Prospector** (détecte les prospects) et le **Builder** (déploie le site).

## Flux complet

```
Prospector → Supabase (table prospects)
                 ↓
           demo-gen ← Anthropic API (génération contenu)
                 ↓
         configs/demo-<slug>.json
                 ↓
    deploy.mts --demo (déploie sur Vercel)
```

## Commandes

```bash
# Depuis la racine du monorepo
cd apps/demo-gen

# Générer pour un prospect par nom + ville
npx dotenv -e ../../.env -- npx tsx src/index.ts "Le Groupe Ultra" "Granby"

# Générer pour les 5 meilleurs prospects (status=new, triés par score)
npx dotenv -e ../../.env -- npx tsx src/index.ts --top 5

# Voir le coût estimé AVANT de lancer
npx dotenv -e ../../.env -- npx tsx src/index.ts --top 3 --estimate

# Tester sans aucune API (contenu fictif, zod validé)
npx tsx src/index.ts --simulate
```

## Variables d'environnement requises

| Variable              | Usage                         |
|----------------------|-------------------------------|
| `ANTHROPIC_API_KEY`  | Génération du contenu         |
| `SUPABASE_URL`       | Lecture des prospects         |
| `SUPABASE_SERVICE_KEY` | Auth Supabase               |
| `GOOGLE_PLACES_API_KEY` | Enrichissement optionnel (avis, horaires) |

## Flags

| Flag          | Description                                      |
|--------------|--------------------------------------------------|
| `--top <n>`  | Prend les N meilleurs prospects status='new'     |
| `--estimate` | Affiche le coût Anthropic estimé, demande confirmation |
| `--simulate` | Génère sans API (contenu fictif, pour tester)   |

## Coût estimé

| Étape            | Coût par config |
|-----------------|-----------------|
| Anthropic API   | ~$0.075 USD     |
| Places enrichissement | ~$0.049 USD (optionnel) |
| **Total**       | **~$0.12 USD**  |

> Tarifs approximatifs claude-sonnet-4-6 — vérifier console.anthropic.com

## Sortie

Le config est écrit dans `/configs/demo-<slug>.json` (à la racine du monorepo).

**Résumé terminal :**
```
✅ Le Groupe Ultra
   Fichier   : /…/configs/demo-le-groupe-ultra.json
   Domaine   : demo-le-groupe-ultra.nexuslocale.com
   Services  : 4 pages
   Zones     : 4 villes

   Prochaine étape :
   npx dotenv -e .env -- npx tsx apps/site-template/scripts/deploy.mts \
     configs/demo-le-groupe-ultra.json --demo
```

## Validation

Le config généré est validé contre le schéma Zod de `apps/site-template/src/schema/config.ts`.

En cas d'échec de validation :
1. Auto-correction automatique (truncate meta_title/description, compléter local_data)
2. Si toujours invalide : message d'erreur détaillé avec les champs en cause

## Règles de contenu (intégrées au prompt Anthropic)

- Français québécois, ton professionnel de métier
- Aucune statistique inventée (`#1 à`, `500 clients`, etc.)
- `nav_label` ≤ 30 car. (services) / ≤ 20 car. (zones)
- `meta_title` ≤ 60 car. | `meta_description` ≤ 160 car.
- Chaque page service : `local_data` avec ≥ 2 champs remplis
- Chaque zone : `neighborhoods` + `local_context` ≥ 80 car.
- Quartiers et points de repère **réels** de la région
