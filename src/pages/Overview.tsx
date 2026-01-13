/**
 * Overview Page (Home)
 * 
 * Purpose: Give situation + drivers + market reaction in 30 seconds
 * 
 * Layout (12 columns):
 * - Row 1 (12): HeaderBar
 * - Row 2 (12): KPIGrid (4 cards)
 * - Row 3: Left (8): NarrativeCard + TimelineCard | Right (4): MarketMoversCard
 * - Row 4 (12): TopSignalsTable
 * - Row 5: Left (6): RecentEventsFeed | Right (6): TriggeredAlertsFeed
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import HeaderBar from '../components/overview/HeaderBar';
import KPIGrid from '../components/overview/KPIGrid';
import NarrativeCard from '../components/overview/NarrativeCard';
import TimelineCard from '../components/overview/TimelineCard';
import MarketMoversCard from '../components/overview/MarketMoversCard';
import TopSignalsTable from '../components/overview/TopSignalsTable';
import RecentEventsFeed from '../components/overview/RecentEventsFeed';
import TriggeredAlertsFeed from '../components/overview/TriggeredAlertsFeed';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';

function OverviewContent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load overview data
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="col-span-1 sm:col-span-12 flex items-center justify-center h-64">
          <div className="text-text-secondary">Loading overview...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SEO 
        title="Overview — Nucigen"
        description="Intelligence dashboard overview"
      />

      {/* Row 1: HeaderBar */}
      <div className="col-span-1 sm:col-span-12">
        <HeaderBar />
      </div>

      {/* Row 2: KPIGrid (4 cards) */}
      <div className="col-span-1 sm:col-span-12">
        <KPIGrid />
      </div>

      {/* Row 3: Left (8) + Right (4) */}
      <div className="col-span-1 sm:col-span-8 space-y-6">
        <NarrativeCard />
        <TimelineCard />
      </div>
      <div className="col-span-1 sm:col-span-4">
        <MarketMoversCard />
      </div>

      {/* Row 4: TopSignalsTable */}
      <div className="col-span-1 sm:col-span-12">
        <TopSignalsTable />
      </div>

      {/* Row 5: Left (6) + Right (6) */}
      <div className="col-span-1 sm:col-span-6">
        <RecentEventsFeed />
      </div>
      <div className="col-span-1 sm:col-span-6">
        <TriggeredAlertsFeed />
      </div>
    </AppShell>
  );
}

export default function Overview() {
  return (
    <ProtectedRoute>
      <OverviewContent />
    </ProtectedRoute>
  );
}
