# PHASE 7: Advanced Features Setup

## 📋 Vue d'Ensemble

Phase 7 implémente 4 fonctionnalités révolutionnaires :
1. **Knowledge Graph & Relations** - Connecte les événements entre eux
2. **Analyse Comparative Historique** - Compare avec événements passés similaires
3. **Prédictions Multi-Scénarios** - Génère 3 scénarios (optimiste, réaliste, pessimiste) avec probabilités
4. **Recommandations Proactives** - Suggestions d'actions basées sur préférences utilisateur

---

## 🚀 Setup

### 1. Appliquer les Migrations SQL

Exécuter dans Supabase SQL Editor dans cet ordre :

1. **`phase7_knowledge_graph.sql`**
   - Crée table `event_relationships`
   - Fonctions `get_event_relationships()`, `get_event_graph()`

2. **`phase7_historical_comparisons.sql`**
   - Crée table `historical_comparisons`
   - Fonction `get_historical_comparisons()`

3. **`phase7_scenario_predictions.sql`**
   - Crée table `scenario_predictions`
   - Fonction `get_scenario_predictions()`

4. **`phase7_recommendations.sql`**
   - Crée table `recommendations`
   - Fonctions `get_user_recommendations()`, `count_unread_recommendations()`

### 2. Vérifier l'Installation

```sql
-- Vérifier les tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'event_relationships',
    'historical_comparisons',
    'scenario_predictions',
    'recommendations'
  );

-- Vérifier les fonctions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_event_relationships',
    'get_historical_comparisons',
    'get_scenario_predictions',
    'get_user_recommendations'
  );
```

---

## 🔧 Services Backend

### 1. Relationship Extractor

**Fichier** : `src/server/phase7/relationship-extractor.ts`

**Usage** :
```bash
# Traiter les relations pour tous les événements en attente
npm run phase7:relationships

# Traiter les relations pour un événement spécifique
npm run phase7:relationships:event <event_id>
```

**Fonctionnalités** :
- Détecte 8 types de relations (causes, precedes, amplifies, etc.)
- Score de force et confiance pour chaque relation
- Evidence et reasoning pour chaque relation

---

### 2. Historical Analyzer

**Fichier** : `src/server/phase7/historical-analyzer.ts`

**Usage** :
```bash
# Analyser un événement spécifique
npm run phase7:historical <event_id>
```

**Fonctionnalités** :
- Trouve événements historiques similaires (similarity >= 0.6)
- Compare les outcomes historiques
- Génère lessons learned

---

### 3. Scenario Predictor

**Fichier** : `src/server/phase7/scenario-predictor.ts`

**Usage** :
```bash
# Générer scénarios pour un événement
npm run phase7:scenarios <event_id>
```

**Fonctionnalités** :
- Génère 3 scénarios (optimistic, realistic, pessimistic)
- Pour 5 horizons temporels (1week, 1month, 3months, 6months, 1year)
- Probabilités normalisées (somme = 1.0)
- Key indicators, risk factors, opportunities

---

### 4. Recommendation Engine

**Fichier** : `src/server/phase7/recommendation-engine.ts`

**Usage** :
```bash
# Générer recommandations pour tous les utilisateurs
npm run phase7:recommendations

# Générer recommandations pour un utilisateur spécifique
npm run phase7:recommendations:user <user_id>
```

**Fonctionnalités** :
- 6 types de recommandations (monitor, prepare, act, investigate, mitigate, capitalize)
- Priorité (high, medium, low)
- Basé sur préférences utilisateur, scénarios, comparaisons historiques

---

### 5. Orchestrator Complet

**Fichier** : `src/server/workers/phase7-orchestrator.ts`

**Usage** :
```bash
# Exécuter toutes les étapes Phase 7
npm run phase7:run
```

**Fonctionnalités** :
- Exécute les 4 services dans l'ordre
- Gestion d'erreurs par étape
- Rapport de synthèse

---

## 🎨 Interface Utilisateur

### 1. Event Detail Page

**Fichier** : `src/pages/EventDetail.tsx`

**Nouvelles sections** :
- **Related Events** : Affiche les événements liés (Knowledge Graph)
- **Historical Comparisons** : Affiche les comparaisons historiques
- **Scenario Predictions** : Affiche les scénarios avec probabilités

**Fonctionnalités** :
- Sections expandables/collapsables
- Navigation vers événements liés
- Visualisation des scénarios par horizon temporel

---

### 2. Recommendations Page

**Fichier** : `src/pages/Recommendations.tsx`

**Route** : `/recommendations`

**Fonctionnalités** :
- Liste des recommandations (pending/all)
- Actions : Acknowledge, Complete, Dismiss
- Filtres par priorité
- Lien vers événements associés
- Badge de compteur non lues

---

## 📊 Architecture

### Flux de Données

```
1. Événement créé (Phase 1)
   ↓
2. Relationship Extractor
   → event_relationships
   ↓
3. Historical Analyzer
   → historical_comparisons
   ↓
4. Scenario Predictor
   → scenario_predictions
   ↓
5. Recommendation Engine
   → recommendations (par utilisateur)
```

### Dépendances

- **Scenarios** dépend de : Event + Causal Chain + Historical Comparisons
- **Recommendations** dépend de : Event + Scenarios + Historical Comparisons + User Preferences

---

## 🎯 Utilisation

### Workflow Recommandé

1. **Après traitement d'événements** :
   ```bash
   npm run pipeline:process
   ```

2. **Extraire les relations** :
   ```bash
   npm run phase7:relationships
   ```

3. **Analyser historiquement** :
   ```bash
   # Pour chaque événement récent
   npm run phase7:historical <event_id>
   ```

4. **Générer scénarios** :
   ```bash
   # Pour chaque événement récent
   npm run phase7:scenarios <event_id>
   ```

5. **Générer recommandations** :
   ```bash
   npm run phase7:recommendations
   ```

**OU** utiliser l'orchestrateur complet :
```bash
npm run phase7:run
```

---

## 🔍 Vérification

### Vérifier les Relations

```sql
-- Compter les relations
SELECT 
  relationship_type,
  COUNT(*) as count,
  AVG(strength) as avg_strength,
  AVG(confidence) as avg_confidence
FROM event_relationships
GROUP BY relationship_type;
```

### Vérifier les Comparaisons Historiques

```sql
-- Voir les comparaisons
SELECT 
  current_event_id,
  COUNT(*) as comparison_count,
  AVG(similarity_score) as avg_similarity
FROM historical_comparisons
GROUP BY current_event_id;
```

### Vérifier les Scénarios

```sql
-- Voir les scénarios par événement
SELECT 
  nucigen_event_id,
  time_horizon,
  scenario_type,
  probability,
  confidence
FROM scenario_predictions
ORDER BY nucigen_event_id, time_horizon, scenario_type;
```

### Vérifier les Recommandations

```sql
-- Compter les recommandations par utilisateur
SELECT 
  user_id,
  recommendation_type,
  priority,
  COUNT(*) as count
FROM recommendations
WHERE status = 'pending'
GROUP BY user_id, recommendation_type, priority;
```

---

## ⚠️ Notes Importantes

1. **Coûts LLM** :
   - Relationship extraction : ~$0.01-0.02 par événement
   - Historical analysis : ~$0.01-0.02 par événement
   - Scenario prediction : ~$0.03-0.05 par événement
   - Recommendations : ~$0.01 par utilisateur

2. **Performance** :
   - Traitement séquentiel recommandé (rate limiting)
   - Limiter à 10-20 événements par batch
   - Utiliser l'orchestrateur pour automatisation

3. **Qualité** :
   - Relations : Seulement confidence >= 0.5 et strength >= 0.3
   - Comparaisons : Seulement similarity >= 0.6
   - Scénarios : Probabilités normalisées

---

## 📝 Prochaines Étapes

1. **Visualisation Graph** : Implémenter graph interactif pour relations
2. **Timeline View** : Visualiser événements liés dans le temps
3. **Scenario Comparison** : Comparer scénarios entre événements
4. **Recommendation Analytics** : Dashboard d'analytics pour recommandations

---

**Status** : ✅ Implémentation complète  
**Prochaine étape** : Appliquer migrations SQL et tester

