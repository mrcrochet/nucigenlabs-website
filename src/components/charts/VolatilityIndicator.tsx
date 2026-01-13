/**
 * VolatilityIndicator - Volatility metric display
 */

import { useState, useEffect } from 'react';
import Badge from '../ui/Badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface VolatilityIndicatorProps {
  symbol: string;
  timeframe: '1D' | '5D' | '1M';
}

export default function VolatilityIndicator({ symbol, timeframe }: VolatilityIndicatorProps) {
  const [volatility, setVolatility] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch volatility from GET /markets/asset/:symbol/metrics?range=1M
    setVolatility(15.5); // Placeholder
    setLoading(false);
  }, [symbol, timeframe]);

  if (loading) {
    return (
      <div className="h-16 animate-pulse bg-background-glass-subtle rounded-lg" />
    );
  }

  if (volatility === null) {
    return null;
  }

  const isHigh = volatility > 20;
  const isLow = volatility < 10;

  return (
    <div className="flex items-center justify-between p-3 bg-background-glass-subtle rounded-lg">
      <div>
        <p className="text-xs text-text-secondary mb-1">Volatility ({timeframe})</p>
        <div className="flex items-center gap-2">
          {isHigh ? (
            <TrendingUp className="w-4 h-4 text-red-400" />
          ) : isLow ? (
            <TrendingDown className="w-4 h-4 text-green-400" />
          ) : null}
          <span className="text-sm font-medium text-text-primary">{volatility.toFixed(1)}%</span>
        </div>
      </div>
      <Badge variant={isHigh ? 'critical' : isLow ? 'neutral' : 'level'}>
        {isHigh ? 'High' : isLow ? 'Low' : 'Medium'}
      </Badge>
    </div>
  );
}
