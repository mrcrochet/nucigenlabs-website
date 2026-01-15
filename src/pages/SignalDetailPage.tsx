/**
 * Signal Detail Page (signals/:id)
 * 
 * Purpose: Prove the signal (evidence) + link it to market
 * 
 * Layout:
 * - Header (12): SignalHeader
 * - Row 2: Left (8): SignalEvidenceGraph + EventStack | Right (4): SignalMetricsCard + MarketValidationCard
 * - Row 3 (12): NextActionsBar
 * 
 * FORBIDDEN: projections, future scenarios (these belong to Impacts)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import AppShell from '../components/layout/AppShell';
import SignalHeader from '../components/signals/SignalHeader';
import SignalEvidenceGraph from '../components/signals/SignalEvidenceGraph';
import EventStack from '../components/signals/EventStack';
import SignalMetricsCard from '../components/signals/SignalMetricsCard';
import MarketValidationCard from '../components/signals/MarketValidationCard';
import NextActionsBar from '../components/signals/NextActionsBar';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import { getSignalsFromEvents, getNormalizedEventById, getOrCreateSupabaseUserId, getUserPreferences } from '../lib/supabase';
import type { Signal } from '../types/intelligence';
import SkeletonCard from '../components/ui/SkeletonCard';
import SignalEnrichment from '../components/signals/SignalEnrichment';
import SignalExplanation from '../components/signals/SignalExplanation';

function SignalDetailContent() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const navigate = useNavigate();
  const [signal, setSignal] = useState<Signal | null>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Signal ID required');
      setLoading(false);
      return;
    }

    const loadSignal = async () => {
      try {
        const userId = user ? await getOrCreateSupabaseUserId(user.id) : undefined;
        const allSignals = await getSignalsFromEvents({}, userId);
        const foundSignal = allSignals.find(s => s.id === id);
        
        if (!foundSignal) {
          setError('Signal not found');
        } else {
          setSignal(foundSignal);
        }

        // Load user preferences for enrichment
        if (user?.id) {
          try {
            const prefs = await getUserPreferences(user.id);
            setPreferences(prefs);
          } catch (err) {
            console.warn('Failed to load user preferences:', err);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load signal');
      } finally {
        setLoading(false);
      }
    };

    loadSignal();
  }, [id, user]);

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

  if (error || !signal) {
    return (
      <AppShell>
        <div className="col-span-1 sm:col-span-12">
          <div className="text-center py-12">
            <p className="text-text-primary mb-2">Signal not found</p>
            <p className="text-sm text-text-secondary mb-4">{error}</p>
            <button
              onClick={() => navigate('/signals-feed')}
              className="px-4 py-2 bg-primary-red text-text-primary rounded-lg hover:bg-primary-redHover transition-colors"
            >
              Back to Signals
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SEO 
        title={`${signal.title} — Nucigen`}
        description={signal.summary.substring(0, 160)}
      />

      {/* Header: SignalHeader */}
      <div className="col-span-1 sm:col-span-12">
        <SignalHeader signal={signal} />
      </div>

      {/* Row 2: Left (8) + Right (4) */}
      <div className="col-span-1 sm:col-span-8 space-y-6">
        <SignalEvidenceGraph signal={signal} />
        <EventStack signal={signal} />
        {/* Signal Explanation - Why significant, precedents, invalidation */}
        <SignalExplanation signal={signal} />
        {/* Perplexity Enrichment */}
        <SignalEnrichment 
          signal={signal} 
          userPreferences={preferences ? {
            preferred_sectors: preferences.preferred_sectors,
            preferred_regions: preferences.preferred_regions,
          } : undefined}
        />
      </div>
      <div className="col-span-1 sm:col-span-4 space-y-6">
        <SignalMetricsCard signal={signal} />
        <MarketValidationCard signal={signal} />
      </div>

      {/* Row 3: NextActionsBar */}
      <div className="col-span-1 sm:col-span-12">
        <NextActionsBar signal={signal} />
      </div>
    </AppShell>
  );
}

export default function SignalDetailPage() {
  return (
    <ProtectedRoute>
      <SignalDetailContent />
    </ProtectedRoute>
  );
}
