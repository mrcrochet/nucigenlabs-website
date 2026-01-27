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

      {/* Row 1: HeaderBar - Starts immediately after TopNav, no top spacing */}
      <div className="col-span-1 sm:col-span-12">
        <HeaderBar />
      </div>

      {/* NEW: Command Center Section - Top Priority */}
      <div className="col-span-1 sm:col-span-12 mb-2">
        <div className="backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/10 to-[#E1463E]/5 border border-[#E1463E]/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-[#E1463E]" />
            <h2 className="text-xl font-semibold text-text-primary">My World Changed</h2>
          </div>
          <p className="text-sm text-text-secondary mb-6">
            Here's what changed for you, now, and what you need to do.
          </p>
          
          {/* Command Center Grid - Improved hierarchy */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Triggered Alerts - Priority 1 (col-span-3) */}
            <div className="lg:col-span-3">
              <TriggeredAlertsFeed />
            </div>
            
            {/* Decision Points - Priority 2, larger (col-span-6) */}
            <div className="lg:col-span-6">
              <ActionItemsCard />
            </div>
            
            {/* Watchlist Changes - Priority 3 (col-span-3) */}
            <div className="lg:col-span-3">
              <WatchlistChangesCard />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: KPIGrid (4 cards) */}
      <div className="col-span-1 sm:col-span-12">
        <KPIGrid />
      </div>

      {/* Row 3: Narrative (moved down, transformed) */}
      <div className="col-span-1 sm:col-span-12">
        <NarrativeCard />
      </div>

      {/* Row 4: Left (8) + Right (4) - Reduced prominence */}
      <div className="col-span-1 sm:col-span-8 space-y-4">
        <TimelineCard />
      </div>
      <div className="col-span-1 sm:col-span-4 space-y-4">
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
