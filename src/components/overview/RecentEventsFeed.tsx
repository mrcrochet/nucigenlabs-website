/**
 * RecentEventsFeed - 8 events facts-only
 * 
 * Data: GET /events?range=24h&limit=8
 * 
 * FORBIDDEN: impact, why_it_matters, predictions
 */

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import { getNormalizedEvents, getOrCreateSupabaseUserId } from '../../lib/supabase';
import type { Event } from '../../types/intelligence';

export default function RecentEventsFeed() {
  const { user } = useUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const userId = user ? await getOrCreateSupabaseUserId(user.id) : undefined;
        const recentEvents = await getNormalizedEvents(
          {
            dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            dateTo: new Date().toISOString(),
            limit: 8,
          },
          userId
        );
        setEvents(recentEvents);
      } catch (error) {
        console.error('Error loading recent events:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <div className="h-64 animate-pulse bg-background-glass-subtle rounded-lg" />
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <SectionHeader title="Recent Events" />
        <div className="mt-4 text-sm text-text-secondary">
          No recent events available
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader title="Recent Events" />
      
      <div className="mt-4 space-y-3">
        {events.map((event) => (
          <Link
            key={event.id}
            to={`/events/${event.id}`}
            className="block p-3 bg-background-glass-subtle rounded-lg hover:bg-background-glass-medium transition-colors"
          >
            <h4 className="text-sm font-medium text-text-primary line-clamp-2 mb-2">
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
              {event.source_count > 0 && (
                <>
                  <span>•</span>
                  <span>{event.source_count} source{event.source_count > 1 ? 's' : ''}</span>
                </>
              )}
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
