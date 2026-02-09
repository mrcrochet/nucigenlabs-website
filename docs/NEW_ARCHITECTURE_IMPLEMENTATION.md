# Nouvelle Architecture Nucigen - Implémentation

## 🎯 Vision Globale

> **Nucigen est un moteur qui transforme le monde réel en lecture économique actionnable.**

**Pas** :
- ❌ un site de news
- ❌ un terminal de trading

**Mais** :
- ✅ un **système de compréhension**
- ✅ un **filtre intelligent du chaos**
- ✅ une **couche entre événements → décisions**

---

## ✅ Agents Créés (Production-Ready)

### 1. OverviewNarrativeAgent ✅
**Fichier**: `src/server/agents/overview-narrative-agent.ts`

**Rôle**: Génère "Today's Narrative" - une histoire cohérente à partir d'événements

**Prompt utilisé**: Today's Narrative (PROMPT CLÉ)

**Endpoint**: `GET /api/overview/narrative?timeframe=24h|7d|30d`

**Utilisé par**: `NarrativeCard` (Overview page)

**Output**:
```typescript
{
  narrative: string; // max 120 words
  key_themes: string[];
  confidence_level: 'low' | 'medium' | 'high';
}
```

---

### 2. IntelligenceClusterAgent ✅
**Fichier**: `src/server/agents/intelligence-cluster-agent.ts`

**Rôle**: Détecte les patterns thématiques et crée des clusters d'événements

**Prompts utilisés**:
- Event Clustering
- Relationship Reasoning

**Endpoints**:
- `POST /api/intelligence/cluster` - Cluster events
- (Future) Relationship explanation endpoint

**Output**:
```typescript
{
  cluster_name: string;
  events: string[]; // event IDs
  reasoning: string;
  strength: number; // 1-10
}
```

---

### 3. SignalAgent (Amélioré) ✅
**Fichier**: `src/server/agents/signal-agent.ts`

**Rôle**: Transforme le chaos en direction lisible (CŒUR DE LA VALEUR)

**Améliorations**:
- ✅ Nouveau prompt stratégique intégré
- ✅ Intégration Perplexity pour contexte marché
- ✅ Génération de signaux avec reasoning transparent

**Prompt utilisé**: Signal Generation (LE PLUS IMPORTANT)

**Méthode principale**: `generateSignalFromEventCluster()`

**Output**: `Signal[]` avec:
- `signal_title`
- `signal_description`
- `signal_strength` (1-10)
- `confidence` (1-10)
- `time_horizon`
- `reasoning`

---

### 4. MarketDisconnectAgent ✅
**Fichier**: `src/server/agents/market-disconnect-agent.ts`

**Rôle**: Détecte les décalages entre risque réel et pricing marché

**Prompt utilisé**: Market Disconnect Detection

**Endpoint**: `POST /api/markets/disconnect`

**Output**:
```typescript
{
  disconnect: boolean;
  explanation: string;
  severity: 'low' | 'medium' | 'high';
}
```

---

### 5. ImpactExposureAgent ✅
**Fichier**: `src/server/agents/impact-exposure-agent.ts`

**Rôle**: Mappe les expositions entités/entreprises aux signaux

**Prompt utilisé**: Entity Exposure Mapping

**Endpoint**: `POST /api/impacts/exposure`

**Output**:
```typescript
{
  entity: string;
  entity_type: 'company' | 'sector' | 'country' | 'asset';
  exposure_type: 'direct' | 'indirect';
  reason: string;
  exposure_score: number; // 0-100
}
```

---

## 📄 Composants Mis à Jour

### NarrativeCard ✅
**Fichier**: `src/components/overview/NarrativeCard.tsx`

**Changements**:
- ✅ Connecté à `/api/overview/narrative`
- ✅ Affiche la narrative générée par l'agent
- ✅ Affiche les key_themes
- ✅ Affiche le confidence_level
- ✅ Sélecteur de timeframe (24h/7d/30d)

---

## 🔌 Endpoints API Créés

### Overview
- `GET /api/overview/narrative?timeframe=24h|7d|30d` ✅

### Intelligence
- `POST /api/intelligence/cluster` ✅

### Markets
- `POST /api/markets/disconnect` ✅

### Impacts
- `POST /api/impacts/exposure` ✅

---

## 📋 TODO - Reste à Faire

### 1. Overview Page (En cours)
- [x] NarrativeCard connecté
- [ ] KPI Cards dynamiques (cliquables = filtres)
- [ ] Event ↔ Market Timeline
- [ ] Top Signals Preview amélioré

### 2. Intelligence Page
- [ ] Event Clusters UI
- [ ] Relation Graph (interactif)
- [ ] Pattern Detector

### 3. Signals Page
- [x] SignalAgent amélioré avec prompt stratégique
- [ ] Signal Detail View avec reasoning transparent
- [ ] Signal Controls (watchlist, alerts)

### 4. Impacts Page
- [x] ImpactExposureAgent créé
- [ ] Impact Matrix UI
- [ ] Company/Asset View
- [ ] Market Disconnect Indicator

### 5. Markets Page
- [x] MarketDisconnectAgent créé
- [ ] Event ↔ Price Sync Timeline
- [ ] Historical Analogs

### 6. Research Page
- [ ] Analyst Brief Generator (prompt fourni)
- [ ] Templates (country risk, sector outlook, company exposure)

### 7. Alerts Page
- [ ] Alert Explanation (prompt fourni)
- [ ] Conditions simples/complexes

---

## 🧠 Prompts Disponibles (Non Implémentés Encore)

### Event Normalization
- **Agent**: EventAgent (existe déjà, peut être amélioré)
- **Prompt**: Event Normalization
- **Status**: EventAgent existe mais utilise un prompt différent

### Event Deduplication
- **Agent**: À créer
- **Prompt**: Event Deduplication Check
- **Status**: Non implémenté

### Signal Evolution Update
- **Agent**: À créer ou ajouter à SignalAgent
- **Prompt**: Signal Evolution Update
- **Status**: Non implémenté

### Event ↔ Market Explanation
- **Agent**: À créer
- **Prompt**: Event ↔ Market Explanation
- **Status**: Non implémenté

### Historical Analog Search
- **Agent**: À créer
- **Prompt**: Historical Analog Search
- **Status**: Non implémenté

### Analyst Brief Generator
- **Agent**: DeepResearchAgent (existe déjà, peut être amélioré)
- **Prompt**: Analyst Brief Generator
- **Status**: DeepResearchAgent existe mais utilise un prompt différent

### Alert Explanation
- **Agent**: À créer
- **Prompt**: Alert Explanation
- **Status**: Non implémenté

---

## 🎯 Principes Clés

1. **Chaque page produit une compréhension, une décision ou une action**
2. **Chaque prompt produit une sortie structurée, explicable et traçable**
3. **Pas de prose vague. Pas de hype.**
4. **Chaque agent a un rôle précis et un output structuré**

---

## 📝 Notes Techniques

### Imports Perplexity
Tous les agents qui utilisent Perplexity importent:
```typescript
import { chatCompletions } from '../services/perplexity-service';
```

### Imports OpenAI
Tous les agents qui utilisent OpenAI importent:
```typescript
import { callOpenAI } from '../services/openai-optimizer';
```

### Format de réponse
Tous les agents retournent du JSON structuré via `response_format: { type: 'json_object' }`

### Gestion d'erreurs
Tous les agents ont un fallback si l'API échoue (ex: méthode simple pour SignalAgent)

---

## 🚀 Prochaines Étapes Prioritaires

1. **Compléter Overview page** avec Timeline et KPI dynamiques
2. **Refactoriser Intelligence page** avec Event Clusters et Relation Graph
3. **Améliorer Signals page** avec reasoning transparent
4. **Intégrer Market Disconnect** dans Markets page
5. **Intégrer Impact Exposure** dans Impacts page

---

## 📚 Références

- **Vision**: Fournie par l'utilisateur
- **Prompts**: Fournis par l'utilisateur (production-ready)
- **Architecture**: Basée sur UI_SPEC_STRICT.md
- **Perplexity**: https://docs.perplexity.ai/
- **Finance Tools Roadmap**: https://docs.perplexity.ai/feature-roadmap#finance-tools-integration
