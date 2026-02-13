/**
 * Signals Page - Unified Intelligence Hub
 *
 * Three views:
 * - Pressure: Pressure-enriched signals with system/impact filters
 * - Company Impact: Company-specific signals
 * - Table: Table view (coming soon)
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { getSignalsFromEvents, getOrCreateSupabaseUserId } from '../lib/supabase';
import { safeFetchJson } from '../lib/safe-fetch-json';
import { getPressureSignals, getPressureClusters } from '../lib/api/signal-api';
import type { Signal, PressureSignal, PressureSystem, PressureCluster } from '../types/intelligence';
import type { MarketSignal, MarketSignalStats } from '../types/corporate-impact';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AppShell from '../components/layout/AppShell';
import SectionHeader from '../components/ui/SectionHeader';
import { Activity, Building2, Table2, Loader2, Sparkles, BarChart3 } from 'lucide-react';
import PressureCard from '../components/signals/PressureCard';
import PressureClusterBar from '../components/signals/PressureClusterBar';
import DivergenceRadar from '../components/signals/DivergenceRadar';
import SignalFilters from '../components/signals/SignalFilters';
import SignalsTable from '../components/signals/SignalsTable';
import CorporateImpactHeader from '../components/corporate-impact/CorporateImpactHeader';
import CorporateImpactFilters from '../components/corporate-impact/CorporateImpactFilters';
import SignalCard from '../components/corporate-impact/SignalCard';
import EmptyState from '../components/corporate-impact/EmptyState';
import CorporateImpactReportCard from '../components/corporate-impact/CorporateImpactReportCard';
import { AlertTriangle } from 'lucide-react';

type ViewMode = 'pressure' | 'companies' | 'table';

function SignalsPageContent() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isLoaded: authLoaded } = useClerkAuth();
  const isFullyLoaded = userLoaded && authLoaded;
  const [viewMode, setViewMode] = useState<ViewMode>('pressure');

  // Pressure view state
  const [pressureSignals, setPressureSignals] = useState<PressureSignal[]>([]);
  const [pressureClusters, setPressureClusters] = useState<PressureCluster[]>([]);
  const [systemFilter, setSystemFilter] = useState<PressureSystem | 'all'>('all');
  const [orderFilter, setOrderFilter] = useState<1 | 2 | 3 | null>(null);
  const [pressureLoading, setPressureLoading] = useState(true);
  const [pressureError, setPressureError] = useState<string | null>(null);
  const [polymarketOnly, setPolymarketOnly] = useState(false);

  // Company impact signals state (CorporateImpactPage)
  const [companySignals, setCompanySignals] = useState<MarketSignal[]>([]);
  const [companyStats, setCompanyStats] = useState<MarketSignalStats>({
    total_signals: 0,
    opportunities: 0,
    risks: 0,
    avg_confidence: 'Medium-High',
  });
  const [filteredStats, setFilteredStats] = useState<{ total_signals: number; opportunities: number; risks: number } | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'opportunity' | 'risk'>('all');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [availableSectors, setAvailableSectors] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [isTriggeringGeneration, setIsTriggeringGeneration] = useState(false);

  // Table view state (SignalsFeed)
  const [tableSignals, setTableSignals] = useState<Signal[]>([]);
  const [tableFilters, setTableFilters] = useState({
    theme: '',
    sector: '',
    region: '',
    strengthMin: 0,
    confidenceMin: 0,
    timeWindow: '7d' as '24h' | '7d' | '30d',
  });
  const [tableLoading, setTableLoading] = useState(true);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);

  // Load pressure signals
  const loadPressureSignals = useCallback(async () => {
    try {
      setPressureLoading(true);
      setPressureError(null);

      const filters: Parameters<typeof getPressureSignals>[0] = {};
      if (systemFilter !== 'all') filters.system = systemFilter;
      if (orderFilter) filters.impact_order = orderFilter;

      const [signals, clusters] = await Promise.all([
        getPressureSignals(filters),
        getPressureClusters(),
      ]);

      setPressureSignals(signals);
      setPressureClusters(clusters);
    } catch (error: any) {
      console.error('Error loading pressure signals:', error);
      setPressureError(error.message || 'Failed to load pressure signals');
      setPressureSignals([]);
    } finally {
      setPressureLoading(false);
    }
  }, [systemFilter, orderFilter]);

  // Load company impact signals
  const loadCompanySignals = async () => {
    try {
      setCompanyLoading(true);
      const params = new URLSearchParams();
      if (selectedFilter !== 'all') params.append('type', selectedFilter);
      if (selectedSectors.length > 0) {
        params.append('sectors', selectedSectors.join(','));
      } else if (selectedSector !== 'all') {
        params.append('sector', selectedSector);
      }
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (companySearchQuery) params.append('search', companySearchQuery);
      params.append('limit', '50');

      const data = await safeFetchJson<{
        success: boolean;
        error?: string;
        data?: {
          signals?: MarketSignal[];
          stats?: MarketSignalStats;
          filtered_stats?: { total_signals: number; opportunities: number; risks: number };
          available_sectors?: string[];
          available_categories?: string[];
        };
      }>(`/api/corporate-impact/signals?${params.toString()}`);

      if (!data.success) {
        throw new Error(data.error || 'API error');
      }
      if (data.data) {
        setCompanySignals(data.data.signals || []);
        if (data.data.stats) setCompanyStats(data.data.stats);
        setFilteredStats(data.data.filtered_stats ?? null);
        if (data.data.available_sectors) setAvailableSectors(data.data.available_sectors);
        if (data.data.available_categories) setAvailableCategories(data.data.available_categories);
      }
    } catch (error: any) {
      console.error('Error loading company signals:', error);
      setCompanyError(error.message || 'Failed to load signals');
      setCompanySignals([]);
    } finally {
      setCompanyLoading(false);
    }
  };

  // Load table signals
  const loadTableSignals = async () => {
    try {
      setTableLoading(true);
      const userId = user ? await getOrCreateSupabaseUserId(user.id) : undefined;

      const now = new Date();
      const daysAgo = tableFilters.timeWindow === '24h' ? 1 : tableFilters.timeWindow === '7d' ? 7 : 30;
      const dateFrom = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      const searchOptions: any = {
        dateFrom: dateFrom.toISOString(),
        dateTo: now.toISOString(),
      };

      if (tableFilters.region) searchOptions.region = tableFilters.region;
      if (tableFilters.sector) searchOptions.sector = tableFilters.sector;

      const fetchedSignals = await getSignalsFromEvents(searchOptions, userId);
      let filteredSignals = fetchedSignals;

      if (tableFilters.strengthMin > 0) {
        filteredSignals = filteredSignals.filter(s => (s.impact_score || 0) >= tableFilters.strengthMin);
      }
      if (tableFilters.confidenceMin > 0) {
        filteredSignals = filteredSignals.filter(s => (s.confidence_score || 0) >= tableFilters.confidenceMin);
      }

      filteredSignals.sort((a, b) => (b.impact_score || 0) - (a.impact_score || 0));
      setTableSignals(filteredSignals);
    } catch (error) {
      console.error('Error loading table signals:', error);
      setTableSignals([]);
    } finally {
      setTableLoading(false);
    }
  };

  // Load signals based on view mode
  useEffect(() => {
    if (viewMode === 'pressure') {
      loadPressureSignals();
    } else if (viewMode === 'companies') {
      loadCompanySignals();
    } else if (viewMode === 'table') {
      loadTableSignals();
    }
  }, [viewMode, systemFilter, orderFilter, selectedFilter, selectedSector, selectedSectors, selectedCategory, companySearchQuery, tableFilters]);

  if (!isFullyLoaded) {
    return (
      <AppShell>
        <div className="col-span-1 sm:col-span-12 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-slate-500 font-light">Loading...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SEO
        title="Intelligence — Nucigen"
        description="Pressure detection layer: what is building pressure inside the system"
      />

      <div className="col-span-1 sm:col-span-12">
        {/* Header with View Toggle */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader
              title="Intelligence"
              subtitle="What is building pressure inside the system"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex flex-wrap items-center gap-2 p-1 bg-white/[0.02] border border-white/[0.05] rounded-xl w-full sm:w-fit overflow-x-auto">
            <button
              onClick={() => setViewMode('pressure')}
              className={`px-3 sm:px-4 py-2 rounded-lg transition-all text-xs sm:text-sm font-light flex items-center gap-1.5 sm:gap-2 min-h-[44px] ${
                viewMode === 'pressure'
                  ? 'bg-[#E1463E] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4 flex-shrink-0" />
              <span>Pressure</span>
            </button>
            <button
              onClick={() => setViewMode('companies')}
              className={`px-3 sm:px-4 py-2 rounded-lg transition-all text-xs sm:text-sm font-light flex items-center gap-1.5 sm:gap-2 min-h-[44px] ${
                viewMode === 'companies'
                  ? 'bg-[#E1463E] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Company Impact</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 sm:px-4 py-2 rounded-lg transition-all text-xs sm:text-sm font-light flex items-center gap-1.5 sm:gap-2 min-h-[44px] ${
                viewMode === 'table'
                  ? 'bg-[#E1463E] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table2 className="w-4 h-4 flex-shrink-0" />
              <span>Table</span>
            </button>
          </div>
        </header>

        {/* Pressure View */}
        {viewMode === 'pressure' && (
          <>
            {/* Pressure Cluster Bar */}
            <PressureClusterBar
              clusters={pressureClusters}
              activeSystem={systemFilter}
              onSystemSelect={setSystemFilter}
              loading={pressureLoading}
            />

            {/* Impact Order Filter */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs text-slate-500 uppercase tracking-wider mr-1">Impact:</span>
              {([null, 1, 2, 3] as const).map((order) => (
                <button
                  key={order ?? 'all'}
                  type="button"
                  onClick={() => setOrderFilter(order)}
                  className={`px-3 py-1.5 rounded-md text-xs font-light transition-all border ${
                    orderFilter === order
                      ? 'bg-[#E1463E] text-white border-[#E1463E]'
                      : 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {order === null ? 'All' : `${order}${order === 1 ? 'st' : order === 2 ? 'nd' : 'rd'}`}
                </button>
              ))}
            </div>

            {/* Divergence Radar */}
            {!pressureLoading && !pressureError && pressureSignals.length > 0 && (
              <DivergenceRadar
                signals={pressureSignals}
                filterActive={polymarketOnly}
                onToggleFilter={() => setPolymarketOnly(prev => !prev)}
              />
            )}

            {/* Signals */}
            {pressureLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400 text-sm font-light">Detecting pressure signals...</p>
              </div>
            ) : pressureError ? (
              <div className="text-center py-12">
                <div className="backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/10 to-[#E1463E]/5 border border-[#E1463E]/30 rounded-2xl p-8 max-w-2xl mx-auto">
                  <AlertTriangle className="w-12 h-12 text-[#E1463E] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Error Loading Signals</h3>
                  <p className="text-slate-400 mb-4">{pressureError}</p>
                </div>
              </div>
            ) : pressureSignals.length === 0 ? (
              <div className="text-center py-16">
                <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Pressure Signals</h3>
                <p className="text-slate-400 text-sm font-light max-w-md mx-auto">
                  No pressure signals detected for the current filters. Try changing the system or impact order filter.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {(polymarketOnly ? pressureSignals.filter(s => s.polymarket) : pressureSignals).map((signal) => (
                  <PressureCard key={signal.id} signal={signal} />
                ))}
                {polymarketOnly && pressureSignals.filter(s => s.polymarket).length === 0 && (
                  <div className="text-center py-12">
                    <BarChart3 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No signals with Polymarket matches yet.</p>
                    <p className="text-slate-600 text-xs mt-1">Matches are generated every 4 hours.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Company Impact View */}
        {viewMode === 'companies' && (
          <>
            <CorporateImpactHeader stats={companyStats} />
            <CorporateImpactFilters
              selectedFilter={selectedFilter}
              selectedSector={selectedSector}
              selectedSectors={selectedSectors}
              selectedCategory={selectedCategory}
              searchQuery={companySearchQuery}
              onFilterChange={setSelectedFilter}
              onSectorChange={setSelectedSector}
              onSectorsChange={setSelectedSectors}
              onCategoryChange={setSelectedCategory}
              onSearchChange={setCompanySearchQuery}
              opportunitiesCount={companyStats.opportunities}
              risksCount={companyStats.risks}
              totalCount={companyStats.total_signals}
              availableSectors={availableSectors}
              availableCategories={availableCategories}
            />
            {selectedSectors.length > 0 && (
              <CorporateImpactReportCard
                industries={selectedSectors}
                totalSignals={filteredStats?.total_signals ?? companyStats.total_signals}
                opportunities={filteredStats?.opportunities ?? companyStats.opportunities}
                risks={filteredStats?.risks ?? companyStats.risks}
                topCompanies={[...new Set(companySignals.map((s) => s.company?.name).filter(Boolean))] as string[]}
              />
            )}
            {companyLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400">Loading signals...</p>
              </div>
            ) : companyError ? (
              <div className="text-center py-12">
                <div className="backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/10 to-[#E1463E]/5 border border-[#E1463E]/30 rounded-2xl p-8 max-w-2xl mx-auto">
                  <AlertTriangle className="w-12 h-12 text-[#E1463E] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Error Loading Signals</h3>
                  <p className="text-slate-400 mb-4">{companyError}</p>
                </div>
              </div>
            ) : companySignals.length === 0 ? (
              <div className="space-y-6">
                <EmptyState />
                <div className="text-center">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsTriggeringGeneration(true);
                      setCompanyError(null);
                      try {
                        const json = await safeFetchJson<{ success: boolean; result?: unknown; error?: string }>(
                          '/api/corporate-impact/trigger',
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ limit: 20 }),
                          }
                        );
                        if (json.success && json.result) {
                          await loadCompanySignals();
                        } else {
                          setCompanyError(json.error || 'Generation failed');
                        }
                      } catch (e: any) {
                        setCompanyError(e?.message || 'Request failed');
                      } finally {
                        setIsTriggeringGeneration(false);
                      }
                    }}
                    disabled={isTriggeringGeneration}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#E1463E] hover:bg-[#E1463E]/90 disabled:opacity-50 text-white rounded-lg text-sm font-light transition-all"
                  >
                    {isTriggeringGeneration ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating from recent events…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate from recent events
                      </>
                    )}
                  </button>
                  <p className="text-xs text-slate-500 mt-3">
                    Runs analysis on the latest events (last 30 days) and creates company impact signals.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {companySignals.map((signal) => (
                  <SignalCard key={signal.id} signal={signal} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Table View — Blur + Coming soon */}
        {viewMode === 'table' && (
          <div className="relative rounded-2xl overflow-hidden min-h-[50vh] border border-white/[0.06]">
            <div
              className="absolute inset-0 blur-md scale-105 bg-[#0a0a0a] pointer-events-none select-none"
              aria-hidden
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 h-full">
                <div className="lg:col-span-3 opacity-90">
                  <SignalFilters
                    filters={tableFilters}
                    onFiltersChange={setTableFilters}
                  />
                </div>
                <div className="lg:col-span-9 opacity-90">
                  <SignalsTable
                    signals={tableSignals}
                    loading={tableLoading}
                    onSignalClick={() => {}}
                  />
                </div>
              </div>
            </div>
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xl"
              aria-hidden
            >
              <div className="text-center px-8 py-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] shadow-2xl">
                <p className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                  Coming soon
                </p>
                <p className="text-slate-400 text-sm mt-3 max-w-xs mx-auto">
                  La vue tableau des signaux sera bientôt disponible.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function SignalsPage() {
  return (
    <ProtectedRoute>
      <SignalsPageContent />
    </ProtectedRoute>
  );
}
