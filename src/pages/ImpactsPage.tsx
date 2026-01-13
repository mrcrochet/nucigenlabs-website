/**
 * Impacts Page
 * 
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
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';

function ImpactsPageContent() {
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load impacts
    setLoading(false);
  }, [filters, signalId, user]);

  return (
    <AppShell>
      <SEO 
        title="Impacts — Nucigen"
        description="Future impact scenarios and projections"
      />

      {/* Filters */}
      <div className="col-span-12">
        <ImpactFilters
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* ImpactCardGrid */}
      <div className="col-span-12">
        <ImpactCardGrid
          filters={filters}
          signalId={signalId || undefined}
          loading={loading}
        />
      </div>
    </AppShell>
  );
}

export default function ImpactsPage() {
  return (
    <ProtectedRoute>
      <ImpactsPageContent />
    </ProtectedRoute>
  );
}
