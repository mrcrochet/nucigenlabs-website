# Sources de Données - Nucigen Labs

## 📊 Vue d'ensemble

### Sources Principales (Collecte Automatique)

#### 1. **Tavily** (`tavily.com`) - **SOURCE PRINCIPALE**
- **Type** : API de recherche intelligente
- **Rôle** : Source principale pour collecte d'événements pertinents
- **Avantages** :
  - Filtrage par pertinence (score > 0.5)
  - Articles récents uniquement (7 derniers jours)
  - Requêtes ciblées (géopolitique, business, tech, régulation)
  - Moins de bruit, plus de signal
- **Volume** : ~50-100 articles pertinents par cycle
- **Fréquence** : Toutes les heures (configurable)
- **Fichier** : `src/server/workers/tavily-news-collector.ts`
- **Status** : ✅ Actif par défaut

#### 2. **RSS Feeds** (10 sources) - **COMPLÉMENTAIRE**
- **Type** : Flux RSS de sources fiables
- **Rôle** : Couverture complémentaire, sources de confiance
- **Sources** :
  - **Geopolitical** : Reuters, BBC World, Guardian World, NPR World
  - **Business** : Guardian Business, BBC Business, NPR Business
  - **Technology** : Guardian Tech, BBC Tech, NPR Tech
  - **Environment** : BBC Environment
- **Volume** : ~80-150 articles par cycle (selon les feeds)
- **Fréquence** : Toutes les heures (en parallèle avec Tavily)
- **Fichier** : `src/server/workers/rss-collector.ts`
- **Format source** : `rss:feedname` (ex: `rss:bbc world`)
- **Status** : ✅ Actif par défaut

#### 3. **NewsAPI** (`newsapi.org`) - **DÉSACTIVÉ PAR DÉFAUT**
- **Type** : API tierce pour actualités
- **Status** : ❌ Désactivé par défaut (non rentable)
- **Raison** : Coût par requête élevé, taux de rejet élevé, trop de bruit
- **Utilisation** : Uniquement en fallback manuel/urgence
- **Activation** : `ENABLE_NEWSAPI=true` (non recommandé)
- **Fichier** : `src/server/workers/data-collector.ts`

### Sources d'Enrichissement (Phase 4)

#### 1. **Tavily Context Service** (`tavily.com`)
- **Rôle** : Enrichissement contextuel des événements existants
- **Utilisation** :
  - Contexte historique
  - Événements similaires passés
  - Explications de fond
  - Validation des effets de second ordre
- **Règle** : N'enrichit QUE les événements existants, ne détecte PAS de nouveaux événements
- **Fichier** : `src/server/phase4/tavily-context-service.ts`
- **Note** : Différent de `tavily-news-collector.ts` (collecte) vs `tavily-context-service.ts` (enrichissement)

#### 2. **Firecrawl** (`firecrawl.dev`)
- **Rôle** : Scraping de documents officiels uniquement
- **Utilisation** :
  - Documents gouvernementaux
  - Sites de régulateurs
  - Institutions officielles
- **Règle** : Domaines whitelistés uniquement, pas de scraping large
- **Fichier** : `src/server/phase4/firecrawl-official-service.ts`
- **Table** : `firecrawl_whitelist` (gestion des domaines autorisés)

### Sources Manuelles (Tests)

- **Type** : Insertion manuelle pour tests
- **Source** : `'manual'`
- **Fichier** : `src/server/phase1/insert-test-events.ts`

---

## 🔄 Flux de Données

```
┌─────────────────────────────────────────────────────────┐
│                    SOURCES DE DONNÉES                    │
└─────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
   ┌────────┐    ┌──────────┐    ┌──────────┐
   │NewsAPI │    │  Tavily  │    │Firecrawl │
   │(Primaire)│   │(Enrich.) │    │(Enrich.) │
   └────────┘    └──────────┘    └──────────┘
        │               │               │
        └───────────────┼───────────────┘
                        ▼
              ┌─────────────────┐
              │  Table: events  │
              │  (status: pending)│
              └─────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │ Event Processor │
              │ (Phase 1 + 2B)  │
              └─────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│nucigen_events│ │event_context │ │official_docs │
│              │ │  (Tavily)    │ │ (Firecrawl)  │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 📋 Détails Techniques

### NewsAPI

**Configuration** :
```env
NEWS_API_KEY=your-newsapi-key
```

**Catégories collectées** :
- `business` : Actualités économiques et financières
- `technology` : Actualités technologiques
- `general` : Actualités générales

**Limitations** :
- Plan gratuit : 100 requêtes/jour
- Plan payant : Limites plus élevées
- Rate limiting : À respecter

**Déduplication** :
- Basée sur `source='newsapi'` + `source_id=url`
- Vérifie l'existence avant insertion

### Tavily

**Configuration** :
```env
TAVILY_API_KEY=your-tavily-key
```

**Utilisation** :
- Enrichit `nucigen_events` existants
- Ajoute du contexte historique
- Trouve des événements similaires passés
- Valide les effets de second ordre

**Règle stricte** :
- ❌ Ne détecte PAS de nouveaux événements
- ✅ Enrichit UNIQUEMENT les événements existants
- ✅ S'exécute APRÈS qu'un événement existe

### Firecrawl

**Configuration** :
```env
FIRECRAWL_API_KEY=your-firecrawl-key
```

**Utilisation** :
- Scrape des documents officiels
- Domaines whitelistés uniquement
- Sources gouvernementales, régulateurs, institutions

**Règle stricte** :
- ❌ Pas de scraping large
- ❌ Pas de scraping de news générales
- ✅ Domaines whitelistés uniquement
- ✅ Documents officiels uniquement

---

## 📊 Statistiques

### Volume de Collecte

#### Tavily (Source Principale)
- **Par cycle** : ~50-100 articles pertinents (filtrés par score > 0.5)
- **Fréquence** : Toutes les heures
- **Qualité** : Haute (filtrage intelligent, récent uniquement)

#### RSS Feeds (Complémentaire)
- **Par cycle** : ~80-150 articles (selon les feeds disponibles)
- **Fréquence** : Toutes les heures (en parallèle)

#### Total Combiné
- **Par cycle** : ~130-250 articles (Tavily + RSS)
- **Par jour** : ~3,120-6,000 articles max (si tous nouveaux)
- **Réel** : Moins à cause de la déduplication
- **Avantage** : Qualité > Quantité (moins de bruit, plus de signal)

#### NewsAPI (Désactivé)
- **Par cycle** : 0 (désactivé par défaut)
- **Activation manuelle** : `ENABLE_NEWSAPI=true` (non recommandé)

### Enrichissement

- **Tavily** : Enrichit chaque `nucigen_event` avec contexte
- **Firecrawl** : Scrape uniquement les URLs de domaines whitelistés

---

## 🔐 Sécurité et Conformité

### NewsAPI
- ✅ API officielle avec clé d'API
- ✅ Respect des ToS
- ✅ Rate limiting respecté

### Tavily
- ✅ API officielle
- ✅ Utilisation conforme (enrichissement uniquement)

### Firecrawl
- ✅ Domaines whitelistés uniquement
- ✅ Respect des robots.txt
- ✅ Sources officielles uniquement

---

## 🚀 Améliorations Futures Possibles

### Sources Additionnelles
1. **RSS Feeds** : Flux RSS de sources fiables
2. **APIs Spécialisées** :
   - Alpha Vantage (données financières)
   - FRED API (données économiques US)
   - World Bank API (données macro)
   - UN Comtrade (commerce international)
   - IEA (énergie)
3. **Webhooks** : Partenaires et services tiers
4. **Scraping Ciblé** : Sites gouvernementaux spécifiques

### Améliorations Qualité
1. **Filtrage par source** : Prioriser certaines sources
2. **Scoring de crédibilité** : Noter les sources
3. **Diversification** : Plus de sources pour éviter biais
4. **Validation humaine** : Review des sources importantes

---

## 📝 Notes

- **NewsAPI est la source principale** pour la collecte automatique
- **Tavily et Firecrawl sont des outils d'enrichissement**, pas des sources primaires
- Les sources manuelles sont uniquement pour les tests
- Toutes les sources respectent les ToS et les bonnes pratiques

---

**Dernière mise à jour** : Janvier 2025

