/**
 * MarketOutlook Component
 * 
 * Displays market futures and indices
 * Similar to Perplexity's market outlook widget
 */

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketData {
  symbol: string;
  name: string;
  price: string;
  change: number;
  changePercent: number;
}

export default function MarketOutlook() {
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch('/api/market-outlook');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setMarkets(data.data || []);
          }
        }
      } catch (error) {
        console.error('[MarketOutlook] Error fetching data:', error);
        // Fallback to empty array
        setMarkets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
    // Refresh every 60 seconds
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading && markets.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-light text-white mb-4">Market Outlook</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-light text-white mb-2">Market Outlook</h3>
        <p className="text-xs text-slate-500 font-light">Indices bientôt disponibles.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
      <h3 className="text-sm font-light text-white mb-4">Market Outlook</h3>
      <div className="space-y-3">
        {markets.map((market) => {
          const isPositive = market.change >= 0;
          return (
            <div key={market.symbol} className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-400 font-light truncate">{market.name}</div>
                <div className="text-[10px] text-slate-600 font-light">{market.symbol}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-sm text-white font-light">{market.price}</div>
                  <div className={`text-xs font-light flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>
                      {isPositive ? '+' : ''}{market.changePercent.toFixed(2)}%
                    </span>
                    <span className="text-slate-500">
                      {isPositive ? '+' : ''}{market.change > 0 ? '$' : ''}{market.change.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
