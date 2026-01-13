/**
 * EventsList - Main events feed
 * 
 * EventCard displays EXACT:
 * - headline (max 2 lines)
 * - date + location
 * - actors chips (max 4 + "+n")
 * - sector chip
 * - source_count + logos sources
 * - if linked to asset: MarketReactionChip (sparkline + %)
 * 
 * FORBIDDEN: impact, why_it_matters, predictions
 */

import { useState } from 'react';
import EventCard from './EventCard';
import Card from '../ui/Card';
import SkeletonCard from '../ui/SkeletonCard';
import type { Event } from '../../types/intelligence';

interface EventsListProps {
  events: Event[];
  loading: boolean;
  onEventClick: (eventId: string) => void;
}

export default function EventsList({ events, loading, onEventClick }: EventsListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-text-secondary mb-4">No events found</p>
          <p className="text-sm text-text-tertiary">Try adjusting your filters</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onClick={() => onEventClick(event.id)}
        />
      ))}
    </div>
  );
}
