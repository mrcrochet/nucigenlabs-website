/**
 * Advanced Search Page
 * 
 * Features:
 * - Three input modes: search query, paste link, explore deeper
 * - Knowledge graph visualization with D3.js
 * - Buckets: Events, Actors, Assets, Sources
 * - Advanced filters
 * - Result details drawer
 */

import { useState, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import AppShell from '../components/layout/AppShell';
import SEO from '../components/SEO';
import ProtectedRoute from '../components/ProtectedRoute';
import SearchTopBar from '../components/search/SearchTopBar';
import FiltersSidebar from '../components/search/FiltersSidebar';
import ResultsPanel from '../components/search/ResultsPanel';
import KnowledgeGraph from '../components/search/KnowledgeGraph';
import ResultDetailsDrawer from '../components/search/ResultDetailsDrawer';
import SearchStatusBar from '../components/search/SearchStatusBar';
import type { SearchMode, SearchFilters, SearchResult, KnowledgeGraph as KnowledgeGraphType } from '../types/search';

function SearchContent() {
  const { user } = useUser();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('standard');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    results: SearchResult[];
    buckets: any;
    graph: KnowledgeGraphType;
    meta: any;
  } | null>(null);

  // Search function
  const performSearch = useCallback(async (searchQuery: string, searchMode: SearchMode, searchFilters: SearchFilters) => {
    if (!searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery.trim(),
          mode: searchMode,
          filters: searchFilters,
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      if (data.success) {
        setSearchResults({
          results: data.results || [],
          buckets: data.buckets || { events: [], actors: [], assets: [], sources: [] },
          graph: data.graph || { nodes: [], links: [] },
          meta: data.meta || {},
        });
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (error: any) {
      console.error('[Search] Error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search
  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    performSearch(searchQuery, mode, filters);
  }, [mode, filters, performSearch]);

  // Handle link paste
  const handleLinkPaste = useCallback(async (url: string) => {
    setIsSearching(true);
    try {
      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          existingGraph: searchResults?.graph,
        }),
      });

      if (!response.ok) {
        throw new Error('Link processing failed');
      }

      const data = await response.json();
      if (data.success) {
        // Update graph with new data
        if (searchResults) {
          setSearchResults({
            ...searchResults,
            results: [...searchResults.results, data.enrichedData],
            graph: data.updatedGraph,
          });
        } else {
          // First result
          setSearchResults({
            results: [data.enrichedData],
            buckets: { events: [], actors: [], assets: [], sources: [] },
            graph: data.updatedGraph,
            meta: {},
          });
        }
        setSelectedResultId(data.enrichedData.id);
      }
    } catch (error: any) {
      console.error('[Search] Link paste error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchResults]);

  // Handle explore deeper
  const handleExploreDeeper = useCallback(async (resultId: string) => {
    if (!searchResults) return;

    setIsSearching(true);
    try {
      const response = await fetch('/api/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resultId,
          results: searchResults.results,
        }),
      });

      if (!response.ok) {
        throw new Error('Enrichment failed');
      }

      const data = await response.json();
      if (data.success) {
        // Update result and graph
        const updatedResults = searchResults.results.map(r =>
          r.id === resultId ? data.enrichedData : r
        );
        setSearchResults({
          ...searchResults,
          results: updatedResults,
          graph: data.updatedGraph,
        });
        setSelectedResultId(resultId);
      }
    } catch (error: any) {
      console.error('[Search] Explore deeper error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchResults]);

  const selectedResult = searchResults?.results.find(r => r.id === selectedResultId) || null;

  return (
    <AppShell>
      <SEO title="Advanced Search | Nucigen Labs" description="Search events, actors, assets, and sources with knowledge graph visualization" />
      
      {/* Header */}
      <div className="col-span-1 sm:col-span-12 mb-6">
        <h1 className="text-3xl sm:text-4xl font-light text-text-primary mb-6">Search</h1>
        
        {/* Top Bar */}
        <div className="mb-6">
          <SearchTopBar
            query={query}
            mode={mode}
            onQueryChange={setQuery}
            onModeChange={setMode}
            onSearch={handleSearch}
            onLinkPaste={handleLinkPaste}
            onSaveSearch={async () => {
              if (user && query) {
                try {
                  await fetch('/api/save-search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, filters, userId: user.id }),
                  });
                } catch (error) {
                  console.error('Failed to save search:', error);
                }
              }
            }}
          />
        </div>
      </div>

      {/* Sidebar Filters */}
      <div className="col-span-1 sm:col-span-3">
        <FiltersSidebar
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* Results Panel */}
      <div className="col-span-1 sm:col-span-6">
        <ResultsPanel
          results={searchResults?.results || []}
          buckets={searchResults?.buckets || { events: [], actors: [], assets: [], sources: [] }}
          isLoading={isSearching}
          onResultClick={setSelectedResultId}
          onExploreDeeper={handleExploreDeeper}
        />
      </div>

      {/* Knowledge Graph */}
      <div className="col-span-1 sm:col-span-3">
        <div className="sticky top-24">
          <KnowledgeGraph
            graph={searchResults?.graph || { nodes: [], links: [] }}
            onNodeClick={setSelectedResultId}
          />
        </div>
      </div>

      {/* Result Details Drawer */}
      {selectedResult && (
        <ResultDetailsDrawer
          result={selectedResult}
          isOpen={!!selectedResult}
          onClose={() => setSelectedResultId(null)}
          onExploreDeeper={() => handleExploreDeeper(selectedResult.id)}
        />
      )}

      {/* Status Bar */}
      <SearchStatusBar
        status={isSearching ? 'loading' : searchResults ? 'success' : 'idle'}
        meta={searchResults?.meta}
      />
    </AppShell>
  );
}

export default function Search() {
  return (
    <ProtectedRoute>
      <SearchContent />
    </ProtectedRoute>
  );
}
