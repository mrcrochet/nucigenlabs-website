# Conception — Nucigen Intelligence Detective

Document de conception détaillé pour le produit « Investigation Threads » (pistes d’enquête).  
Référence vision : [NUCIGEN_INTELLIGENCE_DETECTIVE.md](NUCIGEN_INTELLIGENCE_DETECTIVE.md).

**Moteur d'enquête (état unique, 3 vues) :** [CONCEPTION_INVESTIGATION_ENGINE.md](CONCEPTION_INVESTIGATION_ENGINE.md) — un graphe d'enquête ; Flow, Timeline, Map = projections. Types : `src/types/investigation-graph.ts`.

---

## 1. Modèle de données (Supabase)

### 1.1 Tables

#### `investigation_threads` (piste d’enquête)

| Colonne | Type | Contraintes | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | Identifiant |
| user_id | UUID | NOT NULL | Propriétaire (supabase_user_id via Clerk) |
| title | TEXT | NOT NULL | Titre court (ex. "Soudan – Or – Golfe") |
| initial_hypothesis | TEXT | NOT NULL | Question / hypothèse initiale |
| scope | TEXT | NOT NULL | geopolitics \| commodities \| security \| finance |
| status | TEXT | NOT NULL, default 'active' | active \| dormant \| closed |
| confidence_score | INTEGER | CHECK (0–100) | Niveau de confiance actuel |
| investigative_axes | TEXT[] | DEFAULT '{}' | Axes d’enquête (3–6) issus du Decomposer |
| current_assessment | TEXT | | supported \| partially_supported \| unclear \| contradicted |
| blind_spots | TEXT[] | DEFAULT '{}' | Zones d’ombre |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

Index : `user_id`, `status`, `updated_at DESC`.

---

#### `investigation_signals` (preuve / élément)

| Colonne | Type | Contraintes | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | |
| thread_id | UUID | NOT NULL, FK investigation_threads(id) ON DELETE CASCADE | |
| type | TEXT | NOT NULL | article \| report \| testimony \| data \| sanction \| seizure |
| source | TEXT | NOT NULL | Nom de la source (site, rapport) |
| url | TEXT | | Lien vers le document |
| date | DATE | | Date du signal (si connue) |
| actors | TEXT[] | DEFAULT '{}' | Acteurs mentionnés |
| summary | TEXT | NOT NULL | Résumé IA |
| credibility_score | TEXT | | A \| B \| C \| D |
| extracted_facts | TEXT[] | DEFAULT '{}' | Faits extraits |
| impact_on_hypothesis | TEXT | | supports \| weakens \| neutral |
| raw_evidence | JSONB | | Données brutes (ex. excerpt, title) pour affichage |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

Index : `thread_id`, `created_at DESC`, `type`.

---

#### `investigation_messages` (historique chat / contrôles)

| Colonne | Type | Contraintes | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | |
| thread_id | UUID | NOT NULL, FK investigation_threads(id) ON DELETE CASCADE | |
| role | TEXT | NOT NULL | user \| assistant |
| content | TEXT | NOT NULL | Contenu du message |
| citations | TEXT[] | DEFAULT '{}' | URLs citées (assistant) |
| evidence_snapshot | JSONB | | Evidence[] au moment de la réponse (assistant) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

Index : `thread_id`, `created_at`.

Permet de persister le fil de conversation et de réafficher une piste avec son historique.

---

#### `investigation_causal_links` (Phase 4)

| Colonne | Type | Contraintes | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| thread_id | UUID | NOT NULL, FK | |
| from_actor | TEXT | NOT NULL | |
| to_actor | TEXT | NOT NULL | |
| mechanism | TEXT | NOT NULL | funding \| trafficking \| influence \| logistics |
| confidence | INTEGER | CHECK (0–100) | |
| evidence_signal_ids | UUID[] | DEFAULT '{}' | IDs de signals qui étayent le lien |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 1.2 RLS

- **investigation_threads** : `user_id = auth.uid()` ou service_role (auth.uid() peut être résolu via clerk_user_mapping selon le setup).
- **investigation_signals** : accès si le thread appartient à l’utilisateur (via thread_id → threads.user_id).
- **investigation_messages** : idem, via thread_id.
- **investigation_causal_links** : idem.

En environnement Clerk-only, les politiques peuvent utiliser une fonction qui résout `auth.jwt() ->> 'sub'` (Clerk ID) vers `supabase_user_id`, ou une politique service_role pour l’API qui vérifie le user côté app.

---

## 2. Contrats API (backend)

Base path : `/api/investigations` (ou `/api/detective`).

| Méthode | Route | Body / Query | Description |
|--------|--------|--------------|-------------|
| POST | /api/investigations | `{ initial_hypothesis, title?, scope? }` | Crée une piste (thread). Optionnel : appelle Hypothesis Decomposer pour remplir axes. Retourne thread + axes si décomposition faite. |
| GET | /api/investigations | (query: user) | Liste des pistes de l’utilisateur (gauche). |
| GET | /api/investigations/:threadId | | Détail d’une piste : thread + signals + messages + hypothesis state. |
| POST | /api/investigations/:threadId/messages | `{ content }` | Envoie un message (user). Déclenche côté backend : Detective message (Perplexity + Firecrawl) → création de signals à partir des citations/evidence → mise à jour assessment/confidence si synthèse activée. Retourne message assistant + signals créés. |
| GET | /api/investigations/:threadId/signals | | Liste des signals de la piste (feed centre). |
| POST | /api/investigations/:threadId/signals | (optionnel) | Ajout manuel d’un signal (ex. URL passée). |
| PATCH | /api/investigations/:threadId | `{ status?, title? }` | Met à jour statut (active / dormant / closed) ou titre. |
| GET | /api/investigations/:threadId/brief | | Export Intelligence Brief (texte ou PDF). |

Les appels « Detective message » existants (`POST /api/search/detective/message`) peuvent être réutilisés en interne ; le nouveau flux les enveloppe et persiste thread + messages + signals.

---

## 3. Flux utilisateur

### 3.1 Création d’une piste

1. Utilisateur ouvre « Investigations » (ou « Pistes »).
2. Champ « Nouvelle piste » : il saisit une question / hypothèse (ex. « Y a-t-il un lien entre la guerre au Soudan et l’or des pays arabes ? »).
3. Clic « Ouvrir l’enquête » → `POST /api/investigations` avec `initial_hypothesis`.
4. Backend : création de la ligne en base ; optionnel : appel Hypothesis Decomposer (prompt) pour remplir `investigative_axes` et éventuellement `title` court.
5. Redirection vers la page workspace de cette piste : ` /investigations/:threadId`.

### 3.2 Workspace (une piste ouverte)

- **Gauche** : liste des pistes (GET /api/investigations) ; la piste courante est highlightée.
- **Centre** : feed des signals (GET /api/investigations/:threadId/signals), ordre chronologique. Chaque carte : type, source, date, résumé, impact (+ / − / neutre), lien.
- **Droite** : panel intelligence pour la piste courante — hypothèse active, axes, assessment, confidence, blind spots, bouton Export Brief.
- **Chat** (en bas du centre ou droite) : input pour « Affiner la piste », « Explorer X », « Garder sous surveillance ». Envoi → `POST /api/investigations/:threadId/messages` → nouvel assistant message + nouveaux signals si trouvés → mise à jour du feed et du panel.

### 3.3 Première question sur une piste

- À la création, on peut immédiatement envoyer l’hypothèse comme premier message assistant (Signal Hunter + synthèse) pour remplir le feed et le panel sans que l’utilisateur ait à renvoyer la même question. Donc : après `POST /api/investigations`, optionnel `POST /api/investigations/:threadId/messages` avec `content = initial_hypothesis` pour « lancer » la première collecte.

---

## 4. Maquette fonctionnelle (écrans)

### 4.1 Liste des pistes (gauche)

- Titre court de la piste.
- Statut (badge) : active / dormant / closed.
- Confidence % (barre ou chiffre).
- Dernière mise à jour (relative).
- Clic → charge la piste (centre + droite).

### 4.2 Feed d’enquête (centre)

- Titre de section : « Signaux » ou « Chronologie ».
- Cartes signal : type (icône), source, date, résumé (2–3 lignes), impact (icône + / − / neutre), lien « Lire » / « Creuser » (réutilise enrich).
- Tri : plus récent en premier.
- Pagination ou infinite scroll si beaucoup de signals.

### 4.3 Panel Intelligence (droite)

- Bloc **Hypothèse active** : texte court.
- Bloc **Axes d’enquête** : liste à puces (3–6).
- Bloc **Assessment** : Supported / Partially supported / Unclear / Contradicted + court texte.
- **Confidence** : jauge 0–100 + justification (1 phrase).
- **Zones d’ombre** : liste courte.
- Bouton **Export Intelligence Brief**.
- (Phase 4) **Chaîne causale** : graphe ou liste from_actor → to_actor (mechanism).

### 4.4 Chat (contrôle de l’enquête)

- Historique : messages user / assistant (comme aujourd’hui Reponse).
- Assistant : peut inclure résumé + liens + evidence (comme detective actuel).
- Input : « Poser une sous-question ou affiner la piste ».
- Envoi → appel API → nouveau message + nouveaux signals → rafraîchissement feed et panel.

---

## 5. Ordre d’implémentation (conception → dev)

| Ordre | Tâche | Livrable |
|-------|--------|----------|
| 1 | Schéma BDD | Migration Supabase : investigation_threads, investigation_signals, investigation_messages (+ RLS). |
| 2 | Types & API client | Types TS (InvestigationThread, Signal, etc.) + client API front (createThread, getThreads, getThread, sendMessage, getSignals). |
| 3 | API backend | POST/GET /api/investigations, GET/POST /api/investigations/:id/messages, GET /api/investigations/:id/signals, PATCH /api/investigations/:id. Intégration avec detective message + persistance signals/messages. |
| 4 | UI liste + détail | Page ou section « Pistes » : liste à gauche, sélection d’une piste. Page ou vue workspace : route /investigations/:threadId. |
| 5 | UI feed + panel | Feed des signals (centre), panel intelligence (droite) avec hypothèse, axes, assessment, confidence, blind spots. |
| 6 | Chat intégré | Chat dans le workspace, branché sur POST messages, affichage des messages + evidence, création de signals à partir des réponses. |
| 7 | Hypothesis Decomposer | Prompt + appel au premier message (ou à la création) pour remplir axes + title. |
| 8 | Intelligence Synthesizer | Après chaque réponse, mise à jour assessment, confidence, blind_spots dans le thread. |
| 9 | Causal Analyst + liens | Tables causal_links, extraction des liens, affichage dans le panel. |
| 10 | Watcher | Job ou cron : nouvelles sources → nouveaux signals → notification. |

Les étapes 1–6 couvrent la « conception » jusqu’à un workspace utilisable (piste persistée, feed, panel, chat). Les 7–10 correspondent aux agents et au suivi continu.

---

## 6. Fichiers à créer / modifier (résumé)

| Fichier | Rôle |
|---------|------|
| `supabase/migrations/20260124000000_create_investigation_tables.sql` | Tables threads, signals, messages (+ RLS). |
| `src/types/investigation.ts` | Types InvestigationThread, Signal, Message, etc. |
| `src/types/investigation-graph.ts` | Types moteur : Node, Edge, Path, InvestigationGraph (état unique pour Flow/Timeline/Map). |
| `src/lib/api/investigation-api.ts` | Client API (createThread, getThreads, sendMessage, getSignals…). |
| `src/server/api-server.ts` | Routes /api/investigations/*. |
| `src/pages/InvestigationsPage.tsx` (ou équivalent) | Liste des pistes + entrée « Nouvelle piste ». |
| `src/pages/InvestigationWorkspacePage.tsx` | Layout 3 colonnes (liste, feed, panel) + chat. |

Ce document sert de référence unique pour la conception et le découpage des tâches de développement.

---

## 7. Artefacts créés (conception démarrée)

| Artefact | Fichier | Rôle |
|----------|---------|------|
| Schéma BDD | [supabase/migrations/20260124000000_create_investigation_tables.sql](supabase/migrations/20260124000000_create_investigation_tables.sql) | Tables `investigation_threads`, `investigation_signals`, `investigation_messages`, `investigation_causal_links` + RLS |
| Types TS | [src/types/investigation.ts](src/types/investigation.ts) | `InvestigationThread`, `InvestigationSignal`, `InvestigationMessage`, payloads, enums |
| Client API | [src/lib/api/investigation-api.ts](src/lib/api/investigation-api.ts) | `createThread`, `getThreads`, `getThread`, `sendMessage`, `getSignals`, `updateThread` |
| Moteur graphe | [CONCEPTION_INVESTIGATION_ENGINE.md](CONCEPTION_INVESTIGATION_ENGINE.md) | Un état = un graphe ; Flow, Timeline, Map = projections. |
| Types graphe | [src/types/investigation-graph.ts](src/types/investigation-graph.ts) | `InvestigationGraphNode`, `InvestigationGraphEdge`, `InvestigationGraphPath`, `InvestigationGraph` |

Prochaine étape : implémenter les routes `/api/investigations/*` dans l’API server et brancher l’UI (moteur (graphe) et les 3 vues synchronisées (Flow, Timeline, Map) + panel de détails commun).
