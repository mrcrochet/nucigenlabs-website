# Plan d'Intégration : Twelve Data + NewsAPI.ai

## 🎯 Objectif

Intégrer deux nouvelles sources de données dans l'architecture Nucigen :
- **Twelve Data** : Données financières temps réel (marchés, FX, crypto, commodities)
- **NewsAPI.ai** : Extraction d'événements structurés depuis les news

## 📋 Architecture Respectée

### Règles Critiques
1. ✅ **EventAgent** reste le SEUL point d'accès aux APIs externes
2. ✅ **FACTS ONLY** : Pas d'impact, pas de priorité dans EventAgent
3. ✅ **UI Contract** : Chaque page consomme un seul type (Signal, Event, etc.)
4. ✅ **Services** : Créer des services techniques, pas de logique métier

## 🏗️ Architecture Proposée

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  Twelve Data    │       │   NewsAPI.ai    │       │     Tavily      │
│   (Marché)      │       │  (Événements)   │       │   (Recherche)   │
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                         │                         │
         └─────────────┬───────────┴─────────────────────────┘
                       ↓
         ┌─────────────────────────────────────┐
         │      Services Techniques            │
         │  - twelvedata-service.ts            │
         │  - newsapi-ai-service.ts            │
         └───────────────┬─────────────────────┘
                         ↓
         ┌─────────────────────────────────────┐
         │      EventAgent (SEUL accès)        │
         │  - Utilise les services             │
         │  - Extrait Event[] (FACTS ONLY)    │
         └───────────────┬─────────────────────┘
                         ↓
         ┌─────────────────────────────────────┐
         │      Event Store (Supabase)         │
         │  - events table                     │
         │  - nucigen_events table             │
         └───────────────┬─────────────────────┘
                         ↓
         ┌─────────────────────────────────────┐
         │      SignalAgent                    │
         │  - Consomme Event[]                 │
         │  - Génère Signal[]                 │
         └─────────────────────────────────────┘
```

## 📦 Implémentation

### Phase 1 : Services Techniques

#### 1.1 `twelvedata-service.ts`
**Responsabilité** : Wrapper technique pour Twelve Data API
- ✅ Pas de logique métier
- ✅ Retourne données brutes normalisées
- ✅ Gestion erreurs, retry, rate limiting

**Méthodes** :
```typescript
- getRealTimePrice(symbol: string)
- getTimeSeries(symbol: string, interval: string)
- getForexRates(base: string)
- getCryptoPrice(symbol: string)
- getCommodityPrice(symbol: string)
```

#### 1.2 `newsapi-ai-service.ts`
**Responsabilité** : Wrapper technique pour NewsAPI.ai Event Registry
- ✅ Pas de logique métier
- ✅ Retourne événements structurés bruts
- ✅ Gestion erreurs, retry, rate limiting

**Méthodes** :
```typescript
- searchEvents(query: string, filters?: EventFilters)
- getEventById(eventId: string)
- getEventsByEntity(entityId: string, entityType: string)
- getEventsByLocation(country: string, region?: string)
- getEventsBySector(sector: string)
```

### Phase 2 : Extension EventAgent

#### 2.1 Ajouter méthodes dans EventAgent
```typescript
// Dans EventAgent
async extractEventsFromMarketData(marketData: MarketData): Promise<Event[]>
async extractEventsFromNewsAPI(newsEvents: NewsAPIEvent[]): Promise<Event[]>
```

**Règles** :
- ✅ Utilise les services techniques (pas d'appels directs)
- ✅ Extrait FACTS ONLY (pas d'impact/priorité)
- ✅ Retourne Event[] conforme au UI Contract

### Phase 3 : Schéma de Données Unifié

#### 3.1 Étendre Event Type
```typescript
interface Event {
  // ... existing fields
  source_type: 'tavily' | 'newsapi_ai' | 'twelvedata' | 'firecrawl';
  market_data?: {
    symbol?: string;
    price?: number;
    change?: number;
    volume?: number;
  };
  newsapi_event_id?: string;
  entities?: Array<{
    id: string;
    type: 'person' | 'organization' | 'location' | 'sector';
    name: string;
  }>;
}
```

#### 3.2 Mettre à jour DB Schema
- Ajouter colonnes `source_type`, `market_data` (JSONB), `entities` (JSONB)
- Migration SQL

### Phase 4 : Variables d'Environnement

```env
# Twelve Data
TWELVEDATA_API_KEY=your_key_here

# NewsAPI.ai
NEWSAI_API_KEY=your_key_here
```

### Phase 5 : Intégration API Server

#### 5.1 Nouveaux Endpoints
```typescript
POST /api/events/market-data
POST /api/events/newsapi
GET /api/market-data/:symbol
```

## 🔒 Respect des Règles Architecturales

### ✅ Règle 1 : Accès APIs Externes
- **EventAgent** est le SEUL point d'accès
- Services techniques sont des wrappers (pas d'appels depuis ailleurs)

### ✅ Règle 2 : UI Contract
- EventAgent retourne toujours `Event[]`
- Pas de transformation dans React

### ✅ Règle 3 : FACTS ONLY
- EventAgent n'assigne pas d'impact/priorité
- Services techniques retournent données brutes

### ✅ Règle 4 : Pas de Logique Métier dans Services
- Services = wrappers techniques
- Agents = intelligence métier

## 📊 Flux de Données

### Exemple : Intégration NewsAPI.ai

```
1. NewsAPI.ai Service
   ↓ (appel API)
   Raw NewsAPI Event
   ↓
2. EventAgent.extractEventsFromNewsAPI()
   ↓ (extraction facts)
   Event[] (FACTS ONLY)
   ↓
3. Event Store (Supabase)
   ↓ (persistence)
4. SignalAgent.generateSignals()
   ↓ (synthesis)
   Signal[] (avec impact/priorité)
   ↓
5. Intelligence Feed UI
   ↓ (affichage)
```

### Exemple : Intégration Twelve Data

```
1. Twelve Data Service
   ↓ (appel API)
   Market Data (price, volume, etc.)
   ↓
2. EventAgent.extractEventsFromMarketData()
   ↓ (extraction facts: "AAPL price changed 5%")
   Event[] (FACTS ONLY)
   ↓
3. Event Store (Supabase)
   ↓ (persistence)
4. SignalAgent.generateSignals()
   ↓ (synthesis avec news events)
   Signal[] (ex: "Market volatility + News event = Signal")
   ↓
5. Intelligence Feed UI
```

## 🧪 Tests Requis

### Tests Services
- [ ] Twelve Data service : getRealTimePrice, getTimeSeries
- [ ] NewsAPI.ai service : searchEvents, getEventById
- [ ] Gestion erreurs, retry logic

### Tests EventAgent
- [ ] extractEventsFromMarketData retourne Event[] (FACTS ONLY)
- [ ] extractEventsFromNewsAPI retourne Event[] (FACTS ONLY)
- [ ] Pas d'impact/priorité assigné

### Tests Intégration
- [ ] End-to-end : NewsAPI.ai → EventAgent → Event Store → SignalAgent
- [ ] End-to-end : Twelve Data → EventAgent → Event Store → SignalAgent

## 📝 Checklist Implémentation

### Phase 1 : Services
- [ ] Créer `src/server/services/twelvedata-service.ts`
- [ ] Créer `src/server/services/newsapi-ai-service.ts`
- [ ] Ajouter variables d'environnement
- [ ] Tests unitaires services

### Phase 2 : EventAgent
- [ ] Étendre EventAgent avec nouvelles méthodes
- [ ] Intégrer services techniques
- [ ] Tests EventAgent

### Phase 3 : Schéma
- [ ] Mettre à jour Event type
- [ ] Migration DB
- [ ] Tests schéma

### Phase 4 : API Server
- [ ] Nouveaux endpoints
- [ ] Tests endpoints

### Phase 5 : Documentation
- [ ] Mettre à jour ARCHITECTURE_RULES.md
- [ ] Documentation API
- [ ] Guide d'utilisation

## 🚀 Ordre d'Implémentation Recommandé

1. **Services techniques** (Phase 1) - Base solide
2. **Extension EventAgent** (Phase 2) - Respect architecture
3. **Schéma données** (Phase 3) - Support nouvelles sources
4. **API Server** (Phase 4) - Exposition fonctionnalités
5. **Tests & Documentation** (Phase 5) - Qualité

## ⚠️ Points d'Attention

1. **Rate Limiting** : Twelve Data et NewsAPI.ai ont des limites
2. **Coûts** : Surveiller usage API (quotas)
3. **Latence** : NewsAPI.ai peut être plus lent que Tavily
4. **Qualité données** : Valider qualité extraction événements
5. **Déduplication** : Éviter doublons entre sources

## ✅ Validation Finale

Avant de merger :
- [ ] Aucun appel direct aux APIs (sauf EventAgent)
- [ ] EventAgent retourne Event[] (FACTS ONLY)
- [ ] Services techniques sans logique métier
- [ ] Tests passent
- [ ] Documentation à jour
