# PHASE 6: Full-Text Search with Supabase

## 📋 Vue d'Ensemble

Implémentation de la recherche full-text serveur avec PostgreSQL pour améliorer les performances et la scalabilité de la recherche d'événements.

## ✅ Livrables

1. **Migration SQL** (`phase6_fulltext_search.sql`)
   - Index full-text search sur `nucigen_events`
   - Fonction `search_nucigen_events()` pour recherche avec filtres
   - Fonction `count_nucigen_events_search()` pour pagination
   - Indexes pour filtres courants

2. **Fonctions TypeScript** (`src/lib/supabase.ts`)
   - `searchEvents()` - Recherche avec options
   - `countSearchResults()` - Comptage pour pagination
   - `getEventsWithCausalChainsSearch()` - Recherche avec causal chains

3. **Page Events Refactorisée** (`src/pages/Events.tsx`)
   - Recherche serveur au lieu de client-side
   - Debounce pour éviter trop de requêtes
   - Pagination serveur
   - Filtres serveur (sectors, regions, event types, time horizons)

## 🚀 Setup

### 1. Appliquer la Migration SQL

Exécuter `phase6_fulltext_search.sql` dans Supabase SQL Editor :

```sql
-- Le script crée :
-- 1. Colonne search_vector (tsvector) sur nucigen_events
-- 2. Trigger pour auto-mise à jour du search_vector
-- 3. Index GIN pour recherche rapide
-- 4. Fonction search_nucigen_events()
-- 5. Fonction count_nucigen_events_search()
-- 6. Indexes pour filtres
```

### 2. Vérifier l'Installation

```sql
-- Vérifier que la colonne existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'nucigen_events' AND column_name = 'search_vector';

-- Vérifier que l'index existe
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'nucigen_events' AND indexname = 'idx_nucigen_events_search_vector';

-- Tester la fonction
SELECT * FROM search_nucigen_events(
  search_query := 'trade sanctions',
  limit_count := 10
);
```

### 3. Tester dans l'Application

1. Aller sur `/events`
2. Taper une recherche (ex: "sanctions", "trade", "technology")
3. Vérifier que les résultats sont pertinents et rapides
4. Tester les filtres (sectors, regions, event types)
5. Tester la pagination

## 📊 Architecture

### Full-Text Search

**PostgreSQL tsvector** :
- Colonne `search_vector` calculée automatiquement
- Poids : A (summary), B (why_it_matters), C (sector, region, country, actors)
- Index GIN pour recherche ultra-rapide

**Recherche** :
- Utilise `plainto_tsquery()` pour recherche naturelle
- Gère le stemming (ex: "running" match "run")
- Ignore les stop words (the, a, an, etc.)
- Case-insensitive

### Fonction de Recherche

```sql
search_nucigen_events(
  search_query TEXT,           -- Requête de recherche
  sector_filter TEXT[],         -- Filtre par secteurs
  region_filter TEXT[],         -- Filtre par régions
  event_type_filter TEXT[],     -- Filtre par types d'événements
  time_horizon_filter TEXT[],   -- Filtre par horizons temporels
  min_impact_score NUMERIC,    -- Score d'impact minimum
  min_confidence_score NUMERIC,-- Score de confiance minimum
  limit_count INTEGER,         -- Nombre de résultats
  offset_count INTEGER         -- Offset pour pagination
)
```

**Retourne** :
- Tous les champs de `nucigen_events`
- `relevance_score` (0-1) pour tri
- `has_causal_chain` (boolean)

### Debounce

- **500ms** de délai pour éviter trop de requêtes
- Réinitialise la page à 1 lors de changement de filtres
- Utilise `debouncedSearchQuery` dans `fetchEvents`

## 🎯 Avantages

1. **Performance** : Recherche serveur ultra-rapide (index GIN)
2. **Scalabilité** : Fonctionne avec des milliers d'événements
3. **Pertinence** : Tri par relevance_score
4. **Filtres** : Tous les filtres sont serveur-side
5. **Pagination** : Pagination serveur efficace

## ⚠️ Notes

- La recherche full-text utilise la langue **anglais** (`'english'`)
- Les événements **sans causal chain** sont exclus (requis par la fonction)
- Le `search_vector` est mis à jour automatiquement via trigger
- Les filtres sont optionnels (NULL = pas de filtre)

## 🔄 Prochaines Étapes

1. **IntelligenceFeed** : Adapter pour utiliser la recherche serveur
2. **Recherche Avancée** : Ajouter recherche dans causal chains
3. **Autocomplete** : Suggestions de recherche
4. **Recherche Multi-langue** : Support français, etc.

## 📝 Tests

### Test de Recherche Basique

```typescript
const results = await searchEvents({
  searchQuery: 'trade sanctions',
  limit: 10
});
console.log('Results:', results);
```

### Test avec Filtres

```typescript
const results = await searchEvents({
  searchQuery: 'technology',
  sectorFilter: ['Technology', 'Energy'],
  regionFilter: ['US', 'EU'],
  minImpactScore: 0.5,
  limit: 20
});
```

### Test de Pagination

```typescript
const [page1, count] = await Promise.all([
  searchEvents({ limit: 5, offset: 0 }),
  countSearchResults({})
]);
console.log('Page 1:', page1.length, 'Total:', count);
```

---

**Status** : ✅ Complété pour Events page  
**Prochaine étape** : Adapter IntelligenceFeed

