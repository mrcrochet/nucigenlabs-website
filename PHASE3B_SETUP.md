# PHASE 3B: Quality Improvement System Setup

## Objectif

Améliorer la qualité des extractions d'événements et chaînes causales grâce à :
1. Validation humaine (reviewer/reject events)
2. Feedback loop pour améliorer les prompts
3. Métriques de qualité et dashboard de monitoring
4. Système de re-processing avec prompts améliorés

## Architecture

```
Events → Validation Humaine → Feedback → Amélioration Prompts → Re-processing
         ↓
    Quality Metrics → Dashboard
```

## Setup

### 1. Appliquer la migration SQL

Exécutez `phase3b_quality_tables.sql` dans Supabase SQL Editor.

Cette migration crée :
- `event_validations` : Validations humaines des events
- `causal_chain_validations` : Validations humaines des causal chains
- `prompt_feedback` : Feedback pour améliorer les prompts
- `quality_metrics` : Métriques agrégées de qualité

### 2. Variables d'environnement

Les mêmes variables que Phase 3A sont nécessaires :
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

### 3. Scripts NPM

```bash
# Calculer les métriques de qualité pour aujourd'hui
npm run quality:metrics

# Calculer les métriques pour une plage de dates
npm run quality:metrics-range 2024-01-01 2024-01-31
```

## Utilisation

### 1. Validation Humaine

Les utilisateurs peuvent valider les events via l'interface (à implémenter dans EventDetail).

**Via API (exemple) :**

```typescript
import { createEventValidation } from './src/server/phase3b/quality-service';

await createEventValidation({
  nucigen_event_id: 'event-id',
  status: 'approved', // ou 'rejected' ou 'needs_revision'
  reviewer_id: user.id,
  reviewer_email: user.email,
  accuracy_score: 0.9,
  relevance_score: 0.85,
  completeness_score: 0.8,
  issues: [],
});
```

### 2. Feedback sur les Prompts

Soumettre du feedback pour améliorer les prompts :

```typescript
import { createPromptFeedback } from './src/server/phase3b/quality-service';

await createPromptFeedback({
  phase: 'phase1',
  nucigen_event_id: 'event-id',
  feedback_type: 'missing_field',
  feedback_text: 'The event_type was incorrectly classified',
  suggested_improvement: 'Add more examples of Industrial events in the prompt',
});
```

### 3. Dashboard de Qualité

Accédez au dashboard via `/quality` dans l'application.

Le dashboard affiche :
- Overall Quality Score
- Métriques Phase 1 (accuracy, relevance, completeness)
- Métriques Phase 2B (logical coherence, causality strength, time horizon accuracy)
- Statistiques d'approbation/rejet

### 4. Calcul des Métriques

Les métriques sont calculées automatiquement ou manuellement :

```bash
# Calculer pour aujourd'hui
npm run quality:metrics

# Calculer pour une plage
npm run quality:metrics-range 2024-01-01 2024-01-31
```

## Déploiement

### Cron Job pour Métriques Quotidiennes

**Option 1: Railway / Render Cron Job**

Créez un service séparé qui s'exécute quotidiennement :

```bash
# Commande cron
npm run quality:metrics
```

**Option 2: Supabase Edge Function + Cron**

Créez une Edge Function qui calcule les métriques et configurez un cron job dans Supabase.

**Option 3: Local avec cron**

```bash
# Ajouter à crontab
0 0 * * * cd /path/to/project && npm run quality:metrics
```

## Prochaines Étapes

Une fois la Phase 3B validée :
- Implémenter l'interface de validation dans EventDetail
- Créer un système de re-processing automatique basé sur le feedback
- A/B testing des prompts améliorés
- Alertes automatiques si la qualité baisse

## Monitoring

### Vérification dans Supabase

```sql
-- Voir les validations récentes
SELECT * FROM event_validations 
ORDER BY created_at DESC 
LIMIT 10;

-- Voir le feedback sur les prompts
SELECT * FROM prompt_feedback 
WHERE phase = 'phase1'
ORDER BY created_at DESC 
LIMIT 10;

-- Voir les métriques de qualité
SELECT * FROM quality_metrics 
ORDER BY metric_date DESC 
LIMIT 7;
```

### Alertes

Configurez des alertes si :
- Overall quality score < 0.7
- Phase 1 rejection rate > 30%
- Phase 2B rejection rate > 30%

