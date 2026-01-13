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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '/api';
        const response = await fetch(`${API_BASE}/api/market-data/${symbol}/timeseries?interval=1h&days=30`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || `Failed to fetch price data: ${response.statusText}`;
          
          if (errorMessage.includes('TWELVEDATA_API_KEY') || errorMessage.includes('not configured')) {
            throw new Error('Twelve Data API key not configured');
          }
          
          throw new Error(errorMessage);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch price data');
        }
        
        if (result.data && result.data.values && result.data.values.length > 0) {
          const data = result.data.values.map((point: any) => ({
            timestamp: point.datetime || point.timestamp,
            price: parseFloat(point.close || point.price || 0),
          }));
          setPriceData(data);
        } else {
          throw new Error('No price data available for this symbol');
        }

        // Load related events
        try {
          const relatedEvents = await getNormalizedEvents({
            limit: 10,
          });
          setEvents(relatedEvents);
        } catch (eventError) {
          console.warn('Could not load related events:', eventError);
        }
      } catch (error: any) {
        console.error('Error loading price data:', error);
        setError(error.message || 'Failed to load price data');
        setPriceData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [symbol]);

  if (loading) {
    return (
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Price Chart</h2>
          <p className="text-sm text-text-secondary">With event markers</p>
        </div>
        <div className="h-96 animate-pulse bg-background-glass-subtle rounded-lg" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Price Chart</h2>
          <p className="text-sm text-text-secondary">With event markers</p>
        </div>
        <div className="h-96 flex flex-col items-center justify-center text-center p-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 max-w-md">
            <p className="text-red-400 font-medium mb-2">Error loading price data</p>
            <p className="text-sm text-text-secondary">{error}</p>
            {error.includes('API key') && (
              <p className="text-xs text-text-secondary mt-2">
                Please check TWELVEDATA_SETUP.md for configuration instructions.
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (priceData.length === 0) {
    return (
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Price Chart</h2>
          <p className="text-sm text-text-secondary">With event markers</p>
        </div>
        <div className="h-96 flex items-center justify-center text-text-secondary">
          No price data available for {symbol}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Price Chart</h2>
        <p className="text-sm text-text-secondary">With event markers</p>
      </div>

      <PriceChart
        data={priceData}
        eventTimestamp={events[0]?.date}
        symbol={symbol}
        timeframe="1M"
      />
    </Card>
  );
}
