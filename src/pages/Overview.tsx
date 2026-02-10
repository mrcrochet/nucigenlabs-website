/**
 * Overview Page — Style Google Earth
 * Globe en pleine page, partie d’or (header + panneaux) juxtaposée en overlay pour une navigation optimale.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, BarChart3 } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import HeaderBar from '../components/overview/HeaderBar';
import MarketSummaryBlock from '../components/overview/MarketSummaryBlock';
import GlobalSituationMap from '../components/overview/GlobalSituationMap';
import OverviewMapSidePanel from '../components/overview/OverviewMapSidePanel';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import { getOverviewMapData, FALLBACK_DATA } from '../lib/api/overview-api';
import type { OverviewMapData, OverviewEventSummary } from '../types/overview';
import type { GlobalSituationMapHandle } from '../components/overview/GlobalSituationMap';

/** Hauteur TopNav (h-16) pour positionner le globe en dessous */
const TOP_NAV_HEIGHT = '4rem';
/** Hauteur barre Overview (compacte) */
const OVERVIEW_HEADER_HEIGHT = '3rem';

function OverviewContent() {
  const navigate = useNavigate();
  const mapRef = useRef<GlobalSituationMapHandle>(null);
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<OverviewMapData | null>(null);
  const [marketSummaryOpen, setMarketSummaryOpen] = useState(true);
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [scopeMode, setScopeMode] = useState<'global' | 'watchlist'>('global');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSubmitted, setSearchSubmitted] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOverviewMapData({
        dateRange,
        scopeMode,
        q: searchSubmitted || undefined,
      });
      setMapData(data);
    } catch (e) {
      setMapData(FALLBACK_DATA);
      setError('Mode démo — API non disponible');
    } finally {
      setLoading(false);
    }
  }, [dateRange, scopeMode, searchSubmitted]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEventClick = useCallback(
    (event: OverviewEventSummary) => {
      const signal = mapData?.signals.find((s) => s.id === event.id);
      if (signal && mapRef.current) {
        mapRef.current.flyTo(signal.lon, signal.lat, 4);
      }
      navigate(event.investigate_id || '/search');
    },
    [mapData?.signals, navigate]
  );

  const handleImpactClick = useCallback(
    (impact: { investigate_id: string | null }) => {
      navigate(impact.investigate_id || '/search');
    },
    [navigate]
  );

  if (loading && !mapData) {
    return (
      <AppShell>
        <div
          className="col-span-1 sm:col-span-12 w-screen min-h-screen ml-[calc(50%-50vw)] flex flex-col items-center justify-center bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-[#0a0a0f]"
        >
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-[#E1463E]/80 animate-spin" />
          <p className="mt-4 text-sm text-gray-400">Chargement du globe…</p>
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

      {/* Réserve la place dans le flux (évite collapse du main) */}
      <div className="col-span-1 sm:col-span-12 relative min-h-[100vh]" aria-hidden>
        {/* Globe fixe — occupe tout l’espace sous la TopNav, navigation optimale (drag, zoom, rotate) */}
        <div
          className="fixed left-0 right-0 bottom-0 overflow-hidden bg-gradient-to-b from-[#0a0a0f] via-[#0b0b12] to-[#08080d]"
          style={{ top: TOP_NAV_HEIGHT }}
        >
          <GlobalSituationMap ref={mapRef} signals={signals} />
        </div>

        {/* Partie d’or : barre Overview (type Google Earth) — juxtaposée sur le globe */}
        <div
          className="fixed left-0 right-0 z-20 border-b border-white/[0.08] bg-black/40 backdrop-blur-xl"
          style={{ top: TOP_NAV_HEIGHT }}
        >
          <HeaderBar
            dateRange={dateRange}
            scopeMode={scopeMode}
            searchQuery={searchQuery}
            onDateRangeChange={setDateRange}
            onScopeModeChange={setScopeMode}
            onSearchChange={setSearchQuery}
            onSearchSubmit={(v) => { setSearchQuery(v); setSearchSubmitted(v); }}
          />
        </div>
        {error && (
          <div
            className="fixed left-2 right-2 sm:left-4 sm:right-4 z-30 flex items-center justify-center gap-2 rounded-lg bg-white/[0.08] border border-white/10 px-4 py-2 text-sm text-gray-300"
            style={{ top: `calc(${TOP_NAV_HEIGHT} + ${OVERVIEW_HEADER_HEIGHT} + 0.5rem)` }}
          >
            <span>{error}</span>
            <button type="button" onClick={fetchData} className="text-amber-400 hover:text-amber-300 underline hover:no-underline font-medium">
              Réessayer
            </button>
          </div>
        )}

        {/* Partie d’or : Market summary — gauche, sous la barre Overview, rétractable */}
        <div
          className="fixed left-2 sm:left-4 z-20 w-full max-w-[calc(100vw-1rem)] sm:max-w-md max-h-[calc(100vh-7.5rem)] overflow-y-auto"
          style={{ top: `calc(${TOP_NAV_HEIGHT} + ${OVERVIEW_HEADER_HEIGHT} + 0.5rem)` }}
        >
          {marketSummaryOpen ? (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.06] backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/30 ring-1 ring-white/[0.06]">
              <button
                type="button"
                onClick={() => setMarketSummaryOpen(false)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 border-b border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] transition-colors text-left"
                aria-label="Rétracter Market summary"
              >
                <span className="flex items-center gap-2 text-xs font-medium text-gray-300 uppercase tracking-wider">
                  <BarChart3 className="w-4 h-4 text-[#E1463E]" aria-hidden />
                  Market summary
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />
              </button>
              <div className="max-h-[50vh] overflow-y-auto bg-white/[0.02]">
                <MarketSummaryBlock />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setMarketSummaryOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-white/[0.08] bg-white/[0.06] backdrop-blur-xl shadow-xl hover:bg-white/[0.1] transition-colors text-left ring-1 ring-white/[0.06]"
              aria-label="Afficher Market summary"
            >
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />
              <BarChart3 className="w-4 h-4 text-[#E1463E]" aria-hidden />
              <span className="text-xs font-medium text-gray-300 uppercase tracking-wider">Market summary</span>
            </button>
          )}
        </div>

        {/* Partie d’or : Top events + Top corporate impacts — droite, sous la barre Overview */}
        <div
          className="fixed right-2 sm:right-4 z-20 w-[min(18rem,calc(100vw-1rem))] sm:w-80 max-h-[calc(100vh-7.5rem)] overflow-y-auto"
          style={{ top: `calc(${TOP_NAV_HEIGHT} + ${OVERVIEW_HEADER_HEIGHT} + 0.5rem)` }}
        >
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.06] backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/30 ring-1 ring-white/[0.06]">
            <OverviewMapSidePanel
              top_events={top_events}
              top_impacts={top_impacts}
              onEventClick={handleEventClick}
              onImpactClick={handleImpactClick}
            />
          </div>
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
