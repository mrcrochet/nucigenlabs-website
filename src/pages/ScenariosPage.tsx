/**
 * Scenarios Page (formerly Impacts)
 * 
 * NEW ARCHITECTURE: Renamed from "Impacts" to "Scenarios"
 * Purpose: Display future scenarios, probability, magnitude, timeframe
 * 
 * Layout:
 * - Filters top (12)
 * - Grid (12): ImpactCardGrid (2 colonnes desktop)
 */

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSearchParams } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import ImpactFilters from '../components/impacts/ImpactFilters';
import ImpactCardGrid from '../components/impacts/ImpactCardGrid';
import ImpactMappingMatrix from '../components/impacts/ImpactMappingMatrix';
import DecisionPointsCard from '../components/scenarios/DecisionPointsCard';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';

function ScenariosPageContent() {
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const signalId = searchParams.get('signal_id');
  
  const [filters, setFilters] = useState({
    probabilityMin: 0,
    magnitudeMin: 0,
    timeframe: '' as '' | 'immediate' | 'short' | 'medium' | 'long',
    sector: '',
    region: '',
  });
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load scenarios (formerly impacts)
    setLoading(false);
  }, [filters, signalId, user]);

  return (
    <AppShell>
      <SEO 
        title="Scenarios — Nucigen"
        description="Future scenarios, probability, magnitude, and timeframe"
      />

      {/* Filters */}
      <div className="col-span-1 sm:col-span-12">
        <ImpactFilters
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* Decision Points - NEW ARCHITECTURE */}
      <div className="col-span-1 sm:col-span-12 mb-6">
        <DecisionPointsCard scenarioId={undefined} signalId={signalId || undefined} />
      </div>

      {/* Scenario Mapping Matrix */}
      {scenarios.length > 0 && (
        <div className="col-span-1 sm:col-span-12">
          <ImpactMappingMatrix impacts={scenarios} />
        </div>
      )}

      {/* ScenarioCardGrid */}
      <div className="col-span-1 sm:col-span-12">
        <ImpactCardGrid
          filters={filters}
          signalId={signalId || undefined}
          loading={loading}
          onImpactsLoaded={setScenarios}
        />
      </div>
    </AppShell>
  );
}

export default function ScenariosPage() {
  return (
    <ProtectedRoute>
      <ScenariosPageContent />
    </ProtectedRoute>
  );
}
