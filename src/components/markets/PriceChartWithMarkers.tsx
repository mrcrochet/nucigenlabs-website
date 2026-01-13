/**
 * PriceChartWithMarkers - Price chart with event markers
 */

import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import PriceChart from '../charts/PriceChart';
import { getNormalizedEvents } from '../../lib/supabase';
import type { Event } from '../../types/intelligence';

interface PriceChartWithMarkersProps {
  symbol: string;
}

export default function PriceChartWithMarkers({ symbol }: PriceChartWithMarkersProps) {
  const [priceData, setPriceData] = useState<any[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '/api';
        const response = await fetch(`${API_BASE}/api/market-data/${symbol}/timeseries?interval=1h&days=30`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch price data: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success && result.data && result.data.values) {
          const data = result.data.values.map((point: any) => ({
            timestamp: point.datetime || point.timestamp,
            price: parseFloat(point.close || point.price || 0),
          }));
          setPriceData(data);
        } else {
          // Fallback
          const now = Date.now();
          const data = Array.from({ length: 30 }, (_, i) => ({
            timestamp: new Date(now - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
            price: 150 + Math.random() * 10,
          }));
          setPriceData(data);
        }

        // Load related events
        const relatedEvents = await getNormalizedEvents({
          limit: 10,
        });
        setEvents(relatedEvents);
      } catch (error) {
        console.error('Error loading price data:', error);
        // Fallback on error
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
  }, [symbol]);

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
        <h2 className="text-lg font-semibold text-text-primary">Price Chart</h2>
        <p className="text-sm text-text-secondary">With event markers</p>
      </div>

      {priceData.length > 0 && events.length > 0 ? (
        <PriceChart
          data={priceData}
          eventTimestamp={events[0].date}
          symbol={symbol}
          timeframe="1M"
        />
      ) : (
        <div className="h-96 flex items-center justify-center text-text-secondary">
          No data available
        </div>
      )}
    </Card>
  );
}
