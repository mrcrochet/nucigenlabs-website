/**
 * Corporate Impact Page
 * 
 * Displays market signals identifying companies likely to be impacted
 * by geopolitical/regulatory events
 */

import { useState, useEffect } from 'react';
import { Sparkles, Activity, Info, AlertTriangle } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import SEO from '../components/SEO';
import ProtectedRoute from '../components/ProtectedRoute';
import CorporateImpactHeader from '../components/corporate-impact/CorporateImpactHeader';
import CorporateImpactFilters from '../components/corporate-impact/CorporateImpactFilters';
import CorporateImpactReportCard from '../components/corporate-impact/CorporateImpactReportCard';
import SignalCard from '../components/corporate-impact/SignalCard';
import EmptyState from '../components/corporate-impact/EmptyState';
import type { MarketSignal, MarketSignalStats } from '../types/corporate-impact';

function CorporateImpactPageContent() {
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [stats, setStats] = useState<MarketSignalStats>({
    total_signals: 0,
    opportunities: 0,
    risks: 0,
    avg_confidence: 'Medium-High',
  });
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'opportunity' | 'risk'>('all');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableSectors, setAvailableSectors] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSignals();
  }, [selectedFilter, selectedSector, selectedSectors, selectedCategory, searchQuery]);

  const loadSignals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedFilter !== 'all') {
        params.append('type', selectedFilter);
      }
      if (selectedSectors.length > 0) {
        params.append('sectors', selectedSectors.join(','));
      } else if (selectedSector !== 'all') {
        params.append('sector', selectedSector);
      }
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      params.append('limit', '50');

      const url = `/api/corporate-impact/signals?${params.toString()}`;
      console.log('[Corporate Impact] Fetching signals from:', url);

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Corporate Impact] API error:', response.status, errorText);
        throw new Error(`API error: ${response.status} - ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      console.log('[Corporate Impact] API response:', { success: data.success, signalsCount: data.data?.signals?.length || 0 });

      if (data.success && data.data) {
        setSignals(data.data.signals || []);
        if (data.data.stats) {
          setStats(data.data.stats);
        }
        if (data.data.available_sectors) {
          setAvailableSectors(data.data.available_sectors);
        }
        if (data.data.available_categories) {
          setAvailableCategories(data.data.available_categories);
        }
      } else if (data.error) {
        console.error('[Corporate Impact] API returned error:', data.error);
        setSignals([]);
      }
    } catch (error: any) {
      console.error('[Corporate Impact] Error loading signals:', error);
      setSignals([]);
      // Show error to user
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        setError('API server not available. Please start it with: npm run api:server');
      } else {
        setError(error.message || 'Failed to load signals');
      }
    } finally {
      setLoading(false);
    }
  };

  // Demo signals removed - system is now live
  // Only real signals from database are displayed

  // Filtering is now done server-side, but keep client-side filter as fallback
  const filteredSignals = signals;

  return (
    <div className="col-span-1 sm:col-span-12 bg-black min-h-screen">
      <CorporateImpactHeader stats={stats} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Bandeau: Events | N signals | Company impact — stack on mobile */}
        <div className="flex flex-col sm:flex-row items-center justify-between py-4 border-y border-gray-900 gap-4 sm:gap-0">
          <div className="text-center flex-1 order-1 sm:order-1">
            <div className="text-xs text-gray-600 mb-1 uppercase tracking-wider font-medium">Drivers</div>
            <div className="font-medium text-gray-300">Events</div>
            <div className="text-xs text-gray-500 mt-1">Real-world catalysts</div>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 w-full sm:w-auto order-3 sm:order-2">
            <div className="flex-1 h-px bg-gray-800" aria-hidden />
            <span className="text-xs text-gray-600 px-2 font-mono">{filteredSignals.length} signals</span>
            <div className="flex-1 h-px bg-gray-800" aria-hidden />
          </div>
          <div className="text-center flex-1 order-2 sm:order-3">
            <div className="text-xs text-gray-600 mb-1 uppercase tracking-wider font-medium">Outcome</div>
            <div className="font-medium text-gray-300">Company impact</div>
            <div className="text-xs text-gray-500 mt-1">Exposure & opportunities</div>
          </div>
        </div>

        <CorporateImpactFilters
          selectedFilter={selectedFilter}
          selectedSector={selectedSector}
          selectedSectors={selectedSectors}
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          onFilterChange={setSelectedFilter}
          onSectorChange={setSelectedSector}
          onSectorsChange={setSelectedSectors}
          onCategoryChange={setSelectedCategory}
          onSearchChange={setSearchQuery}
          opportunitiesCount={stats.opportunities}
          risksCount={stats.risks}
          totalCount={stats.total_signals}
          availableSectors={availableSectors}
          availableCategories={availableCategories}
        />

        {/* Rapport Corporate Impact — affiché quand des industries sont sélectionnées */}
        {selectedSectors.length > 0 && !loading && (
          <div className="py-4">
            <CorporateImpactReportCard
              industries={selectedSectors}
              totalSignals={signals.length}
              opportunities={signals.filter((s) => s.type === 'opportunity').length}
              risks={signals.filter((s) => s.type === 'risk').length}
              topCompanies={signals.slice(0, 8).map((s) => s.company.name)}
            />
          </div>
        )}

        {/* Activity Indicator */}
        <div className="py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" aria-hidden />
              Monitoring companies across sectors
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden />
              Live feed · Last update: 1h ago
            </span>
          </div>
        </div>

        {/* Info Banner — mockup style */}
        <div className="py-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-[#E1463E]/10 border border-[#E1463E]/20 rounded-lg shrink-0">
              <Sparkles className="w-5 h-5 text-[#E1463E]" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-gray-200 font-semibold mb-2 text-base">AI-Curated Market Signals</h3>
              <div className="mb-3 p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                <p className="text-gray-300 font-light text-sm leading-relaxed italic">
                  "We don't forecast prices. We show how similar pressure reshaped markets before."
                </p>
              </div>
              <p className="text-gray-400 leading-relaxed text-sm mb-3">
                Companies whose <span className="text-gray-200 font-medium">valuation may be affected</span> by real-world events{' '}
                <span className="text-gray-200 font-medium">before</span> the impact is fully priced.
              </p>
              <ul className="space-y-1.5 text-xs text-gray-500">
                <li className="flex items-start gap-2"><span className="text-gray-600 mt-0.5">•</span> Historical pattern matching (Causal Replay™)</li>
                <li className="flex items-start gap-2"><span className="text-gray-600 mt-0.5">•</span> Past similar cases, not predictions</li>
                <li className="flex items-start gap-2"><span className="text-gray-600 mt-0.5">•</span> <span className="text-gray-400">High-confidence matches only. Noise filtered by design.</span></li>
              </ul>
              <p className="text-xs text-gray-600 mt-3 italic">Event-driven corporate exposure. Not investment advice.</p>
            </div>
          </div>
        </div>
        </div>

        {/* Low Noise Mode Indicator (when few signals) */}
        {!loading && filteredSignals.length > 0 && filteredSignals.length < 5 && (
          <div className="py-2">
            <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Info className="w-3.5 h-3.5 shrink-0" aria-hidden />
                <span><span className="text-gray-400 font-medium">Low Noise Mode</span> — Evidence-only signals. Only companies with clear, evidence-backed exposure are shown.</span>
              </div>
            </div>
          </div>
        )}

        {/* Signals Feed */}
        <div className="pb-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Loading signals...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/10 to-[#E1463E]/5 border border-[#E1463E]/30 rounded-2xl p-8 max-w-2xl mx-auto">
              <AlertTriangle className="w-12 h-12 text-[#E1463E] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Error Loading Signals</h3>
              <p className="text-slate-400 mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  loadSignals();
                }}
                className="px-4 py-2 backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/20 to-[#E1463E]/10 border border-[#E1463E]/30 rounded-lg text-sm font-medium text-[#E1463E] hover:from-[#E1463E]/30 hover:to-[#E1463E]/20 transition-all"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredSignals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
          </div>
        )}

        {!loading && !error && filteredSignals.length === 0 && (
          <EmptyState />
        )}
        </div>
      </div>
    </div>
  );
}

export default function CorporateImpactPage() {
  return (
    <ProtectedRoute>
      <SEO 
        title="Corporate Impact — Nucigen"
        description="How real-world events are likely to affect companies"
      />
      <AppShell>
        <CorporateImpactPageContent />
      </AppShell>
    </ProtectedRoute>
  );
}
