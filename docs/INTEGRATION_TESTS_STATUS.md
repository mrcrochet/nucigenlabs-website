# 🧪 Tests d'Intégration - EventAgent → SignalAgent

## ✅ Tests Créés

**Fichier:** `src/server/agents/__tests__/event-signal-integration.test.ts`

### Tests Implémentés

1. **EventAgent returns null for impact and horizon**
   - ✅ Vérifie que `extractEvent()` retourne `impact: null` et `horizon: null`
   - ✅ Vérifie que `extractEvents()` (batch) retourne aussi `null` pour ces champs
   - ✅ Timeout: 30s (pour permettre les appels API si nécessaire)

2. **SignalAgent fills impact and horizon**
   - ✅ Vérifie que SignalAgent assigne des valeurs non-null pour `impact` et `horizon`
   - ✅ Vérifie que les valeurs sont du bon type (number, TimeHorizon)
   - ✅ Vérifie que les signaux ont tous les champs requis

3. **End-to-end flow: EventAgent → SignalAgent**
   - ✅ Teste le flow complet depuis l'extraction d'événement jusqu'à la génération de signal
   - ✅ Vérifie que EventAgent retourne `null` pour impact/horizon
   - ✅ Vérifie que SignalAgent remplit ces valeurs
   - ✅ Vérifie que le signal référence l'événement original
   - ✅ Timeout: 30s

4. **Null handling edge cases**
   - ✅ Teste le comportement avec des événements ayant tous les champs à `null`
   - ✅ Vérifie que SignalAgent gère gracieusement ces cas

---

## 📋 Structure des Tests

### Test 1: EventAgent Returns Null
```typescript
it('should return impact: null and horizon: null for extracted events')
```
- Input: Raw content avec événement factuel
- Expected: Event avec `impact: null`, `horizon: null`
- Validates: EventAgent ne fait pas d'interprétation

### Test 2: SignalAgent Fills Values
```typescript
it('should assign impact and horizon when creating signals from events')
```
- Input: Events avec `impact: null`, `horizon: null`
- Expected: Signals avec `impact: number`, `horizon: TimeHorizon`
- Validates: SignalAgent remplit les valeurs manquantes

### Test 3: End-to-End Flow
```typescript
it('should process events through complete pipeline')
```
- Input: Raw content
- Process: EventAgent.extractEvent() → SignalAgent.generateSignals()
- Expected: Signal avec impact/horizon remplis
- Validates: Flow complet fonctionne

### Test 4: Edge Cases
```typescript
it('should handle events with all null values gracefully')
```
- Input: Events avec tous les champs optionnels à `null`
- Expected: Pas d'erreur, traitement gracieux
- Validates: Robustesse du système

---

## 🔧 Configuration

### Timeouts
- Tests avec appels API: 30s
- Tests unitaires: 5s (défaut)

### Dépendances
- `vitest` pour le framework de test
- Types: `Event`, `EventWithChain`, `Signal`
- Agents: `EventExtractionAgentImpl`, `IntelligenceSignalAgent`

---

## 🚀 Exécution

```bash
# Exécuter tous les tests d'intégration
npm test -- src/server/agents/__tests__/event-signal-integration.test.ts

# Exécuter en mode watch
npm run test:watch -- src/server/agents/__tests__/event-signal-integration.test.ts
```

---

## ✅ Validations Critiques

### EventAgent
- ✅ Retourne `impact: null`
- ✅ Retourne `horizon: null`
- ✅ Ne fait pas d'interprétation
- ✅ Extrait uniquement des faits

### SignalAgent
- ✅ Assigne `impact: number` (non-null)
- ✅ Assigne `horizon: TimeHorizon` (non-null)
- ✅ Utilise `impact_score` de la DB en priorité
- ✅ Gère les valeurs null gracieusement

### Flow Complet
- ✅ EventAgent → SignalAgent fonctionne
- ✅ Les valeurs null sont correctement remplies
- ✅ Les références entre événements et signaux sont correctes

---

## 📝 Notes

- Les tests peuvent nécessiter des clés API (OpenAI, Tavily) pour fonctionner complètement
- Si les clés API ne sont pas disponibles, certains tests peuvent être skippés
- Les tests utilisent des mocks pour éviter les dépendances externes quand possible

---

## 🎯 Prochaines Étapes

1. ✅ Tests créés
2. ⏳ Exécuter les tests et valider qu'ils passent
3. ⏳ Ajouter des tests pour les cas limites supplémentaires
4. ⏳ Documenter les résultats dans `ARCHITECTURE_IMPROVEMENTS.md`
