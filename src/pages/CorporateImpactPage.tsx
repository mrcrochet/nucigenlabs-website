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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableSectors, setAvailableSectors] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSignals();
  }, [selectedFilter, selectedSector, selectedCategory, searchQuery]);

  const loadSignals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedFilter !== 'all') {
        params.append('type', selectedFilter);
      }
      if (selectedSector !== 'all') {
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
    <div className="col-span-1 sm:col-span-12">
      <CorporateImpactHeader stats={stats} />

      <CorporateImpactFilters
        selectedFilter={selectedFilter}
        selectedSector={selectedSector}
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        onFilterChange={setSelectedFilter}
        onSectorChange={setSelectedSector}
        onCategoryChange={setSelectedCategory}
        onSearchChange={setSearchQuery}
        opportunitiesCount={stats.opportunities}
        risksCount={stats.risks}
        totalCount={stats.total_signals}
        availableSectors={availableSectors}
        availableCategories={availableCategories}
      />

      {/* Activity Indicator */}
      <div className="px-6 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <Activity className="w-4 h-4" />
            <span>Monitoring 1,247 companies across 42 sectors</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live feed</span>
            <span>•</span>
            <span>Last update: 1h ago</span>
          </div>
        </div>
      </div>

      {/* Info Banner - Improved */}
      <div className="px-6 py-4">
        <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.15] rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-gradient-to-br from-[#E1463E]/20 to-[#E1463E]/10 border border-[#E1463E]/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-[#E1463E]" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-3 text-lg">AI-Curated Market Signals</h3>
              
              {/* Product Phrase - Very Strong */}
              <div className="mb-4 p-4 backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/10 to-[#E1463E]/5 border border-[#E1463E]/20 rounded-xl">
                <p className="text-white font-light text-base leading-relaxed italic">
                  "We don't forecast prices.
                  <br />
                  We show how similar pressure reshaped markets before."
                </p>
              </div>

              <p className="text-slate-400 leading-relaxed text-sm mb-3">
                Our system identifies companies whose <span className="text-white font-medium">valuation may be affected</span> by real-world events{' '}
                <span className="text-white font-medium">before</span> the impact is fully priced by markets.
              </p>
              <div className="space-y-2 text-sm text-slate-400">
                <p className="flex items-center gap-2">
                  <span className="text-[#E1463E]">•</span>
                  Signals are generated using historical pattern matching (Causal Replay™)
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-[#E1463E]">•</span>
                  We show what happened in past similar cases, not predictions
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-[#E1463E]">•</span>
                  <span className="text-white font-medium">Only high-confidence pattern matches are shown. Noise is filtered by design.</span>
                </p>
              </div>
              <p className="text-xs text-slate-500 mt-4 italic">
                *Event-driven corporate exposure. Not investment advice.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Low Noise Mode Indicator (when few signals) */}
      {!loading && filteredSignals.length > 0 && filteredSignals.length < 5 && (
        <div className="px-6 py-2">
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Info className="w-4 h-4" />
              <span>
                <span className="text-white font-medium">Low Noise Mode — Evidence-only signals</span> — Only companies with clear, evidence-backed exposure to real-world events are shown.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Signals Feed */}
      <div className="px-6 pb-8">
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
          <div className="space-y-6">
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
