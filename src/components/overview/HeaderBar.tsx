/**
 * HeaderBar - Overview page header
 * Props: dateRange, scopeMode, globalSearchQuery
 */

import { Calendar, Globe, Search } from 'lucide-react';

interface HeaderBarProps {
  dateRange?: '24h' | '7d' | '30d';
  scopeMode?: 'global' | 'watchlist';
  globalSearchQuery?: string;
}

export default function HeaderBar({
  dateRange = '24h',
  scopeMode = 'global',
  globalSearchQuery = '',
}: HeaderBarProps) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold text-text-primary">Overview</h1>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Calendar className="w-4 h-4" />
          <span>{dateRange}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Globe className="w-4 h-4" />
          <span className="capitalize">{scopeMode}</span>
        </div>
      </div>

      <div className="flex-1 max-w-md ml-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search events, entities, tickers..."
            value={globalSearchQuery}
            className="w-full pl-10 pr-4 py-2 bg-background-glass-subtle border border-borders-subtle rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-borders-medium focus:bg-background-glass-medium"
          />
        </div>
      </div>
    </div>
  );
}
