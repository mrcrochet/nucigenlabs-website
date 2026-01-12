# Architecture Rules - Nucigen

## 🔒 RÈGLES STRICTES D'ARCHITECTURE

Ces règles doivent être respectées **sans exception**. Toute violation doit être corrigée immédiatement.

---

## RÈGLE 1 — Accès aux APIs Externes

> **Seul `EventAgent` peut utiliser Tavily ou Firecrawl.**
> **Tout autre appel direct est interdit.**

### Implémentation
- ✅ `src/server/agents/event-agent.ts` — SEUL accès autorisé
- ❌ `src/server/services/live-event-creator.ts` — DEPRECATED (à migrer)
- ❌ Tous les autres fichiers — INTERDIT

### Vérification
```bash
# Chercher les violations
grep -r "TavilySearchAPIClient\|tavily\|firecrawl" src/ --exclude-dir=agents
```

---

## RÈGLE 2 — Contrat UI Strict

> **Chaque page UI consomme UN SEUL type d'objet.**

### Mapping
| Page | Type autorisé | Agent |
|------|---------------|-------|
| `/intelligence` | `Signal[]` uniquement | SignalAgent |
| `/events` | `Event[]` uniquement | EventAgent |
| `/recommendations` | `Recommendation[]` uniquement | RecommendationAgent |
| `/alerts` | `Alert[]` uniquement | AlertAgent |
| `/research` | `Analysis[]` uniquement | ResearchAgent |
| `/quality` | `Metric[]` uniquement | QualityAgent |

### Vérification
- ❌ Une page ne doit JAMAIS consommer plusieurs types
- ❌ Une page ne doit JAMAIS accéder directement aux events pour créer des signals
- ✅ Une page appelle UN agent qui retourne UN type

---

## RÈGLE 3 — Agents ≠ Services

### Agents (`src/server/agents/`)
- **Responsabilité:** Intelligence métier
- **Exemples:** SignalAgent, EventAgent, RecommendationAgent
- **Peuvent utiliser:** Services, autres agents
- **Ne font jamais:** Appels directs aux APIs externes (sauf EventAgent)

### Services (`src/server/services/`)
- **Responsabilité:** Outils techniques
- **Exemples:** Cache, logging, validation
- **Ne décident jamais:** Pas de logique métier
- **Ne filtrent jamais:** Pas de "important" vs "non important"

---

## RÈGLE 4 — EventAgent = FACTS ONLY

> **EventAgent extrait des FAITS, pas des interprétations.**

### Ce que EventAgent FAIT
- ✅ Extrait: who, what, where, when
- ✅ Classifie: event_type, sector, region (factuel)
- ✅ Assigne: confidence (qualité des données, pas importance)

### Ce que EventAgent NE FAIT PAS
- ❌ N'assigne JAMAIS d'impact
- ❌ N'assigne JAMAIS de priorité
- ❌ Ne filtre JAMAIS par "importance"
- ❌ N'interprète JAMAIS ("why it matters")
- ❌ Ne prédit JAMAIS (first_order_effect, second_order_effect)

### Vérification
```typescript
// ❌ MAUVAIS
event.impact = calculateImpact(event); // EventAgent ne fait pas ça

// ✅ BON
event.impact = 0; // EventAgent retourne 0, SignalAgent assignera l'impact
```

---

## RÈGLE 5 — Pas de Logique Métier dans React

> **Les composants React affichent, ils ne décident pas.**

### Ce que React FAIT
- ✅ Affiche les données
- ✅ Gère l'interaction utilisateur
- ✅ Formate les données pour l'affichage

### Ce que React NE FAIT PAS
- ❌ Ne filtre pas par "importance" (sauf pour l'affichage)
- ❌ Ne calcule pas de scores
- ❌ Ne décide pas de pertinence
- ❌ Ne transforme pas Event[] en Signal[]

### Vérification
```typescript
// ❌ MAUVAIS (dans React)
const importantEvents = events.filter(e => e.impact > 70);

// ✅ BON (dans Agent)
const signals = await signalAgent.generateSignals({ events });
// React affiche juste signals
```

---

## RÈGLE 6 — Single Source of Truth

### Flux de Données
```
Tavily/Firecrawl APIs
    ↓
EventAgent (SEUL accès)
    ↓
Event Store (Supabase)
    ↓
SignalAgent (consomme Event[])
    ↓
Intelligence Page (consomme Signal[])
```

### Règles
1. **EventAgent** est le SEUL point d'entrée pour Tavily/Firecrawl
2. **Event Store** (Supabase) est la source de vérité pour les events
3. **Agents** consomment depuis Event Store, pas directement depuis APIs
4. **Pages** consomment depuis Agents, pas directement depuis Event Store

---

## RÈGLE 7 — Validation Stricte

### EventAgent
- ✅ Valide: event_type, summary (requis)
- ✅ Valide: date format
- ✅ Valide: actors array
- ❌ Ne valide pas: impact, priority (pas de responsabilité)

### SignalAgent
- ✅ Valide: Au moins 2 events pour créer un signal (ou 1 high-impact)
- ✅ Valide: user_preferences format
- ✅ Valide: Signal[] format

---

## RÈGLE 8 — Tests Minimum

### Tests Requis
```typescript
describe("EventAgent", () => {
  it("returns only Event[]", ...);
  it("never assigns impact or priority", ...);
  it("extracts facts only", ...);
});

describe("SignalAgent", () => {
  it("returns only Signal[]", ...);
  it("never accesses Tavily/Firecrawl", ...);
});
```

---

## 🚨 VIOLATIONS COMMUNES

### ❌ Violation 1: Appel direct à Tavily
```typescript
// ❌ MAUVAIS
import { tavily } from '@tavily/core';
const results = await tavily.search(...);

// ✅ BON
const response = await eventAgent.searchAndExtractEvents(query);
```

### ❌ Violation 2: Logique métier dans React
```typescript
// ❌ MAUVAIS (dans React)
const signals = eventsToSignals(events);

// ✅ BON (dans Agent)
const signals = await signalAgent.generateSignals({ events });
```

### ❌ Violation 3: EventAgent assigne impact
```typescript
// ❌ MAUVAIS (dans EventAgent)
event.impact = calculateImpact(event);

// ✅ BON (dans SignalAgent)
signal.impact_score = calculateImpactFromEvents(events);
```

---

## 📋 CHECKLIST DE VALIDATION

Avant de merger du code, vérifier:

- [ ] Aucun appel direct à Tavily/Firecrawl (sauf EventAgent)
- [ ] Pages consomment UN SEUL type d'objet
- [ ] EventAgent n'assigne pas d'impact/priorité
- [ ] Pas de logique métier dans React
- [ ] Agents respectent leurs responsabilités
- [ ] Tests passent

---

## 🔄 MIGRATION PROGRESSIVE

### Fichiers à Migrer (ordre recommandé)

1. ✅ `live-event-creator.ts` — DEPRECATED (marqué)
2. ⏳ `tavily-personalized-collector.ts` — Utiliser EventAgent
3. ⏳ `tavily-unified-service.ts` — Utiliser EventAgent
4. ⏳ Services Firecrawl — Utiliser EventAgent

---

## 📝 NOTES

- Ces règles sont **non négociables**
- Toute violation doit être corrigée immédiatement
- En cas de doute, consulter ce document
- Les agents sont **remplaçables** — si une règle bloque, c'est qu'il faut changer l'agent, pas la règle
