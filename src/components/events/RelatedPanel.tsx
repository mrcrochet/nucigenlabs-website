/**
 * RelatedPanel
 * 
 * Sections:
 * - related events
 * - related signals (if already generated)
 * 
 * Actions:
 * - "Create signal from this event"
 * - "Add to watchlist"
 * - "Create alert"
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import { Plus, Bookmark, Bell } from 'lucide-react';
import type { Event } from '../../types/intelligence';

interface RelatedPanelProps {
  event: Event;
}

interface RelatedData {
  relatedEvents: Array<{ id: string; headline: string }>;
  relatedSignals: Array<{ id: string; title: string }>;
}

export default function RelatedPanel({ event }: RelatedPanelProps) {
  const [data, setData] = useState<RelatedData>({
    relatedEvents: [],
    relatedSignals: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch related events and signals
    setLoading(false);
  }, [event.id]);

  return (
    <div className="space-y-6">
      {/* Related Events */}
      <Card>
        <SectionHeader title="Related Events" />
        {loading ? (
          <div className="mt-4 h-32 animate-pulse bg-background-glass-subtle rounded-lg" />
        ) : data.relatedEvents.length > 0 ? (
          <div className="mt-4 space-y-2">
            {data.relatedEvents.map((relatedEvent) => (
              <Link
                key={relatedEvent.id}
                to={`/events/${relatedEvent.id}`}
                className="block p-2 bg-background-glass-subtle rounded-lg hover:bg-background-glass-medium transition-colors"
              >
                <p className="text-sm text-text-primary line-clamp-2">{relatedEvent.headline}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-4 text-sm text-text-secondary">No related events</div>
        )}
      </Card>

      {/* Related Signals */}
      {data.relatedSignals.length > 0 && (
        <Card>
          <SectionHeader title="Related Signals" />
          <div className="mt-4 space-y-2">
            {data.relatedSignals.map((signal) => (
              <Link
                key={signal.id}
                to={`/signals/${signal.id}`}
                className="block p-2 bg-background-glass-subtle rounded-lg hover:bg-background-glass-medium transition-colors"
              >
                <p className="text-sm text-text-primary">{signal.title}</p>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <SectionHeader title="Actions" />
        <div className="mt-4 space-y-2">
          <button className="w-full flex items-center gap-2 px-4 py-2 bg-background-glass-subtle rounded-lg hover:bg-background-glass-medium transition-colors text-sm text-text-primary">
            <Plus className="w-4 h-4" />
            <span>Create signal from this event</span>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-2 bg-background-glass-subtle rounded-lg hover:bg-background-glass-medium transition-colors text-sm text-text-primary">
            <Bookmark className="w-4 h-4" />
            <span>Add to watchlist</span>
          </button>
          <button className="w-full flex items-center gap-2 px-4 py-2 bg-background-glass-subtle rounded-lg hover:bg-background-glass-medium transition-colors text-sm text-text-primary">
            <Bell className="w-4 h-4" />
            <span>Create alert</span>
          </button>
        </div>
      </Card>
    </div>
  );
}
