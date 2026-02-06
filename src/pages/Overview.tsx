/**
 * Overview Page
 *
 * Global Situation map is the first block (V1); then KPIs and rest.
 */

import { useState, useEffect } from 'react';
import AppShell from '../components/layout/AppShell';
import HeaderBar from '../components/overview/HeaderBar';
import GlobalSituationMap from '../components/overview/GlobalSituationMap';
import OverviewMapSidePanel from '../components/overview/OverviewMapSidePanel';
import { Link } from 'react-router-dom';
import KPIGrid from '../components/overview/KPIGrid';
import NarrativeCard from '../components/overview/NarrativeCard';
import TopSignalsTable from '../components/overview/TopSignalsTable';
import RecentEventsFeed from '../components/overview/RecentEventsFeed';
import { ChevronRight } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import { getOverviewMapData } from '../lib/api/overview-api';
import type { OverviewMapData } from '../types/overview';

function OverviewContent() {
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<OverviewMapData | null>(null);

  useEffect(() => {
    getOverviewMapData().then((data) => {
      setMapData(data);
      setLoading(false);
    });
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

  const signals = mapData?.signals ?? [];
  const top_events = mapData?.top_events ?? [];
  const top_impacts = mapData?.top_impacts ?? [];

  return (
    <AppShell>
      <SEO
        title="Overview — Nucigen"
        description="Global Situation and strategic overview"
      />

      {/* Row 1: HeaderBar */}
      <div className="col-span-1 sm:col-span-12">
        <HeaderBar />
      </div>

      {/* Global Situation Map (V1) – map + side panel */}
      <div className="col-span-1 sm:col-span-12 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-9 min-h-[400px]">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Global Situation
            </h2>
            <GlobalSituationMap signals={signals} />
          </div>
          <div className="lg:col-span-3 min-h-[400px]">
            <OverviewMapSidePanel top_events={top_events} top_impacts={top_impacts} />
          </div>
        </div>
      </div>

      {/* KPIGrid (4 cards) */}
      <div className="col-span-1 sm:col-span-12 mb-6">
        <KPIGrid />
      </div>

      {/* Narrative only */}
      <div className="col-span-1 sm:col-span-12 mb-6">
        <NarrativeCard />
      </div>

      {/* Compact: Top signals (3) + Recent events (3) with View all */}
      <div className="col-span-1 sm:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <TopSignalsTable limit={3} />
          <Link
            to="/signals"
            className="mt-2 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary-red transition-colors"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div>
          <RecentEventsFeed limit={3} />
          <Link
            to="/events"
            className="mt-2 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary-red transition-colors"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
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
