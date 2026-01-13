/**
 * Compact Market Metrics Component
 * 
 * Displays compact market metrics inline in event cards
 * Format: 📈 Symbol +X.X% / 24h | Volatilité +X% | Volume +X%
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface MarketMetricsCompactData {
  symbol: string;
  priceChange?: number; // percentage
  volatilityChange?: number; // percentage
  volumeChange?: number; // percentage
  timeFrame?: '1h' | '24h' | '7d' | '30d';
  estimatedImpact?: 'low' | 'medium' | 'high' | 'critical';
  affectedAssets?: string[];
}

interface MarketMetricsCompactProps {
  data: MarketMetricsCompactData;
  className?: string;
}

export default function MarketMetricsCompact({ data, className = '' }: MarketMetricsCompactProps) {
  const {
    symbol,
    priceChange = 0,
    volatilityChange = 0,
    volumeChange = 0,
    timeFrame = '24h',
    estimatedImpact,
    affectedAssets = [],
  } = data;

  const formatChange = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getChangeIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-3 h-3" />;
    if (value < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Symbol and Price */}
      <div className={`flex items-center gap-2 text-sm font-light ${getChangeColor(priceChange)}`}>
        <span className="text-base">📈</span>
        <span className="font-medium text-white">{symbol}</span>
        <span className="flex items-center gap-1">
          {getChangeIcon(priceChange)}
          {formatChange(priceChange)} / {timeFrame}
        </span>
        {estimatedImpact && estimatedImpact !== 'low' && (
          <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
            Impact {estimatedImpact === 'critical' ? 'Critique' : estimatedImpact === 'high' ? 'Élevé' : 'Modéré'}
          </span>
        )}
      </div>

      {/* Metrics Row */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-light">
        {/* Volatility */}
        <div className={`flex items-center gap-1.5 ${getChangeColor(volatilityChange)}`}>
          <span className="text-slate-500">Volatilité</span>
          <span className="flex items-center gap-1">
            {getChangeIcon(volatilityChange)}
            {formatChange(volatilityChange)}
          </span>
        </div>

        {/* Volume */}
        <div className={`flex items-center gap-1.5 ${getChangeColor(volumeChange)}`}>
          <span className="text-slate-500">Volume</span>
          <span className="flex items-center gap-1">
            {getChangeIcon(volumeChange)}
            {formatChange(volumeChange)}
          </span>
        </div>

        {/* Affected Assets */}
        {affectedAssets.length > 0 && (
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-slate-500">Actifs:</span>
            <span>{affectedAssets.slice(0, 3).join(', ')}{affectedAssets.length > 3 ? '...' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}
