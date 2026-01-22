# UN Comtrade Integration - Corporate Impact

## Vue d'ensemble

Intégration de **UN Comtrade API** dans Corporate Impact pour valider les signaux avec des données de flux commerciaux factuelles.

## Architecture

```
Event (géopolitique/réglementaire)
   ↓
Entity & Sector Resolver
   ↓
Comtrade Impact Analyzer (batch only)
   ↓
Trade Delta Detection (rules-based)
   ↓
Corporate Impact Signal (avec trade_impact)
   ↓
LLM Explanation (explain only, no discovery)
```

## Règles absolues

✅ **Batch processing uniquement** - Aucun appel Comtrade au clic utilisateur
✅ **Calculs rules-based** - Aucun LLM pour calculer des chiffres
✅ **Stockage en DB** - Tout est stocké et partagé
✅ **Perplexity libéré** - Découvre les sources, pays, secteurs, HS codes pertinents
✅ **LLM limité** - Explique seulement, ne découvre rien (pour l'explication finale)

## Composants créés

### 1. `comtrade-impact-analyzer.ts`

Service principal qui :
- **Utilise Perplexity pour découvrir** automatiquement pays, secteurs, et HS codes pertinents
- Récupère les données de flux commerciaux depuis UN Comtrade API
- Calcule les métriques (export/import drop, redirection, dépendance, etc.)
- Génère un Trade Impact Score (0-1) basé sur des règles
- Détermine le type d'impact et la direction
- Génère des preuves factuelles (Trade Evidence)

**Fonctions principales :**
- `discoverTradeEntitiesWithPerplexity(...)` - **LIBÉRÉ** : Découvre pays, secteurs, HS codes avec Perplexity
- `analyzeTradeImpact(input)` - Analyse l'impact commercial pour un événement (inclut discovery Perplexity)
- `storeTradeImpactData(eventId, tradeImpact, explanation)` - Stocke en DB
- `generateTradeImpactExplanation(tradeImpact, eventTitle, eventSummary)` - Génère l'explication LLM
- `getTradeImpactData(eventId)` - Récupère depuis la DB

### 2. Migration DB : `trade_impact` table

Table pour stocker les analyses d'impact commercial :
- `event_id` (unique)
- `trade_impact_score` (0-1)
- `impact_type` (Trade Disruption, Trade Reallocation, Supply Chain Risk, Market Opportunity)
- `direction` (Positive, Negative, Mixed)
- `confidence` (0-1)
- `trade_evidence` (JSONB)
- `metrics` (JSONB)

### 3. Migration DB : `market_signals.trade_impact`

Ajout de la colonne `trade_impact` (JSONB) à `market_signals` pour stocker les données directement avec chaque signal.

## Intégration dans Corporate Impact Worker

Le worker `corporate-impact-worker.ts` :
1. Analyse l'impact commercial avec Comtrade (si pays + secteurs disponibles)
2. Stocke les résultats dans `trade_impact` table
3. Inclut `trade_impact` dans chaque signal généré
4. Boost la confiance si trade impact est validé (score > 0.3)

## Calcul du Trade Impact Score

Score basé sur des règles (pas d'IA) :

```typescript
trade_impact_score = (
  export_drop_weight (0-0.3) +
  import_drop_weight (0-0.3) +
  dependency_weight (0-0.2) +
  concentration_weight (0-0.1) +
  redirection_weight (0-0.05) +
  historical_break_weight (0-0.1)
) / total_weights
```

**Règles :**
- Export drop > 20% → impact fort
- Dépendance > 40% à un pays → risque critique
- Redirection rapide → opportunité sectorielle
- Pattern similaire observé historiquement → confiance renforcée

## UI - SignalCard

### Badge "Trade-Validated"

Affiché si `signal.trade_impact` existe :
```tsx
{signal.trade_impact && (
  <span className="px-2 py-0.5 backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 border border-blue-500/30 rounded text-xs font-semibold text-blue-400">
    Trade-Validated
  </span>
)}
```

### Section Trade Impact

Affiche :
- Impact Type (Trade Disruption, Trade Reallocation, etc.)
- Direction (Positive, Negative, Mixed)
- Trade Impact Score (0-100%)
- Trade Evidence (métriques avec valeurs)

## API Endpoints

### GET `/api/corporate-impact/signals`

Retourne les signaux avec `trade_impact` inclus si disponible.

**Format :**
```json
{
  "success": true,
  "data": {
    "signals": [
      {
        "id": "...",
        "type": "opportunity",
        "company": {...},
        "prediction": {...},
        "trade_impact": {
          "trade_impact_score": 0.84,
          "impact_type": "Trade Disruption",
          "direction": "Negative",
          "confidence": 0.82,
          "trade_evidence": [
            {
              "metric": "Export decline",
              "value": "-31%",
              "source": "UN Comtrade",
              "description": "Exports of HS2709 from Russia to EU countries"
            }
          ],
          "hs_codes": ["2709"],
          "countries_affected": ["Russia", "EU"]
        }
      }
    ]
  }
}
```

## Configuration

### Variables d'environnement

```bash
COMTRADE_PRIMARY_KEY=4845fb8db76c4506b957dacb20ff5ed4
COMTRADE_SECONDARY_KEY=b11e0865d9db4dfb8312ac2e18af2351
```

### UN Comtrade API

- Base URL: `https://comtradeapi.un.org/data/v1/get`
- Documentation: https://unstats.un.org/wiki/display/comtrade/
- Rate limits: Gérés avec retry logic et secondary key

## Flux de traitement

1. **Event détecté** (avec ou sans pays + secteurs)
2. **Perplexity Discovery (LIBÉRÉ)** :
   - Découvre automatiquement les pays impliqués dans les flux commerciaux
   - Découvre les secteurs économiques impactés
   - Découvre les HS codes pertinents pour les produits
   - Enrichit les données d'entrée avant l'analyse Comtrade
3. **Comtrade Analyzer** :
   - Résout les codes pays (Russia → 643, Germany → 276, etc.)
   - Résout les HS codes depuis secteurs (Energy → 2709, 2710, etc.)
   - Calcule les périodes avant/après événement
   - Fetch les données Comtrade (exports + imports)
3. **Calcul des métriques** :
   - Export/Import drop %
   - Redirection %
   - Dépendance score
   - Concentration score
   - Historical break score
4. **Trade Impact Score** calculé (rules-based)
5. **Si score > 0.3** :
   - Stocke dans `trade_impact` table
   - Inclut dans les signaux générés
   - Boost la confiance des signaux
6. **LLM Explanation** génère l'explication (explain only)

## Exemple de Trade Evidence

```
"According to UN Comtrade, exports of crude oil (HS2709) from Russia to EU countries declined by 31% in the three months following the sanctions announcement."
```

## Résultat attendu

✅ Corporate Impact = **mesurable** avec données factuelles
✅ Prédictions = **justifiées** par flux commerciaux réels
✅ Plateforme = **institutionnelle** (comme Palantir)
✅ Différenciation = **forte** (pas juste des news)

Nucigen devient une **machine d'intelligence économique**, pas un agrégateur de news.
