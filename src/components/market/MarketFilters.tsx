/**
 * MarketFilters Component
 * 
 * Filter controls for Market page
 */

import { useState } from 'react';
import Badge from '../ui/Badge';
import { TrendingUp, TrendingDown, Filter, X } from 'lucide-react';
import type { MarketFilters as MarketFiltersType } from '../../types/market';

interface MarketFiltersProps {
  filters: MarketFiltersType;
  onFiltersChange: (filters: MarketFiltersType) => void;
  availableSectors?: string[];
}

export default function MarketFilters({ filters, onFiltersChange, availableSectors = [] }: MarketFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = <K extends keyof MarketFiltersType>(key: K, value: MarketFiltersType[K]) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilter = (key: keyof MarketFiltersType) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const clearAll = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="mb-6">
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Filters</h3>
          {hasActiveFilters && (
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
              {Object.keys(filters).length} active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear all
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Active Filters (Pills) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.direction && (
            <Badge
              className="bg-blue-500/20 text-blue-300 border-blue-500/30 flex items-center gap-1 cursor-pointer hover:bg-blue-500/30"
              onClick={() => clearFilter('direction')}
            >
              Direction: {filters.direction === 'up' ? 'UP' : 'DOWN'}
              <X className="w-3 h-3" />
            </Badge>
          )}
          {filters.sector && (
            <Badge
              className="bg-blue-500/20 text-blue-300 border-blue-500/30 flex items-center gap-1 cursor-pointer hover:bg-blue-500/30"
              onClick={() => clearFilter('sector')}
            >
              Sector: {filters.sector}
              <X className="w-3 h-3" />
            </Badge>
          )}
          {filters.time_horizon && (
            <Badge
              className="bg-blue-500/20 text-blue-300 border-blue-500/30 flex items-center gap-1 cursor-pointer hover:bg-blue-500/30"
              onClick={() => clearFilter('time_horizon')}
            >
              Horizon: {filters.time_horizon}
              <X className="w-3 h-3" />
            </Badge>
          )}
          {filters.min_probability !== undefined && (
            <Badge
              className="bg-blue-500/20 text-blue-300 border-blue-500/30 flex items-center gap-1 cursor-pointer hover:bg-blue-500/30"
              onClick={() => clearFilter('min_probability')}
            >
              Min: {Math.round(filters.min_probability * 100)}%
              <X className="w-3 h-3" />
            </Badge>
          )}
          {filters.max_probability !== undefined && (
            <Badge
              className="bg-blue-500/20 text-blue-300 border-blue-500/30 flex items-center gap-1 cursor-pointer hover:bg-blue-500/30"
              onClick={() => clearFilter('max_probability')}
            >
              Max: {Math.round(filters.max_probability * 100)}%
              <X className="w-3 h-3" />
            </Badge>
          )}
        </div>
      )}

      {/* Expanded Filter Options */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          {/* Direction Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Direction</label>
            <div className="flex gap-2">
              <button
                onClick={() => updateFilter('direction', filters.direction === 'up' ? undefined : 'up')}
                className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                  filters.direction === 'up'
                    ? 'bg-green-500/20 text-green-300 border-green-500/30'
                    : 'bg-gray-700/50 text-gray-400 border-gray-600 hover:bg-gray-700'
                }`}
              >
                <TrendingUp className="w-4 h-4 mx-auto" />
                <span className="text-xs mt-1">UP</span>
              </button>
              <button
                onClick={() => updateFilter('direction', filters.direction === 'down' ? undefined : 'down')}
                className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                  filters.direction === 'down'
                    ? 'bg-red-500/20 text-red-300 border-red-500/30'
                    : 'bg-gray-700/50 text-gray-400 border-gray-600 hover:bg-gray-700'
                }`}
              >
                <TrendingDown className="w-4 h-4 mx-auto" />
                <span className="text-xs mt-1">DOWN</span>
              </button>
            </div>
          </div>

          {/* Sector Filter */}
          {availableSectors.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sector</label>
              <select
                value={filters.sector || ''}
                onChange={(e) => updateFilter('sector', e.target.value || undefined)}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sectors</option>
                {availableSectors.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Time Horizon Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Time Horizon</label>
            <select
              value={filters.time_horizon || ''}
              onChange={(e) => updateFilter('time_horizon', (e.target.value || undefined) as any)}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Horizons</option>
              <option value="short">Short (Days-Weeks)</option>
              <option value="medium">Medium (Weeks-Months)</option>
              <option value="long">Long (Months-Years)</option>
            </select>
          </div>

          {/* Probability Range (if user has access) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Min Probability</label>
            <input
              type="range"
              min="0.5"
              max="0.9"
              step="0.05"
              value={filters.min_probability || 0.5}
              onChange={(e) => updateFilter('min_probability', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-400 mt-1">
              {filters.min_probability ? Math.round(filters.min_probability * 100) : 50}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
