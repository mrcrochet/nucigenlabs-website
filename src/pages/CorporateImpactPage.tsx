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
import CorporateImpactHeroSection from '../components/corporate-impact/CorporateImpactHeroSection';
import CorporateImpactTeaserCards from '../components/corporate-impact/CorporateImpactTeaserCards';
import CorporateImpactFilters from '../components/corporate-impact/CorporateImpactFilters';
import CorporateImpactReportCard from '../components/corporate-impact/CorporateImpactReportCard';
import SignalCard from '../components/corporate-impact/SignalCard';
import EmptyState from '../components/corporate-impact/EmptyState';
import { apiUrl } from '../lib/api-base';
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
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<{
    causal_drivers?: string[];
    impact_score?: { average: number; count: number; trend: string } | null;
    decision_points?: Array<{ label: string; reason: string; company?: string }>;
  } | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [briefResult, setBriefResult] = useState<{
    brief: string;
    briefType: 'mini' | 'pro';
    scope?: 'tickers' | 'sectors';
    signalsUsed: Array<{ id: string; company_name: string; type: string; event_title: string }>;
    generated_at: string;
    industries?: string[];
  } | null>(null);

  useEffect(() => {
    loadSignals();
  }, [selectedFilter, selectedSector, selectedSectors, selectedCategory, searchQuery]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await fetch(apiUrl('/api/corporate-impact/dashboard'));
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data) setDashboard(json.data);
    } catch {
      // Non-blocking
    }
  };

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

      const path = `/api/corporate-impact/signals?${params.toString()}`;
      const url = apiUrl(path);
      console.log('[Corporate Impact] Fetching signals from:', url);

      const response = await fetch(url);
      const contentType = response.headers.get('content-type') ?? '';
      const rawText = await response.text();
      const isHtml = !contentType.includes('application/json') || rawText.trimStart().startsWith('<');

      // Réponse HTML = SPA fallback (ex. Vercel sans backend) → message clair
      if (isHtml) {
        const isProd = import.meta.env.PROD;
        const hasApiUrl = !!(import.meta.env.VITE_API_URL as string)?.trim();
        let msg = 'La réponse reçue est une page web au lieu des données. ';
        if (isProd && !hasApiUrl) {
          msg += "Configurez VITE_API_URL dans Vercel vers l'URL de votre backend (ex. Railway), ou déployez les routes API.";
        } else if (isProd && hasApiUrl) {
          msg += "Vérifiez que l'URL du backend (VITE_API_URL) est correcte et que le serveur répond en JSON.";
        } else {
          msg += 'En local, lancez le backend : npm run api:server (port 3001).';
        }
        console.error('[Corporate Impact] Non-JSON response (HTML?). Content-Type:', contentType, 'body start:', rawText.substring(0, 80));
        throw new Error(msg);
      }

      if (!response.ok) {
        let errMsg = `API error: ${response.status}`;
        try {
          const errJson = JSON.parse(rawText);
          if (errJson?.error) errMsg = errJson.error;
        } catch {
          if (rawText.length) errMsg = rawText.substring(0, 200);
        }
        console.error('[Corporate Impact] API error:', response.status, rawText);
        throw new Error(errMsg);
      }

      let data: { success?: boolean; data?: any; error?: string };
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error('Réponse API invalide (pas du JSON). Vérifiez la configuration du backend et les clés API (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).');
      }
      console.log('[Corporate Impact] API response:', { success: data.success, signalsCount: data.data?.signals?.length || 0 });

      if (data.success && data.data) {
        setSignals(data.data.signals || []);
        if (data.data.stats) {
          setStats(data.data.stats);
        }
        if (data.data.last_update) {
          setLastUpdate(data.data.last_update);
        }
        if (data.data.available_sectors) {
          setAvailableSectors(data.data.available_sectors);
        }
        if (data.data.available_categories) {
          setAvailableCategories(data.data.available_categories);
        }
        setError(null);
      } else {
        const apiError = data?.error || 'Réponse API invalide';
        console.error('[Corporate Impact] API returned error:', apiError);
        setSignals([]);
        setError(apiError);
      }
    } catch (error: any) {
      console.error('[Corporate Impact] Error loading signals:', error);
      setSignals([]);
      const isProd = import.meta.env.PROD;
      const isNetwork = error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError');
      if (isNetwork && isProd) {
        setError('Le service de données est temporairement indisponible. Réessayez plus tard.');
      } else if (isNetwork) {
        setError('API non joignable. En local, lancez le backend : npm run api:server (port 3001).');
      } else {
        setError(error.message || 'Échec du chargement des signaux.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBrief = async (tickers: string[], briefType: 'mini' | 'pro') => {
    setBriefError(null);
    setBriefResult(null);
    setBriefLoading(true);
    try {
      const res = await fetch(apiUrl('/api/corporate-impact/brief'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers, briefType }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || res.statusText);
      if (json.success && json.data) {
        setBriefResult(json.data);
        setBriefError(null);
        document.getElementById('corporate-impact-report')?.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => document.getElementById('impact-brief-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
      } else {
        throw new Error(json.error || 'Failed to generate brief');
      }
    } catch (e: any) {
      setBriefError(e.message || 'Failed to generate impact brief');
    } finally {
      setBriefLoading(false);
    }
  };

  const handleGenerateSectorBrief = async () => {
    if (selectedSectors.length === 0) return;
    setBriefError(null);
    setBriefResult(null);
    setBriefLoading(true);
    try {
      const res = await fetch(apiUrl('/api/corporate-impact/brief'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industries: selectedSectors, briefType: 'mini' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || res.statusText);
      if (json.success && json.data) {
        setBriefResult(json.data);
        setBriefError(null);
        document.getElementById('corporate-impact-report')?.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => document.getElementById('impact-brief-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
      } else {
        throw new Error(json.error || 'Failed to generate sector brief');
      }
    } catch (e: any) {
      setBriefError(e.message || 'Failed to generate sector brief');
    } finally {
      setBriefLoading(false);
    }
  };

  function formatLastUpdate(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffM = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffMs / 86400000);
    if (diffM < 1) return 'Just now';
    if (diffM < 60) return `${diffM}m ago`;
    if (diffH < 24) return `${diffH}h ago`;
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Filtering is now done server-side, but keep client-side filter as fallback
  const filteredSignals = signals;

  const showReportActions = signals.length > 0 || selectedSectors.length > 0;

  return (
    <div className="col-span-1 sm:col-span-12 bg-black min-h-screen">
      <CorporateImpactHeader stats={stats} showReportActions={showReportActions} />

      {/* Hero: input, CTA calls API to generate brief */}
      <CorporateImpactHeroSection
        onGenerate={handleGenerateBrief}
        generating={briefLoading}
      />

      {/* 3 teaser cards — real data when dashboard loaded */}
      <CorporateImpactTeaserCards dashboard={dashboard} />

      <div id="corporate-impact-report" className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 border-t border-gray-900">
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

        {/* Impact Brief — generated from Hero CTA */}
        {(briefResult || briefError) && (
          <div id="impact-brief-card" className="py-4">
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#E1463E]" aria-hidden />
                <h3 className="text-sm font-semibold text-white">
                  {briefResult?.scope === 'sectors' && briefResult?.industries?.length
                    ? `Sector Brief (${briefResult.industries.join(', ')})`
                    : `Impact Brief${briefResult ? ` (${briefResult.briefType})` : ''}`}
                </h3>
              </div>
              {briefError && (
                <p className="text-sm text-[#E1463E] mb-3">{briefError}</p>
              )}
              {briefResult && (
                <>
                  <div className="text-sm text-gray-300 font-light leading-relaxed whitespace-pre-line mb-4">
                    {briefResult.brief}
                  </div>
                  <p className="text-xs text-gray-500">
                    Based on {briefResult.signalsUsed.length} signal{briefResult.signalsUsed.length !== 1 ? 's' : ''} · Generated {new Date(briefResult.generated_at).toLocaleString()}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Rapport Corporate Impact — affiché quand des industries sont sélectionnées */}
        {selectedSectors.length > 0 && !loading && (
          <div className="py-4">
            <CorporateImpactReportCard
              industries={selectedSectors}
              totalSignals={signals.length}
              opportunities={signals.filter((s) => s.type === 'opportunity').length}
              risks={signals.filter((s) => s.type === 'risk').length}
              topCompanies={signals.slice(0, 8).map((s) => s.company.name)}
              onGenerateSectorBrief={handleGenerateSectorBrief}
              sectorBriefLoading={briefLoading}
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
              Live feed · Last update: {formatLastUpdate(lastUpdate)}
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
              {error.includes('Supabase not configured') && (
                <p className="text-xs text-slate-500 mb-4 text-left max-w-md mx-auto">
                  Backend : vérifiez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans les variables d’environnement du serveur API.
                </p>
              )}
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
        description="What changed, why it matters, and what to do next. Event-to-impact intelligence for your portfolio."
      />
      <AppShell>
        <CorporateImpactPageContent />
      </AppShell>
    </ProtectedRoute>
  );
}
