# PHASE 2B: Causal Chain Extraction

## Objectif

Générer une chaîne causale structurée, déterministe et lisible pour chaque `nucigen_event`.

## Setup

### 1. Appliquer la migration SQL

Exécutez `phase2b_causal_chains_table.sql` dans Supabase SQL Editor.

### 2. Variables d'environnement

Les mêmes que Phase 1 :
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Prérequis

- Phase 1 doit être complétée (avoir des `nucigen_events` dans la base)

## Utilisation

### Extraire une chaîne causale unique

```typescript
import { extractCausalChain } from './causal-extractor';

const chain = await extractCausalChain('nucigen-event-id');
console.log(chain);
```

### Valider la Phase 2B

```bash
npm run phase2b:validate
```

Le script va :
1. Récupérer tous les `nucigen_events` (max 10)
2. Extraire une chaîne causale pour chacun
3. Valider le schéma JSON
4. Évaluer la cohérence logique
5. Générer un rapport avec statistiques

## Deliverables

- ✅ Migration SQL (`phase2b_causal_chains_table.sql`)
- ✅ Service d'extraction (`causal-extractor.ts`)
- ✅ Script de validation (`phase2b_validate.ts`)
- ✅ Prompt final (dans `PROMPT_FINAL.md`)

## Critères de validation

La Phase 2B est validée si :
- ✅ Taux de succès >= 80%
- ✅ Tous les JSON sont valides
- ✅ Pas de mots interdits (could, might, etc.)
- ✅ Cohérence logique vérifiée
- ✅ 1 chaîne causale par événement

## Prochaines étapes

Une fois la Phase 2B validée, on passe à la Phase suivante.

