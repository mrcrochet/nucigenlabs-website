/**
 * EventFactsPanel
 * 
 * Table key/values:
 * - event_type, event_subtype
 * - country, region, sector
 * - actors
 * - extracted_summary (max 2 sentences)
 * 
 * FORBIDDEN: impact, why_it_matters, predictions
 */

import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import type { Event } from '../../types/intelligence';

interface EventFactsPanelProps {
  event: Event;
}

export default function EventFactsPanel({ event }: EventFactsPanelProps) {
  return (
    <Card>
      <SectionHeader title="Event Facts" />
      
      <div className="mt-4 space-y-4">
        {/* Event Type */}
        {(event.event_type || event.event_subtype) && (
          <div className="flex items-start">
            <div className="w-32 text-sm text-text-secondary font-medium">Type</div>
            <div className="flex-1">
              {event.event_type && (
                <Badge variant="level" className="mr-2">{event.event_type}</Badge>
              )}
              {event.event_subtype && (
                <Badge variant="neutral">{event.event_subtype}</Badge>
              )}
            </div>
          </div>
        )}

        {/* Country/Region */}
        {(event.country || event.region) && (
          <div className="flex items-start">
            <div className="w-32 text-sm text-text-secondary font-medium">Location</div>
            <div className="flex-1">
              {event.country && (
                <span className="text-sm text-text-primary mr-2">{event.country}</span>
              )}
              {event.region && (
                <Badge variant="region">{event.region}</Badge>
              )}
            </div>
          </div>
        )}

        {/* Sector */}
        {event.sectors.length > 0 && (
          <div className="flex items-start">
            <div className="w-32 text-sm text-text-secondary font-medium">Sector</div>
            <div className="flex-1 flex flex-wrap gap-2">
              {event.sectors.map((sector, idx) => (
                <Badge key={idx} variant="sector">{sector}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actors */}
        {event.actors.length > 0 && (
          <div className="flex items-start">
            <div className="w-32 text-sm text-text-secondary font-medium">Actors</div>
            <div className="flex-1 flex flex-wrap gap-2">
              {event.actors.map((actor, idx) => (
                <Badge key={idx} variant="neutral">{actor}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Summary (max 2 sentences) */}
        {event.description && (
          <div className="flex items-start">
            <div className="w-32 text-sm text-text-secondary font-medium">Summary</div>
            <div className="flex-1">
              <p className="text-sm text-text-primary leading-relaxed">
                {event.description.split('.').slice(0, 2).join('.')}
                {event.description.split('.').length > 2 && '.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
