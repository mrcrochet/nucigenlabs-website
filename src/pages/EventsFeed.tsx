/**
 * Events Feed Page
 * 
 * Purpose: Display factual base - who/what/where/when + evidence
 * 
 * Layout:
 * - Left (3): EventFiltersRail
 * - Center (6): EventsList
 * - Right (3): ContextInspector (click on card → quick detail)
 * 
 * FORBIDDEN: impact, why_it_matters, predictions
 */

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import AppShell from '../components/layout/AppShell';
import EventFiltersRail from '../components/events/EventFiltersRail';
import EventsList from '../components/events/EventsList';
import ContextInspector from '../components/events/ContextInspector';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import { getNormalizedEvents, getOrCreateSupabaseUserId } from '../lib/supabase';
import type { Event } from '../types/intelligence';

function EventsFeedContent() {
  const { user } = useUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    country: '',
    region: '',
    sector: '',
    source_type: '',
    confidence: [0, 100] as [number, number],
    timeRange: '7d' as '24h' | '7d' | '30d',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const userId = user ? await getOrCreateSupabaseUserId(user.id) : undefined;
        
        // Calculate date range
        const now = new Date();
        const daysAgo = filters.timeRange === '24h' ? 1 : filters.timeRange === '7d' ? 7 : 30;
        const dateFrom = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        const searchOptions: any = {
          dateFrom: dateFrom.toISOString(),
          dateTo: now.toISOString(),
        };

        // Apply filters
        if (filters.region) searchOptions.region = filters.region;
        if (filters.sector) searchOptions.sector = filters.sector;
        if (filters.type) searchOptions.eventType = filters.type;

        const fetchedEvents = await getNormalizedEvents(searchOptions, userId);

        // Apply client-side filters
        let filteredEvents = fetchedEvents;

        if (filters.source_type) {
          filteredEvents = filteredEvents.filter(
            e => e.source_type === filters.source_type
          );
        }

        if (filters.confidence[0] > 0 || filters.confidence[1] < 100) {
          filteredEvents = filteredEvents.filter(e => {
            const conf = e.confidence || 0;
            return conf >= filters.confidence[0] && conf <= filters.confidence[1];
          });
        }

        setEvents(filteredEvents);
      } catch (error) {
        console.error('Error loading events:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [filters, user]);

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  return (
    <AppShell showRightInspector={!!selectedEventId} rightInspectorContent={
      selectedEventId ? <ContextInspector eventId={selectedEventId} /> : null
    }>
      <SEO 
        title="Events — Nucigen"
        description="Factual events feed"
      />

      {/* Left: EventFiltersRail */}
      <div className="col-span-3">
        <EventFiltersRail
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* Center: EventsList */}
      <div className="col-span-6">
        <EventsList
          events={events}
          loading={loading}
          onEventClick={handleEventSelect}
        />
      </div>

      {/* Right: ContextInspector (handled by AppShell) */}
    </AppShell>
  );
}

export default function EventsFeed() {
  return (
    <ProtectedRoute>
      <EventsFeedContent />
    </ProtectedRoute>
  );
}
