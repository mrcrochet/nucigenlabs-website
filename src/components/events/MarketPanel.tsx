/**
 * MarketPanel (if asset linked)
 * 
 * Components:
 * - PriceChart 1D/5D/1M
 * - VolumeBars
 * - VolatilityIndicator
 * - "Event Marker" on chart
 * 
 * Data:
 * - GET /markets/asset/:symbol/history?range=1M
 * - GET /markets/asset/:symbol/metrics?range=1M
 */

import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import PriceChart from '../charts/PriceChart';
import VolumeBars from '../charts/VolumeBars';
import VolatilityIndicator from '../charts/VolatilityIndicator';
import type { Event } from '../../types/intelligence';

interface MarketPanelProps {
  event: Event;
}

export default function MarketPanel({ event }: MarketPanelProps) {
  const symbol = event.market_data?.symbol || 
                 event.actors.find(a => /^[A-Z]{1,5}$/.test(a)) || 
                 null;

  const [timeframe, setTimeframe] = useState<'1D' | '5D' | '1M'>('1M');
  const [loading, setLoading] = useState(true);
  const [priceData, setPriceData] = useState<any[]>([]);
  const [volumeData, setVolumeData] = useState<any[]>([]);

  useEffect(() => {
    if (!symbol) {
      setLoading(false);
      return;
    }

    // TODO: Fetch from GET /markets/asset/:symbol/history?range=1M
    // TODO: Fetch from GET /markets/asset/:symbol/metrics?range=1M
    setLoading(false);
  }, [symbol, timeframe]);

  if (!symbol) {
    return (
      <Card>
        <SectionHeader title="Market Data" />
        <div className="mt-4 text-sm text-text-secondary">
          No market data available for this event
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader title="Market Reaction" />
      
      {/* Timeframe Selector */}
      <div className="mt-4 flex gap-2">
        {(['1D', '5D', '1M'] as const).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
              timeframe === tf
                ? 'bg-primary-red text-text-primary'
                : 'bg-background-glass-subtle text-text-secondary hover:bg-background-glass-medium'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-4 h-64 animate-pulse bg-background-glass-subtle rounded-lg" />
      ) : (
        <div className="mt-4 space-y-4">
          {/* Price Chart with Event Marker */}
          <PriceChart
            data={priceData}
            eventTimestamp={event.date}
            symbol={symbol}
          />

          {/* Volume Bars */}
          <VolumeBars data={volumeData} />

          {/* Volatility Indicator */}
          <VolatilityIndicator symbol={symbol} timeframe={timeframe} />
        </div>
      )}
    </Card>
  );
}
