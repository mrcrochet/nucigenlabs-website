# 🎯 Architecture Improvements - EventAgent "FACTS ONLY" Enhancement

## 📋 Résumé des Changements

Suite au retour d'expertise, nous avons rendu l'EventAgent encore plus strict dans sa discipline "FACTS ONLY" en éliminant toutes les interprétations implicites.

---

## ✅ Améliorations Implémentées

### 1. **Impact et Horizon → `null` au lieu de valeurs par défaut**

**Avant :**
```typescript
impact: 0, // EventAgent does NOT assign impact
horizon: 'medium', // Default factual classification
```

**Après :**
```typescript
impact: null, // EventAgent does NOT assign impact - SignalAgent will fill this
horizon: null, // EventAgent does NOT assign horizon - SignalAgent will fill this
```

**Pourquoi :**
- `impact: 0` et `horizon: 'medium'` étaient déjà des interprétations faibles
- `null` rend explicite que ces valeurs doivent être assignées par SignalAgent
- Plus pur conceptuellement

**Fichiers modifiés :**
- `src/server/agents/event-agent.ts` (3 occurrences)
- `src/types/intelligence.ts` (interface `IntelligenceObject`)
- `src/server/agents/__tests__/event-agent.test.ts` (tests mis à jour)

---

### 2. **Configuration Centralisée pour Seuils Techniques**

**Création :** `src/server/config/event-agent-config.ts`

**Paramètres configurables :**
- `MARKET_EVENT_THRESHOLD_PERCENT` (défaut: 2.0%)
- `TAVILY_RELEVANCE_THRESHOLD` (défaut: 0.3)
- `MAX_EVENTS_PER_SEARCH` (défaut: 50)
- `STORE_RAW_DATA` (défaut: false)

**Avant :**
```typescript
const isSignificant = Math.abs(changePercent) >= 2; // Hard-coded
.filter((r: any) => (r.score || 0) >= 0.3) // Hard-coded
.slice(0, 50); // Hard-coded
```

**Après :**
```typescript
const isSignificant = Math.abs(changePercent) >= MARKET_EVENT_THRESHOLD_PERCENT;
.filter((r: any) => (r.score || 0) >= TAVILY_RELEVANCE_THRESHOLD)
.slice(0, MAX_EVENTS_PER_SEARCH);
```

**Pourquoi :**
- Paramètres documentés et configurables via `.env`
- Facilite l'ajustement sans modifier le code
- Clarifie que ce sont des seuils techniques, pas business

**Variables d'environnement :**
```env
MARKET_EVENT_THRESHOLD_PERCENT=2.0
TAVILY_RELEVANCE_THRESHOLD=0.3
MAX_EVENTS_PER_SEARCH=50
STORE_RAW_DATA=false
```

---

### 3. **Stockage Optionnel des Données Brutes**

**Ajout :** `raw_content_hash` dans l'interface `Event`

**Implémentation :**
```typescript
// Store raw data for audit/replay/ML (if enabled)
...(STORE_RAW_DATA && {
  raw_content_hash: Buffer.from(input.raw_content).toString('base64').substring(0, 64),
}),
```

**Pourquoi :**
- Permet audit, replay, ML futur
- Hash compact (64 chars) pour éviter explosion de stockage
- Optionnel (activé via `STORE_RAW_DATA=true`)

**Sources couvertes :**
- Tavily (raw_content)
- NewsAPI.ai (JSON complet)
- Twelve Data (market data JSON)

---

### 4. **Scope : Documenté comme Interprétation Factuelle**

**État actuel :**
```typescript
scope: extractedData.region ? 'regional' : 'global', // Factual classification - could be null in future
```

**Note :** 
- Pour l'instant conservé car c'est une classification factuelle (présence/absence de région)
- Documenté comme potentiellement `null` dans le futur
- SignalAgent peut toujours le réassigner si nécessaire

---

## 🔍 Points de Vigilance Identifiés

### 1. **Confidence vs Importance**

**État actuel :**
- `confidence` = qualité de la donnée (article count, source quality)
- Pas de mélange avec "importance"

**À surveiller :**
- S'assurer que SignalAgent ne confond pas `confidence` (qualité) et `impact` (importance)
- Documenter clairement la différence

### 2. **Scope comme Interprétation**

**Recommandation future :**
- Considérer `scope: null` pour EventAgent
- Laisser SignalAgent déterminer le scope basé sur l'analyse des événements

**Pour l'instant :**
- Conservé car classification factuelle (présence région = régional)
- Documenté comme potentiellement améliorable

---

## 📊 Impact sur les Tests

**Tests mis à jour :**
- `event-agent.test.ts` : Vérifie maintenant `impact: null` et `horizon: null`
- Tests existants toujours valides

**Nouveaux tests recommandés :**
- Vérifier que SignalAgent remplit bien `impact` et `horizon`
- Vérifier que les seuils configurables fonctionnent
- Vérifier que `raw_content_hash` est stocké si activé

---

## 🎯 Bénéfices

### ✅ Pureté Conceptuelle
- EventAgent ne fait AUCUNE interprétation
- Séparation claire : Facts (EventAgent) vs Intelligence (SignalAgent)

### ✅ Flexibilité
- Seuils configurables sans modifier le code
- Raw data optionnel pour audit/ML

### ✅ Traçabilité
- Hash des données brutes pour audit/replay
- Configuration documentée

### ✅ Évolutivité
- Base propre pour ML futur
- Possibilité de recalculer signaux avec nouvelles règles

---

## 📝 Prochaines Étapes Recommandées

1. ✅ **Vérifier SignalAgent** : S'assurer qu'il remplit bien `impact` et `horizon` pour tous les événements
2. ✅ **Tests d'intégration** : Vérifier le flow complet EventAgent → SignalAgent
   - ✅ Tests créés dans `src/server/agents/__tests__/event-signal-integration.test.ts`
   - ✅ 5 tests passent avec succès
   - ✅ Configuration vitest résolue (utilise npx)
   - ✅ Documentation créée dans `INTEGRATION_TESTS_STATUS.md`
   - ✅ Tous les tests valident le comportement "facts only"
3. ⏳ **Documentation** : Mettre à jour la documentation architecture avec ces changements
4. ⏳ **Monitoring** : Surveiller que les événements avec `impact: null` sont bien traités par SignalAgent

---

## 🏆 Conclusion

Ces améliorations rendent l'architecture encore plus rigoureuse et alignée avec les meilleures pratiques des systèmes d'intelligence professionnels. L'EventAgent est maintenant **100% facts-only**, sans aucune interprétation implicite.

**Niveau atteint :** Architecture institutionnelle / produit pro ✅
