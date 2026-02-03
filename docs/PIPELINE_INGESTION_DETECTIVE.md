# Pipeline d’ingestion Detective (Signal → Claim)

Ce document décrit le **pipeline canonique** d’ingestion : des sources brutes aux **claims structurés** en base. À ce stade : **pas de graphe, pas de paths**, seulement des claims stockés dans `detective_claims`.

## Rôle de chaque API (aligné design)

| API        | Rôle |
|-----------|------|
| **Tavily** | Trouver des sources diverses (angles multiples, variété de médias). |
| **Firecrawl** | Extraire le contenu brut (texte propre) depuis chaque URL. |
| **OpenAI** | Transformer le texte en **claims structurés** (JSON strict). |
| **Perplexity** | Optionnel : angles contradictoires, « who disputes this? » (phase ultérieure). |

## Flux global (pseudo-code)

```
ENTRÉE: investigation_id, hypothesis, query? (optionnel, sinon hypothesis utilisée)

1. SOURCES (Tavily)
   query_effective = query ?? hypothesis
   results = searchTavily(query_effective, 'news', { maxResults: 10, days: 90 })
   articles = results.articles  // { title, url, content?, publishedDate? }

2. TEXTE BRUT (par article)
   Pour chaque article (limiter à maxScrapeUrls, ex. 5) :
     si article.content et length > 500 → rawText = article.content
     sinon → doc = scrapeOfficialDocument(article.url, { checkWhitelist: false })
             rawText = doc?.content ?? doc?.markdown ?? ''

3. EXTRACTION CLAIMS (OpenAI)
   Pour chaque (rawText, article) :
     payloads = extractDetectiveClaims({
       hypothesis,
       rawText,
       sourceUrl: article.url,
       sourceName: article.title
     })

4. PERSISTANCE
   Pour chaque payload :
     insert detective_claims (
       investigation_id,
       text, subject, action, object,
       polarity, confidence, date,
       source_url, source_name,
       signal_id  -- null pour l’instant (optionnel)
     )

SORTIE: { claimsCreated: number, articlesProcessed: number, errors?: string[] }
```

## Contraintes

- **Pas de graphe** dans ce pipeline : pas de création de `detective_nodes` / `detective_edges` / `detective_paths`. C’est l’étape suivante (Claim → Node/Edge).
- **Investigation doit exister** : `detective_investigations.id = investigation_id` doit être valide (création d’enquête gérée ailleurs).
- **Idempotence** : plusieurs runs avec la même hypothèse peuvent produire des claims dupliqués (déduplication / fusion possible plus tard).

## Implémentation

- **Module** : `src/server/services/detective-ingestion-pipeline.ts`
- **Fonction principale** : `runDetectiveIngestion(params)`
- **Dépendances** : `tavily-unified-service`, `phase4/firecrawl-official-service`, `detective-claim-extractor`, Supabase (client passé ou créé depuis env).

## Options envisagées

- `maxTavilyResults` : nombre max d’articles Tavily (défaut 10).
- `maxScrapeUrls` : nombre max d’URLs à scraper avec Firecrawl (défaut 5).
- `skipTavily` : utiliser uniquement du texte fourni en entrée (ex. message utilisateur + evidence déjà récupérées).
- `skipFirecrawl` : utiliser uniquement le contenu Tavily (snippets), pas de scrape.

## Étape 4 (optionnelle) : Claim → Graphe persistant

Après ingestion des claims, le graphe peut être reconstruit et persisté :

- **Claim → Node/Edge** : `src/lib/investigation/build-graph-from-claims.ts` (1 claim → 1 node ; ordre temporel → edges supports/weakens).
- **Paths** : `buildPaths(graph)` (algorithme existant) → `detective_paths` + `detective_path_nodes`.
- **Persistance** : `src/server/services/detective-graph-persistence.ts` — `rebuildAndPersistGraph(supabase, investigationId)` remplace tout le graphe de l’enquête.

Dans le pipeline, passer **`runGraphRebuild: true`** pour enchaîner ingestion + reconstruction du graphe en un seul appel.

## Intégration (faite)

- **POST /api/investigations/:threadId/messages** : après Perplexity + Firecrawl (evidence), le backend appelle `getOrCreateDetectiveInvestigation(threadId)`, puis `runDetectiveIngestion` avec `skipTavily: true`, `rawTextChunks` = evidence (excerpt/url/title), `runGraphRebuild: true`. Les claims sont insérés dans `detective_claims`, le graphe est reconstruit et persisté.
- **GET /api/investigations/:threadId/detective-graph** : retourne `{ graph: { nodes, edges, paths } }` depuis les tables detective_* (ou `graph: null` si pas encore de graphe). Le frontend (InvestigationWorkspacePage) utilise ce graphe en priorité lorsqu’il est présent, sinon fallback sur `buildGraphFromSignals(thread, signals)`.
- **Convention** : `thread_id` = `investigation_id` (1:1) pour ne pas ajouter de colonne de liaison.

## Script / cron (optionnel)

- Lancer le pipeline sur une enquête existante pour enrichir les claims (Tavily → Firecrawl → OpenAI) avec `runDetectiveIngestion({ investigationId: threadId, hypothesis, runGraphRebuild: true })`.
