# ✅ Amélioration de la Section Evidence - Sources Web

## 🎯 Objectif

Afficher les vraies sources web (articles, ouvrages) qui supportent les signaux Corporate Impact, plutôt que des catégories génériques.

## ✅ Modifications Implémentées

### 1. Type de Données Amélioré

**Avant** : `sources: string[]` (ex: `["Perplexity Research", "Market Analysis"]`)

**Après** : `sources: Array<string | { type: string; title?: string; url?: string; description?: string }>`

Permet de stocker des sources structurées avec :
- **type** : Type de source (`perplexity`, `market_analysis`, `comtrade`, `other`)
- **title** : Titre de la source (nom du site, titre d'article)
- **url** : URL complète de la source web
- **description** : Description optionnelle

### 2. Extraction des URLs de Perplexity

**Fichier modifié** : `src/server/workers/corporate-impact-worker.ts`

- Extraction des citations/URLs depuis la réponse Perplexity
- Stockage des URLs avec chaque compagnie identifiée
- Création de sources structurées avec URLs réelles

**Code** :
```typescript
// Extract citations/URLs from Perplexity response
const citations = response.choices[0]?.message?.citations || response.citations || [];
const urlPattern = /https?:\/\/[^\s\)]+/g;
const foundUrls = [...new Set([...content.match(urlPattern) || [], ...citations])];

// Store URLs with companies
(companies as any[]).forEach((company: any) => {
  company._perplexityUrls = foundUrls;
});

// Create structured sources
perplexityUrls.slice(0, 10).forEach((url: string) => {
  sources.push({
    type: 'perplexity',
    url: url,
    title: new URL(url).hostname.replace('www.', ''),
  });
});
```

### 3. Affichage Amélioré avec Sections Expandables

**Fichier modifié** : `src/components/corporate-impact/SignalCard.tsx`

**Nouveau composant** : `EvidenceSourceSection`

- Sections expandables pour "Perplexity Research" et "Market Analysis"
- Affichage des sources web avec :
  - Titre cliquable
  - Hostname du site
  - Lien externe avec icône
  - Description (si disponible)
- Compteur de sources dans le header
- Style glass morphism cohérent avec le design system

**Fonctionnalités** :
- ✅ Sections expandables/collapsibles
- ✅ Liens cliquables vers les sources web
- ✅ Affichage du hostname pour identification rapide
- ✅ Gestion des sources sans URL (fallback)
- ✅ Support des sources structurées et strings simples

### 4. Structure de l'Affichage

```
Evidence
├── 🔍 Perplexity Research (10 sources) [expandable]
│   ├── Article Title 1 → reuters.com
│   ├── Article Title 2 → bloomberg.com
│   └── ...
├── 📊 Market Analysis [expandable]
│   └── Sources web...
└── 📰 Other Sources (Comtrade, etc.)
    └── UN Comtrade
```

## 📊 Résultat

### Avant
- Sources génériques : "Perplexity Research", "Market Analysis"
- Pas de liens vers les vraies sources
- Pas de visibilité sur les articles/ouvrages utilisés

### Après
- ✅ Sources web réelles avec URLs
- ✅ Sections expandables organisées par type
- ✅ Liens cliquables vers les articles/ouvrages
- ✅ Identification rapide des sources (hostname)
- ✅ Compteur de sources par section

## 🔄 Flux de Données

1. **Perplexity** identifie les compagnies et retourne des citations/URLs
2. **Worker** extrait les URLs et les stocke avec les compagnies
3. **Base de données** stocke les sources structurées en JSONB
4. **API** retourne les sources structurées
5. **Frontend** affiche les sources dans des sections expandables

## 📝 Fichiers Modifiés

1. `src/types/corporate-impact.ts`
   - Type `MarketSignal.sources` amélioré pour supporter des sources structurées

2. `src/server/workers/corporate-impact-worker.ts`
   - Extraction des URLs de Perplexity
   - Création de sources structurées
   - Type `MarketSignalData.sources` mis à jour

3. `src/components/corporate-impact/SignalCard.tsx`
   - Nouveau composant `EvidenceSourceSection`
   - Affichage amélioré avec sections expandables
   - Support des sources structurées et strings

4. `src/server/api-server.ts`
   - Gestion des sources dans la transformation des signaux

## ✅ Statut

Toutes les modifications ont été implémentées. La section Evidence affiche maintenant les vraies sources web avec des liens cliquables vers les articles et ouvrages qui supportent les signaux.
