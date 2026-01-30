/**
 * KPIStatCard - KPI statistics card
 * Used in Overview KPIGrid
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Sparkline from '../charts/Sparkline';

export interface KPIData {
  label: string;
  value: string | number;
  delta?: number; // percentage change
  trendData?: number[]; // for sparkline
  trendDirection?: 'up' | 'down' | 'neutral';
  subLabel?: string; // e.g. "Données indicatives"
}

interface KPIStatCardProps {
  data: KPIData;
  className?: string;
}

export default function KPIStatCard({ data, className = '' }: KPIStatCardProps) {
  const { label, value, delta, trendData, trendDirection, subLabel } = data;

  const getDeltaColor = () => {
    if (!delta) return 'text-text-secondary';
    if (delta > 0) return 'text-green-400';
    if (delta < 0) return 'text-red-400';
    return 'text-text-secondary';
  };

  const getDeltaIcon = () => {
    if (!delta) return null;
    if (delta > 0) return <TrendingUp className="w-4 h-4" />;
    if (delta < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  return (
    <div className={`bg-background-glass-subtle border border-borders-subtle rounded-xl p-5 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm text-text-secondary font-medium mb-1">{label}</p>
          <p className="text-2xl font-semibold text-text-primary">{value}</p>
          {subLabel && (
            <p className="text-xs text-text-tertiary font-light mt-1">{subLabel}</p>
          )}
        </div>
        {trendData && trendData.length > 0 && (
          <div className="w-16 h-8">
            <Sparkline data={trendData} />
          </div>
        )}
      </div>
      
      {delta !== undefined && (
        <div className={`flex items-center gap-1 text-sm ${getDeltaColor()}`}>
          {getDeltaIcon()}
          <span>{delta > 0 ? '+' : ''}{delta.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}
