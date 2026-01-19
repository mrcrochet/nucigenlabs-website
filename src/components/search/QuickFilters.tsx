/**
 * Quick Filters - Inline filter chips
 * 
 * Fast filtering options displayed directly in the results panel
 */

import { X, Calendar, TrendingUp, Globe, Filter } from 'lucide-react';
import { useState } from 'react';

export type SortOption = 'relevance' | 'date-desc' | 'date-asc' | 'source';
export type DateFilter = 'all' | '24h' | '7d' | '30d' | 'custom';

interface QuickFiltersProps {
  onSortChange: (sort: SortOption) => void;
  onDateFilterChange: (filter: DateFilter) => void;
  onSourceFilterChange: (sources: string[]) => void;
  availableSources: string[];
  activeSources: string[];
  activeSort: SortOption;
  activeDateFilter: DateFilter;
  onClearAll: () => void;
}

export default function QuickFilters({
  onSortChange,
  onDateFilterChange,
  onSourceFilterChange,
  availableSources,
  activeSources,
  activeSort,
  activeDateFilter,
  onClearAll,
}: QuickFiltersProps) {
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);

  const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
    { value: 'relevance', label: 'Relevance', icon: <TrendingUp className="w-3 h-3" /> },
    { value: 'date-desc', label: 'Newest', icon: <Calendar className="w-3 h-3" /> },
    { value: 'date-asc', label: 'Oldest', icon: <Calendar className="w-3 h-3" /> },
    { value: 'source', label: 'Source', icon: <Globe className="w-3 h-3" /> },
  ];

  const dateFilters: { value: DateFilter; label: string }[] = [
    { value: 'all', label: 'All time' },
    { value: '24h', label: 'Last 24h' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
  ];

  const toggleSource = (source: string) => {
    if (activeSources.includes(source)) {
      onSourceFilterChange(activeSources.filter(s => s !== source));
    } else {
      onSourceFilterChange([...activeSources, source]);
    }
  };

  const hasActiveFilters = activeSources.length > 0 || activeDateFilter !== 'all' || activeSort !== 'relevance';

  return (
    <div className="space-y-3">
      {/* Quick Filters Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sort */}
        <div className="relative">
          <button
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeSort !== 'relevance'
                ? 'bg-primary/20 text-primary border border-primary/50'
                : 'bg-background-glass-subtle text-text-secondary hover:text-text-primary border border-borders-subtle'
            }`}
          >
            {sortOptions.find(o => o.value === activeSort)?.icon}
            <span>{sortOptions.find(o => o.value === activeSort)?.label}</span>
          </button>
          {/* Sort dropdown - hidden for now, can be added later if needed */}
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1 bg-background-glass-subtle border border-borders-subtle rounded-lg overflow-hidden">
          {dateFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => onDateFilterChange(filter.value)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                activeDateFilter === filter.value
                  ? 'bg-primary/20 text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Source Filter */}
        {availableSources.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowSourceDropdown(!showSourceDropdown)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSources.length > 0
                  ? 'bg-primary/20 text-primary border border-primary/50'
                  : 'bg-background-glass-subtle text-text-secondary hover:text-text-primary border border-borders-subtle'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>Sources {activeSources.length > 0 && `(${activeSources.length})`}</span>
            </button>
            {showSourceDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSourceDropdown(false)}
                />
                <div className="absolute top-full left-0 mt-1 bg-background-elevated border border-borders-subtle rounded-lg shadow-lg z-20 max-w-xs max-h-64 overflow-y-auto">
                  <div className="p-2">
                    <div className="text-xs font-semibold text-text-primary mb-2 px-2">Select Sources</div>
                    <div className="space-y-1">
                      {availableSources.map((source) => (
                        <label
                          key={source}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-background-glass-subtle cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={activeSources.includes(source)}
                            onChange={() => toggleSource(source)}
                            className="w-3 h-3 text-primary bg-background-glass-subtle border-borders-subtle rounded focus:ring-primary"
                          />
                          <span className="text-xs text-text-secondary">{source}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Clear All */}
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-text-tertiary hover:text-text-primary bg-background-glass-subtle border border-borders-subtle transition-colors"
          >
            <X className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-borders-subtle">
          <span className="text-xs text-text-tertiary flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Active filters:
          </span>
          {activeSources.map((source) => (
            <button
              key={source}
              onClick={() => toggleSource(source)}
              className="flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded text-xs hover:bg-primary/30 transition-colors"
            >
              {source}
              <X className="w-3 h-3" />
            </button>
          ))}
          {activeDateFilter !== 'all' && (
            <button
              onClick={() => onDateFilterChange('all')}
              className="flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded text-xs hover:bg-primary/30 transition-colors"
            >
              {dateFilters.find(f => f.value === activeDateFilter)?.label}
              <X className="w-3 h-3" />
            </button>
          )}
          {activeSort !== 'relevance' && (
            <button
              onClick={() => onSortChange('relevance')}
              className="flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded text-xs hover:bg-primary/30 transition-colors"
            >
              Sort: {sortOptions.find(o => o.value === activeSort)?.label}
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
