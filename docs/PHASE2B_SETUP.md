# PHASE 2B: Causal Chain Extraction - Setup Guide

## ✅ Deliverables créés

1. **`phase2b_causal_chains_table.sql`** - Migration SQL pour créer la table `nucigen_causal_chains`
2. **`src/server/phase2b/causal-extractor.ts`** - Service d'extraction de chaînes causales
3. **`src/server/phase2b/phase2b_validate.ts`** - Script de validation
4. **`src/server/phase2b/PROMPT_FINAL.md`** - Prompt final utilisé
5. **`src/server/phase2b/README.md`** - Documentation

## 🚀 Étapes pour exécuter la Phase 2B

### 1. Prérequis

- ✅ Phase 1 complétée (avoir des `nucigen_events` dans la base)
- ✅ Variables d'environnement configurées (mêmes que Phase 1)

### 2. Appliquer la migration SQL

1. Allez sur Supabase Dashboard → SQL Editor
2. Exécutez le contenu de `phase2b_causal_chains_table.sql`
3. Vérifiez que la table `nucigen_causal_chains` a été créée

### 3. Exécuter la validation

```bash
npm run phase2b:validate
```

Le script va :
1. Récupérer tous les `nucigen_events` existants (max 10)
2. Extraire une chaîne causale pour chacun
3. Valider le schéma JSON
4. Évaluer la cohérence logique
5. Générer un rapport avec statistiques

## 📊 Résultats attendus

Le script de validation va :
1. ✅ Extraire des chaînes causales pour chaque événement
2. ✅ Valider le schéma JSON strict
3. ✅ Vérifier l'absence de mots interdits (could, might, etc.)
4. ✅ Évaluer la cohérence logique
5. ✅ Générer un rapport avec :
   - Taux de succès
   - Score de confiance moyen
   - Distribution des time_horizons
   - Exemples de chaînes causales

## ✅ Critères de validation

La Phase 2B est validée si :
- ✅ Taux de succès >= 80%
- ✅ Tous les JSON sont valides
- ✅ Pas de mots interdits (could, might, possibly, may)
- ✅ Cohérence logique vérifiée (secteurs/régions alignés)
- ✅ 1 chaîne causale par événement (contrainte unique)

## 📝 Prochaines étapes

Une fois la Phase 2B validée, vous pouvez :
1. Examiner les chaînes causales dans `nucigen_causal_chains`
2. Ajuster le prompt si nécessaire
3. Demander "PHASE 2B ready for review" avec :
   - Prompt causal final
   - Extrait de 2 causal chains (JSON)
   - Résultats du script de validation

