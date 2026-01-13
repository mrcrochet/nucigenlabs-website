/**
 * Market Data Panel Component
 * 
 * Complete market data visualization panel for events
 * Combines mini chart, volatility sparkline, volume histogram, and metrics
 */

import { useState, useEffect } from 'react';
import MiniPriceChart, { type PriceDataPoint } from './MiniPriceChart';
import VolatilitySparkline, { type VolatilityDataPoint } from './VolatilitySparkline';
import VolumeHistogram, { type VolumeDataPoint } from './VolumeHistogram';
import MarketMetrics, { type MarketMetricsData } from './MarketMetrics';
import { Loader2 } from 'lucide-react';
import type { Event } from '../../types/intelligence';

interface MarketDataPanelProps {
  event: Event;
  className?: string;
}

export default function MarketDataPanel({ event, className = '' }: MarketDataPanelProps) {
  const [loading, setLoading] = useState(false);
  const [priceData, setPriceData] = useState<PriceDataPoint[]>([]);
  const [volatilityData, setVolatilityData] = useState<VolatilityDataPoint[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeDataPoint[]>([]);
  const [metrics, setMetrics] = useState<MarketMetricsData | null>(null);

  useEffect(() => {
    // Extract symbol from event
    const symbol = event.market_data?.symbol || 
                   event.actors.find(a => /^[A-Z]{1,5}$/.test(a)) || // Try to find ticker symbol
                   null;

    if (!symbol || event.source_type !== 'twelvedata') {
      return; // Only fetch for market data events
    }

    const fetchMarketData = async () => {
      setLoading(true);
      try {
        // Fetch time series data from API
        // Use relative URL in production, absolute in development
        const apiPort = import.meta.env.VITE_API_PORT || '3001';
        const isDev = import.meta.env.DEV;
        const apiUrl = isDev ? `http://localhost:${apiPort}` : '';
        const response = await fetch(`${apiUrl}/api/market-data/${symbol}/timeseries?interval=1h&days=7`);
        if (!response.ok) throw new Error('Failed to fetch market data');
        
        const data = await response.json();
        
        // Transform data for charts
        const prices: PriceDataPoint[] = data.values.map((v: any) => ({
          timestamp: v.datetime,
          price: v.close,
          isBeforeEvent: new Date(v.datetime) < new Date(event.date),
        }));
        
        const volatilities: VolatilityDataPoint[] = data.values.map((v: any, i: number, arr: any[]) => {
          if (i === 0) return { timestamp: v.datetime, volatility: 0 };
          const prevClose = arr[i - 1].close;
          const volatility = Math.abs((v.close - prevClose) / prevClose) * 100;
          return { timestamp: v.datetime, volatility };
        });
        
        const volumes: VolumeDataPoint[] = data.values.map((v: any) => ({
          timestamp: v.datetime,
          volume: v.volume,
        }));

        // Calculate metrics
        const currentPrice = prices[prices.length - 1]?.price || 0;
        const price24hAgo = prices[Math.max(0, prices.length - 24)]?.price || currentPrice;
        const priceChange = currentPrice && price24hAgo ? ((currentPrice - price24hAgo) / price24hAgo) * 100 : 0;
        
        const avgVolatility = volatilities.reduce((sum, v) => sum + v.volatility, 0) / volatilities.length;
        const recentVolatility = volatilities.slice(-24).reduce((sum, v) => sum + v.volatility, 0) / 24;
        const volatilityChange = avgVolatility ? ((recentVolatility - avgVolatility) / avgVolatility) * 100 : 0;
        
        const avgVolume = volumes.reduce((sum, v) => sum + v.volume, 0) / volumes.length;
        const recentVolume = volumes.slice(-24).reduce((sum, v) => sum + v.volume, 0) / 24;
        const volumeChange = avgVolume ? ((recentVolume - avgVolume) / avgVolume) * 100 : 0;

        // Estimate impact based on price change and volatility
        const absPriceChange = Math.abs(priceChange);
        const absVolatilityChange = Math.abs(volatilityChange);
        let estimatedImpact: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (absPriceChange > 5 || absVolatilityChange > 20) {
          estimatedImpact = 'critical';
        } else if (absPriceChange > 3 || absVolatilityChange > 15) {
          estimatedImpact = 'high';
        } else if (absPriceChange > 1 || absVolatilityChange > 10) {
          estimatedImpact = 'medium';
        }

        // Extract affected assets from event
        const affectedAssets = event.actors.filter(a => 
          a !== symbol && 
          (a.length <= 5 || /^(Copper|Gold|Silver|Oil|Gas|Shipping|Logistics)/i.test(a))
        );

        setPriceData(prices);
        setVolatilityData(volatilities);
        setVolumeData(volumes);
        setMetrics({
          symbol,
          priceChange,
          volatilityChange,
          volumeChange,
          timeFrame: '24h',
          estimatedImpact,
          affectedAssets: affectedAssets.length > 0 ? affectedAssets : [symbol],
        });
      } catch (error) {
        console.error('Failed to fetch market data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, [event]);

  // If no market data, don't render
  if (!event.market_data && event.source_type !== 'twelvedata') {
    return null;
  }

  if (loading) {
    return (
      <div className={`bg-white/[0.02] border border-white/[0.05] rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-light">Loading market data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/[0.02] border border-white/[0.05] rounded-lg p-6 space-y-6 ${className}`}>
      {/* Header Section: "En un écran" */}
      <div className="pb-4 border-b border-white/[0.05]">
        <h3 className="text-sm font-light text-slate-400 mb-3 uppercase tracking-wide">Impact Marché</h3>
        <div className="grid grid-cols-3 gap-4 text-xs text-slate-500 font-light">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
            <span>Je comprends</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
            <span>Je vois</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
            <span>Je décide</span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <MarketMetrics data={metrics} />
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Price Chart */}
        <div>
          <div className="text-xs text-slate-500 font-light mb-2 uppercase tracking-wide">Graphique</div>
          <MiniPriceChart
            data={priceData}
            eventTimestamp={event.date}
            height={80}
          />
        </div>

        {/* Volatility Sparkline */}
        <div>
          <div className="text-xs text-slate-500 font-light mb-2 uppercase tracking-wide">Volatilité</div>
          <VolatilitySparkline
            data={volatilityData}
            height={80}
          />
        </div>

        {/* Volume Histogram */}
        <div>
          <div className="text-xs text-slate-500 font-light mb-2 uppercase tracking-wide">Volume</div>
          <VolumeHistogram
            data={volumeData}
            height={80}
          />
        </div>
      </div>
    </div>
  );
}
