# Schéma de données — Investigation Engine (V1)

**Principe directeur :** On persiste un **état d’investigation évolutif**, pas une réponse.

**Implémentation DB :** Les tables Supabase sont préfixées `detective_` (`detective_investigations`, `detective_signals`, etc.) pour coexister avec les tables existantes (`investigation_threads`, `investigation_signals`). Les types TypeScript (voir `src/types/investigation-schema.ts`) reflètent les entités logiques sans préfixe.

Chaque entité existe parce qu’elle est **nécessaire au raisonnement** (Step 1 — algorithme de paths).

---

## 1. `investigations` (conteneur logique)

| Champ        | Type     | Contrainte |
|-------------|----------|------------|
| id          | string   | PK         |
| title       | string   |            |
| hypothesis  | string   |            |
| status      | enum     | ongoing \| paused \| closed |
| created_at  | Date     |            |
| updated_at  | Date     |            |

Une enquête est un espace de travail ; elle vit dans le temps et contient tout le reste.

---

## 2. `signals` (observations brutes — input)

| Champ        | Type     | Contrainte |
|-------------|----------|------------|
| id          | string   | PK         |
| investigation_id | string | FK → investigations |
| source      | string   |            |
| source_url  | string?  |            |
| published_at| Date?    |            |
| extracted_at| Date     |            |
| credibility | number   | 0..1       |
| raw_text    | string   |            |

Le moteur raisonne **à partir des signaux**. Les signaux sont neutres et peuvent être réinterprétés plus tard.

**Règle :** Jamais modifiés après ingestion (immutables).

---

## 3. `nodes` (faits / événements / acteurs normalisés)

| Champ           | Type   | Contrainte |
|----------------|--------|------------|
| id             | string | PK         |
| investigation_id | string | FK → investigations |
| type           | enum   | event \| actor \| resource \| decision \| impact |
| label          | string |            |
| date           | Date?  |            |
| confidence     | number | 0..1       |

Les nodes sont la matière du graphe ; réutilisées par plusieurs paths.

---

## 4. `edges` (relations causales / d’influence)

| Champ           | Type   | Contrainte |
|----------------|--------|------------|
| id             | string | PK         |
| investigation_id | string | FK → investigations |
| from_node_id  | string | FK → nodes |
| to_node_id    | string | FK → nodes |
| relation      | enum   | causes \| influences \| restricts \| supports \| weakens |
| strength       | number | 0..1       |
| confidence    | number | 0..1       |

Les edges servent à **inférer les paths** ; ils expriment la direction et la force. Ils peuvent être contradictoires.

---

## 5. `paths` (hypothèses causales en concurrence — output clé)

| Champ            | Type   | Contrainte |
|-----------------|--------|------------|
| id              | string | PK         |
| investigation_id | string | FK → investigations |
| status          | enum   | active \| weak \| dead |
| confidence      | number | 0..100 (affichage) |
| hypothesis_label| string?|            |
| created_at      | Date   |            |
| updated_at      | Date   |            |

C’est **le produit intellectuel du moteur** ; plusieurs paths coexistent.

---

## 6. `path_nodes` (appartenance node ↔ path)

| Champ     | Type   | Contrainte |
|----------|--------|------------|
| path_id  | string | FK → paths, PK partiel |
| node_id  | string | FK → nodes, PK partiel |
| position | number | ordre local dans le path |

Un node peut appartenir à plusieurs paths ; l’ordre est contextuel au path.

---

## Relations (vision d’ensemble)

```
Investigation
 ├─ Signals (1..N)
 ├─ Nodes (1..N)
 ├─ Edges (1..N)
 └─ Paths (1..N)
       └─ PathNodes (N..N with Nodes)
```

Aucune relation circulaire ambiguë ; tout est versionnable.

---

## Règles de persistance

1. **Immutabilité partielle**
   - Signals : jamais modifiés.
   - Nodes / Edges : peuvent être enrichis.
   - Paths : évoluent (status, confidence).

2. **Historique implicite**
   - `updated_at` permet de savoir quand un path a changé. Pas de versioning lourd en V1.

3. **Recalcul contrôlé**
   - Le moteur peut recalculer les paths et mettre à jour `paths` + `path_nodes`.
   - Les anciens paths **ne sont pas supprimés**.

---

## Interdits (alignement Detective)

- ❌ table `answers`
- ❌ table `chat_messages` (dans ce schéma)
- ❌ table `conclusions`
- ❌ champ `final_truth`

---

## Test mental

> *Est-ce que ce schéma me permet de montrer aujourd’hui un path mort qui était crédible hier ?*

→ Oui.
