# Nucigen Intelligence Detective — Vision & Architecture

> Un enquêteur intelligent / analyste-détective qui poursuit une piste dans le temps.  
> Ce n’est pas un chatbot : c’est un **outil d’enquête stratégique**.

---

## 1. Concept

L’utilisateur **ouvre une piste**, pas une question.

**Exemple :** *« Y a-t-il un lien entre la guerre au Soudan et l’or des pays arabes ? »*

À partir de là, l’IA **n’enquête pas une fois** : elle **enquête dans le temps**.

- Ce n’est **pas** : Question → réponse → fin  
- C’est : **Hypothèse → collecte → corrélation → suivi**

---

## 2. Objets fondation (modèle de données)

### A. InvestigationThread (piste d’enquête)

```ts
InvestigationThread {
  id: string
  title: string
  initial_hypothesis: string
  scope: 'geopolitics' | 'commodities' | 'security' | 'finance'
  status: 'active' | 'dormant' | 'closed'
  confidence_score: number  // 0–100
  created_at: string
  updated_at: string
}
```

Ex. : *"Sudan conflict → Gold flows → Gulf States"*

---

### B. Signal (preuve / élément)

```ts
Signal {
  id: string
  thread_id: string
  type: 'article' | 'report' | 'testimony' | 'data' | 'sanction' | 'seizure'
  source: string
  url?: string
  date: string
  actors: string[]
  summary: string
  credibility_score: 'A' | 'B' | 'C' | 'D'
  extracted_facts: string[]
  impact_on_hypothesis?: 'supports' | 'weakens' | 'neutral'
}
```

---

### C. CausalLink (lien logique)

```ts
CausalLink {
  id: string
  thread_id: string
  from_actor: string
  to_actor: string
  mechanism: 'funding' | 'trafficking' | 'influence' | 'logistics'
  confidence: number
  evidence_signal_ids: string[]
}
```

---

### D. HypothesisState (état de l’hypothèse)

```ts
HypothesisState {
  thread_id: string
  current_assessment: 'supported' | 'partially_supported' | 'unclear' | 'contradicted'
  confidence_delta: number  // évolution
  blind_spots: string[]
  last_updated: string
}
```

---

## 3. Pipeline global

```
User Hypothesis
       ↓
Thread Created
       ↓
Signals Collected (Signal Hunter)
       ↓
Causal Chains Built (Causal Analyst)
       ↓
Hypothesis Updated (Intelligence Synthesizer)
       ↓
Continuous Monitoring (Watcher)
```

---

## 4. Agents IA

| Agent | Rôle |
|-------|------|
| **Hypothesis Decomposer** | Découpe la question en axes d’enquête (3–6 angles). Crée la structure de la piste. |
| **Signal Hunter** | Scrape / interroge news, rapports ONU/ONG, données trade, think tanks. Ne répond jamais : **collecte**. |
| **Causal Analyst** | Relie acteurs, flux, incitations. Génère des chaînes causales (CausalLink). |
| **Intelligence Synthesizer** | Met à jour hypothèse, niveau de confiance, zones d’ombre. Produit une note intelligible. |
| **Watcher** | Surveille nouvelles données. Réactive la piste. Notifie l’utilisateur. |

---

## 5. System prompt — Nucigen Detective AI

À utiliser comme **system prompt** pour le raisonnement enquête.

```
You are **Nucigen Intelligence Detective**, an investigative reasoning engine.

Your role is **not to answer questions**, but to **open, pursue, and update investigative hypotheses** over time.

When a user submits a question, treat it as a **hypothesis to investigate**, not a request for a final answer.

### Core principles

1. Decompose each hypothesis into **distinct investigative axes** (3–6).
2. Collect **verifiable signals** (articles, reports, data, testimonies).
3. Identify **causal mechanisms**, not mere correlations.
4. Explicitly state **what is known, uncertain, and unknown**.
5. Continuously **update the hypothesis** as new signals emerge.
6. Never claim certainty unless supported by multiple independent signals.

### Response structure (OBLIGATOIRE)

Every output must follow:

**1. Active Hypothesis** — Rephrase the investigation in analytical terms.

**2. Investigative Axes** — List 3–6 angles being explored.

**3. Signals Identified** — Summarize key evidence with sources and credibility.

**4. Causal Chain (if any)** — Describe plausible mechanisms linking actors/events.

**5. Current Assessment** — Supported / Partially supported / Unclear / Contradicted

**6. Confidence Level** — Numeric (0–100) + justification.

**7. Blind Spots** — What is missing or deliberately opaque.

### Update rule

When new information appears, explicitly state how it **changes the confidence** of the original hypothesis.
```

---

## 6. UI — Investigation Workspace

Layout en **3 colonnes** :

| Zone | Contenu |
|------|---------|
| **Gauche — Active Investigations** | Liste des pistes (ex. Sudan → Gold → Gulf). Statut + confidence %. |
| **Centre — Investigation Feed** | Chronologie : nouveaux articles, rapports, saisies, témoignages. Chaque item : résumé IA + impact sur l’hypothèse (+ / − / neutre). |
| **Droite — Intelligence Panel** | Hypothèse actuelle, chaîne causale (visuelle), confidence meter, zones d’ombre, **Export Intelligence Brief**. |

Le **chat** sert à :

- Affiner la piste
- Poser une sous-question
- « Explore financial actors more »
- « Keep monitoring this »

Le chat **contrôle l’enquête**, il ne la remplace pas.

---

## 7. Ce qui existe déjà (base)

- **Chat Réponse** (page `/search/session/:id/reponse`) : chat avec Perplexity.
- **Detective message** : `POST /api/search/detective/message` — Perplexity + Firecrawl sur les citations → réponses + **evidence** (extraits scrapés).
- **Creuser cette source** : drawer + `POST /api/enrich` → entités, faits clés.

C’est une **base** : une conversation avec preuves (liens + extraits) et deep-dive sur une source. Il manque : **thread persisté**, **axes d’enquête**, **signals stockés**, **chaînes causales**, **watcher**.

---

## 8. Roadmap par phases

| Phase | Objectif | Livrables |
|-------|----------|-----------|
| **Phase 1 (actuelle)** | Chat avec preuves + deep-dive | Endpoint detective, evidence cards, drawer enrich. ✅ |
| **Phase 2** | Piste = objet persisté | Tables `investigation_threads`, `investigation_signals`. Création de thread à partir de la première question. UI : liste des pistes (gauche) + feed des signals (centre). |
| **Phase 3** | Axes + synthèse structurée | Hypothesis Decomposer (prompt) → axes d’enquête. Intelligence Synthesizer → assessment + confidence + blind spots. Affichage dans le panel droit. |
| **Phase 4** | Chaînes causales | Causal Analyst : extraction de liens acteur→acteur. Stockage CausalLink. Visualisation (graphe ou liste) dans le panel droit. |
| **Phase 5** | Suivi continu | Watcher : surveillance (RSS, APIs, ou run périodique). Nouveaux signals attachés au thread. Notifications « Nouvel élément lié à votre enquête ». |

---

## 9. Noms possibles du produit

- Investigation Threads  
- Causal Intelligence  
- Live Hypothesis Tracking  
- Geopolitical Detective  
- Intelligence Lines  
- Signal Chains  
- Ongoing Inquiry  

---

*Document de vision — à utiliser comme référence pour l’architecture et les prochaines implémentations.*
