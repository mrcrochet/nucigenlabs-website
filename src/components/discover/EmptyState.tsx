/**
 * EmptyState Component
 * 
 * Displays contextual empty states for the Discover page
 */

import { Search, Filter, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  searchQuery?: string;
  filters?: {
    category?: string;
    timeRange?: string;
    sortBy?: string;
  };
  onResetFilters?: () => void;
  onClearSearch?: () => void;
}

export default function EmptyState({ 
  searchQuery, 
  filters, 
  onResetFilters,
  onClearSearch 
}: EmptyStateProps) {
  const hasActiveFilters = searchQuery || 
    (filters?.category && filters.category !== 'all') ||
    (filters?.timeRange && filters.timeRange !== 'all');

  const getMessage = () => {
    if (searchQuery) {
      return {
        title: 'No matches for this query',
        description: `System monitoring active. No items match "${searchQuery}" — monitoring 1,247 entities across 89 sectors.`,
        icon: Search,
      };
    }

    if (filters?.category && filters.category !== 'all') {
      return {
        title: 'Category monitoring active',
        description: `No items in ${filters.category} have crossed thresholds. System continues monitoring this category.`,
        icon: Filter,
      };
    }

    if (filters?.timeRange && filters.timeRange !== 'all') {
      return {
        title: 'Time range under surveillance',
        description: `No material changes detected in the selected time range. Monitoring continues.`,
        icon: Filter,
      };
    }

    return {
      title: 'Calm under surveillance',
      description: 'System monitoring 1,247 entities. No items have crossed replay-validated thresholds. Low-noise mode active.',
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

        {hasActiveFilters && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
