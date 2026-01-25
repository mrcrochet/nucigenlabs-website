/**
 * Overview Page - Command Center
 * 
 * NEW ARCHITECTURE: "My World Changed"
 * 
 * This page must shock positively. Required content:
 * - Alertes déclenchées (top)
 * - Impacts sur MA watchlist
 * - 3 Decision Points clairs
 * - Exposition qui change
 * 
 * If a user arrives here and doesn't know what to do, it's failed.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import HeaderBar from '../components/overview/HeaderBar';
import KPIGrid from '../components/overview/KPIGrid';
import TriggeredAlertsFeed from '../components/overview/TriggeredAlertsFeed';
import ActionItemsCard from '../components/overview/ActionItemsCard';
import WatchlistChangesCard from '../components/overview/WatchlistChangesCard';
import NarrativeCard from '../components/overview/NarrativeCard';
import TimelineCard from '../components/overview/TimelineCard';
import MarketMoversCard from '../components/overview/MarketMoversCard';
import TopSignalsTable from '../components/overview/TopSignalsTable';
import TopRisksCard from '../components/overview/TopRisksCard';
import OpportunitiesCard from '../components/overview/OpportunitiesCard';
import RecentEventsFeed from '../components/overview/RecentEventsFeed';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import { Bell, AlertCircle } from 'lucide-react';
import Badge from '../components/ui/Badge';

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
        description="Command Center: What changed and what to do"
      />

      {/* Row 1: HeaderBar */}
      <div className="col-span-1 sm:col-span-12">
        <HeaderBar />
      </div>

      {/* NEW: Command Center Section - Top Priority */}
      <div className="col-span-1 sm:col-span-12 mb-6">
        <div className="backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/10 to-[#E1463E]/5 border border-[#E1463E]/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-[#E1463E]" />
            <h2 className="text-xl font-semibold text-text-primary">My World Changed</h2>
          </div>
          <p className="text-sm text-text-secondary mb-6">
            Here's what changed for you, now, and what you need to do.
          </p>
          
          {/* Command Center Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Alertes déclenchées */}
            <div className="lg:col-span-1">
              <TriggeredAlertsFeed />
            </div>
            
            {/* Decision Points */}
            <div className="lg:col-span-1">
              <ActionItemsCard />
            </div>
            
            {/* Watchlist Changes */}
            <div className="lg:col-span-1">
              <WatchlistChangesCard />
            </div>
          </div>
        </div>
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
      <div className="col-span-1 sm:col-span-4 space-y-6">
        <MarketMoversCard />
        <TopRisksCard />
        <OpportunitiesCard />
      </div>

      {/* Row 4: TopSignalsTable (Top 5) */}
      <div className="col-span-1 sm:col-span-12">
        <TopSignalsTable limit={5} />
      </div>

      {/* Row 5: Left (6) + Right (6) */}
      <div className="col-span-1 sm:col-span-6">
        <RecentEventsFeed />
      </div>
      <div className="col-span-1 sm:col-span-6">
        {/* Additional context can go here */}
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
