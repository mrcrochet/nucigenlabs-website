/**
 * Signals Feed Page
 * 
 * Purpose: Transform events into interpreted patterns (present)
 * 
 * Layout:
 * - Left (3): SignalFilters
 * - Center (9): SignalsTable + preview drawer
 * 
 * Table columns EXACT:
 * - Signal
 * - Theme
 * - Strength
 * - Confidence
 * - #events
 * - Linked assets
 * - Updated
 * 
 * FORBIDDEN: projections, future scenarios (these belong to Impacts)
 */

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import AppShell from '../components/layout/AppShell';
import SignalFilters from '../components/signals/SignalFilters';
import SignalsTable from '../components/signals/SignalsTable';
import SignalPreviewDrawer from '../components/signals/SignalPreviewDrawer';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import { getSignalsFromEvents, getOrCreateSupabaseUserId } from '../lib/supabase';
import type { Signal } from '../types/intelligence';

function SignalsFeedContent() {
  const { user } = useUser();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    theme: '',
    sector: '',
    region: '',
    strengthMin: 0,
    confidenceMin: 0,
    timeWindow: '7d' as '24h' | '7d' | '30d',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSignals = async () => {
      try {
        const userId = user ? await getOrCreateSupabaseUserId(user.id) : undefined;
        
        // Calculate date range
        const now = new Date();
        const daysAgo = filters.timeWindow === '24h' ? 1 : filters.timeWindow === '7d' ? 7 : 30;
        const dateFrom = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        const searchOptions: any = {
          dateFrom: dateFrom.toISOString(),
          dateTo: now.toISOString(),
        };

        // Apply filters
        if (filters.region) searchOptions.region = filters.region;
        if (filters.sector) searchOptions.sector = filters.sector;

        const fetchedSignals = await getSignalsFromEvents(searchOptions, userId);

        // Apply client-side filters
        let filteredSignals = fetchedSignals;

        if (filters.strengthMin > 0) {
          filteredSignals = filteredSignals.filter(
            s => (s.impact_score || 0) >= filters.strengthMin
          );
        }

        if (filters.confidenceMin > 0) {
          filteredSignals = filteredSignals.filter(
            s => (s.confidence_score || 0) >= filters.confidenceMin
          );
        }

        // Sort by strength (impact_score)
        filteredSignals.sort((a, b) => (b.impact_score || 0) - (a.impact_score || 0));

        setSignals(filteredSignals);
      } catch (error) {
        console.error('Error loading signals:', error);
        setSignals([]);
      } finally {
        setLoading(false);
      }
    };

    loadSignals();
  }, [filters, user]);

  const handleSignalSelect = (signalId: string) => {
    setSelectedSignalId(signalId);
  };

  return (
    <AppShell>
      <SEO 
        title="Signals — Nucigen"
        description="Intelligence signals feed"
      />

      {/* Left: SignalFilters */}
      <div className="col-span-3">
        <SignalFilters
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* Center: SignalsTable */}
      <div className="col-span-9">
        <SignalsTable
          signals={signals}
          loading={loading}
          onSignalClick={handleSignalSelect}
        />
      </div>

      {/* Preview Drawer */}
      {selectedSignalId && (
        <SignalPreviewDrawer
          signalId={selectedSignalId}
          onClose={() => setSelectedSignalId(null)}
        />
      )}
    </AppShell>
  );
}

export default function SignalsFeed() {
  return (
    <ProtectedRoute>
      <SignalsFeedContent />
    </ProtectedRoute>
  );
}
