# Checklist de Test Rapide - UI Contract

## ✅ Tests à Effectuer

### 1. Page Intelligence (`/intelligence`)

**Vérifications**:
- [ ] La page charge sans erreur
- [ ] Des **signals** s'affichent (pas d'events bruts)
- [ ] Chaque signal montre :
  - [ ] Titre
  - [ ] Résumé (max 2 phrases)
  - [ ] Impact score (%)
  - [ ] Confidence score (%)
  - [ ] Time horizon
  - [ ] Nombre d'events liés
- [ ] Le bouton "View Events" fonctionne
- [ ] Les tabs (Top, Recent, Critical) trient correctement
- [ ] La recherche fonctionne

**Note**: Si aucun signal n'apparaît, c'est normal si vous avez moins de 2 events avec le même secteur/région/type.

---

### 2. Page Events (`/events`) ✅ DÉJÀ TESTÉE

**Vérifications**:
- [x] La page charge sans erreur
- [x] Les events normalisés s'affichent
- [x] Tags, métriques, causal chains visibles
- [x] Recherche live fonctionne (serveur API démarré)

---

### 3. Page Recommendations (`/recommendations`)

**Vérifications**:
- [ ] La page charge sans erreur
- [ ] Des **recommendations** s'affichent (si des signals existent)
- [ ] Chaque recommendation montre :
  - [ ] Action proposée
  - [ ] Rationale (raisonnement)
  - [ ] Risk level (low/medium/high)
  - [ ] Confidence et Impact scores
- [ ] Le bouton "View related events" fonctionne
- [ ] Les boutons Accept/Dismiss fonctionnent (logs console)
- [ ] Si aucun signal → aucune recommendation (règle respectée)

**Note**: Les recommendations nécessitent des signals avec impact >= 60% et confidence >= 50%.

---

### 4. Page Alerts (`/alerts`)

**Vérifications**:
- [ ] La page charge sans erreur
- [ ] Des **alerts** s'affichent (seulement si seuils dépassés)
- [ ] Chaque alert montre :
  - [ ] Title
  - [ ] Trigger reason
  - [ ] Threshold exceeded
  - [ ] Severity (moderate/high/critical)
- [ ] Le filtre "Critical Only" fonctionne
- [ ] Le bouton "Mark Read" fonctionne
- [ ] Si aucun seuil dépassé → aucune alert

**Note**: Les alerts nécessitent des signals avec impact >= 70% ou confidence >= 60%.

---

### 5. Page Research (`/research`)

**Vérifications**:
- [ ] La page charge sans erreur
- [ ] Des **analyses** s'affichent (long-form)
- [ ] Chaque analysis montre :
  - [ ] Title
  - [ ] Executive summary
  - [ ] Key trends (liste)
  - [ ] Implications (liste)
  - [ ] Time horizon (medium/long)
- [ ] Le tab Medium-term / Long-term fonctionne
- [ ] Le bouton "View referenced events" fonctionne
- [ ] Si moins de 3 events par groupe → aucune analysis

**Note**: Les analyses nécessitent au moins 3 events liés par secteur/région.

---

### 6. Page Quality (`/quality`)

**Vérifications**:
- [ ] La page charge sans erreur
- [ ] Des **metrics** système s'affichent
- [ ] Chaque metric montre :
  - [ ] Coverage score (%)
  - [ ] Average latency (ms)
  - [ ] Error rate (%)
  - [ ] Events processed
  - [ ] Signals generated
  - [ ] Validation notes
- [ ] Les périodes (7d, 30d, 90d) fonctionnent
- [ ] Aucun contenu métier n'est affiché (seulement metrics)

---

## 🔍 Tests de Navigation

- [ ] Navigation entre toutes les pages fonctionne
- [ ] Le sidebar reste cohérent
- [ ] Les URLs sont correctes
- [ ] Le retour en arrière fonctionne

---

## 🎯 Tests de Contrat UI

### Règle 1: Une page = Un type
- [ ] Intelligence → **Signal** uniquement ✅
- [ ] Events → **Event** uniquement ✅
- [ ] Recommendations → **Recommendation** uniquement
- [ ] Alerts → **Alert** uniquement
- [ ] Research → **Analysis** uniquement
- [ ] Quality → **Metric** uniquement

### Règle 2: Pas de signal → Pas de recommendation
- [ ] Si aucun signal, la page Recommendations est vide (normal)

### Règle 3: Events = Source de vérité
- [ ] Les events sont normalisés et cohérents ✅
- [ ] Les autres pages utilisent les events comme source

---

## 🐛 Problèmes Courants

### "No signals available"
**Cause**: Moins de 2 events avec le même secteur/région/type
**Solution**: Normal. Créez plus d'events ou ajustez le groupement dans `eventsToSignals()`

### "No recommendations available"
**Cause**: Pas de signals ou signals avec impact < 60%
**Solution**: Normal. Vérifiez la page Intelligence d'abord.

### "No alerts at this time"
**Cause**: Aucun seuil dépassé
**Solution**: Normal. Les alerts nécessitent impact >= 70% ou confidence >= 60%

### "No analysis available"
**Cause**: Moins de 3 events par groupe
**Solution**: Normal. Besoin d'au moins 3 events liés.

---

## ✅ Critères de Succès

Toutes les pages sont fonctionnelles si :
1. ✅ Elles chargent sans erreur
2. ✅ Elles affichent le bon type d'objet
3. ✅ Les données sont cohérentes
4. ✅ La navigation fonctionne
5. ✅ Les filtres fonctionnent (si applicable)

---

## 📝 Notes

- Les adaptateurs sont temporaires et fonctionnent avec les données Supabase existantes
- Les vrais endpoints API remplaceront ces adaptateurs plus tard
- L'architecture respecte strictement le contrat UI
