/**
 * EventStack - Events that compose the signal
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import { getNormalizedEventById } from '../../lib/supabase';
import type { Signal } from '../../types/intelligence';
import type { Event } from '../../types/intelligence';

interface EventStackProps {
  signal: Signal;
}

export default function EventStack({ signal }: EventStackProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      if (!signal.related_event_ids || signal.related_event_ids.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const loadedEvents = await Promise.all(
          signal.related_event_ids.map(id => getNormalizedEventById(id))
        );
        setEvents(loadedEvents);
      } catch (error) {
        console.error('Error loading events for stack:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [signal.related_event_ids]);

  if (loading) {
    return (
      <Card>
        <div className="h-64 animate-pulse bg-background-glass-subtle rounded-lg" />
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader title="Event Stack" />
      
      <div className="mt-4 space-y-3">
        {events.map((event) => (
          <Link
            key={event.id}
            to={`/events-feed/${event.id}`}
            className="block p-4 bg-background-glass-subtle rounded-lg hover:bg-background-glass-medium transition-colors border border-borders-subtle"
          >
            <h4 className="text-sm font-medium text-text-primary mb-2 line-clamp-2">
              {event.headline}
            </h4>
            <div className="flex items-center gap-2 flex-wrap text-xs text-text-tertiary">
              <span>{new Date(event.date).toLocaleDateString()}</span>
              {event.location && (
                <>
                  <span>•</span>
                  <span>{event.location}</span>
                </>
              )}
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
          <div className="text-sm text-text-secondary text-center py-8">
            No events found
          </div>
        )}
      </div>
    </Card>
  );
}
