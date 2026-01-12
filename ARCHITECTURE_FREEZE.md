# 🔒 Architecture Freeze - Règles Strictes

## ✅ Tests = Barrière, Pas Formalité

**RÈGLE ABSOLUE:**
> Les tests doivent passer avant toute nouvelle feature
> 
> S'ils cassent → on corrige, on n'ignore jamais

---

## 🚫 ZÉRO Nouvel Agent Tant Que:

1. ✅ **Tests verts** - Tous les tests passent
2. ✅ **Legacy complètement migré** - Tous les fichiers utilisent EventAgent
3. ✅ **Architecture stable 48h** - Aucun changement d'architecture pendant 48h

---

## 📋 Tests Requis

### EventAgent Tests
- ✅ `src/server/agents/__tests__/event-agent.test.ts`
  - Returns only Event[]
  - Never assigns impact or priority
  - Extracts facts only
  - No business logic filtering

### SignalAgent Tests
- ✅ `src/server/agents/__tests__/signal-agent.test.ts`
  - Returns only Signal[]
  - Never accesses Tavily/Firecrawl directly
  - Synthesizes from Event[] only
  - Applies user preferences correctly

---

## 🔒 Règles d'Architecture (Non Négociables)

### Règle 1 — Accès aux APIs Externes
> Seul `EventAgent` peut utiliser Tavily ou Firecrawl.
> Tout autre appel direct est interdit.

### Règle 2 — Contrat UI Strict
> Chaque page UI consomme UN SEUL type d'objet:
> - `/intelligence` → `Signal[]`
> - `/events` → `Event[]`
> - `/recommendations` → `Recommendation[]`

### Règle 3 — EventAgent = FACTS ONLY
> EventAgent extrait des FAITS, pas des interprétations.
> - ✅ Extrait: who, what, where, when
> - ❌ N'assigne JAMAIS d'impact
> - ❌ N'assigne JAMAIS de priorité
> - ❌ Ne filtre JAMAIS par "importance"

---

## 📊 État Actuel

### ✅ Complété
- ✅ SignalAgent implémenté
- ✅ EventAgent implémenté (100% factuel)
- ✅ Intelligence page migrée (consomme Signal[] uniquement)
- ✅ live-event-creator.ts migré vers EventAgent
- ✅ Tests créés (EventAgent + SignalAgent)

### ⏳ En Attente
- ⏳ Tests à exécuter et valider
- ⏳ Migration complète de tous les fichiers legacy
- ⏳ Stabilité 48h

---

## 🚨 Violations = Blocage Immédiat

Si une violation est détectée:
1. **STOP** - Aucune nouvelle feature
2. **FIX** - Corriger la violation immédiatement
3. **TEST** - Vérifier que les tests passent
4. **VALIDATE** - Valider avec l'équipe

---

## 📝 Checklist Avant Nouvelle Feature

- [ ] Tous les tests passent (`npm test`)
- [ ] Aucune violation d'architecture détectée
- [ ] Legacy complètement migré
- [ ] Architecture stable depuis 48h minimum
- [ ] Documentation à jour

---

## 🔄 Process de Développement

1. **Avant de coder:**
   - Vérifier que les tests passent
   - Lire `ARCHITECTURE_RULES.md`
   - Vérifier qu'aucune règle n'est violée

2. **Pendant le développement:**
   - Écrire les tests en premier (TDD)
   - Respecter les règles strictes
   - Ne pas créer de nouveaux agents sans validation

3. **Après le développement:**
   - Exécuter les tests (`npm test`)
   - Vérifier qu'aucune règle n'est violée
   - Documenter les changements

---

## 📅 Date de Gel

**Date:** 2025-01-15
**Raison:** Tests créés, architecture stabilisée
**Durée:** Minimum 48h de stabilité requise

---

## ✅ Validation

Une fois que:
- ✅ Tous les tests passent
- ✅ Legacy complètement migré
- ✅ Architecture stable 48h

→ **Architecture dégelée pour nouvelles features**

---

**Note:** Ce document est une barrière de qualité, pas une formalité bureaucratique.
Les règles sont strictes pour garantir la qualité et la maintenabilité du code.
