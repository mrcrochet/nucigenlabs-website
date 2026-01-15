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
import CategoryTabs from '../components/discover/CategoryTabs';
import DiscoverFilters from '../components/discover/DiscoverFilters';
import DiscoverSearch from '../components/discover/DiscoverSearch';
import DiscoverDetailModal from '../components/discover/DiscoverDetailModal';
import SkeletonCard from '../components/ui/SkeletonCard';
import { Loader2 } from 'lucide-react';
import { getOrCreateSupabaseUserId } from '../lib/supabase';

function DiscoverContent() {
  const { user } = useUser();
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState({
    timeRange: '7d' as '24h' | '7d' | '30d' | 'all',
    sortBy: 'relevance' as 'relevance' | 'recent' | 'trending',
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DiscoverItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const itemsPerPage = 12;

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

      const apiUrl = `/api/discover?category=${selectedCategory}&offset=${offset}&limit=${itemsPerPage}&sortBy=${filters.sortBy}&timeRange=${filters.timeRange}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}${userId ? `&userId=${userId}` : ''}`;
      
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
  }, [selectedCategory, filters, searchQuery, user]);

  // Initial load
  useEffect(() => {
    setCurrentPage(0);
    fetchItems(0, true);
  }, [selectedCategory, filters.sortBy, filters.timeRange, searchQuery]);

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
      <div className="col-span-1 sm:col-span-12 mb-8">
        <h1 className="text-3xl sm:text-4xl font-light text-white mb-4">Discover</h1>
        <p className="text-sm text-slate-500 font-light mb-6">
          Explore insights, trends, and analysis from multiple sources
        </p>
        
        {/* Search Bar */}
        <div className="flex justify-center">
          <DiscoverSearch
            onSearch={setSearchQuery}
            placeholder="Search topics, trends, or ask a question..."
          />
        </div>
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
        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-white font-light mb-2">No items found</p>
            <p className="text-sm text-slate-400 font-light">
              Try adjusting your filters or category selection
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <DiscoverCard
                  key={item.id}
                  item={item}
                  onSave={handleSave}
                  onView={handleView}
                />
              ))}
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
