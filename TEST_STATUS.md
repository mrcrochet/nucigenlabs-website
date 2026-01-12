# Test Status - Architecture Freeze

## ⚠️ État Actuel

**Status:** Tests créés mais configuration vitest à corriger

### Tests Créés
- ✅ `src/server/agents/__tests__/event-agent.test.ts` - EventAgent tests
- ✅ `src/server/agents/__tests__/signal-agent.test.ts` - SignalAgent tests

### Configuration
- ✅ `vitest.config.ts` créé
- ⚠️ Installation vitest en cours de résolution

---

## 🔒 Règles Strictes (En Vigueur)

### Règle 1 — Tests = Barrière
> Les tests doivent passer avant toute nouvelle feature
> S'ils cassent → on corrige, on n'ignore jamais

### Règle 2 — ZÉRO Nouvel Agent Tant Que:
1. ✅ Tests verts
2. ✅ Legacy complètement migré
3. ✅ Architecture stable 48h

---

## 📋 Tests Requis

### EventAgent Tests
- Returns only Event[] (UI contract)
- Never assigns impact or priority
- Extracts facts only (who, what, where, when)
- No business logic filtering

### SignalAgent Tests
- Returns only Signal[]
- Never accesses Tavily/Firecrawl directly
- Synthesizes from Event[] only
- Applies user preferences correctly

---

## 🚨 Action Requise

**Problème:** Configuration vitest à corriger
**Solution:** Installer vitest correctement et exécuter les tests

**Une fois les tests verts:**
1. ✅ Valider que tous les tests passent
2. ✅ Geler l'architecture (voir `ARCHITECTURE_FREEZE.md`)
3. ✅ Aucune nouvelle feature jusqu'à stabilité 48h

---

## 📝 Note

Les tests sont créés et prêts. Une fois la configuration vitest corrigée, exécuter:
```bash
npm test
```

**Tous les tests doivent passer avant toute nouvelle feature.**
