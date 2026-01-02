# PHASE 3A: Pipeline Automation Setup

## Objectif

Automatiser le pipeline de collecte et traitement d'événements pour rendre Nucigen opérationnel sans intervention manuelle.

## Architecture

```
Data Collector → events (pending) → Event Processor → nucigen_events → nucigen_causal_chains
```

## Composants

### 1. Data Collector (`data-collector.ts`)
- Collecte automatique d'articles depuis NewsAPI
- Déduplication automatique
- Insertion dans `events` avec status `pending`

### 2. Event Processor (`event-processor.ts`)
- Traite les events `pending`
- Phase 1: Extraction structurée → `nucigen_events`
- Phase 2B: Génération causal chain → `nucigen_causal_chains`
- Gestion d'erreurs et retry

### 3. Pipeline Orchestrator (`pipeline-orchestrator.ts`)
- Coordonne collection + traitement
- Intervalles configurables
- Mode "run once" ou continu

## Setup

### 1. Variables d'environnement

Ajoutez à votre `.env` :

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-...

# NewsAPI (optionnel, pour la collecte automatique)
NEWS_API_KEY=your-newsapi-key
```

### 2. Installation

Les dépendances sont déjà installées :
- `@supabase/supabase-js`
- `openai`
- `dotenv`
- `tsx`

### 3. Scripts NPM

```bash
# Collecter des articles (une fois)
npm run pipeline:collect

# Traiter les events pending (une fois, limite 10)
npm run pipeline:process

# Lancer l'orchestrateur complet (une fois)
npm run pipeline:run-once

# Lancer l'orchestrateur en mode continu
npm run pipeline:run
```

## Utilisation

### Mode développement (run once)

```bash
# Collecter des articles
npm run pipeline:collect

# Traiter les events pending
npm run pipeline:process

# Ou tout en une fois
npm run pipeline:run-once
```

### Mode production (continu)

```bash
# Lancer l'orchestrateur (runs continu)
npm run pipeline:run
```

L'orchestrateur va :
- Collecter des articles toutes les heures
- Traiter les events pending toutes les 15 minutes
- Gérer les erreurs automatiquement

### Configuration via variables d'environnement

```env
# Intervalles (en millisecondes)
COLLECTION_INTERVAL=3600000  # 1 heure
PROCESSING_INTERVAL=900000   # 15 minutes
PROCESSING_BATCH_SIZE=10     # Nombre d'events à traiter par batch

# Mode run once
RUN_ONCE=true
```

## Déploiement

### Option 1: Railway / Render (recommandé)

1. Créez un nouveau service
2. Connectez votre repo GitHub
3. Configurez les variables d'environnement
4. Commande de démarrage : `npm run pipeline:run`
5. Le service tourne en continu

### Option 2: Supabase Edge Functions

1. Créez une Edge Function pour la collecte
2. Créez une Edge Function pour le traitement
3. Configurez des cron jobs dans Supabase

### Option 3: Local avec PM2

```bash
npm install -g pm2
pm2 start npm --name "nucigen-pipeline" -- run pipeline:run
pm2 save
pm2 startup
```

## Monitoring

### Logs

Les workers loggent :
- Nombre d'articles collectés
- Nombre d'events traités
- Erreurs avec détails
- Statistiques par phase

### Vérification dans Supabase

```sql
-- Voir les events pending
SELECT COUNT(*) FROM events WHERE status = 'pending';

-- Voir les events traités aujourd'hui
SELECT COUNT(*) FROM nucigen_events 
WHERE created_at >= CURRENT_DATE;

-- Voir les causal chains créées
SELECT COUNT(*) FROM nucigen_causal_chains 
WHERE created_at >= CURRENT_DATE;
```

## Troubleshooting

### Erreur: "Missing environment variables"
- Vérifiez que toutes les variables sont dans `.env`
- Redémarrez le processus

### Erreur: "NewsAPI error"
- Vérifiez votre clé API NewsAPI
- Limite de rate: 100 requests/day (free tier)

### Events restent en "pending"
- Vérifiez les logs du processor
- Vérifiez que OpenAI API key est valide
- Vérifiez les erreurs dans `events.processing_error`

### Rate limits OpenAI
- Le processor attend 1 seconde entre chaque event
- Réduisez `PROCESSING_BATCH_SIZE` si nécessaire

## Prochaines étapes

Une fois la Phase 3A validée :
- PHASE 3B: Amélioration qualité (validation humaine, meilleurs prompts)
- PHASE 3C: Fonctionnalités utilisateur (alerts, recherche avancée)

