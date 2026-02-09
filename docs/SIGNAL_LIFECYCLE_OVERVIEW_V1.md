# Signal Lifecycle & Overview V1

Document de référence produit pour la fondation Nucigen : cycle de vie du signal et discipline Overview V1.

---

## 1. Signal Lifecycle (V1)

À ne pas coder tout de suite — ce cycle guide tout le reste.

```
Signal lifecycle (V1):
1. Signal detected
2. Signal appears on Overview
3. User clicks Investigate
4. Signal gets context & causality
5. Signal either escalates, stabilizes, or expires
```

---

## 2. Règles produit Overview V1

### Sémantique (wording UI / doc)

- **importance** = gravité du signal (drives point size on map).
- **impact** (ou `impact_scope` en mental model) = étendue géographique : local / regional / global (drives halo on map).

Ne pas mélanger les deux dans les libellés.

### Nombre de points sur la map

- **Max 8–12 signaux visibles** sur l’Overview V1.
- Au-delà, on perd l’effet *“je vois tout de suite où regarder”*.
- Règle produit, pas seulement technique : à appliquer côté API / sélection des signaux.

### Side panel

- **Panneau d’orientation**, pas une page d’analyse.
- Pas de drill-down, pas de scroll infini, pas d’interactivité poussée ici.
- Top 3 events + Top 3 corporate impacts + CTA “Go to Investigate” suffisent pour V1.

---

## 3. Ce qu’il ne faut PAS faire maintenant

- Timeline animée
- WebSocket
- Alertes / notifications
- AI copilot partout
- Predictions

---

## 4. Prochaine feature (une seule)

Choisir **une** des trois options avant d’en ajouter d’autres :

1. **Investigate – V1** : page simple, 1 signal, chaîne causale minimale.
2. **Signal generation pipeline (mock)** : comment un signal “naît”, même en semi-manuel.
3. **Confidence & scoring logic** : comment on justifie un 82% vs 65%.

---

## 5. Référence technique V1

- **Types** : `src/types/overview.ts` (`OverviewSignal`, `OverviewMapData`).
- **API** : `GET /api/overview/map` → `{ signals, top_events, top_impacts }`.
- **UI** : `GlobalSituationMap` (Mapbox) + `OverviewMapSidePanel` dans `Overview.tsx`.

Ce document est la source de vérité pour le cycle de vie du signal et la discipline Overview V1.
