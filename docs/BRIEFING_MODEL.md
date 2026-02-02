# Modèle de données — Briefing (Option B)

**Règle d’or :** Le Briefing **lit** le moteur (paths, nodes, edges). Il ne crée rien, ne modifie rien, ne choisit pas une vérité.

---

## Contrat lecture seule

### Entrées (read-only)

| Source | Données lues |
|--------|--------------|
| **Thread** | id, title, initial_hypothesis, status, confidence_score, investigative_axes, current_assessment, blind_spots, updated_at |
| **Graph** | nodes, edges, paths (id, nodes, status, confidence, hypothesis_label) |

Le Briefing **ne modifie jamais** ces données. Il en dérive une structure de présentation (payload) pour l’UI ou l’export.

---

## Structure du Briefing (6 sections)

Chaque section est **données structurées** (références aux nodes/paths, labels, chiffres). Pas de texte long généré en continu.

### 1. What is being investigated

- **hypothesis** (thread.initial_hypothesis)
- **title** (thread.title)
- **status** (thread.status)
- **updated_at** (thread.updated_at)
- **investigative_axes** (thread.investigative_axes)

→ État de l’enquête, pas de narration.

---

### 2. Primary path (current best explanation)

- **path_id** (référence)
- **hypothesis_label** (path.hypothesis_label ou path.id)
- **confidence** (path.confidence 0..100)
- **status** (path.status)
- **key_node_ids** (2–4 nodes clés du path, pas tous)

Règle : le path “principal” est dérivé (ex. path actif de confiance max). **Ce n’est jamais “la vérité”** — les alternatives doivent être visibles.

---

### 3. Key turning points

- Liste de **2–4 nodes** (node_id, label, date, confidence)
- Critère de dérivation : nodes pivot (ex. dans plusieurs paths, ou point de bifurcation), pas “étapes A→B→C”

Chapitres = **tournants**, pas étapes linéaires.

---

### 4. Alternative explanations

- Liste de **paths** autres que le primary (path_id, hypothesis_label, status, confidence)
- Inclut **weak** et **dead** (jamais supprimés)

→ Montrer qu’il existe des alternatives ; pas de ton omniscient.

---

### 5. What is uncertain

- **blind_spots** (thread.blind_spots)
- **low_confidence_nodes** (références aux nodes avec confidence < seuil)
- **contradictions** (ex. edges avec strength faible sur le path principal, ou paths dead)

→ Zones sans données, contradictions visibles.

---

### 6. Disclaimer

- Phrase fixe (ex. “This briefing is subject to change as new signals are integrated.”)
- Pas de champ généré ; toujours présent.

---

## Ce que le Briefing ne fait pas

- ❌ Texte long généré en continu
- ❌ “Final answer” ou conclusion unique
- ❌ Suppression des paths morts
- ❌ Ton affirmatif omniscient
- ❌ Écrire dans le graphe ou le thread

---

## Implémentation

- **Types** : `src/types/briefing.ts` (BriefingInput, BriefingPayload, sections)
- **Dérivation** : `src/lib/investigation/build-briefing.ts` — `buildBriefingPayload(thread, graph): BriefingPayload`
- **UI / Export** : consomment `BriefingPayload` ; aucun accès direct au graphe pour “inventer” du contenu.
