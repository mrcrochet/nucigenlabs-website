/**
 * VolumeBars - Volume histogram
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export interface VolumeDataPoint {
  timestamp: string;
  volume: number;
}

interface VolumeBarsProps {
  data: VolumeDataPoint[];
}

export default function VolumeBars({ data }: VolumeBarsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-text-secondary text-sm">
        No volume data available
      </div>
    );
  }

  const chartData = data.map((point) => ({
    ...point,
    date: format(new Date(point.timestamp), 'MMM dd'),
  }));

  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: '10px' }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: '10px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(10, 10, 10, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="volume" fill="#E1463E" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
