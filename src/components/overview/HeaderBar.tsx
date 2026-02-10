/**
 * HeaderBar — Sobre, high-tech : une ligne de contrôles, pas de surcharge visuelle.
 */

import { Calendar, Globe, MapPin, RefreshCw, Search } from 'lucide-react';
import { OVERVIEW_COUNTRIES } from '../../constants/overview-countries';

const DATE_RANGES = ['24h', '7d', '30d'] as const;
const SCOPE_MODES = ['global', 'watchlist'] as const;

export interface HeaderBarProps {
  dateRange?: '24h' | '7d' | '30d';
  scopeMode?: 'global' | 'watchlist';
  searchQuery?: string;
  country?: string;
  onDateRangeChange?: (v: '24h' | '7d' | '30d') => void;
  onScopeModeChange?: (v: 'global' | 'watchlist') => void;
  onSearchChange?: (v: string) => void;
  onSearchSubmit?: (v: string) => void;
  onCountryChange?: (v: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function HeaderBar({
  dateRange = '24h',
  scopeMode = 'global',
  searchQuery = '',
  country = '',
  onDateRangeChange,
  onScopeModeChange,
  onSearchChange,
  onSearchSubmit,
  onCountryChange,
  onRefresh,
  refreshing = false,
}: HeaderBarProps) {
  return (
    <div className="flex items-center gap-3 pl-4 pr-4 w-full min-w-0 h-full">
      <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest shrink-0">Overview</span>
      <div className="h-6 w-px bg-white/[0.06] shrink-0" aria-hidden />
      <div className="relative flex-1 min-w-0 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
        <input
          type="text"
          placeholder="Search…"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit?.(e.currentTarget.value)}
          className="w-full h-7 pl-7 pr-2.5 rounded bg-white/[0.04] border border-white/[0.06] text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/20"
        />
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {DATE_RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onDateRangeChange?.(r)}
            className={`flex items-center gap-0.5 h-7 px-2 rounded text-[10px] uppercase tracking-wider transition-colors ${
              dateRange === r
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'bg-white/[0.04] text-zinc-400 border border-transparent hover:bg-white/[0.06] hover:text-zinc-300'
            }`}
          >
            {r === '24h' && <Calendar className="w-3 h-3 shrink-0" />}
            {r}
          </button>
        ))}
      </div>
      <div className="h-6 w-px bg-white/[0.06] shrink-0" aria-hidden />
      <div className="flex items-center gap-1 shrink-0">
        {SCOPE_MODES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onScopeModeChange?.(m)}
            className={`flex items-center gap-0.5 h-7 px-2 rounded text-[10px] uppercase tracking-wider transition-colors capitalize ${
              scopeMode === m
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'bg-white/[0.04] text-zinc-400 border border-transparent hover:bg-white/[0.06] hover:text-zinc-300'
            }`}
          >
            {m === 'global' && <Globe className="w-3 h-3 shrink-0" />}
            {m}
          </button>
        ))}
      </div>
      {onCountryChange && (
        <>
          <div className="h-6 w-px bg-white/[0.06] shrink-0" aria-hidden />
          <div className="flex items-center gap-1.5 shrink-0">
            <MapPin className="w-3 h-3 text-zinc-500" aria-hidden />
            <select
              value={country}
              onChange={(e) => onCountryChange(e.target.value)}
              className="h-7 pl-1.5 pr-6 rounded bg-white/[0.04] border border-white/[0.06] text-[10px] text-zinc-300 focus:outline-none focus:border-cyan-500/30 cursor-pointer min-w-[7rem]"
              aria-label="Pays"
            >
              <option value="">All</option>
              {OVERVIEW_COUNTRIES.map((c) => (
                <option key={c} value={c} className="bg-[#0f0f12] text-zinc-200">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
      {onRefresh && (
        <>
          <div className="h-6 w-px bg-white/[0.06] shrink-0" aria-hidden />
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="p-1.5 rounded text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-50 transition-colors"
            aria-label="Rafraîchir"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </>
      )}
    </div>
  );
}
