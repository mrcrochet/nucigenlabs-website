# Guide de Test - UI Contract Implementation

## 🎯 Objectif

Tester que chaque page respecte le contrat UI et consomme uniquement le type d'objet qui lui est assigné.

## 📋 Checklist de Test

### 1. Intelligence Page (`/intelligence`)

**Type attendu**: `Signal` uniquement

**Tests à effectuer**:
- [ ] La page charge sans erreur
- [ ] Les signals s'affichent (pas d'events bruts)
- [ ] Chaque signal affiche :
  - [ ] Titre
  - [ ] Résumé (max 2 phrases)
  - [ ] Impact score (%)
  - [ ] Confidence score (%)
  - [ ] Time horizon
  - [ ] Nombre d'events liés
- [ ] Le bouton "View Events" navigue vers `/events?event_ids=...`
- [ ] Les filtres par préférences fonctionnent
- [ ] Les tabs (Top, Recent, Critical) trient correctement

**Erreurs possibles**:
- Si vous voyez des events bruts → la page ne respecte pas le contrat
- Si les signals ne s'affichent pas → vérifier que `eventsToSignals()` fonctionne

---

### 2. Events Page (`/events`)

**Type attendu**: `Event` normalisé uniquement

**Tests à effectuer**:
- [ ] La page charge sans erreur
- [ ] Les events s'affichent (format normalisé)
- [ ] Chaque event affiche :
  - [ ] Headline (pas summary)
  - [ ] Sectors (array, pas string)
  - [ ] Region
  - [ ] Event type
  - [ ] Causal chain (via propriétés étendues)
- [ ] Le filtrage par `event_ids` fonctionne (depuis signals)
- [ ] La recherche fonctionne
- [ ] Les filtres (sectors, regions, etc.) fonctionnent
- [ ] La pagination fonctionne

**Erreurs possibles**:
- Si vous voyez `event.summary` au lieu de `event.headline` → adapter non appliqué
- Si les causal chains ne s'affichent pas → vérifier `causal_chain` dans l'adaptateur

---

### 3. Recommendations Page (`/recommendations`)

**Type attendu**: `Recommendation` uniquement

**Tests à effectuer**:
- [ ] La page charge sans erreur
- [ ] Les recommendations s'affichent
- [ ] Chaque recommendation affiche :
  - [ ] Action proposée
  - [ ] Rationale (raisonnement)
  - [ ] Risk level (low/medium/high)
  - [ ] Confidence score
  - [ ] Impact score
- [ ] Le bouton "View related events" fonctionne
- [ ] Les boutons Accept/Dismiss fonctionnent (logs console pour l'instant)
- [ ] Si aucun signal → aucune recommendation (règle respectée)

**Erreurs possibles**:
- Si aucune recommendation n'apparaît → vérifier que des signals existent
- Si les recommendations ne sont pas liées aux events → vérifier `related_event_ids`

---

### 4. Alerts Page (`/alerts`)

**Type attendu**: `Alert` uniquement

**Tests à effectuer**:
- [ ] La page charge sans erreur
- [ ] Les alerts s'affichent (seulement si seuils dépassés)
- [ ] Chaque alert affiche :
  - [ ] Title
  - [ ] Trigger reason
  - [ ] Threshold exceeded
  - [ ] Severity (moderate/high/critical)
  - [ ] Impact et confidence
- [ ] Le filtre "Critical Only" fonctionne
- [ ] Le bouton "Mark Read" fonctionne (logs console)
- [ ] Si aucun seuil dépassé → aucune alert

**Erreurs possibles**:
- Si trop d'alerts → ajuster les seuils dans `detectAlertsFromSignals`
- Si aucune alert → vérifier que des signals avec impact élevé existent

---

### 5. Research Page (`/research`)

**Type attendu**: `Analysis` uniquement

**Tests à effectuer**:
- [ ] La page charge sans erreur
- [ ] Les analyses s'affichent (long-form)
- [ ] Chaque analysis affiche :
  - [ ] Title
  - [ ] Executive summary
  - [ ] Key trends (liste)
  - [ ] Implications (liste)
  - [ ] Time horizon (medium/long)
  - [ ] Nombre d'events référencés
- [ ] Le tab Medium-term / Long-term fonctionne
- [ ] Le bouton "View referenced events" fonctionne
- [ ] Si moins de 3 events → aucune analysis (règle respectée)

**Erreurs possibles**:
- Si aucune analysis → vérifier qu'il y a assez d'events (minimum 3 par groupe)
- Si les analyses sont trop courtes → vérifier `generateAnalysisFromEvents`

---

### 6. Quality Page (`/quality`)

**Type attendu**: `Metric` uniquement

**Tests à effectuer**:
- [ ] La page charge sans erreur
- [ ] Les metrics système s'affichent
- [ ] Chaque metric affiche :
  - [ ] Coverage score (%)
  - [ ] Average latency (ms)
  - [ ] Error rate (%)
  - [ ] Events processed
  - [ ] Signals generated
  - [ ] Validation notes
- [ ] Les périodes (7d, 30d, 90d) fonctionnent
- [ ] Aucun contenu métier n'est affiché (seulement metrics)

**Erreurs possibles**:
- Si les metrics sont à 0 → vérifier que des events existent
- Si le coverage score est bas → normal si peu d'events

---

## 🔍 Vérifications Techniques

### Console Browser
Ouvrez la console et vérifiez :
- [ ] Aucune erreur TypeScript
- [ ] Aucune erreur de réseau
- [ ] Les appels API fonctionnent

### Network Tab
Vérifiez les requêtes :
- [ ] Les requêtes Supabase fonctionnent
- [ ] Les données sont retournées correctement

### React DevTools
Vérifiez les états :
- [ ] Les états se mettent à jour correctement
- [ ] Les données sont du bon type

---

## 🐛 Problèmes Courants

### "No signals available"
**Cause**: Pas assez d'events ou `eventsToSignals()` ne trouve pas de groupes
**Solution**: Vérifier qu'il y a au moins 2 events avec le même secteur/région

### "No recommendations available"
**Cause**: Pas de signals ou signals avec impact < 60%
**Solution**: Normal si pas de signals. Vérifier la page Intelligence d'abord.

### "No alerts at this time"
**Cause**: Aucun seuil dépassé
**Solution**: Normal. Les alerts ne s'affichent que si impact >= 70% ou confidence >= 60%

### "No analysis available"
**Cause**: Moins de 3 events par groupe
**Solution**: Normal. Besoin d'au moins 3 events liés pour générer une analysis

---

## ✅ Critères de Succès

Une page est considérée comme fonctionnelle si :
1. ✅ Elle charge sans erreur
2. ✅ Elle affiche le bon type d'objet (pas d'autres types)
3. ✅ Les données sont cohérentes
4. ✅ La navigation fonctionne
5. ✅ Les filtres fonctionnent (si applicable)

---

## 📝 Notes

- Les adaptateurs sont temporaires et fonctionnent avec les données Supabase existantes
- Les vrais endpoints API remplaceront ces adaptateurs plus tard
- L'architecture respecte strictement le contrat UI
