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

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import AppShell from '../components/layout/AppShell';
import SEO from '../components/SEO';
import ProtectedRoute from '../components/ProtectedRoute';
import DiscoverCard, { type DiscoverItem } from '../components/discover/DiscoverCard';
import DiscoverTabs from '../components/discover/DiscoverTabs';
import DiscoverFilters from '../components/discover/DiscoverFilters';
import DiscoverSearch from '../components/discover/DiscoverSearch';
import DiscoverSidebar from '../components/discover/DiscoverSidebar';
import DiscoverDetailModal from '../components/discover/DiscoverDetailModal';
import PersonalizationModal from '../components/discover/PersonalizationModal';
import SkeletonCard from '../components/ui/SkeletonCard';
import { Loader2 } from 'lucide-react';
import { getOrCreateSupabaseUserId } from '../lib/supabase';

function DiscoverContent() {
  const { user } = useUser();
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [selectedTab, setSelectedTab] = useState<string>('for-you');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState({
    timeRange: 'all' as 'now' | '24h' | '7d' | '30d' | 'structural' | 'all',
    sortBy: 'relevance' as 'relevance' | 'recent' | 'trending',
    category: 'all' as string,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DiscoverItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPersonalizationModalOpen, setIsPersonalizationModalOpen] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const itemsPerPage = 12;

  // Show personalization modal on first visit
  useEffect(() => {
    const hasSeenPersonalization = localStorage.getItem('hasSeenPersonalization');
    if (!hasSeenPersonalization) {
      setIsPersonalizationModalOpen(true);
    }
  }, []);

  // Fetch discover items
  const fetchItems = useCallback(async (page: number, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      const userId = user ? await getOrCreateSupabaseUserId(user.id) : undefined;
      const offset = page * itemsPerPage;

      // Determine category based on selected tab
      let category = 'all';
      if (selectedTab === 'topics') {
        category = filters.category || 'all';
      } else if (selectedTab === 'top') {
        category = 'all'; // Top shows all categories
      } else {
        category = 'all'; // For You shows personalized content
      }

      const apiUrl = `/api/discover?category=${category}&offset=${offset}&limit=${itemsPerPage}&sortBy=${filters.sortBy}&timeRange=${filters.timeRange}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}${userId ? `&userId=${userId}` : ''}`;
      
      const response = await fetch(apiUrl);

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `Failed to fetch discover items: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use status text
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success) {
        if (reset) {
          setItems(data.items || []);
        } else {
          setItems(prev => [...prev, ...(data.items || [])]);
        }
        setHasMore(data.hasMore !== false);
      } else {
        throw new Error(data.error || 'Failed to fetch discover items');
      }
    } catch (err: any) {
      console.error('[Discover] Error fetching items:', err);
      setError(err.message || 'Failed to load discover items');
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [selectedTab, filters, searchQuery, user]);

  // Initial load
  useEffect(() => {
    setCurrentPage(0);
    fetchItems(0, true);
  }, [selectedTab, filters.sortBy, filters.timeRange, filters.category, searchQuery, fetchItems]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || isLoadingMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);
          fetchItems(nextPage, false);
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
  }, [hasMore, isLoadingMore, loading, currentPage, fetchItems]);

  // Handle save item
  const handleSave = async (itemId: string) => {
    try {
      const response = await fetch(`/api/discover/${itemId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to save item');
      }

      // Update engagement count
      setItems(prev =>
        prev.map(item =>
          item.id === itemId
            ? { ...item, engagement: { ...item.engagement, saves: item.engagement.saves + 1 } }
            : item
        )
      );
    } catch (err) {
      console.error('[Discover] Error saving item:', err);
      throw err;
    }
  };

  // Handle view item
  const handleView = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setSelectedItem(item);
      setIsModalOpen(true);
      
      // Update engagement count
      setItems(prev =>
        prev.map(i =>
          i.id === itemId
            ? { ...i, engagement: { ...i.engagement, views: i.engagement.views + 1 } }
            : i
        )
      );
    }
  };

  if (loading) {
    return (
      <AppShell>
        <SEO title="Discover — Nucigen" description="Explore insights, trends, and analysis" />
        <div className="col-span-1 sm:col-span-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (error && items.length === 0) {
    return (
      <AppShell>
        <SEO title="Discover — Nucigen" description="Explore insights, trends, and analysis" />
        <div className="col-span-1 sm:col-span-12 flex items-center justify-center min-h-[400px]">
          <div className="max-w-2xl w-full text-center">
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
            <button
              onClick={() => fetchItems(0, true)}
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
      <div className="col-span-1 sm:col-span-12 mb-6">
        <h1 className="text-3xl sm:text-4xl font-light text-white mb-6">Discover</h1>
        
        {/* Navigation Tabs */}
        <div className="mb-6">
          <DiscoverTabs
            selected={selectedTab}
            onSelect={(tab) => {
              setSelectedTab(tab);
              // Reset category when switching tabs
              if (tab !== 'topics') {
                setFilters(prev => ({ ...prev, category: 'all' }));
              }
            }}
          />
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <DiscoverSearch
            onSearch={setSearchQuery}
            placeholder="Search topics, trends, or ask a question..."
          />
        </div>
      </div>

      {/* Filters */}
      <div className="col-span-1 sm:col-span-12 mb-6">
        <DiscoverFilters 
          filters={filters} 
          onFiltersChange={setFilters}
          showCategory={selectedTab === 'topics'}
        />
      </div>

      {/* Main Content + Sidebar */}
      <div className="col-span-1 sm:col-span-12">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Grid */}
            {items.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-lg text-white font-light mb-2">No items found</p>
                <p className="text-sm text-slate-400 font-light">
                  Try adjusting your filters or category selection
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr" style={{ gap: '1.75rem' }}>
                  {items.map((item) => {
                    // Determine if this is a critical tier item (full width)
                    const isCritical = item.tier === 'critical' || 
                      (item.metadata.relevance_score >= 90 && item.sources.length >= 30);
                    
                    return (
                      <div
                        key={item.id}
                        className={isCritical ? 'md:col-span-2 lg:col-span-3' : ''}
                      >
                        <DiscoverCard
                          item={item}
                          onSave={handleSave}
                          onView={handleView}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Infinite scroll trigger */}
                {hasMore && (
                  <div ref={observerRef} className="mt-8 text-center py-4">
                    {isLoadingMore && (
                      <div className="flex items-center justify-center gap-2 text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-light">Loading more...</span>
                      </div>
                    )}
                  </div>
                )}

                {!hasMore && items.length > 0 && (
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
      <DiscoverDetailModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
        }}
        onSave={handleSave}
      />

      {/* Personalization Modal */}
      <PersonalizationModal
        isOpen={isPersonalizationModalOpen}
        onClose={() => {
          setIsPersonalizationModalOpen(false);
          localStorage.setItem('hasSeenPersonalization', 'true');
        }}
        onSave={(interests) => {
          // Save interests to user preferences
          console.log('Saved interests:', interests);
          localStorage.setItem('hasSeenPersonalization', 'true');
          // TODO: Save to Supabase user preferences
        }}
      />
    </AppShell>
  );
}

export default function Discover() {
  return (
    <ProtectedRoute>
      <DiscoverContent />
    </ProtectedRoute>
  );
}
