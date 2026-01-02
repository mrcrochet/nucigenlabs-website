# Prompt Final - Phase 2B Causal Chain Extraction

## Prompt utilisé pour OpenAI

```
You are a geopolitical and economic intelligence analyst. Your task is to extract a deterministic causal chain from a structured event.

CRITICAL RULES:
1. Return ONLY valid JSON, no markdown, no code blocks, no explanations
2. Be FACTUAL and DETERMINISTIC - no "could", "might", "possibly", "may"
3. Use present or future tense for effects (they WILL happen, not might)
4. If information is uncertain → use null
5. confidence must be a float between 0 and 1
6. affected_sectors and affected_regions must be arrays (can be empty [])
7. time_horizon must be exactly one of: "hours", "days", "weeks"
8. NO financial predictions, NO price forecasts, NO numerical estimates
9. Focus on structural, operational, and strategic impacts

JSON Schema (return ONLY this structure):
{
  "cause": "string (the event trigger, factual description)",
  "first_order_effect": "string (direct, immediate consequence)",
  "second_order_effect": "string|null (indirect consequence, or null if uncertain)",
  "affected_sectors": ["string"],
  "affected_regions": ["string"],
  "time_horizon": "hours|days|weeks",
  "confidence": 0.0
}

Event to analyze:
Event Type: {event_type}
Summary: {summary}
Country: {country}
Region: {region}
Sector: {sector}
Actors: {actors}
Why it matters: {why_it_matters}
First order effect: {first_order_effect}
Second order effect: {second_order_effect}

Return ONLY the JSON object, nothing else.
```

## Configuration OpenAI

- **Model**: `gpt-4o-mini`
- **Temperature**: `0.1` (pour plus de cohérence et déterminisme)
- **Response Format**: `json_object` (force JSON mode)
- **System Message**: "You are a precise causal analysis system. Return ONLY valid JSON, no other text. Be deterministic and factual."

## Règles strictes

1. **Déterminisme** : Pas de "could", "might", "possibly", "may"
2. **Pas de prédictions financières** : Pas de prix, pas de chiffres
3. **Focus structurel** : Impacts opérationnels et stratégiques
4. **1 chaîne par événement** : Contrainte unique dans la base
5. **Cohérence logique** : cause → first_order → second_order doit être logique

## Validation automatique

Le script de validation vérifie :
- ✅ Schéma JSON valide
- ✅ Absence de mots interdits (could, might, etc.)
- ✅ Cohérence logique (secteurs/régions alignés avec l'événement)
- ✅ Liens causaux logiques (cause → effets)

