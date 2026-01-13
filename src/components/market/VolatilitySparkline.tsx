/**
 * Volatility Sparkline Component
 * 
 * Displays a small sparkline showing volatility changes
 */

import { LineChart, Line, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useMemo } from 'react';

export interface VolatilityDataPoint {
  timestamp: string;
  volatility: number; // percentage
}

interface VolatilitySparklineProps {
  data: VolatilityDataPoint[];
  height?: number;
  className?: string;
}

export default function VolatilitySparkline({
  data,
  height = 40,
  className = '',
}: VolatilitySparklineProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((point, index) => ({
      ...point,
      index,
    }));
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-[${height}px] bg-white/[0.02] rounded border border-white/[0.05] ${className}`}>
        <span className="text-xs text-slate-500 font-light">No volatility data</span>
      </div>
    );
  }

  const volatilities = chartData.map(d => d.volatility);
  const maxVolatility = Math.max(...volatilities);
  const avgVolatility = volatilities.reduce((a, b) => a + b, 0) / volatilities.length;
  const isHighVolatility = maxVolatility > avgVolatility * 1.5;

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="volatilityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isHighVolatility ? '#f59e0b' : '#6366f1'} stopOpacity={0.4} />
              <stop offset="100%" stopColor={isHighVolatility ? '#f59e0b' : '#6366f1'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="volatility"
            stroke={isHighVolatility ? '#f59e0b' : '#6366f1'}
            strokeWidth={1.5}
            fill="url(#volatilityGradient)"
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
