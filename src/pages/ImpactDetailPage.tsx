/**
 * Impact Detail Page (impacts/:id)
 * 
 * Purpose: Show projection + invalidation conditions + assets
 * 
 * Layout:
 * - Header (12)
 * - Row 2: Left (7): ScenarioNarrative + AssumptionsList + Pathways | Right (5): ProbabilityPanel + AssetsExposurePanel + ChartPack
 * - Row 3 (12): InvalidationPanel
 * 
 * FORBIDDEN: facts, events (these belong to Events/Signals)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import ScenarioNarrative from '../components/impacts/ScenarioNarrative';
import AssumptionsList from '../components/impacts/AssumptionsList';
import Pathways from '../components/impacts/Pathways';
import ProbabilityPanel from '../components/impacts/ProbabilityPanel';
import AssetsExposurePanel from '../components/impacts/AssetsExposurePanel';
import ChartPack from '../components/impacts/ChartPack';
import InvalidationPanel from '../components/impacts/InvalidationPanel';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import SkeletonCard from '../components/ui/SkeletonCard';
import type { Impact } from '../types/intelligence';

function ImpactDetailContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [impact, setImpact] = useState<Impact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Impact ID required');
      setLoading(false);
      return;
    }

    const loadImpact = async () => {
      try {
        // Fetch all impacts and find the one matching the ID
        const { getSignalsFromEvents } = await import('../lib/supabase');
        const allSignals = await getSignalsFromEvents({});
        
        if (allSignals.length === 0) {
          setError('No signals available to generate impacts');
          setLoading(false);
          return;
        }

        // Generate impacts from signals
        const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '/api';
        const response = await fetch(`${API_BASE}/api/impacts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            signals: allSignals,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch impacts: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success && result.impacts) {
          const foundImpact = result.impacts.find((i: Impact) => i.id === id);
          if (foundImpact) {
            setImpact(foundImpact);
          } else {
            setError('Impact not found');
          }
        } else {
          setError('Failed to load impacts');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load impact');
      } finally {
        setLoading(false);
      }
    };

    loadImpact();
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="col-span-1 sm:col-span-12 space-y-6">
          <SkeletonCard />
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-1 sm:col-span-7 space-y-6">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <div className="col-span-1 sm:col-span-5 space-y-6">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !impact) {
    return (
      <AppShell>
        <div className="col-span-1 sm:col-span-12">
          <div className="text-center py-12">
            <p className="text-text-primary mb-2">Impact not found</p>
            <p className="text-sm text-text-secondary mb-4">{error}</p>
            <button
              onClick={() => navigate('/impacts')}
              className="px-4 py-2 bg-primary-red text-text-primary rounded-lg hover:bg-primary-redHover transition-colors"
            >
              Back to Impacts
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SEO 
        title={`${impact.risk_headline} — Nucigen`}
        description={impact.scenario_summary?.substring(0, 160) || impact.risk_headline}
      />

      {/* Header */}
      <div className="col-span-1 sm:col-span-12">
        <div className="bg-background-glass-subtle border border-borders-subtle rounded-xl p-6">
          <h1 className="text-2xl font-semibold text-text-primary mb-4">
            {impact.risk_headline}
          </h1>
          {impact.opportunity && (
            <p className="text-text-secondary mb-4">{impact.opportunity}</p>
          )}
        </div>
      </div>

      {/* Row 2: Left (7) + Right (5) */}
      <div className="col-span-1 sm:col-span-7 space-y-6">
        <ScenarioNarrative impact={impact} />
        <AssumptionsList impact={impact} />
        <Pathways impact={impact} />
      </div>
      <div className="col-span-1 sm:col-span-5 space-y-6">
        <ProbabilityPanel impact={impact} />
        <AssetsExposurePanel impact={impact} />
        <ChartPack impact={impact} />
      </div>

      {/* Row 3: InvalidationPanel */}
      <div className="col-span-1 sm:col-span-12">
        <InvalidationPanel impact={impact} />
      </div>
    </AppShell>
  );
}

export default function ImpactDetailPage() {
  return (
    <ProtectedRoute>
      <ImpactDetailContent />
    </ProtectedRoute>
  );
}
