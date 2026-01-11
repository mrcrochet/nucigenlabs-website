# Architecture UI Contract - Nucigen

## Principe Fondamental

> **Chaque page = une intention unique + un type de sortie unique**

## Mapping Page → Type → Agent

| Page | Type autorisé | Agent | Consomme | Produit |
|------|---------------|-------|----------|---------|
| `/intelligence` | `signal` | Intelligence Signal Agent | `events[]` | `signal[]` |
| `/events` | `event` | Event Extraction Agent | `raw_data` | `event[]` |
| `/recommendations` | `recommendation` | Recommendation Agent | `signals[]` + `events[]` | `recommendation[]` |
| `/alerts` | `alert` | Alert Detection Agent | `signals[]` + `thresholds` | `alert[]` |
| `/research` | `analysis` | Research Agent | `events[]` + `signals[]` | `analysis[]` |
| `/quality` | `metric` | Quality Agent | `pipeline_logs` | `metric` |

## Règles Strictes

1. **Une page NE PEUT consommer qu'UN type d'objet**
2. **Pas de signal → pas de recommendation**
3. **Events = source de vérité unique**
4. **Intelligence = signals synthétiques (pas d'events bruts)**

## Flux de Données

```
Data Sources (Firecrawl, Tavily, RSS)
    ↓
Event Extraction Agent
    ↓
Event Store (single source of truth)
    ↓
    ├─→ Signal Agent → Intelligence Page
    ├─→ Alert Agent → Alerts Page
    ├─→ Research Agent → Research Page
    └─→ Recommendation Agent → Recommendations Page
```

## Implémentation

- Types définis dans `src/types/intelligence.ts`
- API définie dans `src/lib/api/intelligence-api.ts`
- Pages doivent utiliser uniquement ces types
- Agents implémentés côté serveur (à venir)
