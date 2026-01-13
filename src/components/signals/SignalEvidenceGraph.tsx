/**
 * SignalEvidenceGraph - Evidence graph visualization
 * 
 * nodes: events/entities/assets
 * edges: "linked by"
 */

import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import { getNormalizedEventById } from '../../lib/supabase';
import type { Signal } from '../../types/intelligence';
import type { Event } from '../../types/intelligence';

interface SignalEvidenceGraphProps {
  signal: Signal;
}

export default function SignalEvidenceGraph({ signal }: SignalEvidenceGraphProps) {
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
        console.error('Error loading events for evidence graph:', error);
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
      <SectionHeader title="Evidence Graph" />
      
      <div className="mt-4">
        {/* Simple graph visualization */}
        <div className="space-y-4">
          {/* Signal node */}
          <div className="p-4 bg-primary-red/10 border border-primary-red/20 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary-red" />
              <span className="font-medium text-text-primary">Signal: {signal.title}</span>
            </div>
          </div>

          {/* Event nodes */}
          {events.map((event, index) => (
            <div key={event.id} className="flex items-center gap-4">
              <div className="w-8 h-0.5 bg-borders-subtle" />
              <div className="flex-1 p-3 bg-background-glass-subtle border border-borders-subtle rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-text-secondary" />
                  <span className="text-sm text-text-primary">{event.headline}</span>
                </div>
                <div className="text-xs text-text-tertiary mt-1">
                  {new Date(event.date).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <div className="text-sm text-text-secondary text-center py-8">
              No related events found
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
