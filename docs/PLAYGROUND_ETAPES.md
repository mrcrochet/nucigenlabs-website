# Playground Détective — Étapes d’implémentation

Le Playground (page Réponse après une recherche) est livré en 3 étapes pour valider l’UI puis le backend puis le temps réel.

## Étape 1 : Données mockées (actuelle)

- **Objectif** : Vérifier que l’interface (pistes à gauche, graphe / chrono / carte / briefing à droite, détails) fonctionne sans dépendre du backend.
- **Usage** : Ouvrir la page Réponse avec `?mock=1` dans l’URL, par exemple :
  - `http://localhost:5173/search/session/<sessionId>/reponse?mock=1`
- **Comportement** :
  - La session est chargée (localStorage ou API) comme d’habitude.
  - Aucun appel à `POST .../playground` ni à `GET .../detective-graph`.
  - Après ~600 ms, un graphe fictif est injecté (voir `src/lib/investigation/playground-mock-graph.ts`).
  - L’UI affiche un bandeau « Mode démo — données mockées ».
- **Fichiers** :
  - `src/lib/investigation/playground-mock-graph.ts` : graphe mock (nodes, edges, paths).
  - `src/pages/SearchResponsePage.tsx` : lecture de `?mock=1`, effet qui pose le graphe mock et `threadId` fictif, pas d’appels API en mode mock.

## Étape 2 : Backend (données réelles, pas de temps réel)

- **Objectif** : Utiliser le vrai pipeline (Tavily + ingestion + graphe) et afficher le graphe une fois prêt.
- **Usage** : Ouvrir la page Réponse **sans** `?mock=1`.
- **Comportement** :
  - Session chargée → si pas de `investigationThreadId`, appel à `POST /api/search/session/:sessionId/playground`.
  - Réception de `threadId` → polling sur `GET /api/investigations/:threadId/detective-graph` jusqu’à avoir un graphe (ou timeout).
  - Affichage du graphe réel (pistes, Flow, Timeline, Carte, Briefing, détails).
- **Backend** : `POST .../playground` crée le thread, lance l’ingestion (Tavily + `rawTextChunks` depuis les résultats de recherche), met à jour `session_snapshot.investigationThreadId`, renvoie `threadId`.

## Étape 3 : Temps réel (réactivité en direct)

- **Objectif** : Mise à jour du graphe en temps réel (nouveaux claims, nouveaux paths) sans recharger la page.
- **Pistes** :
  - Polling plus agressif ou WebSocket / Server-Sent Events pour pousser les mises à jour.
  - Affichage progressif (streaming) des nodes/edges/paths au fur et à mesure de l’ingestion.

---

Pour tester l’étape 1 : après une recherche, cliquer sur **Playground (démo)** à côté de « Playground » dans la barre d’outils (lien qui ouvre la page avec `?mock=1`), ou ajouter `?mock=1` à l’URL manuellement.
