# @nexuslocale/finder

CLI de détection de niches locales rentables. Utilise DataForSEO Labs pour le keyword research et Namecheap pour la vérification + achat de domaines.

---

## Flux complet

```
finder scan → keyword research → clusters → domaines dispo → niche_score → Supabase
finder buy  → confirmation → achat Namecheap → DNS Vercel → Supabase
```

---

## Variables d'environnement

```env
# Supabase (pour écriture dans sites)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_…

# DataForSEO
DATAFORSEO_LOGIN=app@nexuslocale.com
DATAFORSEO_PASSWORD=<mot de passe API>

# Namecheap
NAMECHEAP_API_USER=<votre username Namecheap>
NAMECHEAP_API_KEY=<clé API>
NAMECHEAP_CLIENT_IP=<votre IP publique whitelistée>

# Coordonnées registrant (pour l'achat de domaine)
NC_FIRST_NAME=Jonathan
NC_LAST_NAME=Hebert
NC_ADDRESS=123 Rue Principale
NC_CITY=Sherbrooke
NC_PROVINCE=Quebec
NC_POSTAL=J1H 1A1
NC_COUNTRY=CA
NC_PHONE=+1.8195550000
NC_EMAIL=contact@nexuslocale.com
```

---

## Setup DataForSEO

1. Créer un compte sur [app.dataforseo.com](https://app.dataforseo.com)
2. Récupérer le login (email) et le mot de passe API dans **API Access**
3. Ajouter des crédits (min. $1 pour tester — coût ~$0.002/scan)
4. Ajouter dans `.env`

---

## Setup Namecheap

### 1. Activer l'accès API
- Compte Namecheap → **Profile → Tools → Business & Dev Tools → Namecheap API Access**
- Activer "API Access"
- Copier la **API Key**

### 2. Whitelister votre IP
- Dans la même page → **Whitelisted IPs** → ajouter votre IP publique
- Trouver votre IP : `curl ifconfig.me`
- Mettre dans `.env` : `NAMECHEAP_CLIENT_IP=<votre IP>`

> ⚠️  Namecheap exige min. 20 domaines OU $50 de dépôt pour activer l'API production.
> Utilisez `--sandbox` pour tester sans ces prérequis.

### 3. Sandbox (tests sans achat réel)
- URL sandbox : `https://api.sandbox.namecheap.com/xml.response`
- Les domaines vérifiés en sandbox sont fictifs mais les appels sont validés
- Toujours utiliser `--sandbox` pour les premiers tests

---

## Commandes

```bash
# Alias pratique
alias finder="npx dotenv -e ../../.env -- pnpm cli"

# Estimer les coûts sans appeler les API (données simulées)
finder scan "dégât d'eau" "Sherbrooke QC" --estimate

# Scan réel (confirmation coût avant appel)
finder scan "dégât d'eau" "Sherbrooke QC"

# Scan avec filtre de difficulté
finder scan "toiture" "Laval QC" --max-difficulty 30 --lang fr

# Vérifier un domaine sans acheter
finder scan "excavation" "Granby QC" --estimate

# Acheter un domaine (sandbox — aucun débit)
finder buy degateausherbrooke.ca --sandbox

# Acheter et configurer DNS Vercel
finder buy degateausherbrooke.ca --set-dns

# Acheter et lier à un site Supabase existant
finder buy degateausherbrooke.ca --site-id <uuid>
```

---

## Scoring

```
score_kw = (CPC × volume_mensuel) / max(difficulté, 1)
```

- **CPC élevé** : les annonceurs paient cher → la niche a de la valeur locative
- **Volume raisonnable** : trafic réel disponible
- **Difficulté faible** : on peut se positionner sans backlinks

```
niche_score = moyenne(top 10 scores) × bonus_domaine
bonus_domaine = 1.2 si un exact-match .ca est disponible ≤ $20
```

---

## Sortie d'un scan

```
┌─────────────────────────────────────────────┬──────────┬────────┬──────┬──────────┐
│ Mot-clé                                     │ Volume   │  CPC $ │  KD  │  Score   │
├─────────────────────────────────────────────┼──────────┼────────┼──────┼──────────┤
│ dégât d'eau sherbrooke                      │      720 │  12.50 │   18 │      500 │
│ urgence dégât d'eau                         │      880 │   8.30 │   25 │      292 │
│ restauration dégât d'eau sherbrooke         │      390 │  15.20 │   22 │      269 │
...

── Clusters ──
  [degat eau sherbrooke]
    Vol. total 1510  ·  CPC moy. $12.63  ·  Score 310.78
    dégât d'eau sherbrooke · restauration dégât d'eau sherbrooke ...

── Domaines candidats ──
  degateausherbrooke.ca                       ✓       $12.98     exact
  degateausherbrooke.com                      ✗       —          exact
  degat-eau-sherbrooke.ca                     ✓       $12.98     exact

── Recommandation ──
  Niche score    : 372.94
  Meilleur domaine : degateausherbrooke.ca ($12.98/an)
  → finder buy degateausherbrooke.ca
```

---

## Après l'achat d'un domaine

1. DNS Vercel configurés (automatique avec `--set-dns`, ou manuellement)
2. Ajouter le domaine dans Vercel sur le projet `site-template`
3. Lancer `demo-gen` pour générer le contenu du site
4. Déployer via `pnpm deploy` ou Vercel CI
