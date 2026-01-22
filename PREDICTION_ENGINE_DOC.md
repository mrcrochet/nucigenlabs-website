# Prediction Engine - Documentation Complète

## Vue d'ensemble

Le **Prediction Engine** génère des **scénarios outlooks** (3-9 scénarios) pour chaque événement avec :
- ✅ **Evidence grounded** : articles réels avec URLs + patterns historiques
- ✅ **Probabilités normalisées** : somme = 1.0
- ✅ **Counter-evidence** : preuves contradictoires pour les top scénarios
- ✅ **Watch indicators** : indicateurs à surveiller
- ✅ **Format JSON strict** : structure validée et traçable
- ✅ **Cache avec TTL** : 3h/6h/12h selon tier
- ✅ **Budget cap** : tracking des coûts API

---

## Architecture

### Pipeline en 4 étapes

#### **Step A — Evidence Collector** (cheap)
1. Utilise les sources existantes de l'événement
2. Recherche Tavily pour articles supplémentaires (3-10 selon tier)
3. Recherche patterns historiques via Tavily + OpenAI
4. Collecte 4-10 liens max, déduplique, score, garde top 5-10

#### **Step B — Evidence Extractor** (Firecrawl limité)
1. Firecrawl sur top 3-5 liens max (cap strict)
2. Extrait snippets (100-300 mots) + date + publisher + headline
3. Fallback sur métadonnées si Firecrawl échoue

#### **Step C — Scenario Generator** (LLM strict, température 0)
1. Génère 3-9 outlooks basés UNIQUEMENT sur :
   - Sources de l'événement
   - Claims extraits
   - Evidence collectée
   - Patterns historiques
2. Chaque scénario référence explicitement des URLs de l'evidence
3. Probabilités initiales (seront normalisées)

#### **Step D — Validation & Cache**
1. Valide JSON
2. Normalise probabilités (somme = 1.0)
3. Vérifie que chaque evidence a une URL
4. Stocke en DB avec TTL

---

## Format de sortie (JSON strict)

```json
{
  "event_id": "event_123",
  "generated_at": "2024-01-18T10:00:00Z",
  "ttl_expires_at": "2024-01-18T16:00:00Z",
  "assumptions": [
    "Assumption 1",
    "Assumption 2"
  ],
  "outlooks": [
    {
      "id": "O1",
      "title": "Scenario name",
      "probability": 0.28,
      "time_horizon": "1-3 months",
      "mechanism": "Short explanation of causal chain (2-4 sentences)",
      "supporting_evidence": [
        {
          "type": "article",
          "title": "Exact article headline",
          "publisher": "Reuters",
          "date": "2024-01-15T00:00:00Z",
          "url": "https://...",
          "why_relevant": "1 sentence explanation"
        },
        {
          "type": "historical_pattern",
          "title": "Similar historical pattern/event",
          "date_range": "2014-2015",
          "url": "https://...",
          "why_relevant": "1 sentence explanation"
        }
      ],
      "counter_evidence": [
        {
          "type": "article",
          "title": "...",
          "publisher": "...",
          "date": "2024-01-15T00:00:00Z",
          "url": "https://...",
          "why_relevant": "..."
        }
      ],
      "watch_indicators": [
        "Indicator 1 (what we should watch)",
        "Indicator 2"
      ],
      "confidence": "high"
    }
  ],
  "probability_check": {
    "sum": 1.0,
    "method": "normalize",
    "original_sum": 0.95
  }
}
```

### Règles strictes :
- `outlooks` = 3 à 9
- `probability` = float 0..1
- **Somme des probabilities = 1.0** (normalisation côté backend)
- 2 à 6 `supporting_evidence` par outlook
- Au moins 1 `counter_evidence` sur les scénarios principaux (top 3)
- Toute evidence doit avoir une `url` (ou "Not confirmed by available sources.")

---

## API Endpoints

### GET `/api/events/:eventId/predictions`

Récupère les prédictions pour un événement (depuis le cache si disponible).

**Query params :**
- `tier` : `'fast' | 'standard' | 'deep'` (défaut: `'standard'`)
- `force_refresh` : `'true' | 'false'` (défaut: `'false'`)

**Response :**
```json
{
  "success": true,
  "prediction": { /* EventPrediction */ },
  "from_cache": true,
  "metadata": {
    "cache_hit": true,
    "generation_time_ms": 0,
    "api_calls_count": 0,
    "estimated_cost_usd": 0
  }
}
```

### POST `/api/events/:eventId/predictions`

Génère/rafraîchit les prédictions pour un événement.

**Body :**
```json
{
  "tier": "standard",
  "force_refresh": false
}
```

**Response :**
```json
{
  "success": true,
  "prediction": { /* EventPrediction */ },
  "from_cache": false,
  "metadata": {
    "cache_hit": false,
    "generation_time_ms": 5234,
    "api_calls_count": 8,
    "estimated_cost_usd": 0.072
  }
}
```

---

## Base de données

### Table `event_predictions`

```sql
CREATE TABLE event_predictions (
    id UUID PRIMARY KEY,
    event_id TEXT UNIQUE NOT NULL,
    prediction_json JSONB NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    ttl_expires_at TIMESTAMPTZ NOT NULL,
    tier TEXT DEFAULT 'standard',
    cache_key TEXT UNIQUE,
    evidence_count INTEGER DEFAULT 0,
    historical_patterns_count INTEGER DEFAULT 0,
    confidence_score NUMERIC(3, 2),
    api_calls_count INTEGER DEFAULT 0,
    estimated_cost NUMERIC(10, 6) DEFAULT 0
);
```

**TTL par tier :**
- `fast` : 3 heures
- `standard` : 6 heures
- `deep` : 12 heures

---

## Services utilisés

### Tavily
- Recherche d'articles supplémentaires
- Recherche de patterns historiques
- Coût estimé : ~$0.001 par requête

### Firecrawl
- Extraction de contenu sur top 3-5 liens
- Coût estimé : ~$0.01 par lien

### OpenAI
- GPT-4o-mini : identification de patterns historiques (~$0.01)
- GPT-4o : génération de scénarios (~$0.05 pour 4000 tokens)

**Budget total estimé par prédiction :**
- `fast` : ~$0.02-0.03
- `standard` : ~$0.05-0.08
- `deep` : ~$0.10-0.15

---

## Intégration dans l'UI

### Event Detail Page

```typescript
// Récupérer les prédictions
const response = await fetch(`/api/events/${eventId}/predictions?tier=standard`);
const { prediction, from_cache, metadata } = await response.json();

// Afficher les scénarios
prediction.outlooks.forEach(outlook => {
  // Afficher titre, probabilité, mécanisme
  // Afficher supporting_evidence avec liens cliquables
  // Afficher counter_evidence si disponible
  // Afficher watch_indicators
});
```

### Forcer le refresh

```typescript
// Régénérer les prédictions
const response = await fetch(`/api/events/${eventId}/predictions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tier: 'deep',
    force_refresh: true
  })
});
```

---

## Validation & Qualité

### Vérifications automatiques

1. **Probabilités** : Somme = 1.0 (normalisation automatique)
2. **Evidence URLs** : Toutes les evidence doivent avoir une URL valide
3. **Counter-evidence** : Top 3 scénarios doivent avoir au moins 1 counter-evidence
4. **Watch indicators** : 2-5 indicateurs par scénario
5. **Time horizons** : Valeurs valides uniquement

### Métriques de qualité

- `confidence_score` : Score global (0-1) basé sur la confiance des scénarios
- `evidence_count` : Nombre total d'evidence collectées
- `historical_patterns_count` : Nombre de patterns historiques trouvés
- `api_calls_count` : Nombre d'appels API effectués
- `estimated_cost_usd` : Coût estimé de la génération

---

## Prochaines étapes

1. ✅ Migration SQL créée
2. ✅ Types TypeScript définis
3. ✅ Service `prediction-engine.ts` implémenté
4. ✅ Endpoints API créés
5. ⏳ Intégration dans Event Detail Page (UI)
6. ⏳ Tests unitaires
7. ⏳ Monitoring & alertes (budget cap)

---

## Notes importantes

- **Pas d'hallucinations** : Toute evidence doit référencer une source réelle
- **Traçabilité** : Chaque scénario peut être tracé jusqu'aux sources
- **Cache intelligent** : Réutilise les prédictions si TTL valide
- **Budget control** : Tracking des coûts pour éviter les dépassements
- **Fallback gracieux** : Si une source échoue, utilise les métadonnées disponibles
