/**
 * HeaderBar - Barre compacte type Google Earth, juxtaposée sur le globe.
 * Search + filtres 24h/Global pour une navigation optimale.
 */

import { Calendar, Globe, Search } from 'lucide-react';

const DATE_RANGES = ['24h', '7d', '30d'] as const;
const SCOPE_MODES = ['global', 'watchlist'] as const;

export interface HeaderBarProps {
  dateRange?: '24h' | '7d' | '30d';
  scopeMode?: 'global' | 'watchlist';
  searchQuery?: string;
  onDateRangeChange?: (v: '24h' | '7d' | '30d') => void;
  onScopeModeChange?: (v: 'global' | 'watchlist') => void;
  onSearchChange?: (v: string) => void;
  onSearchSubmit?: (v: string) => void;
}

export default function HeaderBar({
  dateRange = '24h',
  scopeMode = 'global',
  searchQuery = '',
  onDateRangeChange,
  onScopeModeChange,
  onSearchChange,
  onSearchSubmit,
}: HeaderBarProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-4 py-2.5 px-3 sm:px-4 flex-wrap sm:flex-nowrap">
      <span className="text-sm font-semibold text-white/95 shrink-0">Overview</span>
      <div className="relative flex-1 min-w-0 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
        <input
          type="text"
          placeholder="Search events, entities, tickers..."
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit?.(e.currentTarget.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/[0.08] border border-white/[0.1] text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10"
        />
      </div>
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <div className="flex rounded-md overflow-hidden border border-white/[0.08]">
          {DATE_RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onDateRangeChange?.(r)}
              className={`flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-1.5 text-[10px] sm:text-xs transition-colors ${
                dateRange === r ? 'bg-white/20 text-white' : 'bg-white/[0.08] text-white/80 hover:bg-white/10'
              }`}
            >
              {r === '24h' && <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />}
              {r}
            </button>
          ))}
        </div>
        <div className="flex rounded-md overflow-hidden border border-white/[0.08]">
          {SCOPE_MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onScopeModeChange?.(m)}
              className={`flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-1.5 text-[10px] sm:text-xs transition-colors capitalize ${
                scopeMode === m ? 'bg-white/20 text-white' : 'bg-white/[0.08] text-white/80 hover:bg-white/10'
              }`}
            >
              {m === 'global' && <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />}
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
