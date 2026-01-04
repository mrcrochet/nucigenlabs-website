# PHASE 8: Auto-Learning & Amélioration Continue

## 🎯 Objectif

Implémenter un système qui apprend automatiquement des feedbacks utilisateurs et améliore les prompts LLM pour améliorer la qualité des extractions/prédictions.

---

## 📋 Architecture

### 1. **Tables de Base de Données**

- **`model_feedback`** : Stocke les retours utilisateurs
  - Types : `correction`, `improvement`, `validation`, `rejection`
  - Composants : `event_extraction`, `causal_chain`, `scenario`, `recommendation`, `relationship`, `historical_comparison`
  - Sévérité : `low`, `medium`, `high`, `critical`
  - Status : `pending`, `processed`, `applied`, `rejected`

- **`prompt_versions`** : Versioning des prompts LLM
  - Une seule version active par composant
  - Historique complet des versions
  - Métriques de performance

- **`prompt_performance`** : Métriques de performance par version
  - Accuracy, quality scores
  - Compteurs de feedbacks positifs/négatifs

### 2. **Services Backend**

- **`prompt-loader.ts`** : Charge les prompts versionnés depuis la DB
- **`model-improver.ts`** : 
  - Analyse les feedbacks
  - Génère des prompts améliorés avec LLM
  - Crée de nouvelles versions
  - Active les versions validées

### 3. **Orchestrateur**

- **`phase8-auto-learning-orchestrator.ts`** : Exécute l'amélioration automatique périodiquement

### 4. **Interface Utilisateur**

- **`FeedbackModal.tsx`** : Composant modal pour soumettre du feedback
- Intégré dans `EventDetail.tsx` et `Recommendations.tsx`

---

## 🚀 Setup

### 1. Appliquer la Migration SQL

```bash
# Dans Supabase SQL Editor, exécuter:
phase8_auto_learning.sql
```

Cette migration crée :
- 3 tables (`model_feedback`, `prompt_versions`, `prompt_performance`)
- Indexes et triggers
- Fonctions SQL (`get_active_prompt`, `get_pending_feedback`, `calculate_prompt_performance`)
- RLS policies
- Prompts initiaux pour `event_extraction` et `causal_chain`

### 2. Variables d'Environnement

Ajoutez à votre `.env` (optionnel) :

```env
# Auto-Learning Configuration
AUTO_LEARNING_MIN_FEEDBACK=5        # Minimum feedbacks pour déclencher amélioration
AUTO_LEARNING_INTERVAL=1440        # Intervalle en minutes (default: daily)
```

### 3. Scripts NPM

```bash
# Exécuter l'auto-learning une fois
npm run phase8:auto-learning

# Exécuter en mode continu (toutes les 24h par défaut)
npm run phase8:auto-learning:continuous
```

---

## 🔧 Utilisation

### Pour les Utilisateurs

1. **Soumettre du Feedback** :
   - Sur la page Event Detail, cliquer sur "Feedback"
   - Choisir le type : `Correct`, `Needs Correction`, `Suggestion`, `Reject`
   - Expliquer le problème et (optionnel) fournir une correction
   - Soumettre

2. **Types de Feedback** :
   - **Validation** : L'extraction est correcte
   - **Correction** : L'extraction est incorrecte (nécessite correction)
   - **Improvement** : Suggestion d'amélioration
   - **Rejection** : Rejeter complètement l'extraction

### Pour les Administrateurs

1. **Exécuter l'Auto-Learning** :
   ```bash
   npm run phase8:auto-learning
   ```

2. **Processus Automatique** :
   - Analyse les feedbacks en attente (minimum 5)
   - Identifie les problèmes communs
   - Génère un prompt amélioré avec GPT-4
   - Crée une nouvelle version (inactive par défaut)
   - Marque les feedbacks comme traités

3. **Activer une Version** :
   - Les nouvelles versions sont créées comme **inactives**
   - Un admin doit valider et activer manuellement
   - Une fois activée, l'ancienne version est désactivée automatiquement

---

## 📊 Fonctionnement

### Flux d'Amélioration

```
1. Utilisateur soumet feedback
   ↓
2. Feedback stocké dans model_feedback (status: pending)
   ↓
3. Orchestrateur exécute (quotidien ou manuel)
   ↓
4. Analyse des feedbacks critiques (severity: high/critical)
   ↓
5. Génération d'un prompt amélioré avec GPT-4
   ↓
6. Création d'une nouvelle version (is_active: false)
   ↓
7. Admin valide et active la nouvelle version
   ↓
8. Nouvelle version utilisée pour les prochaines extractions
```

### Chargement des Prompts

Les services (`event-extractor.ts`, `causal-extractor.ts`, etc.) doivent être modifiés pour utiliser `prompt-loader.ts` au lieu de prompts hardcodés :

```typescript
import { loadActivePrompt, fillPromptTemplate } from '../phase8/prompt-loader';

// Au lieu de:
const prompt = EXTRACTION_PROMPT.replace('{title}', event.title);

// Utiliser:
const promptVersion = await loadActivePrompt('event_extraction');
const prompt = fillPromptTemplate(
  promptVersion.prompt_template,
  { title: event.title, ... }
);
```

---

## 🎯 Prochaines Étapes

### Immédiat
1. ✅ Appliquer la migration SQL
2. ✅ Tester le feedback modal dans EventDetail
3. ✅ Exécuter l'auto-learning : `npm run phase8:auto-learning`

### Court Terme
- Modifier les extracteurs pour utiliser `prompt-loader.ts`
- Ajouter feedback modal dans Recommendations.tsx
- Créer une page admin pour valider/activer les versions

### Long Terme
- Tests A/B automatiques entre versions
- Métriques de performance automatiques
- Notifications pour les admins quand nouvelles versions sont créées

---

## 📝 Notes

- **Sécurité** : Les nouvelles versions sont créées comme **inactives** par défaut pour éviter de casser le système
- **Performance** : L'auto-learning s'exécute quotidiennement (configurable)
- **Feedback Minimum** : 5 feedbacks critiques minimum pour déclencher une amélioration
- **Versioning** : Historique complet des versions pour rollback si nécessaire

---

## ✅ Status

- ✅ Migration SQL créée
- ✅ Services backend créés
- ✅ Orchestrateur créé
- ✅ Interface UI créée (FeedbackModal)
- ✅ Intégration dans EventDetail
- ⏳ Modification des extracteurs pour utiliser prompt-loader (à faire)
- ⏳ Page admin pour validation (à faire)

---

**Status** : ✅ **IMPLÉMENTATION COMPLÈTE** (sauf intégration prompt-loader dans extracteurs)

