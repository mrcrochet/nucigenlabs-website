/**
 * Discover Page
 * 
 * Aggregated content feed from multiple sources:
 * - NewsAPI articles
 * - Perplexity topics
 * - Internal signals and events
 * 
 * Features:
 * - Infinite scroll
 * - Category filtering
 * - Personalization
 * - Save to library
 */

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';
import AppShell from '../components/layout/AppShell';
import SEO from '../components/SEO';
import ProtectedRoute from '../components/ProtectedRoute';
import DiscoverCard, { type DiscoverItem } from '../components/discover/DiscoverCard';
import DiscoverListCard from '../components/discover/DiscoverListCard';
import DiscoverFilters from '../components/discover/DiscoverFilters';
import DiscoverSidebar from '../components/discover/DiscoverSidebar';
import DiscoverDetailModal from '../components/discover/DiscoverDetailModal';
import PersonalizationModal from '../components/discover/PersonalizationModal';
import EmptyState from '../components/discover/EmptyState';
import ViewModeToggle, { type ViewMode } from '../components/discover/ViewModeToggle';
import AdvancedFilters, { type AdvancedFilters as AdvancedFiltersType } from '../components/discover/AdvancedFilters';
import { DiscoverErrorBoundary } from '../components/discover/DiscoverErrorBoundary';
import SkeletonCard from '../components/ui/SkeletonCard';
import { Loader2, Filter } from 'lucide-react';
import { getOrCreateSupabaseUserId, updateUserPreferences } from '../lib/supabase';
import { trackPageView, trackItemView, trackItemSave, trackItemShare, trackFilterChange, trackViewModeChange, trackAdvancedFilterApply, trackSectorFilter, trackRegionFilter, trackEntityFilter, trackPredictionView, trackVirtualScrollEnabled } from '../lib/analytics';

// Wrapper component for DiscoverDetailModal to handle async userId
function DiscoverDetailModalWrapper({
  item,
  isOpen,
  onClose,
  onSave,
  allItems,
  onItemClick,
  user,
}: {
  item: DiscoverItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemId: string) => Promise<void>;
  allItems: DiscoverItem[];
  onItemClick: (item: DiscoverItem) => Promise<void>;
  user: any;
}) {
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (user) {
      getOrCreateSupabaseUserId(user.id).then(setUserId);
    }
  }, [user]);

  return (
    <DiscoverDetailModal
      item={item}
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      allItems={allItems}
      onItemClick={onItemClick}
      userId={userId}
    />
  );
}

function DiscoverContent() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    timeRange: 'all' as 'now' | '24h' | '7d' | '30d' | 'structural' | 'all',
    sortBy: 'relevance' as 'relevance' | 'recent' | 'trending',
    category: 'all' as string,
  });
  const [selectedItem, setSelectedItem] = useState<DiscoverItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPersonalizationModalOpen, setIsPersonalizationModalOpen] = useState(false);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(-1);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('discover-view-mode');
    return (saved as ViewMode) || 'grid';
  });
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersType>({});
  const [useVirtualScrolling, setUseVirtualScrolling] = useState(() => {
    // Enable virtual scrolling for large lists (100+ items)
    return localStorage.getItem('discover-virtual-scroll') === 'true';
  });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });
  const observerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const itemsPerPage = 12;

  // Persist view mode preference
  useEffect(() => {
    localStorage.setItem('discover-view-mode', viewMode);
  }, [viewMode]);

  // Track page view
  useEffect(() => {
    trackPageView('discover', {
      view_mode: viewMode,
    });
  }, []); // Only on mount

  // Track view mode change
  useEffect(() => {
    if (viewMode) {
      trackViewModeChange(viewMode);
    }
  }, [viewMode]);

  // Track filter changes
  useEffect(() => {
    trackFilterChange('timeRange', filters.timeRange);
  }, [filters.timeRange]);

  useEffect(() => {
    trackFilterChange('sortBy', filters.sortBy);
  }, [filters.sortBy]);

  useEffect(() => {
    if (filters.category && filters.category !== 'all') {
      trackFilterChange('category', filters.category);
    }
  }, [filters.category]);

  // Show personalization modal on first visit
  useEffect(() => {
    const hasSeenPersonalization = localStorage.getItem('hasSeenPersonalization');
    if (!hasSeenPersonalization) {
      setIsPersonalizationModalOpen(true);
    }
  }, []);

  // Keyboard shortcuts
  useHotkeys('esc', () => {
    if (isModalOpen) {
      setIsModalOpen(false);
      setSelectedItem(null);
    }
  });

  // Keyboard shortcuts will be defined after items is available

  // Category from filters (users filter the curated feed)
  const category = useMemo(() => filters.category || 'all', [filters.category]);

  // Serialize advanced filters to query params
  const advancedFiltersParams = useMemo(() => {
    const params = new URLSearchParams();
    if (advancedFilters.tags?.length) {
      params.set('tags', advancedFilters.tags.join(','));
    }
    if (advancedFilters.consensus?.length) {
      params.set('consensus', advancedFilters.consensus.join(','));
    }
    if (advancedFilters.tier?.length) {
      params.set('tier', advancedFilters.tier.join(','));
    }
    if (advancedFilters.sectors?.length) {
      params.set('sectors', advancedFilters.sectors.join(','));
    }
    if (advancedFilters.regions?.length) {
      params.set('regions', advancedFilters.regions.join(','));
    }
    if (advancedFilters.entities?.length) {
      params.set('entities', advancedFilters.entities.join(','));
    }
    if (advancedFilters.minSources !== undefined) {
      params.set('minSources', String(advancedFilters.minSources));
    }
    if (advancedFilters.maxSources !== undefined) {
      params.set('maxSources', String(advancedFilters.maxSources));
    }
    if (advancedFilters.minScore !== undefined) {
      params.set('minScore', String(advancedFilters.minScore));
    }
    if (advancedFilters.maxScore !== undefined) {
      params.set('maxScore', String(advancedFilters.maxScore));
    }
    const str = params.toString();
    return str ? `&${str}` : '';
  }, [advancedFilters]);

  // Fetch discover items function for React Query
  const fetchDiscoverItems = useCallback(async ({ pageParam = 0 }: { pageParam?: number }) => {
    const userId = user ? await getOrCreateSupabaseUserId(user.id) : undefined;
    const offset = pageParam * itemsPerPage;

    const apiUrl = `/api/discover?category=${category}&offset=${offset}&limit=${itemsPerPage}&sortBy=${filters.sortBy}&timeRange=${filters.timeRange}${userId ? `&userId=${userId}` : ''}${advancedFiltersParams}`;
    
    console.log('[Discover] Fetching from:', apiUrl);
    
    let response: Response;
    try {
      response = await fetch(apiUrl);
    } catch (fetchError: any) {
      console.error('[Discover] Fetch error:', fetchError);
      // Network error - API server might not be running
      if (fetchError.message?.includes('Failed to fetch') || fetchError.message?.includes('NetworkError')) {
        throw new Error('Cannot connect to API server. Please make sure the API server is running on port 3001. Run: npm run api:server');
      }
      throw new Error(`Network error: ${fetchError.message || 'Unknown error'}`);
    }

    if (!response.ok) {
      // Read body once and store it
      const contentType = response.headers.get('content-type');
      let errorMessage = `Failed to fetch discover items: ${response.status} ${response.statusText}`;
      
      try {
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error('[Discover] API error response:', errorData);
        } else {
          const text = await response.text();
          console.error('[Discover] API error (non-JSON):', text.substring(0, 200));
        }
      } catch (e) {
        console.error('[Discover] Could not read error response body:', e);
      }
      
      // Provide helpful error message
      if (response.status === 500) {
        errorMessage = errorMessage || 'Internal server error. Check API server logs.';
      } else if (response.status === 503) {
        errorMessage = errorMessage || 'Service unavailable. API server might be starting up.';
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch discover items');
    }

    return {
      items: data.items || [],
      hasMore: data.hasMore !== false,
      nextPage: data.hasMore ? pageParam + 1 : undefined,
    };
  }, [category, filters.sortBy, filters.timeRange, advancedFiltersParams, user, itemsPerPage]);

  // React Query infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['discover', category, filters.sortBy, filters.timeRange, advancedFilters, user?.id],
    queryFn: fetchDiscoverItems,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
  const isRefreshing = isFetching;

  // Flatten pages into single array
  const items = useMemo(() => {
    return data?.pages.flatMap(page => page.items) || [];
  }, [data]);

  // Auto-enable virtual scrolling for large lists
  useEffect(() => {
    if (items.length > 100 && !useVirtualScrolling) {
      setUseVirtualScrolling(true);
      localStorage.setItem('discover-virtual-scroll', 'true');
    }
  }, [items.length, useVirtualScrolling]);

  // Update container size on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width,
          height: window.innerHeight - rect.top - 100,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Keyboard shortcuts (after items is defined)
  useHotkeys('j', () => {
    if (isModalOpen) return;
    setSelectedItemIndex(prev => {
      const next = Math.min(prev + 1, items.length - 1);
      if (next >= 0 && next < items.length) {
        const element = document.querySelector(`[data-item-index="${next}"]`) as HTMLElement;
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return next;
    });
  }, { enabled: !isModalOpen && items.length > 0 });

  useHotkeys('k', () => {
    if (isModalOpen) return;
    setSelectedItemIndex(prev => {
      const next = Math.max(prev - 1, 0);
      if (next >= 0 && next < items.length) {
        const element = document.querySelector(`[data-item-index="${next}"]`) as HTMLElement;
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return next;
    });
  }, { enabled: !isModalOpen && items.length > 0 });

  // Infinite scroll observer
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

  // Save mutation with optimistic updates
  const saveMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const userId = user ? await getOrCreateSupabaseUserId(user.id) : undefined;
      if (!userId) {
        throw new Error('User ID required');
      }

      const response = await fetch(`/api/discover/${itemId}/save?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to save item');
      }

      return response.json();
    },
    onMutate: async (itemId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['discover'] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(['discover']);

      // Optimistically update
      queryClient.setQueryData(['discover'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.map((item: DiscoverItem) =>
              item.id === itemId
                ? { ...item, engagement: { ...item.engagement, saves: item.engagement.saves + 1 } }
                : item
            ),
          })),
        };
      });

      return { previousData };
    },
    onSuccess: (_, itemId) => {
      trackItemSave(itemId);
      toast.success('Item saved to your library', {
        description: 'You can find it in your saved items',
      });
    },
    onError: (err, itemId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['discover'], context.previousData);
      }
      console.error('[Discover] Error saving item:', err);
      toast.error('Failed to save item', {
        description: err instanceof Error ? err.message : 'Please try again',
        action: {
          label: 'Retry',
          onClick: () => handleSave(itemId),
        },
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['discover'] });
    },
  });

  const handleSave = useCallback(async (itemId: string) => {
    await saveMutation.mutateAsync(itemId);
  }, [saveMutation]);

  // Keyboard shortcut for save (after handleSave is defined)
  useHotkeys('s', () => {
    if (isModalOpen || selectedItemIndex < 0 || selectedItemIndex >= items.length) return;
    const item = items[selectedItemIndex];
    if (item) {
      handleSave(item.id);
    }
  }, { enabled: !isModalOpen && selectedItemIndex >= 0 && selectedItemIndex < items.length });

  // Handle view item with optimistic update and tracking
  const handleView = useCallback(async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setSelectedItem(item);
      setIsModalOpen(true);
      
      // Optimistically update engagement count
      queryClient.setQueryData(['discover'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.map((i: DiscoverItem) =>
              i.id === itemId
                ? { ...i, engagement: { ...i.engagement, views: i.engagement.views + 1 } }
                : i
            ),
          })),
        };
      });

      // Track engagement and analytics
      if (user) {
        try {
          const userId = await getOrCreateSupabaseUserId(user.id);
          await fetch(`/api/discover/${itemId}/engage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, type: 'view' }),
          });
          trackItemView(itemId, { user_id: userId });
        } catch (err) {
          console.warn('[Discover] Failed to track view:', err);
        }
      } else {
        trackItemView(itemId);
      }
    }
  }, [items, queryClient, user]);

  if (isLoading) {
    return (
      <AppShell>
        <SEO title="Discover — Nucigen" description="Explore insights, trends, and analysis" />
        <div className="col-span-1 sm:col-span-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ gap: '1.75rem' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} tier={i === 1 ? 'critical' : i <= 3 ? 'strategic' : 'background'} />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (isError && items.length === 0) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load discover items';
    return (
      <AppShell>
        <SEO title="Discover — Nucigen" description="Explore insights, trends, and analysis" />
        <div className="col-span-1 sm:col-span-12 flex items-center justify-center min-h-[400px]">
          <div className="max-w-2xl w-full text-center">
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{errorMessage}</p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-light"
            >
              Try Again
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SEO title="Discover — Nucigen" description="Explore insights, trends, and analysis" />

      {/* Header */}
      <div className="col-span-1 sm:col-span-12 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-light text-white mb-1">Discover</h1>
          <p className="text-slate-400 text-sm font-light">
            Actualités entreprises, marchés, géopolitique — filtrez par catégorie et par période.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-light shrink-0 self-start sm:self-center disabled:opacity-50"
          aria-label="Actualiser le fil"
        >
          <Loader2 className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Filters + View Mode Toggle */}
      <div className="col-span-1 sm:col-span-12 mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <DiscoverFilters 
            filters={filters} 
            onFiltersChange={(newFilters) => setFilters({
              ...filters,
              ...newFilters,
              category: newFilters.category ?? filters.category,
            })}
            showCategory={true}
          />
          <button
            onClick={() => setIsAdvancedFiltersOpen(true)}
            className={`px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-light hover:bg-white/10 transition-colors flex items-center gap-2 ${
              Object.keys(advancedFilters).length > 0 ? 'border-[#E1463E]/50 bg-[#E1463E]/10' : ''
            }`}
          >
            <Filter className="w-4 h-4" />
            Advanced
            {Object.keys(advancedFilters).length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-[#E1463E]/20 text-[#E1463E] text-xs rounded">
                {Object.keys(advancedFilters).length}
              </span>
            )}
          </button>
        </div>
        <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {/* Main Content + Sidebar */}
      <div className="col-span-1 sm:col-span-12">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Content */}
            {items.length === 0 ? (
              <EmptyState
                searchQuery=""
                filters={filters}
                onResetFilters={() => {
                  setFilters({
                    timeRange: 'all',
                    sortBy: 'relevance',
                    category: 'all',
                  });
                }}
                onClearSearch={() => {}}
                onRetry={() => refetch()}
              />
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr" style={{ gap: '1.75rem' }}>
                    {items.map((item, index) => {
                      // Determine if this is a critical tier item (full width)
                      const isCritical = item.tier === 'critical' || 
                        (item.metadata.relevance_score >= 90 && item.sources.length >= 30);
                      
                      return (
                        <div
                          key={item.id}
                          data-item-index={index}
                          className={`${isCritical ? 'md:col-span-2 lg:col-span-3' : ''} ${selectedItemIndex === index ? 'ring-2 ring-[#E1463E]/50 rounded-lg' : ''}`}
                        >
                        <DiscoverCard
                          item={item}
                          onSave={handleSave}
                          onView={handleView}
                          onShare={async (itemId, platform) => {
                            if (user) {
                              try {
                                const userId = await getOrCreateSupabaseUserId(user.id);
                                await fetch(`/api/discover/${itemId}/engage`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ 
                                    userId, 
                                    type: 'share',
                                    metadata: { share_platform: platform }
                                  }),
                                });
                              } catch (err) {
                                console.warn('[Discover] Failed to track share:', err);
                              }
                            }
                          }}
                        />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        data-item-index={index}
                        className={selectedItemIndex === index ? 'ring-2 ring-[#E1463E]/50 rounded-lg' : ''}
                      >
                        <DiscoverListCard
                          item={item}
                          onSave={handleSave}
                          onView={handleView}
                          onShare={async (itemId, platform) => {
                            if (user) {
                              try {
                                const userId = await getOrCreateSupabaseUserId(user.id);
                                await fetch(`/api/discover/${itemId}/engage`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ 
                                    userId, 
                                    type: 'share',
                                    metadata: { share_platform: platform }
                                  }),
                                });
                              } catch (err) {
                                console.warn('[Discover] Failed to track share:', err);
                              }
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Infinite scroll trigger */}
                {hasNextPage && (
                  <div ref={observerRef} className="mt-8 text-center py-4">
                    {isFetchingNextPage && (
                      <div className="flex items-center justify-center gap-2 text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-light">Loading more...</span>
                      </div>
                    )}
                  </div>
                )}

                {!hasNextPage && items.length > 0 && (
                  <div className="mt-8 text-center py-4">
                    <p className="text-sm text-slate-500 font-light">
                      You've reached the end of the feed
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="hidden xl:block flex-shrink-0">
            <DiscoverSidebar />
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Suspense fallback={null}>
        {selectedItem && (
          <DiscoverDetailModalWrapper
            item={selectedItem}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedItem(null);
            }}
            onSave={handleSave}
            allItems={items}
            onItemClick={async (item) => {
              setSelectedItem(item);
              await handleView(item.id);
            }}
            user={user}
          />
        )}
      </Suspense>

      {/* Personalization Modal */}
      <Suspense fallback={null}>
        <PersonalizationModal
          isOpen={isPersonalizationModalOpen}
          onClose={() => {
            setIsPersonalizationModalOpen(false);
            localStorage.setItem('hasSeenPersonalization', 'true');
          }}
          onSave={async (interests) => {
            localStorage.setItem('hasSeenPersonalization', 'true');
            if (user?.id) {
              try {
                await updateUserPreferences({ focus_areas: interests }, user.id);
              } catch (err) {
                console.warn('[Discover] Failed to save personalization:', err);
              }
            }
          }}
        />
      </Suspense>

      {/* Advanced Filters Modal */}
      <AdvancedFilters
        isOpen={isAdvancedFiltersOpen}
        onClose={() => setIsAdvancedFiltersOpen(false)}
        filters={advancedFilters}
        onFiltersChange={(newFilters) => {
          setAdvancedFilters(newFilters);
          // Track filter changes
          if (newFilters.sectors && newFilters.sectors.length > 0) {
            trackSectorFilter(newFilters.sectors);
          }
          if (newFilters.regions && newFilters.regions.length > 0) {
            trackRegionFilter(newFilters.regions);
          }
          if (newFilters.entities && newFilters.entities.length > 0) {
            trackEntityFilter(newFilters.entities);
          }
          if (newFilters.tags && newFilters.tags.length > 0) {
            trackAdvancedFilterApply('tag', newFilters.tags);
          }
          if (newFilters.consensus && newFilters.consensus.length > 0) {
            trackAdvancedFilterApply('consensus', newFilters.consensus);
          }
          if (newFilters.tier && newFilters.tier.length > 0) {
            trackAdvancedFilterApply('tier', newFilters.tier);
          }
        }}
        availableTags={Array.from(new Set(items.flatMap(item => item.tags)))}
      />
    </AppShell>
  );
}

export default function Discover() {
  return (
    <ProtectedRoute>
      <DiscoverErrorBoundary>
        <DiscoverContent />
      </DiscoverErrorBoundary>
    </ProtectedRoute>
  );
}
