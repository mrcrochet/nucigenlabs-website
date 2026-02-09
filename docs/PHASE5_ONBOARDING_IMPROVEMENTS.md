# PHASE 5: Onboarding Improvements - Perplexity-Style Personalization

## 🎯 Objectif

Améliorer l'onboarding pour mieux connaître le client et personnaliser son feed d'actualité, similaire à Perplexity.

---

## 📊 Améliorations Proposées

### 1. **Sélections Multiples** (au lieu de sélection unique)

**Actuellement** :
- Sector : sélection unique
- Pas de sélection de régions
- Pas de sélection de types d'événements

**Nouveau** :
- **Sectors** : sélection multiple (Technology, Energy, Finance, Commodities, etc.)
- **Regions** : sélection multiple (US, EU, China, Middle East, etc.)
- **Event Types** : sélection multiple (Geopolitical, Industrial, SupplyChain, etc.)

### 2. **Focus Areas** (nouveau)

Permettre à l'utilisateur de spécifier des domaines d'intérêt précis :
- "semiconductor supply chains"
- "energy geopolitics"
- "regulatory changes in finance"
- etc.

### 3. **Feed Preferences** (nouveau)

- **Priority** : Relevance | Recency | Impact | Balanced
- **Minimum thresholds** : Impact score, Confidence score
- **Time horizons** : Hours | Days | Weeks

### 4. **Progression Multi-Step** (optionnel)

Diviser l'onboarding en étapes :
1. Basic info (company, role)
2. Interests (sectors, regions, event types)
3. Focus areas
4. Feed preferences

---

## 🗄️ Database Schema

Voir `phase5_user_preferences_table.sql` pour le schéma complet.

**Table `user_preferences`** :
- `preferred_sectors[]` - Array de secteurs
- `preferred_regions[]` - Array de régions
- `preferred_event_types[]` - Array de types d'événements
- `focus_areas[]` - Array de domaines d'intérêt personnalisés
- `feed_priority` - Relevance | Recency | Impact | Balanced
- `min_impact_score` - Seuil minimum d'impact
- `min_confidence_score` - Seuil minimum de confiance
- `preferred_time_horizons[]` - Array d'horizons temporels

---

## 🔧 Implementation Plan

### Step 1: Database Migration
- [x] Créer `user_preferences` table
- [x] Trigger pour créer préférences par défaut

### Step 2: Service Backend
- [x] `preferences-service.ts` créé
- [ ] Fonction `calculateEventRelevance()` pour scoring
- [ ] Fonction `sortEventsByPreferences()` pour tri personnalisé

### Step 3: Onboarding UI
- [ ] Ajouter sélections multiples (sectors, regions, event types)
- [ ] Ajouter champ "Focus Areas" (tags libres)
- [ ] Ajouter section "Feed Preferences"
- [ ] Sauvegarder dans `user_preferences` après onboarding

### Step 4: Feed Personalization
- [ ] Mettre à jour `IntelligenceFeed.tsx` pour utiliser préférences
- [ ] Calculer relevance score pour chaque event
- [ ] Trier selon `feed_priority`
- [ ] Filtrer selon `min_impact_score` et `min_confidence_score`

### Step 5: Integration avec Alerts
- [ ] Utiliser `user_preferences` comme base pour `alert_preferences`
- [ ] Pré-remplir alert preferences depuis user preferences

---

## 🎨 UI/UX Improvements

### Multi-Select Component
Créer un composant réutilisable pour sélections multiples :
- Checkboxes avec tags
- Recherche/filtre dans la liste
- Design cohérent avec Nucigen (dark, analyst-grade)

### Focus Areas Input
- Input avec tags (comme GitHub labels)
- Suggestions basées sur les sectors sélectionnés
- Auto-complétion

### Feed Preferences Section
- Toggle pour activer/désactiver personnalisation
- Sliders pour thresholds (impact, confidence)
- Radio buttons pour priority

---

## 📈 Benefits

1. **Meilleure personnalisation** : Feed adapté aux intérêts réels
2. **Alertes plus pertinentes** : Basées sur préférences détaillées
3. **Engagement amélioré** : Contenu plus pertinent = plus d'utilisation
4. **Données utilisateur** : Meilleure compréhension des besoins clients

---

## 🔄 Migration Path

1. Créer `user_preferences` table
2. Migrer données existantes depuis `users.sector` vers `user_preferences.preferred_sectors[]`
3. Mettre à jour onboarding pour remplir `user_preferences`
4. Mettre à jour feed pour utiliser préférences
5. Optionnel : Permettre modification des préférences dans Settings

---

## 📝 Next Steps

1. Implémenter onboarding amélioré
2. Intégrer personnalisation dans IntelligenceFeed
3. Tester avec utilisateurs réels
4. Itérer basé sur feedback

