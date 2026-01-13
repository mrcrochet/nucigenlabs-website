/**
 * AttributionPanel - Explanation of moves
 * 
 * List of 5 events close in time
 * For each: timestamp + headline + delta % close
 * FORBIDDEN: invent causality → say "temporal proximity", not "caused by"
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { getNormalizedEvents } from '../../lib/supabase';
import type { Event } from '../../types/intelligence';

interface AttributionPanelProps {
  symbol: string;
}

interface Attribution {
  event: Event;
  deltaPercent: number;
  temporalProximity: string;
}

export default function AttributionPanel({ symbol }: AttributionPanelProps) {
  const [attributions, setAttributions] = useState<Attribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAttributions = async () => {
      try {
        // Load recent events
        const recentEvents = await getNormalizedEvents({
          limit: 5,
        });

        // Fetch market data to calculate deltas
        const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '/api';
        let marketData: any = null;
        try {
          const marketResponse = await fetch(`${API_BASE}/api/market-data/${symbol}/timeseries?interval=1h&days=7`);
          if (marketResponse.ok) {
            const marketResult = await marketResponse.json();
            if (marketResult.success && marketResult.data) {
              marketData = marketResult.data;
            }
          }
        } catch (error) {
          console.warn('Could not fetch market data for attribution:', error);
        }

        // Create attributions with temporal proximity
        const attribs: Attribution[] = recentEvents.map((event) => {
          const eventTime = new Date(event.date).getTime();
          const now = Date.now();
          const hoursDiff = Math.abs(now - eventTime) / (1000 * 60 * 60);
          
          let temporalProximity = '';
          if (hoursDiff < 24) {
            temporalProximity = `within ${Math.floor(hoursDiff)}h`;
          } else {
            temporalProximity = `${Math.floor(hoursDiff / 24)} days ago`;
          }

          // Calculate delta from market data if available
          let deltaPercent = 0;
          if (marketData && marketData.values && marketData.values.length > 0) {
            // Find price before and after event
            const eventIndex = marketData.values.findIndex((point: any) => {
              const pointTime = new Date(point.datetime || point.timestamp).getTime();
              return Math.abs(pointTime - eventTime) < 24 * 60 * 60 * 1000; // within 24h
            });
            
            if (eventIndex > 0 && eventIndex < marketData.values.length - 1) {
              const beforePrice = parseFloat(marketData.values[eventIndex - 1].close || marketData.values[eventIndex - 1].price || 0);
              const afterPrice = parseFloat(marketData.values[eventIndex + 1].close || marketData.values[eventIndex + 1].price || 0);
              if (beforePrice > 0) {
                deltaPercent = ((afterPrice - beforePrice) / beforePrice) * 100;
              }
            }
          }

          return {
            event,
            deltaPercent,
            temporalProximity,
          };
        });

        setAttributions(attribs);
      } catch (error) {
        console.error('Error loading attributions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAttributions();
  }, [symbol]);

  if (loading) {
    return (
      <Card>
        <div className="h-64 animate-pulse bg-background-glass-subtle rounded-lg" />
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader title="Move Attribution" />
      
      <div className="mt-4 mb-4">
        <p className="text-xs text-text-tertiary italic">
          Temporal proximity analysis. Correlation does not imply causality.
        </p>
      </div>

      <div className="space-y-3">
        {attributions.map((attribution, index) => {
          const isPositive = attribution.deltaPercent >= 0;

          return (
            <Link
              key={attribution.event.id}
              to={`/events-feed/${attribution.event.id}`}
              className="block p-4 bg-background-glass-subtle rounded-lg hover:bg-background-glass-medium transition-colors border border-borders-subtle"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-text-primary mb-2 line-clamp-2">
                    {attribution.event.headline}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-text-tertiary">
                    <span>{new Date(attribution.event.date).toLocaleString()}</span>
                    <span>•</span>
                    <span className="italic">{attribution.temporalProximity}</span>
                    {attribution.event.sectors.length > 0 && (
                      <>
                        <span>•</span>
                        <Badge variant="sector">{attribution.event.sectors[0]}</Badge>
                      </>
                    )}
                  </div>
                </div>
                <div className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {isPositive ? '+' : ''}{attribution.deltaPercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </Link>
          );
        })}

        {attributions.length === 0 && (
          <div className="text-sm text-text-secondary text-center py-4">
            No attribution data available
          </div>
        )}
      </div>
    </Card>
  );
}
