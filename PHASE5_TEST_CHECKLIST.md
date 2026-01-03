# PHASE 5: Test Checklist

## ✅ Vérifications Automatiques

- [x] TypeScript compilation : ✅ Passed
- [x] Fonctions `getUserPreferences()` et `updateUserPreferences()` dans `supabase.ts`
- [x] Import de `preferences-utils` dans `IntelligenceFeed.tsx`
- [x] Import de `MultiSelect` dans `Onboarding.tsx`

---

## 🧪 Tests Manuels à Effectuer

### 1. **Migration SQL**
- [ ] Exécuter `phase5_user_preferences_table.sql` dans Supabase SQL Editor
- [ ] Vérifier que la table `user_preferences` est créée
- [ ] Vérifier que les triggers sont créés

### 2. **Onboarding Amélioré**
- [ ] Créer un nouveau compte
- [ ] Vérifier que l'onboarding s'affiche en 3 étapes
- [ ] **Step 1** : Remplir informations de base
  - [ ] Company
  - [ ] Role
  - [ ] Intended Use
  - [ ] Exposure (optionnel)
- [ ] **Step 2** : Sélectionner intérêts
  - [ ] MultiSelect Sectors (sélectionner plusieurs)
  - [ ] MultiSelect Regions (sélectionner plusieurs)
  - [ ] MultiSelect Event Types (sélectionner plusieurs)
  - [ ] Ajouter Focus Areas (tags libres)
- [ ] **Step 3** : Configurer préférences de feed
  - [ ] Feed Priority (Balanced/Relevance/Recency/Impact)
  - [ ] Time Horizons (sélectionner plusieurs)
  - [ ] Minimum Impact Score (slider)
  - [ ] Minimum Confidence Score (slider)
- [ ] Soumettre le formulaire
- [ ] Vérifier qu'il n'y a pas d'erreur
- [ ] Vérifier la redirection vers `/app`

### 3. **Vérification Base de Données**
- [ ] Vérifier dans Supabase que `user_preferences` contient les données
  - [ ] `preferred_sectors[]` : Array avec les secteurs sélectionnés
  - [ ] `preferred_regions[]` : Array avec les régions sélectionnés
  - [ ] `preferred_event_types[]` : Array avec les types sélectionnés
  - [ ] `focus_areas[]` : Array avec les focus areas
  - [ ] `feed_priority` : Valeur sélectionnée
  - [ ] `min_impact_score` : Valeur du slider
  - [ ] `min_confidence_score` : Valeur du slider
  - [ ] `preferred_time_horizons[]` : Array avec les horizons sélectionnés

### 4. **Intelligence Feed Personnalisé**
- [ ] Aller sur `/intelligence` (ou `/app` si c'est la route)
- [ ] Vérifier que les events se chargent
- [ ] Vérifier que certains events ont le badge **"Relevant to you"** (si score >= 0.7)
- [ ] Vérifier le tri :
  - [ ] Tab "Top" : Events triés selon `feed_priority`
  - [ ] Tab "Recent" : Events triés par date (ou selon `feed_priority='recency'`)
  - [ ] Tab "Critical" : Events avec impact >= 0.7 (ou selon `feed_priority`)
- [ ] Vérifier le filtrage :
  - [ ] Events en dessous de `min_impact_score` sont filtrés
  - [ ] Events en dessous de `min_confidence_score` sont filtrés

### 5. **Test Sans Préférences**
- [ ] Se déconnecter
- [ ] Créer un compte mais ne pas compléter l'onboarding
- [ ] Aller sur `/intelligence`
- [ ] Vérifier que le feed fonctionne normalement (sans personnalisation)
- [ ] Vérifier qu'il n'y a pas d'erreur dans la console

### 6. **Test MultiSelect Component**
- [ ] Vérifier que le dropdown s'ouvre
- [ ] Vérifier que la recherche fonctionne
- [ ] Vérifier que les sélections multiples fonctionnent
- [ ] Vérifier que les tags s'affichent correctement
- [ ] Vérifier que la suppression de tags fonctionne

---

## 🐛 Erreurs Potentielles à Vérifier

### Console Browser
- [ ] Pas d'erreur `Cannot read property 'preferred_sectors' of null`
- [ ] Pas d'erreur `getUserPreferences is not a function`
- [ ] Pas d'erreur `updateUserPreferences is not a function`

### Supabase
- [ ] Pas d'erreur RLS (Row Level Security)
- [ ] Les préférences sont bien créées pour le nouvel utilisateur
- [ ] Les préférences sont bien mises à jour lors de l'onboarding

### UI
- [ ] Le MultiSelect s'affiche correctement
- [ ] Les sliders fonctionnent correctement
- [ ] Les badges "Relevant to you" s'affichent correctement
- [ ] Le tri fonctionne selon les préférences

---

## 📝 Notes de Test

**Date** : _______________
**Testeur** : _______________
**Résultat** : _______________

**Problèmes rencontrés** :
- 

**Solutions appliquées** :
- 

---

## ✅ Checklist Finale

- [ ] Migration SQL appliquée
- [ ] Onboarding fonctionne (3 étapes)
- [ ] Préférences sauvegardées dans DB
- [ ] Feed personnalisé fonctionne
- [ ] Badge "Relevant to you" s'affiche
- [ ] Tri selon préférences fonctionne
- [ ] Filtrage selon thresholds fonctionne
- [ ] Pas d'erreurs dans la console
- [ ] Test sans préférences fonctionne

