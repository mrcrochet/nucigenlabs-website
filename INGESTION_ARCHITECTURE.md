# Ingestion Architecture - Nucigen Labs

## 🎯 Architecture de Collecte

### Sources Actives (Par Défaut)

```
┌─────────────────────────────────────────┐
│         TAVILY (Source Principale)     │
│  ✅ Intelligent, curated, high-signal │
│  ✅ Filtrage par pertinence            │
│  ✅ Articles récents (7 jours)        │
│  ✅ ~50-100 articles/cycle             │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│      RSS FEEDS (Complémentaire)         │
│  ✅ Sources fiables                      │
│  ✅ Couverture passive                  │
│  ✅ ~80-150 articles/cycle              │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         Table: events                   │
│         (status: pending)               │
└─────────────────────────────────────────┘
```

### Sources Inactives (Par Défaut)

```
┌─────────────────────────────────────────┐
│         NEWSAPI (Désactivé)              │
│  ❌ Non rentable                         │
│  ❌ Trop de bruit                        │
│  ⚠️  Fallback manuel uniquement          │
└─────────────────────────────────────────┘
```

---

## 📊 Décision d'Architecture

### Pourquoi NewsAPI est Désactivé

1. **Coût par Requête**
   - Pricing basé sur le nombre de requêtes
   - Taux de rejet élevé (articles non pertinents)
   - Coût total élevé pour peu de valeur

2. **Qualité vs Quantité**
   - NewsAPI : Volume élevé, bruit élevé
   - Tavily : Volume modéré, signal élevé
   - Pour Nucigen : Qualité > Quantité

3. **Alignement avec Design**
   - Intelligence-first nécessite pertinence
   - Moins d'événements pertinents > Plus d'événements avec bruit
   - Réduction des coûts LLM (moins d'événements à traiter)

---

## 🔧 Configuration

### Variables d'Environnement

```env
# Tavily (REQUIRED - Source principale)
TAVILY_API_KEY=your_tavily_key

# NewsAPI (OPTIONAL - Désactivé par défaut)
NEWS_API_KEY=your_newsapi_key  # Non utilisé sauf si ENABLE_NEWSAPI=true
ENABLE_NEWSAPI=false  # Par défaut: false (désactivé)
```

### Activation de NewsAPI (Non Recommandé)

```bash
# Activer NewsAPI manuellement (urgence uniquement)
ENABLE_NEWSAPI=true npm run pipeline:collect
```

---

## 🚀 Scripts

### Collecte Standard (Recommandé)

```bash
# Collecte complète (Tavily + RSS)
npm run pipeline:collect

# Tavily uniquement (source principale)
npm run pipeline:collect:tavily

# RSS uniquement (complémentaire)
npm run pipeline:collect:rss
```

### Collecte avec NewsAPI (Non Recommandé)

```bash
# Activer NewsAPI en fallback
ENABLE_NEWSAPI=true npm run pipeline:collect
```

---

## 📈 Volume et Coûts

### Volume de Collecte

| Source | Articles/Cycle | Qualité | Coût |
|--------|----------------|---------|------|
| **Tavily** | 50-100 | ⭐⭐⭐⭐⭐ | Modéré |
| **RSS** | 80-150 | ⭐⭐⭐ | Gratuit |
| **NewsAPI** | 0 (désactivé) | ⭐⭐ | Élevé |

### Impact sur Coûts LLM

- **Avant (NewsAPI)** : ~250-350 articles/cycle → ~250-350 appels LLM
- **Après (Tavily)** : ~130-250 articles/cycle → ~130-250 appels LLM
- **Réduction** : ~40-50% de coûts LLM
- **Qualité** : Meilleure (moins de bruit = moins de rejets)

---

## 🔄 Flux de Données

```
1. Tavily News Collector
   ↓
   Requêtes intelligentes (10 queries)
   ↓
   Filtrage (score > 0.5, 7 derniers jours)
   ↓
   Table: events (source='tavily')

2. RSS Collector
   ↓
   10 feeds RSS fiables
   ↓
   Déduplication
   ↓
   Table: events (source='rss:feedname')

3. Event Processor
   ↓
   Phase 1: Extraction structurée
   ↓
   Phase 2B: Causal chains
   ↓
   Table: nucigen_events + nucigen_causal_chains
```

---

## ⚠️ Firecrawl (Non Changé)

Firecrawl reste **inchangé** :
- ✅ Documents officiels uniquement
- ✅ Domaines whitelistés
- ✅ Pas de scraping large
- ✅ Complément aux événements existants

---

## 📝 Notes

1. **Tavily est la source principale** - Qualité > Quantité
2. **RSS est complémentaire** - Couverture passive
3. **NewsAPI est désactivé** - Non rentable, trop de bruit
4. **Firecrawl inchangé** - Documents officiels uniquement

---

## ✅ Avantages de cette Architecture

1. **Réduction des coûts**
   - Moins d'appels API (NewsAPI)
   - Moins d'appels LLM (moins d'événements)
   - Meilleur ROI

2. **Amélioration de la qualité**
   - Filtrage intelligent (Tavily)
   - Moins de bruit
   - Plus de signal

3. **Alignement avec design**
   - Intelligence-first
   - Pertinence > Volume
   - Qualité > Quantité

---

**Dernière mise à jour** : Janvier 2025

