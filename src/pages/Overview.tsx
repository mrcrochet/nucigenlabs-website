/**
 * Overview Page - Command Center
 *
 * Layout priority (top → bottom):
 * 1. KPI Strip — instant numerical pulse
 * 2. Attention Required — alerts + decision points (hidden if empty)
 * 3. Situation Briefing (8col) + Sidebar: Market Movers / Risks / Opportunities (4col)
 * 4. Top Signals Table (full width)
 * 5. Recent Events (6col) + Event Timeline (6col)
 *
 * Principle: answer 3 questions in 10 seconds:
 *   "What changed?" → KPIs + Alerts
 *   "What does it mean?" → Narrative + Risks
 *   "What should I do?" → Decision Points + Emerging Signals
 */

import { useState, useEffect, useCallback } from 'react';
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
import { AlertTriangle, CheckCircle } from 'lucide-react';

function OverviewContent() {
  const [loading, setLoading] = useState(true);
  const [alertCount, setAlertCount] = useState<number | null>(null);
  const [watchlistCount, setWatchlistCount] = useState<number | null>(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleAlertDataLoaded = useCallback((count: number) => {
    setAlertCount(count);
  }, []);

  const handleWatchlistDataLoaded = useCallback((count: number) => {
    setWatchlistCount(count);
  }, []);

  // Show attention section if we're still loading data or if there's content
  const attentionDataReady = alertCount !== null && watchlistCount !== null;
  const hasAttentionContent = !attentionDataReady || (alertCount ?? 0) > 0 || (watchlistCount ?? 0) > 0;

  // Determine how many columns are visible in attention section
  const attentionVisibleCards = [
    (alertCount ?? 0) > 0 || !attentionDataReady,
    true, // ActionItems always shows (hardcoded data for now)
    (watchlistCount ?? 0) > 0 || !attentionDataReady,
  ].filter(Boolean).length;

  const attentionGridCols = attentionVisibleCards === 3
    ? 'lg:grid-cols-3'
    : attentionVisibleCards === 2
    ? 'lg:grid-cols-2'
    : 'lg:grid-cols-1';

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

      {/* Row 2: KPI Strip — instant numerical pulse */}
      <div className="col-span-1 sm:col-span-12">
        <KPIGrid />
      </div>

      {/* Row 3: Attention Required — alerts + decision points */}
      {hasAttentionContent ? (
        <div className="col-span-1 sm:col-span-12">
          <div className="backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/8 to-[#E1463E]/3 border border-[#E1463E]/15 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-[#E1463E]" />
              <h2 className="text-lg font-medium text-text-primary">Attention Required</h2>
            </div>

            <div className={`grid grid-cols-1 ${attentionGridCols} gap-4`}>
              {/* Triggered Alerts — only show if has data or still loading */}
              {((alertCount ?? 0) > 0 || !attentionDataReady) && (
                <div>
                  <TriggeredAlertsFeed onDataLoaded={handleAlertDataLoaded} />
                </div>
              )}

              {/* Decision Points — always visible */}
              <div>
                <ActionItemsCard />
              </div>

              {/* Watchlist Changes — only show if has data or still loading */}
              {((watchlistCount ?? 0) > 0 || !attentionDataReady) && (
                <div>
                  <WatchlistChangesCard onDataLoaded={handleWatchlistDataLoaded} />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="col-span-1 sm:col-span-12">
          <div className="flex items-center gap-3 py-4 px-5 bg-green-500/5 border border-green-500/15 rounded-xl">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-text-secondary">All clear — no alerts or watchlist changes requiring attention.</span>
            {/* Hidden components to still trigger data loading */}
            <div className="hidden">
              <TriggeredAlertsFeed onDataLoaded={handleAlertDataLoaded} />
              <WatchlistChangesCard onDataLoaded={handleWatchlistDataLoaded} />
            </div>
          </div>
        </div>
      )}

      {/* Row 4: Situation Briefing (8col) + Sidebar (4col) */}
      <div className="col-span-1 sm:col-span-8 space-y-6">
        <NarrativeCard />
      </div>
      <div className="col-span-1 sm:col-span-4 space-y-4">
        <MarketMoversCard />
        <TopRisksCard />
        <OpportunitiesCard />
      </div>

      {/* Row 5: Top Signals Table (full width) */}
      <div className="col-span-1 sm:col-span-12">
        <TopSignalsTable limit={5} />
      </div>

      {/* Row 6: Recent Events (6col) + Event Timeline (6col) */}
      <div className="col-span-1 sm:col-span-6">
        <RecentEventsFeed />
      </div>
      <div className="col-span-1 sm:col-span-6">
        <TimelineCard />
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
