/**
 * EventDetailHeader
 * 
 * Displays:
 * - headline
 * - date/time
 * - location
 * - source_type badge
 * - confidence badge (quality)
 */

import { useNavigate } from 'react-router-dom';
import Badge from '../ui/Badge';
import { Calendar, MapPin, ExternalLink, Brain } from 'lucide-react';
import type { Event } from '../../types/intelligence';

interface EventDetailHeaderProps {
  event: Event;
}

export default function EventDetailHeader({ event }: EventDetailHeaderProps) {
  const navigate = useNavigate();

  const getSourceTypeLabel = (sourceType?: string) => {
    switch (sourceType) {
      case 'newsapi_ai':
        return 'NewsAPI.ai';
      case 'tavily':
        return 'Tavily';
      case 'twelvedata':
        return 'Twelve Data';
      case 'firecrawl':
        return 'Firecrawl';
      case 'manual':
        return 'Manual';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-background-glass-subtle border border-borders-subtle rounded-xl p-6">
      <h1 className="text-2xl font-semibold text-text-primary mb-4">
        {event.headline}
      </h1>

      <div className="flex items-center gap-4 flex-wrap">
        {/* Date/Time */}
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Calendar className="w-4 h-4" />
          <span>{new Date(event.date).toLocaleString()}</span>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <MapPin className="w-4 h-4" />
            <span>{event.location}</span>
          </div>
        )}

        {/* Source Type Badge */}
        {event.source_type && (
          <Badge variant="neutral">
            {getSourceTypeLabel(event.source_type)}
          </Badge>
        )}

        {/* Confidence Badge (data quality, not importance) */}
        {event.confidence !== null && event.confidence !== undefined && (
          <Badge variant="neutral">
            Confidence: {event.confidence}%
          </Badge>
        )}

        {/* Source Count */}
        {event.source_count > 0 && (
          <span className="text-sm text-text-tertiary">
            {event.source_count} source{event.source_count > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/[0.05]">
        <button
          onClick={() => navigate(`/events/${event.id}/predictions`)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-sm font-light text-blue-300 transition-all duration-200 hover:scale-105"
        >
          <Brain className="w-4 h-4" />
          <span>View Predictions</span>
        </button>
      </div>
    </div>
  );
}
