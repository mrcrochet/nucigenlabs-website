# Feed Personnalisé avec Tavily - Documentation

## 🎯 Objectif

Utiliser les préférences utilisateur pour générer des requêtes Tavily personnalisées et créer un feed d'actualité **10X plus pertinent** pour chaque utilisateur.

---

## 📊 Architecture

### 1. Collecte Personnalisée

```
User Preferences
  ↓
buildPersonalizedQueries()
  ↓
Tavily Search (15 requêtes max)
  ↓
Events (source: tavily:personalized:userId)
  ↓
Event Processor (Phase 1 + 2B)
  ↓
nucigen_events (avec flag isPersonalized)
```

### 2. Génération de Requêtes

Les requêtes Tavily sont générées à partir de :

1. **Sectors + Regions** : Combinaisons sector/région
   - Ex: "Technology US recent developments policy changes 2025"
   - Limite: Top 3 sectors × Top 3 regions

2. **Event Types + Sectors** : Types d'événements par secteur
   - Ex: "Geopolitical events Technology industry impact 2025"
   - Limite: Top 3 event types × Top 2 sectors

3. **Focus Areas** : Tags personnalisés (priorité maximale)
   - Ex: "semiconductor supply chains recent news developments 2025"
   - Limite: Top 5 focus areas

4. **Region-specific** : Événements géopolitiques par région
   - Ex: "EU geopolitical economic policy changes 2025"
   - Limite: Top 3 regions

5. **Sector-specific** : Changements réglementaires par secteur
   - Ex: "Energy regulatory changes policy updates 2025"
   - Limite: Top 3 sectors

**Total** : Jusqu'à 15 requêtes par utilisateur

---

## 🔧 Implémentation

### Fichiers Créés

1. **`src/server/workers/tavily-personalized-collector.ts`**
   - Collecte personnalisée pour chaque utilisateur
   - Génère requêtes basées sur préférences
   - Filtre par score (> 0.5) et date (7 derniers jours)

2. **`src/lib/supabase.ts`** (modifié)
   - `getEventsWithCausalChains()` : Ajoute flag `isPersonalized`
   - Priorise les événements personnalisés dans le tri

3. **`src/pages/IntelligenceFeed.tsx`** (modifié)
   - Badge "For you" pour événements personnalisés
   - Badge "Relevant to you" pour autres événements pertinents

4. **`src/server/workers/pipeline-orchestrator.ts`** (modifié)
   - Intègre collecte personnalisée après collecte générale

---

## 🚀 Utilisation

### Scripts NPM

```bash
# Collecte personnalisée pour tous les utilisateurs
npm run pipeline:collect:personalized

# Pipeline complet (inclut collecte personnalisée)
npm run pipeline:run-once
```

### Intégration Automatique

Le pipeline orchestrator exécute automatiquement :
1. Collecte générale (Tavily + RSS)
2. **Collecte personnalisée** (nouveau)
3. Traitement des événements (Phase 1 + 2B)
4. Génération d'alertes

---

## 📈 Résultats Attendus

### Avant (Feed Générique)
- Même feed pour tous les utilisateurs
- Filtrage côté client uniquement
- Beaucoup d'événements non pertinents

### Après (Feed Personnalisé)
- **10X meilleure pertinence** (requêtes ciblées)
- Événements collectés spécifiquement pour chaque utilisateur
- Badge "For you" pour événements personnalisés
- Priorisation automatique dans le dashboard

---

## 🎨 UI/UX

### Badge "For you"
- **Variant** : `critical` (rouge)
- **Icône** : `Sparkles`
- **Condition** : `isPersonalized === true`
- **Priorité** : Affiché en premier

### Badge "Relevant to you"
- **Variant** : `critical` (rouge)
- **Icône** : `Sparkles`
- **Condition** : Score de pertinence >= 0.7 ET `!isPersonalized`
- **Priorité** : Affiché après "For you"

### Tri
- **Personnalisés en premier** : Tous les événements avec `isPersonalized` apparaissent en haut
- **Puis par date** : Événements généraux triés par `created_at`

---

## ⚙️ Configuration

### Variables d'Environnement

```env
TAVILY_API_KEY=your_tavily_key  # Requis
```

### Préférences Utilisateur

Les préférences sont stockées dans `user_preferences` :
- `preferred_sectors` : Array de secteurs
- `preferred_regions` : Array de régions
- `preferred_event_types` : Array de types d'événements
- `focus_areas` : Array de tags personnalisés

---

## 📊 Métriques

### Par Utilisateur
- **Requêtes Tavily** : 5-15 requêtes (selon préférences)
- **Articles collectés** : ~40-120 articles (après filtrage)
- **Événements traités** : ~20-60 événements (après Phase 1 + 2B)

### Performance
- **Temps de collecte** : ~2-5 secondes par utilisateur
- **Délai entre utilisateurs** : 1 seconde (rate limiting)
- **Total pour 10 utilisateurs** : ~20-50 secondes

---

## 🔄 Workflow Complet

1. **Utilisateur crée compte** → Onboarding → Préférences sauvegardées
2. **Pipeline s'exécute** → Collecte personnalisée pour cet utilisateur
3. **Événements traités** → Phase 1 + 2B
4. **Dashboard affiche** → Événements personnalisés en premier avec badge "For you"

---

## ✅ Avantages

1. **10X Meilleure Pertinence** : Requêtes ciblées vs feed générique
2. **Expérience Personnalisée** : Chaque utilisateur voit ce qui l'intéresse
3. **Utilisation Intelligente de Tavily** : Requêtes construites à partir de préférences
4. **Feedback Visuel** : Badge "For you" montre clairement la personnalisation

---

## 📝 Notes

- Les événements personnalisés sont marqués avec `source: tavily:personalized:userId`
- La collecte personnalisée s'exécute après la collecte générale
- Si un utilisateur n'a pas de préférences, aucune collecte personnalisée n'est effectuée
- Les requêtes sont limitées à 15 pour éviter la surcharge API

---

**Dernière mise à jour** : Janvier 2025

