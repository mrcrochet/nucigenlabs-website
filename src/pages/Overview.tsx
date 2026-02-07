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
import MarketSummaryBlock from '../components/overview/MarketSummaryBlock';
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

      {/* Market summary (daily digest) */}
      <div className="col-span-1 sm:col-span-12 mb-4">
        <MarketSummaryBlock />
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

      {/* Phase 3.3: Portfolio / Watchlist placeholder (finance dashboard inspiration) */}
      <section className="col-span-1 sm:col-span-12 mt-6" aria-labelledby="portfolio-watchlist-heading">
        <h2 id="portfolio-watchlist-heading" className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Portfolio & Watchlist
        </h2>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 text-center">
          <p className="text-slate-400 text-sm mb-2">
            Track your watchlist and key metrics in one place.
          </p>
          <p className="text-slate-500 text-xs">
            Coming soon — meanwhile use Corporate Impact and Stock Portfolio Researcher for company-level insights.
          </p>
        </div>
      </section>
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
