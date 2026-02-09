# RSS Feeds Integration

## ✅ Intégration Complète

RSS feeds ont été intégrés pour augmenter le volume d'événements collectés.

---

## 📊 Sources RSS Configurées

### Geopolitical & International (4 feeds)
- **Reuters** : `https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best`
- **BBC World** : `https://feeds.bbci.co.uk/news/world/rss.xml`
- **Guardian World** : `https://www.theguardian.com/world/rss`
- **NPR World** : `https://feeds.npr.org/1001/rss.xml`

### Business & Finance (3 feeds)
- **Guardian Business** : `https://www.theguardian.com/business/rss`
- **BBC Business** : `https://feeds.bbci.co.uk/news/business/rss.xml`
- **NPR Business** : `https://feeds.npr.org/1006/rss.xml`

### Technology (3 feeds)
- **Guardian Tech** : `https://www.theguardian.com/technology/rss`
- **BBC Tech** : `https://feeds.bbci.co.uk/news/technology/rss.xml`
- **NPR Tech** : `https://feeds.npr.org/1019/rss.xml`

### Energy & Environment (1 feed)
- **BBC Environment** : `https://feeds.bbci.co.uk/news/science-environment/rss.xml`

**Total** : 10 feeds RSS configurés (sources fiables et testées)

---

## 🔧 Architecture

### Fichiers Créés

1. **`src/server/workers/rss-collector.ts`**
   - Parseur RSS simple (regex-based)
   - Collecte depuis 12 feeds
   - Déduplication automatique
   - Insertion dans `events` avec `source: 'rss:feedname'`

2. **`src/server/workers/data-collector.ts`** (modifié)
   - Intègre `collectRSSEvents()` dans `runDataCollector()`
   - Collecte NewsAPI + RSS en parallèle
   - Combine les résultats

3. **`src/server/workers/pipeline-orchestrator.ts`** (modifié)
   - Utilise `runDataCollector()` qui inclut RSS
   - Collecte automatique NewsAPI + RSS

---

## 📈 Volume Attendu

### Avant (NewsAPI uniquement)
- ~150 articles/cycle (50 × 3 catégories)
- Limité par quota NewsAPI

### Après (NewsAPI + RSS)
- **NewsAPI** : ~150 articles/cycle
- **RSS** : ~80-150 articles/cycle (selon les feeds disponibles)
- **Total** : ~230-300 articles/cycle
- **Augmentation** : +53% à +100%

**Note** : Les feeds RSS peuvent varier en disponibilité. Le système continue même si certains feeds échouent.

---

## 🚀 Utilisation

### Scripts NPM

```bash
# Collecter NewsAPI + RSS (recommandé)
npm run pipeline:collect

# Collecter uniquement RSS (test)
npm run pipeline:collect:rss

# Pipeline complet (NewsAPI + RSS + Processing)
npm run pipeline:run-once
```

### Intégration Automatique

Le pipeline orchestrator collecte automatiquement depuis :
1. **NewsAPI** (si `NEWS_API_KEY` configuré)
2. **RSS Feeds** (toujours actif)

Les deux sources sont collectées en parallèle et combinées.

---

## 🔍 Déduplication

La déduplication fonctionne sur :
- `source` : `'newsapi'` ou `'rss:feedname'`
- `source_id` : URL de l'article ou GUID

Un même article provenant de NewsAPI et d'un RSS feed sera traité comme deux événements distincts (différentes sources).

---

## 📝 Format de Source

Les événements RSS sont stockés avec :
- `source` : `'rss:reuters'`, `'rss:bbc world'`, etc.
- `source_id` : GUID ou URL de l'article
- `raw_category` : `'general'`, `'business'`, `'technology'`

---

## ⚙️ Configuration

### Ajouter un Feed RSS

Modifier `RSS_FEEDS` dans `src/server/workers/rss-collector.ts` :

```typescript
const RSS_FEEDS = [
  // ... existing feeds
  { url: 'https://example.com/feed.rss', name: 'Example Feed', category: 'business' },
];
```

### Parser RSS

Le parser actuel utilise des regex simples. Pour des feeds complexes, considérer :
- `fast-xml-parser` (npm package)
- `rss-parser` (npm package)

---

## 🧪 Tests

```bash
# Tester la collecte RSS uniquement
npm run pipeline:collect:rss

# Vérifier dans Supabase
SELECT source, COUNT(*) 
FROM events 
WHERE source LIKE 'rss:%' 
GROUP BY source;
```

---

## 📊 Monitoring

Le collector RSS log :
- Nombre d'items trouvés par feed
- Nombre d'items insérés
- Nombre d'items skippés (déjà existants)
- Erreurs par feed

---

## ⚠️ Limitations & Gestion d'Erreurs

1. **Parser Simple** : Utilise regex, peut échouer sur feeds complexes
2. **Rate Limiting** : Respecter les limites des serveurs RSS
3. **Timeout** : 10 secondes par feed (évite les blocages)
4. **Résilience** : Utilise `Promise.allSettled` - un feed qui échoue n'empêche pas les autres
5. **Format RSS** : Supporte RSS 2.0 standard, peut nécessiter ajustements
6. **Déduplication** : Les items déjà présents sont automatiquement skippés (normal après la première collecte)

---

## 🔄 Améliorations Futures

1. **Parser XML Robuste** : Utiliser `fast-xml-parser` ou `rss-parser`
2. **Gestion d'Erreurs** : Retry logic pour feeds temporairement indisponibles
3. **Cache** : Éviter de refetch les mêmes items
4. **Validation** : Vérifier la validité des feeds avant collecte
5. **Configuration Dynamique** : Permettre d'ajouter/modifier feeds via admin panel

---

## ✅ Status

- [x] RSS collector créé
- [x] Intégré dans data-collector
- [x] Intégré dans pipeline orchestrator
- [x] 12 feeds configurés
- [x] Déduplication fonctionnelle
- [x] Scripts NPM ajoutés

---

**Dernière mise à jour** : Janvier 2025

