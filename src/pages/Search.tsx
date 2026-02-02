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
import { useSearchParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';
import AppShell from '../components/layout/AppShell';
import SEO from '../components/SEO';
import ProtectedRoute from '../components/ProtectedRoute';
import UnifiedSearchBar from '../components/search/UnifiedSearchBar';
import FiltersDrawer from '../components/search/FiltersDrawer';
import ResultsPanel from '../components/search/ResultsPanel';
import KnowledgeGraph from '../components/search/KnowledgeGraph';
import ResultDetailsDrawer from '../components/search/ResultDetailsDrawer';
import SearchStatusBar from '../components/search/SearchStatusBar';
import InsightPanel from '../components/search/InsightPanel';
import type { SearchMode, SearchFilters, SearchResult, KnowledgeGraph as KnowledgeGraphType } from '../types/search';

function SearchContent() {
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  const focusNodeId = searchParams.get('focus') || searchParams.get('highlight') || null;
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('standard');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [impactBriefOpen, setImpactBriefOpen] = useState(false);
  const [impactBriefText, setImpactBriefText] = useState('');
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
        setSearchError(null);
        // Auto-show results if more than 10
        if ((data.results?.length || 0) > 10) {
          setShowResults(true);
        }
        toast.success('Search completed', {
          description: `Found ${data.results?.length || 0} results`,
          duration: 2000,
        });
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (error: any) {
      console.error('[Search] Error:', error);
      const errorMessage = error.message || 'Search failed. Please try again.';
      setSearchError(errorMessage);
      toast.error('Search failed', {
        description: errorMessage,
        duration: 5000,
      });
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
    setSearchError(null);
    
    // Show loading toast
    const loadingToast = toast.loading('Processing URL...', {
      description: 'Extracting content and building knowledge graph',
    });

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

      // Check if response has content before parsing JSON
      let data: any = null;
      
      try {
        const text = await response.text();
        if (text && text.trim()) {
          data = JSON.parse(text);
        } else {
          throw new Error('Empty response from server');
        }
      } catch (parseError: any) {
        // If JSON parsing fails, create error response
        const errorMessage = parseError.message?.includes('JSON') 
          ? 'Invalid response from server. The API may be experiencing issues.'
          : parseError.message || 'Failed to parse server response';
        
        toast.dismiss(loadingToast);
        setSearchError(errorMessage);
        
        toast.error('Failed to process URL', {
          description: errorMessage,
          duration: 5000,
          action: {
            label: 'Retry',
            onClick: () => handleLinkPaste(url),
          },
        });
        
        return;
      }

      if (!response.ok) {
        // Handle error response
        const errorMessage = data?.message || data?.error || `Server error: ${response.status} ${response.statusText}`;
        setSearchError(errorMessage);
        
        toast.dismiss(loadingToast);
        
        // Show error toast
        if (data?.partialData) {
          // Partial success - show warning
          toast.warning('Partial content extracted', {
            description: errorMessage,
            duration: 5000,
          });
          
          // Still add partial data if available
          if (data.partialData.result) {
            if (searchResults) {
              setSearchResults({
                ...searchResults,
                results: [...searchResults.results, data.partialData.result],
                graph: data.partialData.graph || searchResults.graph,
              });
            } else {
              setSearchResults({
                results: [data.partialData.result],
                buckets: { events: [], actors: [], assets: [], sources: [] },
                graph: data.partialData.graph || { nodes: [], links: [] },
                meta: {},
              });
            }
            setSelectedResultId(data.partialData.result.id);
          }
        } else {
          // Complete failure
          toast.error('Failed to process URL', {
            description: errorMessage,
            duration: 5000,
            action: {
              label: 'Retry',
              onClick: () => handleLinkPaste(url),
            },
          });
        }
        
        return;
      }

      if (data?.success) {
        toast.dismiss(loadingToast);
        
        // Show success toast with fallback info if applicable
        if (data.fallbackUsed) {
          toast.success('URL processed (using fallback)', {
            description: data.message || 'Content extracted using alternative method',
            duration: 4000,
          });
        } else {
          toast.success('URL processed successfully', {
            description: 'Content extracted and knowledge graph updated',
            duration: 3000,
          });
        }

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
        setSearchError(null);
      } else {
        // Response OK but success: false
        const errorMessage = data?.error || data?.message || 'Unknown error occurred';
        toast.dismiss(loadingToast);
        setSearchError(errorMessage);
        
        toast.error('Failed to process URL', {
          description: errorMessage,
          duration: 5000,
          action: {
            label: 'Retry',
            onClick: () => handleLinkPaste(url),
          },
        });
      }
    } catch (error: any) {
      console.error('[Search] Link paste error:', error);
      
      toast.dismiss(loadingToast);
      
      // Better error message handling
      let errorMessage = 'Network error. Please check your connection and try again.';
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errorMessage = 'Cannot connect to API server. Please make sure the API server is running on port 3001.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSearchError(errorMessage);
      
      toast.error('Failed to process URL', {
        description: errorMessage,
        duration: 5000,
        action: {
          label: 'Retry',
          onClick: () => handleLinkPaste(url),
        },
      });
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

  // Handle node explore (click on graph node = contextual search)
  const handleNodeExplore = useCallback((_nodeId: string, nodeLabel: string) => {
    // Build contextual query: original query + clicked node
    const contextualQuery = query.trim() 
      ? `${query} ${nodeLabel}`
      : nodeLabel;
    
    setQuery(contextualQuery);
    performSearch(contextualQuery, mode, filters);
  }, [query, mode, filters, performSearch]);

  return (
    <AppShell>
      <SEO title="Advanced Search | Nucigen Labs" description="Search events, actors, assets, and sources with knowledge graph visualization" />
      
      {/* Header with Search Bar */}
      <div className="col-span-1 sm:col-span-12 mb-6">
        <h1 className="text-3xl sm:text-4xl font-light text-text-primary mb-6">Search</h1>
        
        {/* Top Bar */}
        <div className="mb-6">
          <UnifiedSearchBar
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
                  toast.success('Search saved');
                } catch (error) {
                  console.error('Failed to save search:', error);
                  toast.error('Failed to save search');
                }
              }
            }}
            onOpenFilters={() => setShowFilters(true)}
            isLoading={isSearching}
          />
        </div>
      </div>

      {/* Main Content: Insight Panel (Left) + Graph (Right) */}
      <div className="col-span-1 sm:col-span-5">
        <InsightPanel
          results={searchResults?.results || []}
          graph={searchResults?.graph || { nodes: [], links: [] }}
          buckets={searchResults?.buckets || { events: [], actors: [], assets: [], sources: [] }}
          onViewResults={() => setShowResults(!showResults)}
          onGenerateImpactBrief={() => {
            const results = searchResults?.results || [];
            const buckets = searchResults?.buckets || { events: [], actors: [], assets: [], sources: [] };
            const graph = searchResults?.graph || { nodes: [], links: [] };
            const lines: string[] = [];
            if (results.length > 0) {
              const top = results[0];
              lines.push('Summary: ' + (top.summary?.slice(0, 200) || top.title || '') + (top.summary && top.summary.length > 200 ? '...' : ''));
              lines.push('');
              lines.push('Key events:');
              results.slice(0, 5).forEach((r, i) => lines.push(`  ${i + 1}. ${r.title || r.summary?.slice(0, 80) || '—'}`));
            }
            const actors = buckets.actors?.length ? buckets.actors : graph.nodes?.filter((n: any) => ['person', 'company', 'organization', 'country'].includes(n.type))?.slice(0, 8).map((n: any) => n.label) || [];
            if (actors.length > 0) {
              lines.push('');
              lines.push('Actors: ' + actors.join(', '));
            }
            const events = buckets.events?.slice(0, 5).map((e: any) => e.title || e.name || e.id) || [];
            if (events.length > 0) {
              lines.push('');
              lines.push('Events: ' + events.join('; '));
            }
            setImpactBriefText(lines.length ? lines.join('\n') : 'No results to summarize. Run a search first.');
            setImpactBriefOpen(true);
          }}
        />
      </div>

      {/* Knowledge Graph - Central and Large */}
      <div className="col-span-1 sm:col-span-7">
        <div className="sticky top-24">
          <KnowledgeGraph
            graph={searchResults?.graph || { nodes: [], links: [] }}
            query={query || undefined}
            onNodeClick={setSelectedResultId}
            onNodeExplore={handleNodeExplore}
            height={600}
            focusNodeId={focusNodeId}
          />
        </div>
      </div>

      {/* Results Panel - Conditional, shown below or in drawer */}
      {showResults && (
        <div className="col-span-1 sm:col-span-12 mt-6">
          <ResultsPanel
            results={searchResults?.results || []}
            buckets={searchResults?.buckets || { events: [], actors: [], assets: [], sources: [] }}
            isLoading={isSearching}
            onResultClick={setSelectedResultId}
            onExploreDeeper={handleExploreDeeper}
          />
        </div>
      )}

      {/* Filters Drawer */}
      <FiltersDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={(newFilters) => {
          setFilters(newFilters);
          // Optionally trigger search with new filters if query exists
          if (query.trim()) {
            performSearch(query, mode, newFilters);
          }
        }}
      />

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
        status={isSearching ? 'loading' : searchError ? 'error' : searchResults ? 'success' : 'idle'}
        meta={searchResults?.meta}
        error={searchError}
      />

      {/* Impact Brief Modal */}
      {impactBriefOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setImpactBriefOpen(false)} aria-hidden />
          <div className="relative bg-background-base border border-borders-subtle rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-auto shadow-xl">
            <h3 className="text-lg font-semibold text-text-primary mb-3">Impact Brief</h3>
            <pre className="text-sm text-text-secondary whitespace-pre-wrap font-sans">{impactBriefText}</pre>
            <button
              type="button"
              onClick={() => setImpactBriefOpen(false)}
              className="mt-4 px-4 py-2 bg-borders-subtle hover:bg-borders-medium rounded-lg text-sm text-text-primary"
            >
              Close
            </button>
          </div>
        </div>
      )}
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
