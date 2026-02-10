/**
 * Overview Page — Style Google Earth
 * Globe en pleine page, partie d’or (header + panneaux) juxtaposée en overlay pour une navigation optimale.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { ChevronDown, ChevronRight, BarChart3 } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import HeaderBar from '../components/overview/HeaderBar';
import KPIGrid from '../components/overview/KPIGrid';
import OverviewSituationBlock from '../components/overview/OverviewSituationBlock';
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
/** Barre Overview — sobre, une ligne */
const OVERVIEW_HEADER_HEIGHT = '2.75rem';
/** Largeur rails gauche / droite */
const RAIL_LEFT_WIDTH = '18rem';
const RAIL_RIGHT_WIDTH = '20rem';

function OverviewContent() {
  const navigate = useNavigate();
  const { user } = useUser();
  const mapRef = useRef<GlobalSituationMapHandle>(null);
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<OverviewMapData | null>(null);
  const [marketSummaryOpen, setMarketSummaryOpen] = useState(true);
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [scopeMode, setScopeMode] = useState<'global' | 'watchlist'>('global');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSubmitted, setSearchSubmitted] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
      setNotice(null);
    }
    try {
      const data = await getOverviewMapData({
        dateRange,
        scopeMode,
        q: searchSubmitted || undefined,
        countries: country ? [country] : undefined,
        userId: user?.id,
      });
      setMapData(data);
      setLastUpdated(new Date());

      if (!silent) {
        if (data.is_demo) {
          setNotice('Demo mode — no events found in any date range');
        } else if (data.stats?.effective_date_range && data.stats.effective_date_range !== dateRange) {
          setNotice(`Expanded to ${data.stats.effective_date_range} — no events in ${dateRange}`);
        }
      }
    } catch (e) {
      if (!silent) {
        setMapData(FALLBACK_DATA);
        setError('API unavailable — showing demo data');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [dateRange, scopeMode, searchSubmitted, country, user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time refresh every 2 min when tab is visible (keeps Top events / Top impacts live)
  useEffect(() => {
    const REFRESH_MS = 2 * 60 * 1000;
    const t = setInterval(() => {
      if (document.visibilityState === 'visible' && mapData) fetchData(true);
    }, REFRESH_MS);
    return () => clearInterval(t);
  }, [mapData, fetchData]);

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

        {/* Header — une ligne, sobre, high-tech */}
        <div
          className="fixed left-0 right-0 z-20 flex items-center border-b border-white/[0.06] bg-[#0a0a0c]/90 backdrop-blur-md"
          style={{ top: TOP_NAV_HEIGHT, height: OVERVIEW_HEADER_HEIGHT }}
        >
          <div className="flex-1 min-w-0 flex items-center overflow-hidden">
            <HeaderBar
            dateRange={dateRange}
            scopeMode={scopeMode}
            searchQuery={searchQuery}
            country={country}
            onDateRangeChange={setDateRange}
            onScopeModeChange={setScopeMode}
            onSearchChange={setSearchQuery}
            onSearchSubmit={(v) => { setSearchQuery(v); setSearchSubmitted(v); }}
            onCountryChange={setCountry}
            onRefresh={() => fetchData()}
            refreshing={loading}
          />
          </div>
          {(error || notice) && (
            <div
              className={`shrink-0 flex items-center gap-2 text-[10px] uppercase tracking-wider ${
                error ? 'text-red-400/90' : 'text-zinc-500'
              }`}
            >
              {error ? (
                <>
                  <span className="max-w-[12rem] truncate">{error}</span>
                  <button type="button" onClick={() => fetchData()} className="text-cyan-400/90 hover:text-cyan-300 underline shrink-0">
                    Retry
                  </button>
                </>
              ) : (
                <span className="max-w-[14rem] truncate">{notice}</span>
              )}
            </div>
          )}
        </div>

        {/* Rail gauche : KPIs + Market summary — panneaux épurés */}
        <div
          className="fixed z-20 flex flex-col gap-3 overflow-y-auto"
          style={{
            top: `calc(${TOP_NAV_HEIGHT} + ${OVERVIEW_HEADER_HEIGHT} + 0.75rem)`,
            left: '0.75rem',
            width: RAIL_LEFT_WIDTH,
            maxHeight: 'calc(100vh - 8rem)',
          }}
        >
          <div className="rounded-lg border border-white/[0.06] bg-black/50 backdrop-blur-sm overflow-hidden">
            <KPIGrid dateRange={dateRange} />
          </div>
          <OverviewSituationBlock country={country || null} />
          {marketSummaryOpen ? (
            <div className="rounded-lg border border-white/[0.06] bg-black/50 backdrop-blur-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setMarketSummaryOpen(false)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors text-left"
                aria-label="Rétracter Market summary"
              >
                <span className="flex items-center gap-2 text-[10px] font-medium text-zinc-400 uppercase tracking-widest">
                  <BarChart3 className="w-3.5 h-3.5 text-cyan-500/80" aria-hidden />
                  Market summary
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" aria-hidden />
              </button>
              <div className="max-h-[40vh] overflow-y-auto">
                <MarketSummaryBlock />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setMarketSummaryOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] bg-black/50 backdrop-blur-sm hover:bg-white/[0.04] transition-colors text-left"
              aria-label="Afficher Market summary"
            >
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" aria-hidden />
              <BarChart3 className="w-3.5 h-3.5 text-cyan-500/80" aria-hidden />
              <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">Market summary</span>
            </button>
          )}
        </div>

        {/* Rail droit : Top events + Top impacts — un bloc sobre */}
        <div
          className="fixed z-20 overflow-y-auto"
          style={{
            top: `calc(${TOP_NAV_HEIGHT} + ${OVERVIEW_HEADER_HEIGHT} + 0.75rem)`,
            right: '0.75rem',
            width: RAIL_RIGHT_WIDTH,
            maxHeight: 'calc(100vh - 8rem)',
          }}
        >
          <div className="rounded-lg border border-white/[0.06] bg-black/50 backdrop-blur-sm overflow-hidden">
            <OverviewMapSidePanel
              top_events={top_events}
              top_impacts={top_impacts}
              onEventClick={handleEventClick}
              onImpactClick={handleImpactClick}
              lastUpdated={lastUpdated}
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
