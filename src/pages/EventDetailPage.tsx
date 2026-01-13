/**
 * Event Detail Page (events/:id)
 * 
 * Purpose: Prove the event and show facts + sources + market reaction
 * 
 * Layout:
 * - Top (12): EventDetailHeader
 * - Row 2: Left (8): EventFactsPanel + EvidenceSourcesPanel | Right (4): MarketPanel + RelatedPanel
 * 
 * FORBIDDEN: impact, why_it_matters, predictions (these belong to Signals/Impacts)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import EventDetailHeader from '../components/events/EventDetailHeader';
import EventFactsPanel from '../components/events/EventFactsPanel';
import EvidenceSourcesPanel from '../components/events/EvidenceSourcesPanel';
import MarketPanel from '../components/events/MarketPanel';
import RelatedPanel from '../components/events/RelatedPanel';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import { getNormalizedEventById } from '../lib/supabase';
import type { Event } from '../types/intelligence';
import SkeletonCard from '../components/ui/SkeletonCard';

function EventDetailContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Event ID required');
      setLoading(false);
      return;
    }

    const loadEvent = async () => {
      try {
        const eventData = await getNormalizedEventById(id);
        setEvent(eventData);
      } catch (err: any) {
        setError(err.message || 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="col-span-1 sm:col-span-12 space-y-6">
          <SkeletonCard />
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-1 sm:col-span-8 space-y-6">
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <div className="col-span-1 sm:col-span-4 space-y-6">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !event) {
    return (
      <AppShell>
        <div className="col-span-1 sm:col-span-12">
          <div className="text-center py-12">
            <p className="text-text-primary mb-2">Event not found</p>
            <p className="text-sm text-text-secondary mb-4">{error}</p>
            <button
              onClick={() => navigate('/events')}
              className="px-4 py-2 bg-primary-red text-text-primary rounded-lg hover:bg-primary-redHover transition-colors"
            >
              Back to Events
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SEO 
        title={`${event.headline} — Nucigen`}
        description={event.description.substring(0, 160)}
      />

      {/* Top: EventDetailHeader */}
      <div className="col-span-1 sm:col-span-12">
        <EventDetailHeader event={event} />
      </div>

      {/* Row 2: Left (8) + Right (4) */}
      <div className="col-span-1 sm:col-span-8 space-y-6">
        <EventFactsPanel event={event} />
        <EvidenceSourcesPanel event={event} />
      </div>
      <div className="col-span-1 sm:col-span-4 space-y-6">
        <MarketPanel event={event} />
        <RelatedPanel event={event} />
      </div>
    </AppShell>
  );
}

export default function EventDetailPage() {
  return (
    <ProtectedRoute>
      <EventDetailContent />
    </ProtectedRoute>
  );
}
