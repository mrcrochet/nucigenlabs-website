/**
 * EventCard - Event card in feed
 * 
 * Displays EXACT:
 * - headline (max 2 lines)
 * - date + location
 * - actors chips (max 4 + "+n")
 * - sector chip
 * - source_count + logos sources
 * - if linked to asset: MarketReactionChip (sparkline + %)
 * 
 * FORBIDDEN: impact, why_it_matters, predictions
 */

import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import MarketReactionChip from './MarketReactionChip';
import { ExternalLink, Calendar, MapPin } from 'lucide-react';
import type { Event } from '../../types/intelligence';

interface EventCardProps {
  event: Event;
  onClick: () => void;
}

export default function EventCard({ event, onClick }: EventCardProps) {
  const displayActors = event.actors.slice(0, 4);
  const remainingActors = event.actors.length - 4;

  return (
    <Card className="cursor-pointer hover:bg-background-glass-medium transition-colors" onClick={onClick}>
      {/* Headline (max 2 lines) */}
      <h3 className="text-base font-medium text-text-primary line-clamp-2 mb-3">
        {event.headline}
      </h3>

      {/* Date + Location */}
      <div className="flex items-center gap-4 text-sm text-text-secondary mb-3">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          <span>{new Date(event.date).toLocaleDateString()}</span>
        </div>
        {event.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            <span>{event.location}</span>
          </div>
        )}
      </div>

      {/* Actors chips (max 4 + "+n") */}
      {displayActors.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {displayActors.map((actor, idx) => (
            <Badge key={idx} variant="neutral" className="text-xs">
              {actor}
            </Badge>
          ))}
          {remainingActors > 0 && (
            <Badge variant="neutral" className="text-xs">
              +{remainingActors}
            </Badge>
          )}
        </div>
      )}

      {/* Sector + category (event_type) — classification badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {event.sectors.length > 0 && (
          <Badge variant="sector">{event.sectors[0]}</Badge>
        )}
        {(event as Event & { event_type?: string }).event_type && (
          <Badge variant="category">{(event as Event & { event_type?: string }).event_type}</Badge>
        )}
      </div>

      {/* Bottom row: Sources (micro-source) + Market Reaction */}
      <div className="flex items-center justify-between pt-3 border-t border-borders-subtle">
        {/* Source count + logos */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary">
            {event.source_count || event.sources?.length || 0} source{event.source_count !== 1 ? 's' : ''}
          </span>
          {event.sources && event.sources.length > 0 && (
            <div className="flex items-center gap-1">
              {event.sources.slice(0, 3).map((source, idx) => (
                <a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-text-tertiary hover:text-text-secondary"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Market Reaction Chip (if linked to asset) */}
        {event.market_data?.symbol && (
          <MarketReactionChip
            symbol={event.market_data.symbol}
            changePercent={event.market_data.change_percent || 0}
          />
        )}
      </div>
    </Card>
  );
}
