# Prochaines Étapes - UI Contract Implementation

## ✅ État Actuel

Toutes les pages ont été restructurées selon le contrat UI :
- ✅ Types et interfaces définis
- ✅ Adaptateurs temporaires créés
- ✅ Pages restructurées (Intelligence, Events, Recommendations, Alerts, Research, Quality)
- ✅ Fonctions helper Supabase créées

## 🧪 Phase 1: Tests (Maintenant)

### Tests à Effectuer

1. **Intelligence Page** (`/intelligence`)
   - Vérifier que les signals s'affichent
   - Vérifier qu'aucun event brut n'est affiché
   - Tester la navigation vers events liés

2. **Events Page** (`/events`)
   - Vérifier que les events normalisés s'affichent
   - Tester le filtrage par `event_ids` (depuis signals)
   - Vérifier que les causal chains s'affichent

3. **Recommendations Page** (`/recommendations`)
   - Vérifier que les recommendations sont générées
   - Tester que pas de signal = pas de recommendation

4. **Alerts Page** (`/alerts`)
   - Vérifier que les alerts sont détectées
   - Tester le filtrage par sévérité

5. **Research Page** (`/research`)
   - Vérifier que les analyses sont générées
   - Tester les tabs medium/long-term

6. **Quality Page** (`/quality`)
   - Vérifier que les metrics s'affichent
   - Tester les périodes (7d, 30d, 90d)

### Guide de Test

Voir `TESTING_GUIDE.md` pour la checklist complète.

---

## 🚀 Phase 2: Endpoints API (Après Tests)

Une fois les tests validés, créer les vrais endpoints API côté serveur.

### Structure Recommandée

```
src/server/api/
  ├── signals.ts          # GET /api/signals
  ├── events.ts           # GET /api/events, GET /api/events/:id
  ├── recommendations.ts  # GET /api/recommendations
  ├── alerts.ts          # GET /api/alerts
  ├── analysis.ts        # GET /api/analysis
  └── metrics.ts         # GET /api/metrics
```

### Exemple: Endpoint Signals

```typescript
// src/server/api/signals.ts
import { getSignalsFromEvents } from '../../lib/supabase';

app.get('/signals', async (req, res) => {
  const { scope, horizon, min_impact, min_confidence, page, limit } = req.query;
  const userId = req.user?.id; // From auth middleware
  
  try {
    const signals = await getSignalsFromEvents({
      // Map query params to SearchOptions
    }, userId);
    
    res.json({
      signals,
      total: signals.length,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🤖 Phase 3: Agents (Après Endpoints)

Implémenter les vrais agents avec les system prompts définis.

### Structure Recommandée

```
src/server/agents/
  ├── signal-agent.ts
  ├── event-extraction-agent.ts
  ├── recommendation-agent.ts
  ├── alert-detection-agent.ts
  ├── research-agent.ts
  └── quality-agent.ts
```

### Exemple: Signal Agent

```typescript
// src/server/agents/signal-agent.ts
import { SignalAgent, SignalAgentInput } from '../../lib/agents/agent-interfaces';

const SYSTEM_PROMPT = `
You are the Intelligence Signal Agent.
Your role is to synthesize multiple verified events into a single, high-level intelligence signal.
...
`;

export class IntelligenceSignalAgent implements SignalAgent {
  async generateSignal(input: SignalAgentInput): Promise<AgentResponse<Signal>> {
    // Implementation with OpenAI/Claude
  }
}
```

---

## 🔄 Phase 4: Migration (Final)

Remplacer les adaptateurs temporaires par les vrais endpoints API.

### Étapes

1. Créer les endpoints API
2. Tester chaque endpoint
3. Mettre à jour les pages pour utiliser les endpoints API
4. Supprimer les adaptateurs temporaires (ou les garder comme fallback)

---

## 📊 Métriques de Succès

- ✅ Chaque page charge sans erreur
- ✅ Chaque page affiche le bon type d'objet
- ✅ Aucune confusion sémantique (pas d'events dans Intelligence, etc.)
- ✅ Les données sont cohérentes
- ✅ La navigation fonctionne
- ✅ Les filtres fonctionnent

---

## 🎯 Objectif Final

Un système où :
- Chaque page a un rôle clair
- Chaque type d'objet a un format fixe
- Les API sont simples et prévisibles
- Les agents ont des responsabilités uniques
- Le code est maintenable et scalable
