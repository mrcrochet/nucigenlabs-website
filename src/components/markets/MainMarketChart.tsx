/**
 * MainMarketChart - Main market chart
 * 
 * price line
 * event markers overlay
 * timeframe: 1D/5D/1M/6M/1Y
 * 
 * Data: Twelve Data timeseries
 */

import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import PriceChart from '../charts/PriceChart';
import { getNormalizedEvents } from '../../lib/supabase';
import type { Event } from '../../types/intelligence';

interface MainMarketChartProps {
  symbol: string;
  timeframe: '1D' | '5D' | '1M' | '6M' | '1Y';
}

export default function MainMarketChart({ symbol, timeframe }: MainMarketChartProps) {
  const [priceData, setPriceData] = useState<any[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Calculate days based on timeframe
        const daysMap: Record<typeof timeframe, number> = {
          '1D': 1,
          '5D': 5,
          '1M': 30,
          '6M': 180,
          '1Y': 365,
        };
        const days = daysMap[timeframe];

        // Fetch from API
        const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '/api';
        const response = await fetch(`${API_BASE}/api/market-data/${symbol}/timeseries?interval=1h&days=${days}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch market data: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success && result.data && result.data.values) {
          const data = result.data.values.map((point: any) => ({
            timestamp: point.datetime || point.timestamp,
            price: parseFloat(point.close || point.price || 0),
          }));
          setPriceData(data);
        } else {
          // Fallback to placeholder if API fails
          const now = Date.now();
          const data = Array.from({ length: days }, (_, i) => ({
            timestamp: new Date(now - (days - 1 - i) * 24 * 60 * 60 * 1000).toISOString(),
            price: 150 + Math.random() * 10,
          }));
          setPriceData(data);
        }

        // Load related events (filter by symbol if possible)
        const relatedEvents = await getNormalizedEvents({
          limit: 5,
        });
        setEvents(relatedEvents.slice(0, 5));
      } catch (error) {
        console.error('Error loading market data:', error);
        // Fallback to placeholder on error
        const now = Date.now();
        const data = Array.from({ length: 30 }, (_, i) => ({
          timestamp: new Date(now - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
          price: 150 + Math.random() * 10,
        }));
        setPriceData(data);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [symbol, timeframe]);

  if (loading) {
    return (
      <Card>
        <div className="h-96 animate-pulse bg-background-glass-subtle rounded-lg" />
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-text-primary">{symbol}</h2>
        <p className="text-sm text-text-secondary">Price Chart ({timeframe})</p>
      </div>

      {priceData.length > 0 && events.length > 0 ? (
        <PriceChart
          data={priceData}
          eventTimestamp={events[0].date}
          symbol={symbol}
          timeframe={timeframe}
        />
      ) : (
        <div className="h-96 flex items-center justify-center text-text-secondary">
          No data available
        </div>
      )}
    </Card>
  );
}
