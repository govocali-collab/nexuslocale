# @nexuslocale/site-template

Template Next.js 15 qui génère un site local complet à partir d'un `config.json`.
Un config = un site Vercel indépendant.

## Créer un config

Copie `configs/excavation-granby.json` comme point de départ :

```bash
cp configs/excavation-granby.json configs/mon-site.json
```

Édite les champs. Règles importantes :
- `nav_label` sur chaque service : court (max 30 car.) — c'est ce qui apparaît dans le menu
- `h1` : le titre SEO complet — jamais dans le menu
- Chaque `local_data` de service doit avoir ≥ 2 champs remplis (validation Zod)
- `business.phone` est la **source unique** du numéro — il s'affiche partout depuis là

## Prévisualiser en local

```bash
cd apps/site-template

# Avec le config par défaut (excavation-granby.json)
pnpm dev

# Avec un autre config
SITE_CONFIG_PATH=../../configs/mon-site.json pnpm dev
```

Le site tourne sur http://localhost:3000.

En `mode: "demo"`, un bandeau avertit que le site est non indexé.

## Valider le config (sans lancer le serveur)

```bash
node -e "
  const { SiteConfigSchema } = require('./src/schema/config');
  const raw = JSON.parse(require('fs').readFileSync('../../configs/mon-site.json', 'utf8'));
  const r = SiteConfigSchema.safeParse(raw);
  if (!r.success) console.error(r.error.issues); else console.log('✓ Config valide');
"
```

## Générer les images de marque

```bash
# Depuis la racine du monorepo
pnpm --filter @nexuslocale/images build
node packages/images/dist/generate.js configs/mon-site.json apps/site-template/public/images/brand
```

Produit deux PNG dans `public/images/brand/` :
- `{domain}-hero.png` — 1200×630 (OpenGraph)
- `{domain}-banner.png` — 1200×300

## Déployer en démo (Partie E — prochaine session)

```bash
# Script CLI à venir
deploy configs/mon-site.json --demo
```

## Passer en production

1. Changer `"mode": "production"` dans le config
2. Redéployer — le bandeau démo et le noindex disparaissent automatiquement

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `SITE_CONFIG_PATH` | Chemin absolu ou relatif vers le config.json |
| `SITE_CONFIG_JSON` | Config encodé en base64 (pour Vercel sans fichier) |

Si aucune des deux n'est définie, le template charge `../../configs/excavation-granby.json`.
