/**
 * MarketHeader - Markets page header
 * search + timeframe
 */

import { Search } from 'lucide-react';

interface MarketHeaderProps {
  timeframe: '1D' | '5D' | '1M' | '6M' | '1Y';
  onTimeframeChange: (timeframe: '1D' | '5D' | '1M' | '6M' | '1Y') => void;
}

export default function MarketHeader({ timeframe, onTimeframeChange }: MarketHeaderProps) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold text-text-primary">Markets</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Timeframe Selector */}
        <div className="flex gap-2">
          {(['1D', '5D', '1M', '6M', '1Y'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                timeframe === tf
                  ? 'bg-primary-red text-text-primary'
                  : 'bg-background-glass-subtle text-text-secondary hover:bg-background-glass-medium'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search assets..."
            className="pl-10 pr-4 py-2 bg-background-glass-subtle border border-borders-subtle rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-borders-medium focus:bg-background-glass-medium"
          />
        </div>
      </div>
    </div>
  );
}
