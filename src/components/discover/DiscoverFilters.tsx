/**
 * DiscoverFilters Component
 * 
 * Filter controls for discover items
 */

import { Clock, TrendingUp, Filter } from 'lucide-react';

interface DiscoverFiltersProps {
  filters: {
    timeRange: '24h' | '7d' | '30d' | 'all';
    sortBy: 'relevance' | 'recent' | 'trending';
  };
  onFiltersChange: (filters: DiscoverFiltersProps['filters']) => void;
}

export default function DiscoverFilters({ filters, onFiltersChange }: DiscoverFiltersProps) {
  const timeRangeOptions: Array<{ value: DiscoverFiltersProps['filters']['timeRange']; label: string }> = [
    { value: '24h', label: '24h' },
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: 'all', label: 'All time' },
  ];

  const sortByOptions: Array<{ value: DiscoverFiltersProps['filters']['sortBy']; label: string; icon: typeof Clock }> = [
    { value: 'relevance', label: 'Relevance', icon: TrendingUp },
    { value: 'recent', label: 'Recent', icon: Clock },
    { value: 'trending', label: 'Trending', icon: TrendingUp },
  ];

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-slate-500" />
        <select
          value={filters.timeRange}
          onChange={(e) => onFiltersChange({ ...filters, timeRange: e.target.value as any })}
          className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-sm text-white font-light focus:outline-none focus:border-white/10"
        >
          {timeRangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-500" />
        <select
          value={filters.sortBy}
          onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value as any })}
          className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-sm text-white font-light focus:outline-none focus:border-white/10"
        >
          {sortByOptions.map((option) => {
            const Icon = option.icon;
            return (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
}
