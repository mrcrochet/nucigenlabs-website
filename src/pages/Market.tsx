/**
 * Market Page
 * 
 * Displays market intelligence insights (company stock impacts from geopolitical events).
 * Premium feature - users can filter but not search (curated feed).
 */

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import MarketCard from '../components/market/MarketCard';
import MarketFilters from '../components/market/MarketFilters';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { TrendingUp, TrendingDown, Lock, AlertCircle, Loader2 } from 'lucide-react';
import type { MarketInsight, MarketFilters as MarketFiltersType, MarketFeatureFlags } from '../types/market';
import { getCurrentUser } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Fetch market insights from API
 */
async function fetchMarketInsights(filters: MarketFiltersType = {}): Promise<{
  insights: MarketInsight[];
  metadata: {
    total: number;
    plan: string;
    flags: MarketFeatureFlags;
  };
}> {
  const params = new URLSearchParams();
  
  if (filters.direction) params.append('direction', filters.direction);
  if (filters.sector) params.append('sector', filters.sector);
  if (filters.time_horizon) params.append('time_horizon', filters.time_horizon);
  if (filters.min_probability !== undefined) params.append('min_probability', filters.min_probability.toString());
  if (filters.max_probability !== undefined) params.append('max_probability', filters.max_probability.toString());

  const response = await fetch(`${API_BASE_URL}/api/market/insights?${params.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('UPGRADE_REQUIRED');
    }
    throw new Error(`Failed to fetch market insights: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

export default function Market() {
  const [filters, setFilters] = useState<MarketFiltersType>({});
  const [user, setUser] = useState<any>(null);
  const [viewsToday, setViewsToday] = useState(0);

  // Fetch user on mount
  useEffect(() => {
    getCurrentUser().then(setUser).catch(console.error);
    
    // Load views today from localStorage
    const stored = localStorage.getItem('market_views_today');
    if (stored) {
      const { date, count } = JSON.parse(stored);
      const today = new Date().toDateString();
      if (date === today) {
        setViewsToday(count);
      } else {
        localStorage.removeItem('market_views_today');
      }
    }
  }, []);

  // Fetch insights
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['market-insights', filters],
    queryFn: () => fetchMarketInsights(filters),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Extract feature flags from metadata
  const flags: MarketFeatureFlags = data?.metadata?.flags || {
    canAccessMarket: false,
    maxMarketCardsPerDay: 2,
    canViewConfidence: false,
    canViewFullThesis: false,
    canViewSupportingEvidence: false,
    canViewHistoricalPatterns: false,
    canViewRelatedEvents: false,
    canExport: false,
  };

  // Check if user has exceeded daily limit
  const hasExceededLimit = viewsToday >= flags.maxMarketCardsPerDay;

  // Extract available sectors from insights
  const availableSectors = useMemo(() => {
    if (!data?.insights) return [];
    const sectors = new Set<string>();
    data.insights.forEach(insight => {
      if (insight.company.sector) {
        sectors.add(insight.company.sector);
      }
    });
    return Array.from(sectors).sort();
  }, [data?.insights]);

  // Track view when insight is viewed
  const handleViewInsight = (insightId: string) => {
    if (hasExceededLimit) return;

    const today = new Date().toDateString();
    const newCount = viewsToday + 1;
    setViewsToday(newCount);
    localStorage.setItem('market_views_today', JSON.stringify({ date: today, count: newCount }));
  };

  // Statistics
  const stats = useMemo(() => {
    if (!data?.insights) return null;

    const upCount = data.insights.filter(i => i.direction === 'up').length;
    const downCount = data.insights.filter(i => i.direction === 'down').length;
    const avgProbability = data.insights
      .filter(i => i.probability !== undefined)
      .reduce((sum, i) => sum + (i.probability || 0), 0) / data.insights.filter(i => i.probability !== undefined).length;

    return {
      total: data.insights.length,
      up: upCount,
      down: downCount,
      avgProbability: isNaN(avgProbability) ? null : avgProbability,
    };
  }, [data?.insights]);

  // Error handling
  if (error) {
    if (error instanceof Error && error.message === 'UPGRADE_REQUIRED') {
      return (
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold text-white mb-2">Market Intelligence</h2>
            <p className="text-gray-400 mb-6">
              Market insights are available for paid plans only.
            </p>
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Upgrade Plan
            </button>
          </Card>
        </div>
      );
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Market Insights</h2>
          <p className="text-gray-400 mb-6">{error instanceof Error ? error.message : 'Unknown error'}</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Market Intelligence</h1>
        <p className="text-gray-400">
          Geopolitical event impacts on publicly traded companies. Curated insights, no search.
        </p>
      </div>

      {/* Daily Limit Warning */}
      {hasExceededLimit && (
        <Card className="p-4 mb-6 bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-center gap-2 text-yellow-300">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">
              You've reached your daily limit ({flags.maxMarketCardsPerDay} cards). Upgrade to view more.
            </span>
          </div>
        </Card>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-sm text-gray-400 mb-1">Total Insights</div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Positive Impact
            </div>
            <div className="text-2xl font-bold text-green-400">{stats.up}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">
              <TrendingDown className="w-4 h-4 text-red-400" />
              Negative Impact
            </div>
            <div className="text-2xl font-bold text-red-400">{stats.down}</div>
          </Card>
          {stats.avgProbability !== null && flags.canViewConfidence && (
            <Card className="p-4">
              <div className="text-sm text-gray-400 mb-1">Avg Probability</div>
              <div className="text-2xl font-bold text-white">
                {Math.round(stats.avgProbability * 100)}%
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Filters */}
      <MarketFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableSectors={availableSectors}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      )}

      {/* Insights Grid */}
      {!isLoading && data && (
        <>
          {data.insights.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-400">No market insights found matching your filters.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.insights.map((insight) => (
                <MarketCard
                  key={insight.id}
                  insight={insight}
                  flags={flags}
                  onView={handleViewInsight}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
