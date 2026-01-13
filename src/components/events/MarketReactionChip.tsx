/**
 * MarketReactionChip - Shows market reaction for linked asset
 * sparkline + %
 */

import Sparkline from '../charts/Sparkline';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketReactionChipProps {
  symbol: string;
  changePercent: number;
  sparklineData?: number[];
}

export default function MarketReactionChip({
  symbol,
  changePercent,
  sparklineData = [],
}: MarketReactionChipProps) {
  // Generate placeholder sparkline if no data
  const data = sparklineData.length > 0 
    ? sparklineData 
    : Array.from({ length: 10 }, () => Math.random() * 100);

  const isPositive = changePercent > 0;
  const color = isPositive ? 'text-green-400' : 'text-red-400';

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-background-glass-subtle rounded-lg">
      <span className="text-xs font-medium text-text-secondary">{symbol}</span>
      <div className={`flex items-center gap-1 ${color}`}>
        {isPositive ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        <span className="text-xs font-medium">
          {changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
      </div>
      <div className="w-12 h-4">
        <Sparkline data={data} color={isPositive ? '#10b981' : '#ef4444'} />
      </div>
    </div>
  );
}
