/**
 * HeaderBar - Barre compacte type Google Earth, juxtaposée sur le globe.
 * Search + filtres 24h/Global pour une navigation optimale.
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
    <div className="flex items-center gap-3 sm:gap-4 py-2.5 px-4">
      <span className="text-sm font-semibold text-white/95 shrink-0">Overview</span>
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
        <input
          type="text"
          placeholder="Search events, entities, tickers..."
          value={globalSearchQuery}
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/[0.08] border border-white/[0.1] text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10"
        />
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/[0.08] border border-white/[0.08] text-xs text-white/80">
          <Calendar className="w-3.5 h-3.5" />
          {dateRange}
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/[0.08] border border-white/[0.08] text-xs text-white/80">
          <Globe className="w-3.5 h-3.5" />
          <span className="capitalize">{scopeMode}</span>
        </span>
      </div>
    </div>
  );
}
