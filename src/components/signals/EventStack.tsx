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
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    if (!signal.related_event_ids || signal.related_event_ids.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const loadedEvents = await Promise.all(
        signal.related_event_ids.map(async (id) => {
          try {
            return await getNormalizedEventById(id);
          } catch (err: any) {
            console.warn(`[EventStack] Failed to load event ${id}:`, err);
            return null;
          }
        })
      );
      // Filter out null values (failed loads)
      const validEvents = loadedEvents.filter((e): e is Event => e !== null);
      setEvents(validEvents);
      
      if (validEvents.length === 0 && signal.related_event_ids.length > 0) {
        setError(`Unable to load ${signal.related_event_ids.length} related event${signal.related_event_ids.length > 1 ? 's' : ''}`);
      }
    } catch (error: any) {
      console.error('[EventStack] Error loading events:', error);
      setEvents([]);
      setError(error.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
            {signal.related_event_ids && signal.related_event_ids.length > 0 ? (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="mb-2 text-yellow-400 font-medium">Unable to load related events</p>
                <p className="text-xs text-text-tertiary mb-3">
                  {signal.related_event_ids.length} event{signal.related_event_ids.length > 1 ? 's' : ''} referenced but not found in database
                </p>
                <p className="text-xs text-text-quaternary">
                  The events may still be processing or the event IDs may need to be verified.
                </p>
                {signal.related_event_ids.length > 0 && (
                  <>
                    <div className="mt-3 text-xs text-text-quaternary">
                      <p className="mb-1">Referenced event IDs:</p>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {signal.related_event_ids.slice(0, 3).map((id) => (
                          <code key={id} className="px-2 py-1 bg-background-glass-subtle rounded text-[10px] font-mono">
                            {id.substring(0, 8)}...
                          </code>
                        ))}
                        {signal.related_event_ids.length > 3 && (
                          <span className="text-text-quaternary">+{signal.related_event_ids.length - 3} more</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={loadEvents}
                      disabled={loading}
                      className="mt-3 px-3 py-1.5 bg-[#E1463E]/20 hover:bg-[#E1463E]/30 border border-[#E1463E]/30 rounded-lg text-xs text-[#E1463E] transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Loading...' : 'Retry Loading Events'}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="p-4 bg-background-glass-subtle border border-borders-subtle rounded-lg">
                <p className="text-text-secondary">No events linked to this signal</p>
                <p className="text-xs text-text-tertiary mt-2">
                  This signal was generated without specific event references.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
