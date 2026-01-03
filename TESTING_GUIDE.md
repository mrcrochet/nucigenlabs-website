# Guide de Tests & Validation - Nucigen Labs

## 📋 Vue d'Ensemble

Ce guide décrit comment tester et valider le système Nucigen Labs avant la mise en production.

---

## 🚀 Tests Automatisés

### 1. Validation du Pipeline

Valide que toutes les structures de base de données et fonctions sont correctement configurées.

```bash
npm run test:pipeline
```

**Ce qui est testé** :
- ✅ Existence de toutes les tables requises
- ✅ Colonne `search_vector` et index GIN
- ✅ Fonction `search_nucigen_events()`
- ✅ Structure des événements (champs requis, scores valides)
- ✅ Structure des chaînes causales
- ✅ Préférences utilisateur
- ✅ Préférences d'alertes

**Résultat attendu** :
- ✅ Tous les tests passent
- ⚠️ Warnings acceptables (ex: pas d'événements encore)
- ❌ Erreurs doivent être corrigées

---

### 2. Validation de la Qualité des Données

Valide la qualité des événements et chaînes causales extraits.

```bash
npm run test:quality
```

**Ce qui est testé** :
- ✅ Champs requis présents (summary, why_it_matters, etc.)
- ✅ Longueurs raisonnables (summary, cause, etc.)
- ✅ Scores dans les bonnes plages (0-1)
- ✅ Types d'événements valides
- ✅ Time horizons valides
- ✅ Absence de prédictions de prix ou chiffres financiers
- ✅ Arrays correctement formatés

**Résultat attendu** :
- ✅ Aucune erreur critique
- ⚠️ Warnings acceptables (ex: summaries courts)
- ❌ Erreurs doivent être corrigées

---

### 3. Tous les Tests

Exécute tous les tests automatisés.

```bash
npm run test:all
```

---

## 📝 Tests Manuels

### Checklist Complète

Utilisez `TEST_CHECKLIST.md` pour une checklist complète de tests manuels couvrant :

1. **Authentification & Onboarding**
   - Création de compte (email/password, OAuth)
   - Onboarding 3 étapes
   - Connexion/Déconnexion

2. **Pipeline de Données**
   - Collecte (Tavily, RSS)
   - Traitement (Phase 1, Phase 2B)
   - Enrichissement (Phase 4)
   - Pipeline complet

3. **Système d'Alertes**
   - Configuration des préférences
   - Génération d'alertes
   - Affichage et gestion

4. **Recherche Full-Text**
   - Page Events
   - Intelligence Feed
   - Validation SQL

5. **Interface Utilisateur**
   - Navigation
   - Dashboard
   - Event Detail
   - Settings
   - Responsive

6. **Qualité & Monitoring**
   - Quality Dashboard
   - Validation manuelle

7. **Sécurité**
   - Row Level Security (RLS)
   - Validation des données

8. **Performance**
   - Temps de chargement
   - Optimisations

9. **Gestion d'Erreurs**
   - Erreurs API
   - Erreurs de validation

10. **Tests de Régression**
    - Fonctionnalités existantes
    - Compatibilité navigateurs

---

## 🔍 Tests Spécifiques par Composant

### Test du Pipeline Complet

```bash
# 1. Collecte
npm run pipeline:collect

# 2. Traitement
npm run pipeline:process

# 3. Vérifier les résultats
npm run test:pipeline
npm run test:quality
```

**Vérifications** :
- ✅ Articles collectés dans `events` (status: pending)
- ✅ Événements structurés créés dans `nucigen_events`
- ✅ Chaînes causales créées dans `nucigen_causal_chains`
- ✅ `search_vector` rempli automatiquement
- ✅ Scores valides (0-1)

---

### Test de la Recherche Full-Text

1. **Dans l'application** :
   - Aller sur `/events`
   - Taper une recherche (ex: "sanctions")
   - Vérifier que les résultats sont pertinents
   - Tester les filtres

2. **Dans Supabase SQL Editor** :
   ```sql
   -- Tester la fonction directement
   SELECT * FROM search_nucigen_events(
     search_query := 'sanctions',
     limit_count := 10
   );
   ```

3. **Vérifier l'index** :
   ```sql
   -- Vérifier que search_vector est rempli
   SELECT 
     COUNT(*) as total,
     COUNT(search_vector) as with_vector
   FROM nucigen_events;
   ```

---

### Test du Système d'Alertes

1. **Configurer les préférences** :
   - Aller sur `/settings/alerts`
   - Activer les alertes
   - Configurer les seuils et filtres

2. **Générer des alertes** :
   ```bash
   npm run alerts:generate
   ```

3. **Vérifier les alertes** :
   - Aller sur `/alerts`
   - Vérifier que les alertes sont affichées
   - Marquer comme lu / Dismiss

---

### Test de la Personnalisation

1. **Configurer les préférences** :
   - Aller sur `/settings`
   - Configurer sectors, regions, event types
   - Configurer feed priority

2. **Vérifier le feed** :
   - Aller sur `/intelligence`
   - Vérifier que les événements sont triés selon préférences
   - Vérifier les badges "For you" et "Relevant to you"

3. **Vérifier la collecte personnalisée** :
   ```bash
   npm run pipeline:collect:personalized
   ```
   - Vérifier que des événements sont collectés avec `source: tavily:personalized:userId`

---

## 📊 Métriques de Qualité

### Scores Minimum Acceptables

- **Impact Score** : 0-1 (doit être présent)
- **Confidence** : 0-1 (doit être présent)
- **Summary Length** : 20-500 caractères (recommandé)
- **Why It Matters Length** : 50-1000 caractères (recommandé)
- **Cause Length** : 10-500 caractères (recommandé)

### Taux de Succès Minimum

- **Phase 1 (Extraction)** : ≥ 90%
- **Phase 2B (Causal Chains)** : ≥ 85%
- **Events with Causal Chains** : 100% (pour affichage)
- **Search Vector Population** : 100%

---

## 🐛 Dépannage

### Erreurs Communes

#### "search_vector column does not exist"
**Solution** : Exécuter `phase6_fulltext_search.sql` dans Supabase

#### "search_nucigen_events function does not exist"
**Solution** : Vérifier que la migration SQL a été exécutée complètement

#### "No events found"
**Solution** : 
1. Exécuter `npm run pipeline:collect`
2. Exécuter `npm run pipeline:process`

#### "Invalid scores"
**Solution** : Vérifier les prompts LLM et la validation dans `event-extractor.ts`

#### "Events without causal chains"
**Solution** : 
1. Vérifier que Phase 2B s'exécute correctement
2. Vérifier les logs pour erreurs

---

## ✅ Checklist de Validation Finale

Avant de considérer le système prêt pour la production :

- [ ] `npm run test:all` passe sans erreurs
- [ ] Tous les tests manuels de `TEST_CHECKLIST.md` sont passés
- [ ] Aucune erreur critique dans les logs
- [ ] Les performances sont acceptables (< 2s chargement)
- [ ] La sécurité est validée (RLS fonctionne)
- [ ] La documentation est à jour
- [ ] Les variables d'environnement sont configurées
- [ ] Les clés API sont valides
- [ ] Les migrations SQL sont appliquées

---

## 📝 Rapport de Tests

Après avoir exécuté tous les tests, remplir ce rapport :

**Date** : _______________  
**Testeur** : _______________  

**Tests Automatisés** :
- [ ] `test:pipeline` : ✅ / ❌
- [ ] `test:quality` : ✅ / ❌

**Tests Manuels** :
- [ ] Authentification : ✅ / ❌
- [ ] Pipeline : ✅ / ❌
- [ ] Alertes : ✅ / ❌
- [ ] Recherche : ✅ / ❌
- [ ] UI : ✅ / ❌
- [ ] Performance : ✅ / ❌

**Erreurs Trouvées** :
- _______________
- _______________

**Warnings** :
- _______________
- _______________

**Recommandations** :
- _______________
- _______________

---

**Status Final** : ✅ Prêt pour Production / ❌ Nécessite Corrections

