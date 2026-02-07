/**
 * Overview Page
 *
 * Radar stratégique : lecture macro du monde en 10–15 secondes.
 * 3 blocs uniquement : Global Situation | My World Changed | What to Watch Next.
 * Pas de KPI dashboard, pas de long texte, pas d’analyse causale — Overview montre, Enquêtes expliquent.
 */

import { useState, useEffect } from 'react';
import AppShell from '../components/layout/AppShell';
import HeaderBar from '../components/overview/HeaderBar';
import GlobalSituationMap from '../components/overview/GlobalSituationMap';
import OverviewMapSidePanel from '../components/overview/OverviewMapSidePanel';
import MyWorldChangedSection from '../components/overview/MyWorldChangedSection';
import WhatToWatchNextSection from '../components/overview/WhatToWatchNextSection';
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
          <div className="text-text-secondary">Chargement…</div>
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
        description="Lecture macro du monde : où ça bouge, quoi est important, où creuser."
      />

      {/* Row 1: HeaderBar */}
      <div className="col-span-1 sm:col-span-12">
        <HeaderBar />
      </div>

      {/* Bloc 1: Global Situation — carte + side panel */}
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

      {/* Bloc 2: My World Changed — Triggered Alerts | Decision Points | Watchlist */}
      <MyWorldChangedSection />

      {/* Bloc 3: What to Watch Next — Emerging Signals */}
      <WhatToWatchNextSection />
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
