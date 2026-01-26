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
    <Card className="max-h-64 overflow-y-auto">
      <SectionHeader title="Event Timeline" subtitle="Recent activity" />
      
      <div className="mt-3 space-y-2">
        {events.slice(0, 5).map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-2 p-2 bg-background-glass-subtle rounded-lg hover:bg-background-glass-medium transition-colors"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary-red mt-1.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-primary truncate">{event.headline}</p>
              <p className="text-xs text-text-tertiary mt-0.5">
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
