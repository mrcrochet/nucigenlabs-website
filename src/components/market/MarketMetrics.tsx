/**
 * Market Metrics Component
 * 
 * Displays market data metrics for an event:
 * - Price change percentage
 * - Volatility change
 * - Volume change
 * - Impact estimé (Estimated impact)
 * - Actifs affectés (Affected assets)
 */

import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import Badge from '../ui/Badge';

export interface MarketMetricsData {
  symbol: string;
  priceChange?: number; // percentage
  volatilityChange?: number; // percentage
  volumeChange?: number; // percentage
  benchmarkChange?: number; // percentage vs benchmark
  timeFrame?: '1h' | '24h' | '7d' | '30d';
  estimatedImpact?: 'low' | 'medium' | 'high' | 'critical';
  affectedAssets?: string[]; // e.g., ['Copper', 'Shipping stocks']
}

interface MarketMetricsProps {
  data: MarketMetricsData;
  className?: string;
}

export default function MarketMetrics({ data, className = '' }: MarketMetricsProps) {
  const {
    symbol,
    priceChange = 0,
    volatilityChange = 0,
    volumeChange = 0,
    benchmarkChange,
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

  const getImpactLabel = (impact?: string) => {
    switch (impact) {
      case 'critical': return 'Critique';
      case 'high': return 'Élevé';
      case 'medium': return 'Modéré';
      case 'low': return 'Faible';
      default: return null;
    }
  };

  const getImpactBadgeVariant = (impact?: string): 'critical' | 'neutral' | 'level' => {
    switch (impact) {
      case 'critical':
      case 'high':
        return 'critical';
      case 'medium':
        return 'level';
      default:
        return 'neutral';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header: Symbol and Price Change */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <span className="text-base font-light text-white">{symbol}</span>
          <span className={`text-base font-light flex items-center gap-1.5 ${getChangeColor(priceChange)}`}>
            {getChangeIcon(priceChange)}
            {formatChange(priceChange)} / {timeFrame}
          </span>
        </div>
        {estimatedImpact && (
          <Badge variant={getImpactBadgeVariant(estimatedImpact)}>
            <AlertCircle className="w-3 h-3 mr-1.5" />
            Impact {getImpactLabel(estimatedImpact)}
          </Badge>
        )}
      </div>

      {/* Affected Assets */}
      {affectedAssets.length > 0 && (
        <div>
          <div className="text-xs text-slate-500 font-light mb-2 uppercase tracking-wide">Actifs affectés</div>
          <div className="flex flex-wrap gap-2">
            {affectedAssets.map((asset, idx) => (
              <Badge key={`asset-${idx}`} variant="sector">
                {asset}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Volatility */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3">
          <div className="text-xs text-slate-500 font-light mb-1">Volatilité</div>
          <div className={`text-sm font-light flex items-center gap-1 ${getChangeColor(volatilityChange)}`}>
            {getChangeIcon(volatilityChange)}
            {formatChange(volatilityChange)}
          </div>
        </div>

        {/* Volume */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3">
          <div className="text-xs text-slate-500 font-light mb-1">Volume</div>
          <div className={`text-sm font-light flex items-center gap-1 ${getChangeColor(volumeChange)}`}>
            {getChangeIcon(volumeChange)}
            {formatChange(volumeChange)}
          </div>
        </div>

        {/* Benchmark */}
        {benchmarkChange !== undefined ? (
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3">
            <div className="text-xs text-slate-500 font-light mb-1">vs Benchmark</div>
            <div className={`text-sm font-light flex items-center gap-1 ${getChangeColor(benchmarkChange)}`}>
              {getChangeIcon(benchmarkChange)}
              {formatChange(benchmarkChange)}
            </div>
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-3 opacity-50">
            <div className="text-xs text-slate-500 font-light mb-1">Impact</div>
            <div className="text-sm font-light text-slate-400">
              {estimatedImpact ? getImpactLabel(estimatedImpact) : 'N/A'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
