/**
 * PriceChart - Grand chart + timeframe
 * Includes Event Markers Overlay
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';

export interface PriceDataPoint {
  timestamp: string;
  price: number;
}

interface PriceChartProps {
  data: PriceDataPoint[];
  eventTimestamp: string;
  symbol: string;
  timeframe?: '1D' | '5D' | '1M' | '6M' | '1Y';
}

export default function PriceChart({
  data,
  eventTimestamp,
  symbol,
  timeframe = '1M',
}: PriceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-text-secondary text-sm">
        No price data available
      </div>
    );
  }

  const chartData = data.map((point) => ({
    ...point,
    date: format(new Date(point.timestamp), 'MMM dd'),
  }));

  const eventDate = new Date(eventTimestamp);
  const eventDataPoint = chartData.find(
    (point) => Math.abs(new Date(point.timestamp).getTime() - eventDate.getTime()) < 86400000 // within 24h
  );

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(10, 10, 10, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
            }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#E1463E"
            strokeWidth={2}
            dot={false}
          />
          {/* Event Marker */}
          {eventDataPoint && (
            <ReferenceLine
              x={eventDataPoint.date}
              stroke="#10b981"
              strokeDasharray="5 5"
              label={{ value: 'Event', position: 'top', fill: '#10b981' }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
