/**
 * Signals Page - Unified Intelligence Hub
 * 
 * NEW ARCHITECTURE: Merges IntelligenceFeed + SignalsFeed + CorporateImpactPage
 * 
 * This is the core intelligence page that shows:
 * - General signals (from IntelligenceFeed) - Card view
 * - Company-specific signals (from CorporateImpactPage) - Company Impact view
 * - Table view (from SignalsFeed) - Table view
 * 
 * Users can toggle between these 3 views using a segmented control
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { 
  getEventsWithCausalChainsSearch, 
  getUserPreferences,
  getSignalsFromEvents,
  getOrCreateSupabaseUserId
} from '../lib/supabase';
import { getSignalsViaAgent } from '../lib/api/signal-api';
import { safeFetchJson } from '../lib/safe-fetch-json';
import type { Signal } from '../types/intelligence';
import type { MarketSignal, MarketSignalStats } from '../types/corporate-impact';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AppShell from '../components/layout/AppShell';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SectionHeader from '../components/ui/SectionHeader';
import SkeletonSignal from '../components/ui/SkeletonSignal';
import { Search, MapPin, TrendingUp, Clock, Sparkles, ArrowRight, BarChart3, Activity, Building2, Table2, List, Loader2 } from 'lucide-react';
import SignalFilters from '../components/signals/SignalFilters';
import SignalsTable from '../components/signals/SignalsTable';
import SignalPreviewDrawer from '../components/signals/SignalPreviewDrawer';
import CorporateImpactHeader from '../components/corporate-impact/CorporateImpactHeader';
import CorporateImpactFilters from '../components/corporate-impact/CorporateImpactFilters';
import SignalCard from '../components/corporate-impact/SignalCard';
import EmptyState from '../components/corporate-impact/EmptyState';
import CorporateImpactReportCard from '../components/corporate-impact/CorporateImpactReportCard';
import CorporateImpactPerplexityQuery from '../components/corporate-impact/CorporateImpactPerplexityQuery';
import WatchlistButton from '../components/watchlist/WatchlistButton';
import { AlertTriangle, Info } from 'lucide-react';

type ViewMode = 'general' | 'companies' | 'table';

function SignalsPageContent() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isLoaded: authLoaded } = useClerkAuth();
  const navigate = useNavigate();
  
  const isFullyLoaded = userLoaded && authLoaded;
  const [viewMode, setViewMode] = useState<ViewMode>('general');
  
  // General signals state (IntelligenceFeed)
  const [generalSignals, setGeneralSignals] = useState<Signal[]>([]);
  const [generalLoading, setGeneralLoading] = useState(true);
  const [generalError, setGeneralError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'top' | 'recent' | 'critical'>('top');
  
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
  const [preferences, setPreferences] = useState<any>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load preferences
  useEffect(() => {
    async function fetchPreferences() {
      if (!user?.id) return;
      try {
        const preferencesData = await getUserPreferences(user.id).catch(() => null);
        setPreferences(preferencesData);
      } catch (err) {
        console.error('Error loading preferences:', err);
      }
    }
    fetchPreferences();
  }, [user?.id]);

  // Load general signals (IntelligenceFeed style)
  const fetchGeneralSignals = useCallback(async () => {
    if (!isFullyLoaded || !user?.id) return;

    try {
      setGeneralLoading(true);
      setGeneralError('');

      let searchOptions: any = {
        searchQuery: debouncedSearchQuery || undefined,
        limit: 100,
      };

      switch (activeTab) {
        case 'critical':
          searchOptions.minImpactScore = 0.7;
          break;
        case 'top':
        case 'recent':
          break;
      }

      if (preferences) {
        if (preferences.preferred_sectors?.length > 0) {
          searchOptions.sectorFilter = preferences.preferred_sectors;
        }
        if (preferences.preferred_regions?.length > 0) {
          searchOptions.regionFilter = preferences.preferred_regions;
        }
      }

      const eventsData = await getEventsWithCausalChainsSearch(searchOptions, user.id);
      const signalsData = await getSignalsViaAgent(eventsData.events || [], user.id, preferences);
      
      setGeneralSignals(signalsData.signals || []);
    } catch (error: any) {
      console.error('Error loading general signals:', error);
      setGeneralError(error.message || 'Failed to load signals');
      setGeneralSignals([]);
    } finally {
      setGeneralLoading(false);
    }
  }, [debouncedSearchQuery, activeTab, preferences, user?.id, isFullyLoaded]);

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
    if (viewMode === 'general') {
      fetchGeneralSignals();
    } else if (viewMode === 'companies') {
      loadCompanySignals();
    } else if (viewMode === 'table') {
      loadTableSignals();
    }
  }, [viewMode, fetchGeneralSignals, selectedFilter, selectedSector, selectedSectors, selectedCategory, companySearchQuery, tableFilters]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getImpactBadgeVariant = (impact: number) => {
    if (impact >= 80) return 'critical';
    if (impact >= 60) return 'level';
    return 'neutral';
  };

  const getHorizonLabel = (horizon: string) => {
    switch (horizon) {
      case 'immediate': return 'Immediate';
      case 'short': return 'Short-term';
      case 'medium': return 'Medium-term';
      case 'long': return 'Long-term';
      default: return horizon;
    }
  };

  const filteredGeneralSignals = generalSignals.filter(s => {
    if (activeTab === 'critical') return (s.impact_score || 0) >= 80;
    return true;
  });

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
        title="Corporate Impact — Nucigen"
        description="Corporate impact: what changed and what to do"
      />

      <div className="col-span-1 sm:col-span-12">
        {/* Header with View Toggle */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader
              title="Corporate Impact"
              subtitle="What changed and what to do"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 p-1 bg-white/[0.02] border border-white/[0.05] rounded-xl w-fit">
            <button
              onClick={() => setViewMode('general')}
              className={`px-4 py-2 rounded-lg transition-all text-sm font-light flex items-center gap-2 ${
                viewMode === 'general'
                  ? 'bg-[#E1463E] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              General
            </button>
            <button
              onClick={() => setViewMode('companies')}
              className={`px-4 py-2 rounded-lg transition-all text-sm font-light flex items-center gap-2 ${
                viewMode === 'companies'
                  ? 'bg-[#E1463E] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Company Impact
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg transition-all text-sm font-light flex items-center gap-2 ${
                viewMode === 'table'
                  ? 'bg-[#E1463E] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table2 className="w-4 h-4" />
              Table
            </button>
          </div>
        </header>

        {/* General Signals View */}
        {viewMode === 'general' && (
          <>
            {/* Search and Tabs */}
            <div className="mb-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search signals, sectors, regions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-white/10 focus:bg-white/[0.03] transition-all font-light"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(['top', 'recent', 'critical'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg transition-all text-sm font-light ${
                      activeTab === tab
                        ? 'bg-[#E1463E]/20 text-[#E1463E] border border-[#E1463E]/30'
                        : 'bg-white/[0.02] border border-white/[0.05] text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Signals List */}
            {generalLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <SkeletonSignal key={i} />
                ))}
              </div>
            ) : generalError ? (
              <div className="text-center py-12">
                <div className="backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/10 to-[#E1463E]/5 border border-[#E1463E]/30 rounded-2xl p-8 max-w-2xl mx-auto">
                  <AlertTriangle className="w-12 h-12 text-[#E1463E] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Error Loading Signals</h3>
                  <p className="text-slate-400 mb-4">{generalError}</p>
                </div>
              </div>
            ) : filteredGeneralSignals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400">No signals found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredGeneralSignals.map((signal, index) => (
                  <Card
                    key={signal.id}
                    hover
                    onClick={() => navigate(`/signals/${signal.id}`)}
                    className="p-4 sm:p-6 transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_25px_rgba(225,70,62,0.35)] border-l-4 border-l-transparent hover:border-l-[#E1463E]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white leading-snug mb-2">
                          {signal.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          <Badge variant={getImpactBadgeVariant(signal.impact_score)} className="text-xs">
                            {signal.impact_score}% impact
                          </Badge>
                          <Badge variant="neutral" className="text-xs">
                            {signal.confidence_score}% confidence
                          </Badge>
                          <Badge variant="level" className="text-xs">
                            {getHorizonLabel(signal.time_horizon)}
                          </Badge>
                        </div>
                        <p className="text-slate-300 font-light leading-relaxed mb-4 text-sm">
                          {signal.summary}
                        </p>
                        {signal.why_it_matters && (
                          <div className="p-3 bg-[#E1463E]/10 border border-[#E1463E]/20 rounded-lg mb-4">
                            <p className="text-sm text-slate-300 font-light">
                              <span className="font-semibold text-[#E1463E]">Why it matters: </span>
                              {signal.why_it_matters}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-slate-500 pt-3 border-t border-white/[0.05]">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(signal.last_updated)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <TrendingUp className="w-3 h-3" />
                            {signal.source_count || signal.related_event_ids?.length || 0} related event{signal.source_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <WatchlistButton
                          entityType="signal"
                          entityId={signal.id}
                          entityName={signal.title}
                          variant="icon"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/signals/${signal.id}`);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-lg text-slate-400 hover:text-white hover:bg-[#E1463E]/10 hover:border-[#E1463E]/30 transition-all text-sm font-light"
                        >
                          View Details
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
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
            <div className="mb-6">
              <CorporateImpactPerplexityQuery industries={selectedSectors} />
            </div>
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

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3">
              <SignalFilters
                filters={tableFilters}
                onFiltersChange={setTableFilters}
              />
            </div>
            <div className="lg:col-span-9">
              <SignalsTable
                signals={tableSignals}
                loading={tableLoading}
                onSignalClick={setSelectedSignalId}
              />
            </div>
            {selectedSignalId && (
              <SignalPreviewDrawer
                signalId={selectedSignalId}
                onClose={() => setSelectedSignalId(null)}
              />
            )}
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
