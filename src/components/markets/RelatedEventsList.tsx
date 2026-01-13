/**
 * RelatedEventsList - Related events list
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import { getNormalizedEvents } from '../../lib/supabase';
import type { Event } from '../../types/intelligence';

interface RelatedEventsListProps {
  symbol: string;
}

export default function RelatedEventsList({ symbol }: RelatedEventsListProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        // TODO: Filter events by symbol/asset
        const relatedEvents = await getNormalizedEvents({
          limit: 10,
        });
        setEvents(relatedEvents);
      } catch (error) {
        console.error('Error loading related events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
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
      <SectionHeader title="Related Events" />
      
      <div className="mt-4 space-y-3">
        {events.map((event) => (
          <Link
            key={event.id}
            to={`/events-feed/${event.id}`}
            className="block p-3 bg-background-glass-subtle rounded-lg hover:bg-background-glass-medium transition-colors"
          >
            <h4 className="text-sm font-medium text-text-primary line-clamp-2 mb-2">
              {event.headline}
            </h4>
            <div className="flex items-center gap-2 flex-wrap text-xs text-text-tertiary">
              <span>{new Date(event.date).toLocaleDateString()}</span>
              {event.sectors.length > 0 && (
                <>
                  <span>•</span>
                  <Badge variant="sector">{event.sectors[0]}</Badge>
                </>
              )}
            </div>
          </Link>
        ))}

        {events.length === 0 && (
          <div className="text-sm text-text-secondary text-center py-4">
            No related events
          </div>
        )}
      </div>
    </Card>
  );
}
