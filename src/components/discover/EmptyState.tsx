/**
 * EmptyState Component
 * 
 * Displays contextual empty states for the Discover page
 */

import { Search, Filter, RefreshCw, RotateCw } from 'lucide-react';

interface EmptyStateProps {
  searchQuery?: string;
  filters?: {
    category?: string;
    timeRange?: string;
    sortBy?: string;
  };
  onResetFilters?: () => void;
  onClearSearch?: () => void;
  onRetry?: () => void;
}

export default function EmptyState({ 
  searchQuery, 
  filters, 
  onResetFilters,
  onClearSearch,
  onRetry,
}: EmptyStateProps) {
  const hasActiveFilters = searchQuery || 
    (filters?.category && filters.category !== 'all') ||
    (filters?.timeRange && filters.timeRange !== 'all');

  const getMessage = () => {
    if (searchQuery) {
      return {
        title: 'No results found',
        description: `We couldn't find any items matching "${searchQuery}"`,
        icon: Search,
      };
    }

    if (filters?.category && filters.category !== 'all') {
      return {
        title: 'No items in this category',
        description: `There are no items in the ${filters.category} category right now`,
        icon: Filter,
      };
    }

    if (filters?.timeRange && filters.timeRange !== 'all') {
      return {
        title: 'No recent items',
        description: `No items found for the selected time range`,
        icon: Filter,
      };
    }

    return {
      title: 'No items found',
      description: 'Try adjusting your filters or check back later',
      icon: Search,
    };
  };

  const { title, description, icon: Icon } = getMessage();

  return (
    <div className="text-center py-20 px-4">
      <div className="max-w-md mx-auto">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Icon className="w-8 h-8 text-slate-500" />
          </div>
        </div>
        
        <h3 className="text-xl font-light text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 font-light mb-6">{description}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {hasActiveFilters && (
            <>
              {searchQuery && onClearSearch && (
                <button
                  onClick={onClearSearch}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-light flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Clear search
                </button>
              )}
              {onResetFilters && (
                <button
                  onClick={onResetFilters}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-light flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Réinitialiser les filtres
                </button>
              )}
            </>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-light flex items-center justify-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              Réessayer / Actualiser
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
