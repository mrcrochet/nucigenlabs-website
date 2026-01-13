/**
 * Mini Price Chart Component
 * 
 * Displays a small sparkline chart showing price movement before/after event
 */

import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { useMemo } from 'react';

export interface PriceDataPoint {
  timestamp: string;
  price: number;
  isBeforeEvent?: boolean;
}

interface MiniPriceChartProps {
  data: PriceDataPoint[];
  eventTimestamp?: string;
  height?: number;
  className?: string;
}

export default function MiniPriceChart({
  data,
  eventTimestamp,
  height = 60,
  className = '',
}: MiniPriceChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((point, index) => ({
      ...point,
      index,
      // Color based on before/after event
      isBefore: point.isBeforeEvent ?? (eventTimestamp ? new Date(point.timestamp) < new Date(eventTimestamp) : index < data.length / 2),
    }));
  }, [data, eventTimestamp]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-[${height}px] bg-white/[0.02] rounded-lg border border-white/[0.05] ${className}`}>
        <span className="text-xs text-slate-500 font-light">No price data</span>
      </div>
    );
  }

  // Calculate min/max for domain
  const prices = chartData.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1; // 10% padding

  // Determine if price is trending up or down
  const firstPrice = chartData[0]?.price || 0;
  const lastPrice = chartData[chartData.length - 1]?.price || 0;
  const isUpward = lastPrice > firstPrice;

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isUpward ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
              <stop offset="100%" stopColor={isUpward ? '#10b981' : '#ef4444'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-[#0A0A0A] border border-white/20 rounded-lg p-2 shadow-lg">
                    <p className="text-xs text-white font-light">
                      {new Date(data.timestamp).toLocaleTimeString()}
                    </p>
                    <p className="text-sm text-white font-light">
                      ${data.price.toFixed(2)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke={isUpward ? '#10b981' : '#ef4444'}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: isUpward ? '#10b981' : '#ef4444' }}
            fill="url(#priceGradient)"
            fillOpacity={0.3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
