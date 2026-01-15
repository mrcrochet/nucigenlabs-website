/**
 * DiscoverFilters Component
 * 
 * Unified filter controls: Time range, Sort, and Category (when on Topics tab)
 */

import { Clock, ArrowUpDown, Tag } from 'lucide-react';

interface DiscoverFiltersProps {
  filters: {
    timeRange: 'now' | '24h' | '7d' | '30d' | 'structural' | 'all';
    sortBy: 'relevance' | 'recent' | 'trending';
    category?: string;
  };
  onFiltersChange: (filters: DiscoverFiltersProps['filters']) => void;
  showCategory?: boolean;
}

export default function DiscoverFilters({ filters, onFiltersChange, showCategory = false }: DiscoverFiltersProps) {
  const timeRangeOptions: Array<{ value: DiscoverFiltersProps['filters']['timeRange']; label: string }> = [
    { value: 'now', label: 'Now' },
    { value: '24h', label: '24h' },
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
    { value: 'structural', label: 'Structural' },
    { value: 'all', label: 'All' },
  ];

  const sortByOptions: Array<{ value: DiscoverFiltersProps['filters']['sortBy']; label: string }> = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'recent', label: 'Recent' },
    { value: 'trending', label: 'Trending' },
  ];

  const categoryOptions = [
    { value: 'all', label: 'All' },
    { value: 'tech', label: 'Tech' },
    { value: 'finance', label: 'Finance' },
    { value: 'geopolitics', label: 'Geopolitics' },
    { value: 'energy', label: 'Energy' },
    { value: 'supply-chain', label: 'Supply Chain' },
  ];

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Time Range */}
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-slate-400" />
        <select
          value={filters.timeRange}
          onChange={(e) => onFiltersChange({ ...filters, timeRange: e.target.value as any })}
          className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-light focus:outline-none focus:border-white/20 cursor-pointer"
        >
          {timeRangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sort By */}
      <div className="flex items-center gap-2">
        <ArrowUpDown className="w-4 h-4 text-slate-400" />
        <select
          value={filters.sortBy}
          onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value as any })}
          className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-light focus:outline-none focus:border-white/20 cursor-pointer"
        >
          {sortByOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Category (only shown on Topics tab) */}
      {showCategory && (
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-slate-400" />
          <select
            value={filters.category || 'all'}
            onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-light focus:outline-none focus:border-white/20 cursor-pointer"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
