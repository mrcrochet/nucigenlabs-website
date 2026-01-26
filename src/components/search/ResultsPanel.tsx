/**
 * Results Panel
 * 
 * Displays search results with buckets (Events, Actors, Assets, Sources)
 */

import { useState, useMemo } from 'react';
import { Loader2, GitCompare } from 'lucide-react';
import BucketsTabs from './BucketsTabs';
import ResultCard from './ResultCard';
import QuickFilters, { SortOption, DateFilter } from './QuickFilters';
import SearchWithinResults from './SearchWithinResults';
import EntityFilters from './EntityFilters';
import ExportMenu from './ExportMenu';
import SourceComparison from './SourceComparison';
import TrendingAlerts from './TrendingAlerts';
import type { SearchResult, SearchBuckets, Entity, KnowledgeGraph } from '../../types/search';

interface ResultsPanelProps {
  results: SearchResult[];
  buckets: SearchBuckets;
  isLoading: boolean;
  onResultClick: (resultId: string) => void;
  onExploreDeeper: (resultId: string) => void;
  graph?: KnowledgeGraph;
  query?: string;
  sessionId?: string;
}

export default function ResultsPanel({
  results,
  buckets,
  isLoading,
  onResultClick,
  onExploreDeeper,
  graph,
  query = 'Search Results',
  sessionId,
}: ResultsPanelProps) {
  const [activeBucket, setActiveBucket] = useState<'events' | 'actors' | 'assets' | 'sources'>('events');
  const [sortOption, setSortOption] = useState<SortOption>('relevance');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sourceFilters, setSourceFilters] = useState<string[]>([]);
  const [searchWithinQuery, setSearchWithinQuery] = useState<string>('');
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Extract unique sources from results
  const availableSources = useMemo(() => {
    const sources = new Set<string>();
    results.forEach(result => {
      if (result.source) {
        sources.add(result.source);
      }
    });
    return Array.from(sources).sort();
  }, [results]);

  // Extract all entities from results
  const allEntities = useMemo(() => {
    const entityMap = new Map<string, Entity>();
    results.forEach(result => {
      result.entities.forEach(entity => {
        if (!entityMap.has(entity.id)) {
          entityMap.set(entity.id, entity);
        }
      });
    });
    return Array.from(entityMap.values());
  }, [results]);

  const getActiveResults = () => {
    // For now, show all results by default (Perplexity style)
    // Buckets can be used for filtering later
    if (activeBucket === 'events' && buckets.events.length > 0) {
      return buckets.events;
    }
    // Fallback to all results if bucket is empty
    return results;
  };

  // Apply search within results filter
  const searchFilteredResults = useMemo(() => {
    if (!searchWithinQuery.trim()) {
      return getActiveResults();
    }

    const query = searchWithinQuery.toLowerCase().trim();
    const activeResults = getActiveResults();
    
    return activeResults.filter((result) => {
      // Search in title
      if (result.title.toLowerCase().includes(query)) return true;
      // Search in summary
      if (result.summary.toLowerCase().includes(query)) return true;
      // Search in source
      if (result.source.toLowerCase().includes(query)) return true;
      // Search in tags
      if (result.tags.some(tag => tag.toLowerCase().includes(query))) return true;
      // Search in entities
      if (result.entities.some(entity => entity.name.toLowerCase().includes(query))) return true;
      // Search in content if available
      if (result.content?.toLowerCase().includes(query)) return true;
      return false;
    });
  }, [results, buckets, activeBucket, searchWithinQuery]);

  // Apply filters and sorting
  const filteredAndSortedResults = useMemo(() => {
    let filtered = searchFilteredResults;

    // Apply source filter
    if (sourceFilters.length > 0) {
      filtered = filtered.filter(result => sourceFilters.includes(result.source));
    }

    // Apply entity filter
    if (selectedEntities.length > 0) {
      filtered = filtered.filter(result => {
        return result.entities.some(entity => selectedEntities.includes(entity.id));
      });
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      switch (dateFilter) {
        case '24h':
          filterDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          filterDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          filterDate.setDate(now.getDate() - 30);
          break;
      }
      filtered = filtered.filter(result => {
        const resultDate = new Date(result.publishedAt);
        return resultDate >= filterDate;
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'relevance':
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);
        case 'date-desc':
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case 'date-asc':
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        case 'source':
          return a.source.localeCompare(b.source);
        default:
          return 0;
      }
    });

    return sorted;
  }, [searchFilteredResults, sourceFilters, dateFilter, sortOption, selectedEntities]);

  const handleClearAll = () => {
    setSourceFilters([]);
    setDateFilter('all');
    setSortOption('relevance');
    setSelectedEntities([]);
    setSearchWithinQuery('');
  };

  const handleEntityToggle = (entityId: string) => {
    setSelectedEntities(prev => {
      if (prev.includes(entityId)) {
        return prev.filter(id => id !== entityId);
      } else {
        return [...prev, entityId];
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#E1463E] animate-spin" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <p className="text-text-secondary">No results match this query. System monitoring 47 sources.</p>
        </div>
      </div>
    );
  }

  const activeResults = getActiveResults();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          {filteredAndSortedResults.length} {filteredAndSortedResults.length === 1 ? 'result' : 'results'}
          {filteredAndSortedResults.length !== results.length && (
            <span className="text-sm font-normal text-text-tertiary ml-2">
              (of {results.length} total)
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {filteredAndSortedResults.length >= 2 && (
            <button
              onClick={() => setShowComparison(true)}
              className="flex items-center gap-2 px-4 py-2 bg-background-glass-subtle hover:bg-background-glass-medium border border-borders-subtle rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              title="Compare sources"
            >
              <GitCompare className="w-4 h-4" />
              Compare Sources
            </button>
          )}
          <ExportMenu
            results={filteredAndSortedResults}
            graph={graph}
            buckets={buckets}
            query={query}
            sessionId={sessionId}
          />
        </div>
      </div>

      {/* Trending Alerts */}
      {results.length >= 3 && (
        <TrendingAlerts
          results={results}
          threshold={0.6}
          onTrendDetected={(alert) => {
            // Optional: Show toast notification
            // toast.info(alert.title, { description: alert.description });
          }}
        />
      )}

      {/* Search Within Results */}
      <SearchWithinResults
        results={getActiveResults()}
        onSearchQueryChange={setSearchWithinQuery}
        currentQuery={searchWithinQuery}
        placeholder="Search within results (title, summary, source, tags...)"
      />

      {/* Quick Filters */}
      <QuickFilters
        onSortChange={setSortOption}
        onDateFilterChange={setDateFilter}
        onSourceFilterChange={setSourceFilters}
        availableSources={availableSources}
        activeSources={sourceFilters}
        activeSort={sortOption}
        activeDateFilter={dateFilter}
        onClearAll={handleClearAll}
      />

      {/* Entity Filters */}
      {allEntities.length > 0 && (
        <EntityFilters
          entities={allEntities}
          selectedEntities={selectedEntities}
          onEntityToggle={handleEntityToggle}
          onClearAll={() => setSelectedEntities([])}
        />
      )}

      {/* Buckets Tabs */}
      <BucketsTabs
        activeBucket={activeBucket}
        onBucketChange={setActiveBucket}
        counts={{
          events: buckets.events.length,
          actors: buckets.actors.length,
          assets: buckets.assets.length,
          sources: buckets.sources.length,
        }}
      />

      {/* Results List - Perplexity Style */}
      <div className="space-y-4">
        {filteredAndSortedResults.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary mb-2">No results match your filters.</p>
            <button
              onClick={handleClearAll}
              className="text-xs text-primary hover:text-primary-hover transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          filteredAndSortedResults.map((result) => (
            <ResultCard
              key={result.id}
              result={result}
              onClick={() => onResultClick(result.id)}
              onExploreDeeper={() => onExploreDeeper(result.id)}
            />
          ))
        )}
      </div>

      {/* Source Comparison Modal */}
      {showComparison && (
        <SourceComparison
          results={filteredAndSortedResults}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}
