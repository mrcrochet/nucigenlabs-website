# PHASE 5: Onboarding Improvements - Summary

## 🎯 Objectif

Améliorer l'onboarding pour mieux connaître le client et personnaliser son feed d'actualité (inspiré de Perplexity).

---

## ✅ Ce qui a été créé

### 1. **Database Schema**
- **Fichier** : `phase5_user_preferences_table.sql`
- **Table** : `user_preferences`
  - `preferred_sectors[]` - Secteurs d'intérêt (multiple)
  - `preferred_regions[]` - Régions d'intérêt (multiple)
  - `preferred_event_types[]` - Types d'événements (multiple)
  - `focus_areas[]` - Domaines d'intérêt personnalisés
  - `feed_priority` - Relevance | Recency | Impact | Balanced
  - `min_impact_score`, `min_confidence_score` - Seuils minimums
  - `preferred_time_horizons[]` - Horizons temporels préférés
- **Trigger** : Crée automatiquement des préférences par défaut depuis onboarding

### 2. **Backend Service**
- **Fichier** : `src/server/phase5/preferences-service.ts`
- **Fonctions** :
  - `getUserPreferences()` - Récupère les préférences
  - `updateUserPreferences()` - Met à jour les préférences
  - `calculateEventRelevance()` - Calcule le score de pertinence d'un event
  - `sortEventsByPreferences()` - Trie les events selon les préférences

### 3. **Frontend Functions**
- **Fichier** : `src/lib/supabase.ts` (mis à jour)
- **Fonctions ajoutées** :
  - `getUserPreferences()` - Client-side
  - `updateUserPreferences()` - Client-side

### 4. **UI Component**
- **Fichier** : `src/components/ui/MultiSelect.tsx`
- **Fonctionnalités** :
  - Sélection multiple avec checkboxes
  - Recherche/filtre dans les options
  - Tags pour les sélections
  - Design cohérent avec Nucigen (dark theme)
  - Support pour `maxSelections`

### 5. **Documentation**
- **Fichier** : `PHASE5_ONBOARDING_IMPROVEMENTS.md`
- Détails de l'architecture et plan d'implémentation

---

## 🔜 Prochaines étapes (à implémenter)

### 1. **Mettre à jour l'onboarding** (`src/pages/Onboarding.tsx`)
- Remplacer sélection unique de sector par MultiSelect
- Ajouter MultiSelect pour regions
- Ajouter MultiSelect pour event types
- Ajouter champ "Focus Areas" (tags libres)
- Ajouter section "Feed Preferences"
- Sauvegarder dans `user_preferences` après soumission

### 2. **Personnaliser IntelligenceFeed** (`src/pages/IntelligenceFeed.tsx`)
- Charger `user_preferences` au mount
- Utiliser `calculateEventRelevance()` pour scorer chaque event
- Utiliser `sortEventsByPreferences()` pour trier
- Filtrer selon `min_impact_score` et `min_confidence_score`
- Afficher un indicateur "Relevant to you" pour les events pertinents

### 3. **Intégrer avec Alerts**
- Pré-remplir `alert_preferences` depuis `user_preferences` lors de la création
- Synchroniser les préférences si l'utilisateur les modifie

### 4. **Page Settings pour préférences**
- Permettre modification des préférences dans `/settings`
- Section dédiée "Feed Preferences"

---

## 📊 Scoring Algorithm

Le score de pertinence (`calculateEventRelevance`) prend en compte :

1. **Event Type Match** : +0.2 si correspond
2. **Sector Match** : +0.2 (event) ou +0.15 (causal chain)
3. **Region Match** : +0.2 (event) ou +0.15 (causal chain)
4. **Time Horizon Match** : +0.1
5. **Match Ratio Boost** : +0.2 * (matches / total checks)
6. **Penalties** : -50% si en dessous des seuils (impact/confidence)

**Score final** : Normalisé entre 0 et 1

---

## 🎨 Options disponibles

### Sectors
- Technology, Energy, Finance, Commodities, Logistics, Consulting, Academia, Government, Other

### Regions
- US, EU, China, Middle East, Asia Pacific, Latin America, Africa, Other

### Event Types
- Geopolitical, Industrial, SupplyChain, Regulatory, Security, Market

### Time Horizons
- Hours, Days, Weeks

---

## 🔄 Migration

1. Exécuter `phase5_user_preferences_table.sql` dans Supabase
2. Les préférences seront créées automatiquement pour les nouveaux utilisateurs
3. Pour les utilisateurs existants, migrer `users.sector` → `user_preferences.preferred_sectors[]`

---

## 📝 Notes

- Les préférences sont optionnelles : si l'utilisateur n'en a pas, le feed reste non-personnalisé
- Les préférences peuvent être modifiées à tout moment
- Les alertes peuvent utiliser les mêmes préférences ou avoir des settings séparés

---

**Status** : Architecture prête, implémentation UI à faire

