/**
 * TimelineCard - Interactive timeline (events from last 7 days)
 * Data: GET /api/events?dateFrom=&dateTo=&limit=10
 * Market spikes: bientôt disponible
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import { apiUrl } from '../../lib/api-base';

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
    let cancelled = false;
    const dateTo = new Date();
    const dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const url = apiUrl(
      `/api/events?dateFrom=${encodeURIComponent(dateFrom.toISOString())}&dateTo=${encodeURIComponent(dateTo.toISOString())}&limit=10`
    );
    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled || !json?.success || !Array.isArray(json.data?.events)) return;
        const list = (json.data.events as Array<{ id?: string; event_id?: string; headline?: string; summary?: string; date?: string }>)
          .map((e) => ({
            id: e.id ?? e.event_id ?? '',
            date: e.date ?? new Date().toISOString(),
            headline: e.headline ?? e.summary ?? 'Event',
            type: 'event' as const,
          }))
          .filter((e) => e.id);
        setEvents(list);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
      <SectionHeader
        title="Event Timeline"
        subtitle="Indices et mouvements de marché bientôt disponibles"
      />
      {events.length === 0 ? (
        <div className="mt-4 text-sm text-text-secondary">
          Aucun événement sur la période
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
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
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
