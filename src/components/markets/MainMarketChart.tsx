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
import ErrorState from '../ui/ErrorState';
import { getNormalizedEvents } from '../../lib/supabase';
import { fetchMarketTimeSeries, getMarketErrorDisplay, type MarketDataError } from '../../lib/api/market-data-api';
import type { Event } from '../../types/intelligence';

interface MainMarketChartProps {
  symbol: string;
  timeframe: '1D' | '5D' | '1M' | '6M' | '1Y';
}

export default function MainMarketChart({ symbol, timeframe }: MainMarketChartProps) {
  const [priceData, setPriceData] = useState<any[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<MarketDataError | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    // Calculate days based on timeframe
    const daysMap: Record<typeof timeframe, number> = {
      '1D': 1,
      '5D': 5,
      '1M': 30,
      '6M': 180,
      '1Y': 365,
    };
    const days = daysMap[timeframe];

    // Fetch market data using robust wrapper
    const { data, error: marketError } = await fetchMarketTimeSeries(symbol, {
      interval: '1h',
      days,
    });

    if (marketError) {
      setError(marketError);
      setPriceData([]);
      setLoading(false);
      return;
    }

    if (data && data.values && data.values.length > 0) {
      const chartData = data.values.map((point: any) => ({
        timestamp: point.datetime || point.timestamp,
        price: parseFloat(point.close || point.price || 0),
      }));
      setPriceData(chartData);
    } else {
      setError({
        code: 'NO_DATA',
        message: `No market data available for ${symbol}`,
        provider: 'twelvedata',
        retryable: false,
      });
      setPriceData([]);
    }

    // Load related events (non-blocking)
    try {
      const relatedEvents = await getNormalizedEvents({ limit: 5 });
      setEvents(relatedEvents.slice(0, 5));
    } catch (eventError) {
      console.warn('Could not load related events:', eventError);
      // Don't fail the whole component if events fail
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [symbol, timeframe]);

  if (loading) {
    return (
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-text-primary">{symbol}</h2>
          <p className="text-sm text-text-secondary">Price Chart ({timeframe})</p>
        </div>
        <div className="h-96 animate-pulse bg-background-glass-subtle rounded-lg" />
      </Card>
    );
  }

  if (error) {
    const errorDisplay = getMarketErrorDisplay(error);
    return (
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-text-primary">{symbol}</h2>
          <p className="text-sm text-text-secondary">Price Chart ({timeframe})</p>
        </div>
        <div className="h-96 flex items-center justify-center">
          <ErrorState
            title={errorDisplay.title}
            message={errorDisplay.message}
            provider={error.provider}
            actionLabel={error.retryable ? errorDisplay.actionLabel : undefined}
            onAction={error.retryable ? loadData : undefined}
            className="max-w-md"
          />
        </div>
      </Card>
    );
  }

  if (priceData.length === 0) {
    return (
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-text-primary">{symbol}</h2>
          <p className="text-sm text-text-secondary">Price Chart ({timeframe})</p>
        </div>
        <div className="h-96 flex items-center justify-center text-text-secondary">
          No data available for {symbol}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-text-primary">{symbol}</h2>
        <p className="text-sm text-text-secondary">Price Chart ({timeframe})</p>
      </div>

      <PriceChart
        data={priceData}
        eventTimestamp={events[0]?.date}
        symbol={symbol}
        timeframe={timeframe}
      />
    </Card>
  );
}
