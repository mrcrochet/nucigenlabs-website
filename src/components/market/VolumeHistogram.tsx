/**
 * Volume Histogram Component
 * 
 * Displays a small histogram showing volume changes
 */

import { BarChart, Bar, ResponsiveContainer, XAxis } from 'recharts';
import { useMemo } from 'react';

export interface VolumeDataPoint {
  timestamp: string;
  volume: number;
}

interface VolumeHistogramProps {
  data: VolumeDataPoint[];
  height?: number;
  className?: string;
}

export default function VolumeHistogram({
  data,
  height = 40,
  className = '',
}: VolumeHistogramProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Group data into bins if too many points
    const maxBins = 20;
    if (data.length > maxBins) {
      const binSize = Math.ceil(data.length / maxBins);
      const bins: VolumeDataPoint[] = [];
      for (let i = 0; i < data.length; i += binSize) {
        const bin = data.slice(i, i + binSize);
        const avgVolume = bin.reduce((sum, d) => sum + d.volume, 0) / bin.length;
        bins.push({
          timestamp: bin[0].timestamp,
          volume: avgVolume,
        });
      }
      return bins;
    }
    
    return data.map((point, index) => ({
      ...point,
      index,
    }));
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-[${height}px] bg-white/[0.02] rounded border border-white/[0.05] ${className}`}>
        <span className="text-xs text-slate-500 font-light">No volume data</span>
      </div>
    );
  }

  const volumes = chartData.map(d => d.volume);
  const maxVolume = Math.max(...volumes);
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const isHighVolume = maxVolume > avgVolume * 1.5;

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="index" hide />
          <Bar
            dataKey="volume"
            fill={isHighVolume ? '#10b981' : '#6366f1'}
            fillOpacity={0.6}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
