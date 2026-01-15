# Architecture de la Page Discover de Perplexity

## 🎯 Vue d'ensemble

La page **Discover** de Perplexity est un **agrégateur intelligent de contenus** qui combine :
- **Feed de cartes** (cards) avec contenu enrichi
- **Filtres et catégories** dynamiques
- **Personnalisation** basée sur l'activité utilisateur
- **Navigation fluide** avec preview/détails
- **Infinite scroll** ou pagination optimisée

---

## 🏗️ Architecture Technique

### 1. **Structure de Données**

```typescript
interface DiscoverItem {
  id: string;
  type: 'article' | 'topic' | 'trend' | 'insight';
  title: string;
  summary: string;
  thumbnail?: string;
  sources: Array<{
    name: string;
    url: string;
    date: string;
  }>;
  category: string;
  tags: string[];
  engagement: {
    views: number;
    saves: number;
    questions: number;
  };
  personalization_score?: number; // Pour ranking personnalisé
  metadata: {
    published_at: string;
    updated_at: string;
    relevance_score: number;
  };
}
```

### 2. **Layout Principal**

```
┌─────────────────────────────────────────────────┐
│  Header: "Discover" + Search Bar                │
├─────────────────────────────────────────────────┤
│  Category Tabs (horizontal scroll)              │
│  [All] [Tech] [Finance] [Science] [Politics]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  Card 1  │  │  Card 2  │  │  Card 3  │     │
│  │          │  │          │  │          │     │
│  │  Title   │  │  Title   │  │  Title   │     │
│  │  Summary │  │  Summary │  │  Summary │     │
│  │  Sources │  │  Sources │  │  Sources │     │
│  │  [Save]  │  │  [Save]  │  │  [Save]  │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  Card 4  │  │  Card 5  │  │  Card 6  │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│                                                 │
│  [Load More] ou Infinite Scroll                 │
└─────────────────────────────────────────────────┘
```

### 3. **Composants Clés**

#### A. **DiscoverFeed Component**

```typescript
// src/pages/Discover.tsx
import { useState, useEffect, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query'; // ou fetch classique
import DiscoverCard from '../components/discover/DiscoverCard';
import CategoryTabs from '../components/discover/CategoryTabs';
import DiscoverFilters from '../components/discover/DiscoverFilters';

function DiscoverPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filters, setFilters] = useState({
    timeRange: '7d',
    sortBy: 'relevance', // relevance | recent | trending
  });

  // Infinite scroll avec React Query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['discover', selectedCategory, filters],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/discover?category=${selectedCategory}&offset=${pageParam}&limit=12`);
      return response.json();
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length * 12 : undefined;
    },
  });

  // Observer pour infinite scroll
  const observerRef = useCallback((node: HTMLElement | null) => {
    if (node && hasNextPage && !isFetchingNextPage) {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      });
      observer.observe(node);
      return () => observer.disconnect();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = data?.pages.flatMap(page => page.items) || [];

  return (
    <AppShell>
      <SEO title="Discover — Nucigen" />
      
      {/* Header */}
      <div className="col-span-1 sm:col-span-12 mb-8">
        <h1 className="text-3xl font-light text-white mb-2">Discover</h1>
        <p className="text-sm text-slate-500">Explore insights, trends, and analysis</p>
      </div>

      {/* Category Tabs */}
      <div className="col-span-1 sm:col-span-12 mb-6">
        <CategoryTabs
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          categories={['all', 'tech', 'finance', 'geopolitics', 'energy', 'supply-chain']}
        />
      </div>

      {/* Filters */}
      <div className="col-span-1 sm:col-span-12 mb-6">
        <DiscoverFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Grid */}
      <div className="col-span-1 sm:col-span-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <DiscoverCard key={item.id} item={item} />
          ))}
        </div>

        {/* Infinite scroll trigger */}
        {hasNextPage && (
          <div ref={observerRef} className="mt-8 text-center">
            {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin mx-auto" />}
          </div>
        )}
      </div>
    </AppShell>
  );
}
```

#### B. **DiscoverCard Component**

```typescript
// src/components/discover/DiscoverCard.tsx
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Bookmark, ExternalLink, TrendingUp } from 'lucide-react';

interface DiscoverCardProps {
  item: DiscoverItem;
}

export default function DiscoverCard({ item }: DiscoverCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    // API call to save to library
    await fetch(`/api/discover/${item.id}/save`, { method: 'POST' });
    setIsSaved(!isSaved);
  };

  return (
    <Card hover className="p-6 flex flex-col h-full">
      {/* Category Badge */}
      <div className="mb-3">
        <Badge variant="category">{item.category}</Badge>
      </div>

      {/* Title */}
      <h3 className="text-xl font-light text-white mb-3 leading-snug">
        {item.title}
      </h3>

      {/* Summary */}
      <p className="text-sm text-slate-400 font-light mb-4 flex-grow line-clamp-3">
        {item.summary}
      </p>

      {/* Sources */}
      <div className="mb-4 space-y-1">
        {item.sources.slice(0, 2).map((source, idx) => (
          <a
            key={idx}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="truncate">{source.name}</span>
          </a>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-4 text-xs text-slate-600">
          {item.engagement.views > 0 && (
            <span>{item.engagement.views} views</span>
          )}
          {item.engagement.questions > 0 && (
            <span>{item.engagement.questions} questions</span>
          )}
        </div>
        <button
          onClick={handleSave}
          className={`p-2 rounded-lg transition-colors ${
            isSaved
              ? 'bg-[#E1463E]/20 text-[#E1463E]'
              : 'bg-white/5 text-slate-500 hover:text-white'
          }`}
        >
          <Bookmark className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
}
```

#### C. **CategoryTabs Component**

```typescript
// src/components/discover/CategoryTabs.tsx
import { useState } from 'react';

interface CategoryTabsProps {
  selected: string;
  onSelect: (category: string) => void;
  categories: string[];
}

export default function CategoryTabs({ selected, onSelect, categories }: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={`px-4 py-2 rounded-lg text-sm font-light whitespace-nowrap transition-all ${
            selected === category
              ? 'bg-[#E1463E]/20 text-[#E1463E] border border-[#E1463E]/30'
              : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 hover:text-white'
          }`}
        >
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </button>
      ))}
    </div>
  );
}
```

---

## 🔧 Backend API

### Endpoint: `/api/discover`

```typescript
// src/server/api-server.ts
app.get('/api/discover', async (req, res) => {
  try {
    const { category = 'all', offset = 0, limit = 12, sortBy = 'relevance' } = req.query;
    const userId = req.user?.id;

    // 1. Fetch items from multiple sources
    const sources = await Promise.all([
      // Articles from NewsAPI
      fetchNewsArticles(category, { offset, limit }),
      // Topics from Perplexity
      fetchPerplexityTopics(category, { offset, limit }),
      // Trends from internal signals
      fetchTrendingSignals(category, { offset, limit }),
    ]);

    // 2. Merge and normalize
    const items = mergeAndNormalize(sources);

    // 3. Personalization (if user logged in)
    if (userId) {
      const userPreferences = await getUserPreferences(userId);
      items.forEach(item => {
        item.personalization_score = calculatePersonalizationScore(item, userPreferences);
      });
    }

    // 4. Sort
    items.sort((a, b) => {
      if (sortBy === 'relevance') {
        return (b.personalization_score || b.metadata.relevance_score) - 
               (a.personalization_score || a.metadata.relevance_score);
      } else if (sortBy === 'recent') {
        return new Date(b.metadata.published_at).getTime() - 
               new Date(a.metadata.published_at).getTime();
      } else if (sortBy === 'trending') {
        return b.engagement.views - a.engagement.views;
      }
      return 0;
    });

    // 5. Paginate
    const paginatedItems = items.slice(offset, offset + limit);
    const hasMore = items.length > offset + limit;

    res.json({
      success: true,
      items: paginatedItems,
      hasMore,
      total: items.length,
    });
  } catch (error) {
    console.error('[Discover API] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch discover items' });
  }
});
```

### Sources de Données

```typescript
// src/server/services/discover-service.ts

// 1. NewsAPI Articles
async function fetchNewsArticles(category: string, options: PaginationOptions) {
  const response = await fetch(
    `https://newsapi.org/v2/everything?q=${category}&pageSize=${options.limit}&apiKey=${process.env.NEWSAPI_KEY}`
  );
  const data = await response.json();
  return data.articles.map(article => ({
    id: `news-${article.url}`,
    type: 'article',
    title: article.title,
    summary: article.description,
    sources: [{ name: article.source.name, url: article.url, date: article.publishedAt }],
    category,
    tags: extractTags(article.content),
    engagement: { views: 0, saves: 0, questions: 0 },
    metadata: {
      published_at: article.publishedAt,
      updated_at: article.publishedAt,
      relevance_score: calculateRelevance(article),
    },
  }));
}

// 2. Perplexity Topics
async function fetchPerplexityTopics(category: string, options: PaginationOptions) {
  // Utiliser Perplexity API pour générer des topics enrichis
  const response = await perplexityService.generateTopic({
    category,
    timeRange: '7d',
  });
  
  return response.topics.map(topic => ({
    id: `perplexity-${topic.id}`,
    type: 'topic',
    title: topic.title,
    summary: topic.summary,
    sources: topic.sources,
    category,
    tags: topic.tags,
    engagement: topic.engagement,
    metadata: {
      published_at: topic.created_at,
      updated_at: topic.updated_at,
      relevance_score: topic.relevance,
    },
  }));
}

// 3. Internal Signals (from Nucigen)
async function fetchTrendingSignals(category: string, options: PaginationOptions) {
  const signals = await getSignalsFromEvents({
    category,
    dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    limit: options.limit,
    offset: options.offset,
  });

  return signals.map(signal => ({
    id: `signal-${signal.id}`,
    type: 'insight',
    title: signal.title,
    summary: signal.summary || signal.why_it_matters,
    sources: signal.sources || [],
    category,
    tags: signal.scope ? [signal.scope] : [],
    engagement: {
      views: signal.views || 0,
      saves: signal.saves || 0,
      questions: 0,
    },
    metadata: {
      published_at: signal.created_at,
      updated_at: signal.updated_at,
      relevance_score: signal.impact_score || 0,
    },
  }));
}
```

---

## 🎨 Design Patterns Utilisés

### 1. **Infinite Scroll**
- Utilise `IntersectionObserver` pour détecter le scroll
- Charge les données par batch (12 items)
- Évite les re-renders inutiles avec `useMemo` et `useCallback`

### 2. **Personalization**
- Score de personnalisation basé sur :
  - Historique de navigation
  - Catégories préférées
  - Tags sauvegardés
  - Engagement passé

### 3. **Caching**
- Cache côté client (React Query)
- Cache côté serveur (Redis ou Supabase)
- Invalidation intelligente

### 4. **Performance**
- Lazy loading des images
- Code splitting par route
- Virtual scrolling pour grandes listes (react-window)

---

## 🚀 Implémentation dans Nucigen

### Étape 1: Créer la structure de base

```bash
src/
  pages/
    Discover.tsx
  components/
    discover/
      DiscoverCard.tsx
      CategoryTabs.tsx
      DiscoverFilters.tsx
      DiscoverDetailModal.tsx
  server/
    services/
      discover-service.ts
```

### Étape 2: Intégrer avec les données existantes

- **Events** → Articles/Insights
- **Signals** → Trends/Topics
- **Intelligence** → Analysis/Reports
- **Perplexity** → Enriched Topics

### Étape 3: Personnalisation

- Utiliser `user_preferences` de Supabase
- Tracker les interactions (views, saves)
- Ajuster le ranking en temps réel

---

## 📊 Métriques à Tracker

- **Engagement**: Views, Saves, Clicks
- **Performance**: Load time, Scroll depth
- **Personnalisation**: Click-through rate par catégorie
- **Retention**: Return visits, Time on page

---

## 🔗 Ressources

- [Perplexity Discover Documentation](https://www.perplexity.ai/help-center)
- [React Query Infinite Queries](https://tanstack.com/query/latest/docs/react/guides/infinite-queries)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

---

**Note**: Cette architecture est inspirée de Perplexity mais adaptée pour Nucigen avec nos propres sources de données (Events, Signals, Intelligence) et notre système de personnalisation.
