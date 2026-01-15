/**
 * ContextInspector - Right panel for event context
 * 
 * Sections:
 * - Related entities (max 6)
 * - Related assets (max 6)
 * - Similar events (max 5)
 * - Button: "Open Event Detail"
 * 
 * Data: GET /events/:id/context
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import { ExternalLink, ArrowRight } from 'lucide-react';
import EventEnrichment from './EventEnrichment';
import { getNormalizedEvents, getOrCreateSupabaseUserId } from '../../lib/supabase';
import { useUser } from '@clerk/clerk-react';
import type { Event } from '../../types/intelligence';

interface ContextData {
  relatedEntities: Array<{ id: string; name: string; type: string }>;
  relatedAssets: Array<{ symbol: string; name: string }>;
  similarEvents: Array<{ id: string; headline: string }>;
}

interface ContextInspectorProps {
  eventId: string;
}

export default function ContextInspector({ eventId }: ContextInspectorProps) {
  const { user } = useUser();
  const [data, setData] = useState<ContextData | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadContext = async () => {
      try {
        setLoading(true);
        
        // Load event data for enrichment
        const userId = user ? await getOrCreateSupabaseUserId(user.id) : undefined;
        const events = await getNormalizedEvents({ limit: 1 }, userId);
        const foundEvent = events.find(e => e.id === eventId);
        if (foundEvent && isActive) {
          setEvent(foundEvent);
        }

        // Load context data
        const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '/api';
        const response = await fetch(`${API_BASE}/events/${eventId}/context`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch context: ${response.statusText}`);
        }

        const result = await response.json();
        const contextData: ContextData = {
          relatedEntities: result?.relatedEntities ?? [],
          relatedAssets: result?.relatedAssets ?? [],
          similarEvents: result?.similarEvents ?? [],
        };

        if (isActive) {
          setData(contextData);
        }
      } catch (error) {
        if (!controller.signal.aborted && isActive) {
          console.error('Error loading event context:', error);
          setData(null);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    if (eventId) {
      loadContext();
    } else {
      setData(null);
      setLoading(false);
    }

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [eventId, user]);

  if (loading) {
    return (
      <Card>
        <div className="h-64 animate-pulse bg-background-glass-subtle rounded-lg" />
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <div className="text-text-secondary text-sm">No context available</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Enrichment (Perplexity on-demand) */}
      {event && <EventEnrichment event={event} />}

      {/* Related Entities */}
      {data.relatedEntities.length > 0 && (
        <Card>
          <SectionHeader title="Related Entities" />
          <div className="mt-4 space-y-2">
            {data.relatedEntities.slice(0, 6).map((entity) => (
              <Link
                key={entity.id}
                to={`/entities/${entity.id}`}
                className="flex items-center justify-between p-2 bg-background-glass-subtle rounded-lg hover:bg-background-glass-medium transition-colors"
              >
                <div>
                  <p className="text-sm text-text-primary">{entity.name}</p>
                  <p className="text-xs text-text-tertiary">{entity.type}</p>
                </div>
                <Badge variant="neutral" className="text-xs">
                  {entity.type}
                </Badge>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Related Assets */}
      {data.relatedAssets.length > 0 && (
        <Card>
          <SectionHeader title="Related Assets" />
          <div className="mt-4 space-y-2">
            {data.relatedAssets.slice(0, 6).map((asset) => (
              <Link
                key={asset.symbol}
                to={`/markets/${asset.symbol}`}
                className="flex items-center justify-between p-2 bg-background-glass-subtle rounded-lg hover:bg-background-glass-medium transition-colors"
              >
                <div>
                  <p className="text-sm text-text-primary">{asset.symbol}</p>
                  <p className="text-xs text-text-tertiary">{asset.name}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-text-tertiary" />
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Similar Events */}
      {data.similarEvents.length > 0 && (
        <Card>
          <SectionHeader title="Similar Events" />
          <div className="mt-4 space-y-2">
            {data.similarEvents.slice(0, 5).map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="block p-2 bg-background-glass-subtle rounded-lg hover:bg-background-glass-medium transition-colors"
              >
                <p className="text-sm text-text-primary line-clamp-2">{event.headline}</p>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Open Event Detail Button */}
      <Link
        to={`/events/${eventId}`}
        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary-red text-text-primary rounded-lg hover:bg-primary-redHover transition-colors"
      >
        <span>Open Event Detail</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
