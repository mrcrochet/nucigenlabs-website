# Prompt d’extraction de claims Detective (OpenAI)

Ce document décrit le **contrat strict** entre le prompt et le modèle pour l’étape **Signal → Claim** du pipeline Detective.

## Règle

Le graphe Detective ne consomme **que des claims structurés**. Ce prompt est utilisé par `src/server/services/detective-claim-extractor.ts`.

## Entrée

- **hypothesis** : hypothèse d’enquête (ex. « lien Rwanda et M23 »).
- **rawText** : texte brut (contenu d’un article / extrait Firecrawl).

## Sortie attendue (JSON strict)

Un seul objet JSON avec une clé `claims` (tableau) :

```json
{
  "claims": [
    {
      "text": "Phrase telle qu’énoncée ou paraphrasée.",
      "subject": "Acteur ou entité",
      "action": "Fait ou événement",
      "object": "Cible / ressource / impact",
      "polarity": "supports | weakens | neutral",
      "confidence": 0.85,
      "date": "2024-01-15"
    }
  ]
}
```

### Champs par claim

| Champ       | Type   | Obligatoire | Règle |
|------------|--------|-------------|--------|
| text       | string | oui         | Énoncé du fait (une phrase). |
| subject    | string | oui         | Qui : acteur, entité, organisation. |
| action     | string | oui         | Quoi : fait, événement, décision. |
| object     | string | oui         | Envers quoi / sur quoi : cible, ressource, impact. |
| polarity   | enum   | oui         | `supports` = renforce l’hypothèse ; `weakens` = l’affaiblit ; `neutral` = hors sujet ou neutre. |
| confidence | number | oui         | 0.0 à 1.0. Confiance dans le fait d’après le texte. |
| date       | string \| null | non  | Date du fait si explicite (ISO YYYY-MM-DD ou année). Sinon `null`. |

Aucun autre champ ne doit être présent. Pas de markdown, pas de commentaire autour du JSON.

## Normalisation côté code

Après parsing, le module applique :

- **polarity** : si valeur invalide → `neutral`.
- **confidence** : clamp entre 0 et 1.
- **date** : vide ou invalide → `null`.
- **text / subject / action / object** : trim ; chaîne vide pour `text` → claim exclu.

## Modèle

Par défaut : `gpt-4o-mini`. Surcharge possible via `OPENAI_DETECTIVE_CLAIM_MODEL`.
