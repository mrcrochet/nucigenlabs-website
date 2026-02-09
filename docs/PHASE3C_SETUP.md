# PHASE 3C: User Features Setup (Alerts & Advanced Search)

## Objectif

Implémenter les fonctionnalités utilisateur avancées :
1. Système d'alerts personnalisés basé sur les préférences utilisateur
2. Recherche avancée avec filtres multiples
3. Interface de configuration des alerts

## Architecture

```
New Event → Alert Matching Engine → User Alerts → Notification
User Preferences → Alert Configuration → Matching Rules
```

## Setup

### 1. Appliquer la migration SQL

Exécutez `phase3c_alerts_tables.sql` dans Supabase SQL Editor.

Cette migration crée :
- `alert_preferences` : Préférences d'alerts par utilisateur
- `user_alerts` : Alerts générées pour les utilisateurs
- Triggers pour créer des préférences par défaut

### 2. Variables d'environnement

Les mêmes variables que Phase 3A/3B :
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

### 3. Scripts NPM

```bash
# Générer des alerts pour les events récents
npm run alerts:generate

# Ou avec limite personnalisée
npx tsx src/server/workers/alerts-generator.ts 200
```

## Utilisation

### 1. Configuration des Alerts

Les utilisateurs peuvent configurer leurs alerts via `/settings/alerts` :

- **Seuils** : Impact minimum, confiance minimum
- **Filtres** : Secteurs, régions, types d'événements à surveiller
- **Notifications** : Quels types d'alerts recevoir
- **Fréquence** : Real-time, hourly, daily, weekly

### 2. Consultation des Alerts

Les utilisateurs voient leurs alerts via `/alerts` :

- **Onglets** : Unread / All
- **Actions** : Mark as read, Dismiss
- **Navigation** : Cliquer sur un alert pour voir l'event détaillé

### 3. Génération Automatique

Les alerts sont générées automatiquement :
- Après le traitement d'un nouvel event (via pipeline orchestrator)
- Ou manuellement via `npm run alerts:generate`

## Déploiement

### Intégration dans le Pipeline

Le pipeline orchestrator génère automatiquement les alerts après le traitement des events.

Pour activer manuellement :

```bash
# Générer des alerts pour les 100 derniers events
npm run alerts:generate
```

### Cron Job (Optionnel)

Pour générer des alerts périodiquement :

```bash
# Toutes les 15 minutes
*/15 * * * * cd /path/to/project && npm run alerts:generate
```

## Matching Logic

Un event génère un alert pour un utilisateur si :

1. **Alerts activés** : `enabled = true`
2. **Seuils respectés** :
   - `impact_score >= min_impact_score`
   - `confidence >= min_confidence`
3. **Matchs de filtres** :
   - Secteur dans `sectors[]`
   - Région dans `regions[]`
   - Event type dans `event_types[]`
4. **Notifications activées** :
   - `notify_on_new_event` pour nouveaux events
   - `notify_on_high_impact` pour impact élevé
   - `notify_on_sector_match` pour match secteur
   - `notify_on_region_match` pour match région

**Priorité** :
- `critical` : impact_score >= 0.9
- `high` : impact_score >= 0.8 ou match secteur/région
- `normal` : autres cas
- `low` : impact faible

## Recherche Avancée

La page `/events` inclut maintenant :

- **Recherche full-text** : Summary, why_it_matters, cause, effects
- **Filtres multiples** :
  - Secteurs (event + causal chain)
  - Régions (event + causal chain)
  - Types d'événements
  - Time horizons
- **Pagination** : 5 events par page
- **Compteurs** : Nombre d'events filtrés

## API Frontend

### Alert Preferences

```typescript
// Get preferences
const { data } = await supabase
  .from('alert_preferences')
  .select('*')
  .eq('user_id', userId)
  .single();

// Update preferences
await supabase
  .from('alert_preferences')
  .upsert({ user_id: userId, ...preferences });
```

### User Alerts

```typescript
// Get alerts
const { data } = await supabase
  .from('user_alerts')
  .select('*, nucigen_events(*)')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// Mark as read
await supabase
  .from('user_alerts')
  .update({ status: 'read', read_at: new Date().toISOString() })
  .eq('id', alertId);

// Dismiss
await supabase
  .from('user_alerts')
  .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
  .eq('id', alertId);
```

## Prochaines Étapes

Une fois la Phase 3C validée :
- Notifications email (Supabase Edge Functions)
- Notifications push (browser notifications)
- Alert digest (email résumé selon fréquence)
- Alert analytics (quels alerts sont les plus utiles)

## Monitoring

### Vérification dans Supabase

```sql
-- Voir les préférences d'alerts
SELECT * FROM alert_preferences 
WHERE enabled = true;

-- Voir les alerts générées
SELECT COUNT(*) FROM user_alerts 
WHERE status = 'unread';

-- Voir les alerts par priorité
SELECT priority, COUNT(*) 
FROM user_alerts 
GROUP BY priority;
```

