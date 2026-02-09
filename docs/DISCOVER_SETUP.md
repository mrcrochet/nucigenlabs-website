# Discover Setup Guide

## Problème actuel

L'erreur "Internal Server Error" sur la page Discover est causée par :
1. **Migration SQL non appliquée** : Les colonnes `discover_*` n'existent pas encore dans la table `events`
2. **Pas de données** : Même après la migration, il faut collecter les données depuis EventRegistry

## Solution en 3 étapes

### Étape 1 : Appliquer la migration SQL

**Option A : Via Supabase Dashboard (Recommandé)**

1. Ouvrez votre projet dans [Supabase Dashboard](https://app.supabase.com)
2. Allez dans **SQL Editor** (menu de gauche)
3. Cliquez sur **New Query**
4. Copiez le contenu du fichier `supabase/migrations/20260110000000_add_discover_columns_to_events.sql`
5. Collez dans l'éditeur SQL
6. Cliquez sur **Run** (ou `Cmd+Enter` / `Ctrl+Enter`)

**Option B : Via Supabase CLI (si configuré)**

```bash
# Si vous utilisez Supabase local
supabase start
supabase migration up

# Si vous utilisez Supabase cloud
supabase db push
```

### Étape 2 : Vérifier la migration

```bash
npm run discover:check
```

Vous devriez voir :
```
✅ Events table exists
✅ Discover columns exist
✅ Found X events with Discover data
```

Si vous voyez "❌ Discover columns not found", la migration n'a pas été appliquée.

### Étape 3 : Collecter les données

Une fois la migration appliquée, collectez les données depuis EventRegistry :

```bash
npm run discover:collect
```

Cela va :
- Appeler EventRegistry API pour récupérer articles, events, et trends
- Calculer les scores de pertinence (sans LLM)
- Insérer les données dans la table `events` avec les colonnes `discover_*`

**Note** : La première collecte peut prendre 1-2 minutes.

## Vérification finale

1. Vérifiez que les données sont collectées :
   ```bash
   npm run discover:check
   ```

2. Redémarrez le serveur API si nécessaire :
   ```bash
   npm run api:server
   ```

3. Testez la page Discover dans votre navigateur

## Dépannage

### Erreur "Invalid API key" pour Supabase

Vérifiez votre fichier `.env` :
```bash
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
```

### Erreur "Discover columns not found"

La migration n'a pas été appliquée. Référez-vous à l'Étape 1.

### Erreur "No events found with Discover data"

Les données n'ont pas été collectées. Exécutez :
```bash
npm run discover:collect
```

### Erreur de connexion Supabase

Vérifiez que :
- `SUPABASE_URL` est correct
- `SUPABASE_ANON_KEY` est correct
- Votre projet Supabase est actif
- Pas de restrictions réseau/firewall

## Architecture

```
┌─────────────────┐
│ EventRegistry   │ (Source de données)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ discover-       │ (Worker: collecte + scoring)
│ collector.ts    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ events table    │ (Source unique de vérité)
│ + discover_*    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ discover-       │ (Worker: batch Perplexity)
│ enricher.ts     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ discover-       │ (Service: lecture DB)
│ service.ts      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ API /discover   │ (Endpoint)
└─────────────────┘
```

## Notes importantes

- **Pas d'appels Perplexity dans le flux utilisateur** : Tous les appels Perplexity sont faits en batch via `discover-enricher.ts`
- **Scoring interne** : Le scoring de pertinence est calculé sans LLM (rapide et gratuit)
- **Source unique** : La table `events` reste la source unique de vérité, les colonnes `discover_*` sont juste des projections
