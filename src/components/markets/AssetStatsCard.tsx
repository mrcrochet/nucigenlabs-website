/**
 * AssetStatsCard - Asset statistics card
 */

import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import ErrorState from '../ui/ErrorState';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { fetchMarketPrice, getMarketErrorDisplay, type MarketDataError } from '../../lib/api/market-data-api';

interface AssetStatsCardProps {
  symbol: string;
}

export default function AssetStatsCard({ symbol }: AssetStatsCardProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<MarketDataError | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    
    const { data, error: marketError } = await fetchMarketPrice(symbol);

    if (marketError) {
      setError(marketError);
      setStats(null);
      setLoading(false);
      return;
    }

    if (data) {
      setStats({
        price: parseFloat(data.price || 0),
        change: parseFloat(data.change || 0),
        changePercent: parseFloat(data.change_percent || 0),
        volume: parseInt(data.volume?.toString() || '0'),
        volatility: 15.5, // TODO: Calculate from timeseries
      });
    } else {
      setError({
        code: 'NO_DATA',
        message: `No data available for ${symbol}`,
        provider: 'twelvedata',
        retryable: false,
      });
      setStats(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, [symbol]);

  if (loading) {
    return (
      <Card>
        <SectionHeader title={`${symbol} Stats`} />
        <div className="h-64 animate-pulse bg-background-glass-subtle rounded-lg mt-4" />
      </Card>
    );
  }

  if (error) {
    const errorDisplay = getMarketErrorDisplay(error);
    return (
      <Card>
        <SectionHeader title={`${symbol} Stats`} />
        <div className="mt-4">
          <ErrorState
            title={errorDisplay.title}
            message={errorDisplay.message}
            provider={error.provider}
            actionLabel={error.retryable ? errorDisplay.actionLabel : undefined}
            onAction={error.retryable ? loadStats : undefined}
          />
        </div>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <SectionHeader title={`${symbol} Stats`} />
        <div className="mt-4 text-text-secondary text-sm">No stats available for {symbol}</div>
      </Card>
    );
  }

  const isPositive = stats.change >= 0;

  return (
    <Card>
      <SectionHeader title={`${symbol} Stats`} />
      
      <div className="mt-4 space-y-4">
        {/* Price */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">Price</span>
            <span className="text-xl font-semibold text-text-primary">
              ${stats.price.toFixed(2)}
            </span>
          </div>
          <div className={`flex items-center gap-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {isPositive ? '+' : ''}{stats.change.toFixed(2)} ({isPositive ? '+' : ''}{stats.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Volume */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Volume</span>
            <span className="text-sm font-medium text-text-primary">
              {(stats.volume / 1000000).toFixed(1)}M
            </span>
          </div>
        </div>

        {/* Volatility */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Volatility</span>
            <Badge variant="neutral">{stats.volatility.toFixed(1)}%</Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
