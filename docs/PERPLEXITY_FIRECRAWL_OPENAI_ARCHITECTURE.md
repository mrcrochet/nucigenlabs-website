# Architecture Perplexity + Firecrawl + OpenAI

## Vue d'ensemble

Nouvelle architecture optimisée qui sépare les responsabilités entre les trois services :

1. **Perplexity** : Recherche de sources/URLs pertinentes (limité à la recherche)
2. **Firecrawl** : Extraction du contenu des URLs trouvées
3. **OpenAI** : Synthèse et génération de contenu structuré

## Pourquoi cette architecture ?

### Avantages

✅ **Optimisation des coûts** :
- Perplexity : Utilisé uniquement pour la recherche (max_tokens: 500)
- Firecrawl : Extraction efficace du contenu
- OpenAI : Génération de texte de qualité supérieure

✅ **Meilleure qualité** :
- OpenAI GPT-4o est meilleur pour la génération de texte structuré
- Firecrawl extrait le contenu complet des pages (pas juste des snippets)
- Perplexity trouve les meilleures sources via sa recherche web

✅ **Séparation des responsabilités** :
- Chaque service fait ce qu'il fait de mieux
- Plus facile à maintenir et optimiser

## Flux de traitement

```
┌─────────────────┐
│  Signal Input   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  STEP 1: Perplexity (Search Only)   │
│  - Query: Find relevant URLs        │
│  - max_tokens: 500 (limité)         │
│  - return_citations: true           │
│  Output: List of URLs               │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  STEP 2: Firecrawl (Extraction)     │
│  - Scrape URLs from Perplexity      │
│  - Extract full content             │
│  - Limit: 5 URLs max                │
│  - Content limit: 5000 chars/URL   │
│  Output: Extracted content         │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  STEP 3: OpenAI (Synthesis)         │
│  - Model: gpt-4o                    │
│  - Input: Extracted content         │
│  - Generate structured analysis     │
│  - max_tokens: 4000                 │
│  Output: Structured enrichment      │
└─────────────────────────────────────┘
```

## Implémentation

### Fonction principale : `enrichSignalWithPerplexity`

```typescript
// STEP 1: Perplexity - Recherche de URLs uniquement
const perplexityResponse = await chatCompletions({
  model: 'sonar-pro',
  messages: [
    {
      role: 'system',
      content: 'You are a web search assistant. Your ONLY task is to find and return relevant URLs. Return URLs one per line, nothing else.',
    },
    {
      role: 'user',
      content: searchQuery, // Query pour trouver des sources
    },
  ],
  max_tokens: 500, // LIMITÉ - juste pour trouver des URLs
  return_citations: true,
});

// STEP 2: Firecrawl - Extraction du contenu
const extractedContents = await Promise.all(
  urls.map(url => scrapeOfficialDocument(url, { checkWhitelist: false }))
);

// STEP 3: OpenAI - Synthèse et génération
const openaiResponse = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    {
      role: 'system',
      content: 'You are a financial intelligence analyst...',
    },
    {
      role: 'user',
      content: openaiPrompt, // Prompt avec contenu extrait
    },
  ],
  max_tokens: 4000,
});
```

## Configuration

### Variables d'environnement requises

```bash
PERPLEXITY_API_KEY=pplx-...      # Pour la recherche
FIRECRAWL_API_KEY=fc-...         # Pour l'extraction
OPENAI_API_KEY=sk-...            # Pour la génération
```

## Coûts estimés

### Par enrichissement de signal

- **Perplexity** : ~$0.001 (500 tokens, recherche uniquement)
- **Firecrawl** : ~$0.05 (5 URLs scrapées)
- **OpenAI** : ~$0.02 (4000 tokens, gpt-4o)

**Total** : ~$0.071 par enrichissement

### Comparaison avec l'ancienne architecture

- **Ancienne** : Perplexity seul (4000 tokens) = ~$0.08
- **Nouvelle** : Perplexity (500) + Firecrawl (5 URLs) + OpenAI (4000) = ~$0.071

**Économie** : ~11% + meilleure qualité

## Avantages de qualité

1. **Contenu plus complet** : Firecrawl extrait le contenu complet des pages
2. **Meilleure structuration** : OpenAI GPT-4o est meilleur pour la génération structurée
3. **Sources vérifiables** : URLs extraites directement depuis les pages
4. **Moins d'hallucinations** : OpenAI travaille avec du contenu réel extrait

## Limitations et fallbacks

### Si Firecrawl échoue
- Utilise uniquement les URLs de Perplexity comme citations
- OpenAI génère l'analyse basée sur les URLs trouvées

### Si OpenAI échoue
- Fallback vers l'ancienne méthode (Perplexity seul)
- Log l'erreur pour debugging

## Exemples d'utilisation

### Enrichissement de signal

```typescript
const enrichment = await enrichSignalWithPerplexity({
  signalTitle: "US-China semiconductor sanctions",
  signalSummary: "New export restrictions on advanced chips",
  sector: "Technology",
  region: "Asia",
});
```

### Résultat

```typescript
{
  historical_context: "...",
  expert_analysis: "...",
  market_implications: "...",
  comparable_events: [...],
  key_stakeholders: [...],
  risk_factors: [...],
  impacted_sectors: [...],
  expert_quotes: [...],
  timeline: [...],
  citations: ["https://...", "https://..."],
  related_questions: [...],
  confidence: 85
}
```

## Monitoring

Les logs incluent :
- `[Perplexity+Firecrawl+OpenAI] Found X URLs from Perplexity search`
- `[Perplexity+Firecrawl+OpenAI] Extracting content from X URLs with Firecrawl...`
- `[Perplexity+Firecrawl+OpenAI] Successfully extracted content from X URLs`
- `[Perplexity+Firecrawl+OpenAI] Generating structured analysis with OpenAI...`

## Prochaines améliorations

- [ ] Cache des contenus extraits par Firecrawl
- [ ] Parallélisation optimisée de l'extraction
- [ ] Retry logic pour Firecrawl
- [ ] Métriques de performance par étape
- [ ] A/B testing entre ancienne et nouvelle architecture
