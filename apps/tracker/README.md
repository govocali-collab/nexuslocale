# @nexuslocale/tracker-app

Webhook server + CLI for Twilio call tracking. Receives inbound calls/SMS, logs leads to Supabase, forwards calls to the client's phone, and sends SMS notifications.

---

## Variables d'environnement

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_…

# Twilio
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
OWNER_PHONE=+15145551234      # ton numéro pour les notifs SMS

# Tracker
TRACKER_WEBHOOK_URL=https://YOUR_TUNNEL.ngrok.io   # URL publique du serveur
PORT=3002                                            # optionnel, défaut 3002

# Dev uniquement — désactive la validation de signature
SKIP_TWILIO_SIGNATURE=true
```

---

## Démarrer le serveur de webhooks

```bash
# Dans apps/tracker/
dotenv -e ../../.env -- pnpm serve
```

Sortie attendue :
```
🎯 Tracker webhook server — port 3002
   Health  : http://localhost:3002/health
   Webhooks: https://YOUR_TUNNEL.ngrok.io/webhooks/voice
   Lead API: https://YOUR_TUNNEL.ngrok.io/api/lead
```

---

## CLI

```bash
# Préfixe toujours avec dotenv pour charger les secrets
alias tracker="dotenv -e ../../.env -- pnpm cli"

tracker provision <site_id>          # achète un numéro Twilio
tracker provision <site_id> --dry-run # cherche sans acheter
tracker release   <site_id>          # libère le numéro
tracker list                          # tous les sites actifs
tracker numbers                       # tous les numéros du compte Twilio
tracker report    <site_id> --days 30 # rapport de leads
```

---

## Flux complet en local avec ngrok (sans acheter de numéro)

### 1 — Exposer le serveur local

```bash
# Terminal 1 : démarrer le tracker
cd apps/tracker
SKIP_TWILIO_SIGNATURE=true \
SUPABASE_URL=... SUPABASE_SERVICE_KEY=... \
TWILIO_ACCOUNT_SID=... TWILIO_AUTH_TOKEN=... \
OWNER_PHONE=+1... \
TRACKER_WEBHOOK_URL=http://localhost:3002 \
pnpm serve

# Terminal 2 : tunnel ngrok
ngrok http 3002
# Copier l'URL https, ex: https://abc123.ngrok.io
```

### 2 — Tester la soumission de formulaire (pas de Twilio requis)

```bash
# Créer un site de test dans Supabase d'abord, récupérer son domaine
curl -X POST http://localhost:3002/api/lead \
  -H 'Content-Type: application/json' \
  -d '{
    "site_domain": "demo-le-groupe-ultra.nexuslocale.com",
    "name":        "Jean Tremblay",
    "phone":       "+15141234567",
    "email":       "jean@example.com",
    "message":     "J'\''ai besoin d'\''une estimation pour mon entrée de garage.",
    "service":     "excavation-fondation"
  }'
# Réponse attendue : {"ok":true,"received_at":"..."}
```

### 3 — Tester un appel entrant simulé (avec signature désactivée)

```bash
# Simuler un webhook Twilio de type voice
curl -X POST http://localhost:3002/webhooks/voice \
  -d 'To=%2B14501234567&From=%2B15141234567&CallSid=CA_TEST_001'
# Réponse : XML TwiML (say + dial ou say + hangup selon forward_to)

# Simuler la fin d'appel (status callback)
curl -X POST http://localhost:3002/webhooks/voice/status \
  -d 'To=%2B14501234567&From=%2B15141234567&CallSid=CA_TEST_001&DialCallStatus=completed&DialCallDuration=67'
```

### 4 — Simuler un SMS entrant

```bash
curl -X POST http://localhost:3002/webhooks/sms \
  -d 'To=%2B14501234567&From=%2B15141234567&Body=J%27ai%20un%20projet&MessageSid=SM_TEST_001'
```

### 5 — Provisionner un vrai numéro (quand tu es prêt)

```bash
# Mettre TRACKER_WEBHOOK_URL dans .env = l'URL ngrok stable (ngrok payant)
# ou déployer le tracker sur Railway/Fly.io d'abord

dotenv -e ../../.env -- pnpm cli provision <site_id>
# → achète un numéro local (indicatif détecté depuis la ville du site)
# → configure les webhooks Twilio automatiquement
# → met à jour twilio_number dans Supabase
```

---

## Configurer la redirection d'appels

Après provisionnement, mettre à jour le champ `forward_to` dans la table `sites` :

```sql
UPDATE sites
SET forward_to = '+15141234567'   -- numéro réel du client
WHERE id = 'uuid-du-site';
```

Les appels entrants seront alors redirigés vers ce numéro avec enregistrement.

---

## Lire un rapport de leads

```bash
dotenv -e ../../.env -- pnpm cli report <site_id> --days 30
```

```
📊 Rapport — demo-le-groupe-ultra.nexuslocale.com
   Période : 2026-05-14 → 2026-06-13

   Total       : 12
   Appels      : 7 (manqués: 2)
   SMS         : 3
   Formulaires : 2
   Durée moy.  : 84s
   Enregistrem.: 5
   Hors heures : 4 (leads manqués potentiels)

   💡 Argument upsell : 4 leads reçus hors heures
      → réceptionniste IA ou SMS automatique
```

---

## Routes HTTP

| Méthode | Route | Usage |
|---------|-------|-------|
| `POST` | `/webhooks/voice` | Appel entrant Twilio |
| `POST` | `/webhooks/voice/status` | Fin d'appel Twilio |
| `POST` | `/webhooks/sms` | SMS entrant Twilio |
| `POST` | `/api/lead` | Formulaire depuis le site (JSON) |
| `GET` | `/health` | Health check |
