/**
 * TimelineCard - Interactive timeline
 * Points = Events
 * Overlays = Market spikes (watchlist tickers)
 * 
 * Data:
 * - GET /events?range=7d
 * - GET /markets/spikes?watchlist=default&range=7d
 */

import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';

interface TimelineEvent {
  id: string;
  date: string;
  headline: string;
  type: 'event' | 'market_spike';
  symbol?: string;
}

export default function TimelineCard() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch from GET /events?range=7d and GET /markets/spikes?watchlist=default&range=7d
    // Placeholder data
    setEvents([
      { id: '1', date: '2024-01-15T10:00:00Z', headline: 'Event 1', type: 'event' },
      { id: '2', date: '2024-01-15T14:00:00Z', headline: 'Market Spike', type: 'market_spike', symbol: 'AAPL' },
      { id: '3', date: '2024-01-16T09:00:00Z', headline: 'Event 2', type: 'event' },
    ]);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Card>
        <div className="h-64 animate-pulse bg-background-glass-subtle rounded-lg" />
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader title="Event Timeline" />
      
      <div className="mt-4 space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-3 p-3 bg-background-glass-subtle rounded-lg hover:bg-background-glass-medium transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-primary-red mt-2 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary truncate">{event.headline}</p>
              <p className="text-xs text-text-tertiary mt-1">
                {new Date(event.date).toLocaleDateString()}
                {event.symbol && ` · ${event.symbol}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
