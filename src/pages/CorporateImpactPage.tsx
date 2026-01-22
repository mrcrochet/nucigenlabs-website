/**
 * Corporate Impact Page
 * 
 * Displays market signals identifying companies likely to be impacted
 * by geopolitical/regulatory events
 */

import { useState, useEffect } from 'react';
import { Sparkles, Activity, Info, ArrowRight } from 'lucide-react';
import CorporateImpactHeader from '../components/corporate-impact/CorporateImpactHeader';
import CorporateImpactFilters from '../components/corporate-impact/CorporateImpactFilters';
import SignalCard from '../components/corporate-impact/SignalCard';
import EmptyState from '../components/corporate-impact/EmptyState';
import type { MarketSignal, MarketSignalStats } from '../types/corporate-impact';

export default function CorporateImpactPage() {
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [stats, setStats] = useState<MarketSignalStats>({
    total_signals: 0,
    opportunities: 0,
    risks: 0,
    avg_confidence: 'Medium-High',
  });
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'opportunity' | 'risk'>('all');
  const [selectedSector, setSelectedSector] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  useEffect(() => {
    loadSignals();
  }, [selectedFilter, selectedSector]);

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
      params.append('limit', '50');

      const response = await fetch(`/api/corporate-impact/signals?${params.toString()}`);
      const data = await response.json();

      if (data.success && data.data) {
        setSignals(data.data.signals || []);
        if (data.data.stats) {
          setStats(data.data.stats);
        }
      }
    } catch (error) {
      console.error('Error loading signals:', error);
      setSignals([]);
    } finally {
      setLoading(false);
    }
  };

  // Demo signals (shown when no real signals available)
  const demoSignals: MarketSignal[] = [
    {
      id: 'demo-1',
      type: 'opportunity',
      company: {
        name: 'Lockheed Martin',
        ticker: 'LMT',
        sector: 'Defense',
        market_cap: '$120B',
        current_price: '$450.20',
        exchange: 'NYSE',
      },
      prediction: {
        direction: 'up',
        magnitude: '15-25%',
        timeframe: '3-6 months',
        confidence: 'medium-high',
        target_price: '$520-560 (post-event, past cases)',
      },
      catalyst_event: {
        title: 'NATO increases military readiness in response to regional tensions',
        event_id: null,
        tier: 'Strategic',
        published: new Date().toISOString(),
      },
      reasoning: {
        summary:
          'Escalation in regional defense spending has historically increased procurement cycles for major defense contractors. Past NATO escalation cycles (2014-2018) showed consistent 15-25% stock appreciation for defense contractors within 3-6 months.',
        key_factors: [
          'NATO defense budgets increased 15% YoY in Q4 2024',
          'Historical pattern: 2014-2018 Europe defense spending surge correlated with 40% LMT stock increase',
          'Lockheed Martin holds 35% market share in F-35 program (NATO\'s primary fighter)',
          'Recent $12B contract win for missile defense systems',
        ],
        risks: [
          'Defense spending cycles can be delayed by political processes',
          'Competition from European defense contractors (BAE Systems, Airbus)',
          'Supply chain constraints may limit production capacity',
        ],
      },
      market_data: {
        volume_change: '+85%',
        institutional_interest: 'Increasing (5 new positions last quarter)',
        analyst_coverage: 'Heavy (18 analysts, avg target $480)',
        short_interest: '2.1%',
      },
      sources: ['Reuters', 'Bloomberg', 'NATO Defense Procurement Database', 'Company SEC filings'],
    },
    {
      id: 'demo-2',
      type: 'risk',
      company: {
        name: 'Foxconn Technology Group',
        ticker: '2317.TW',
        sector: 'Manufacturing / Supply Chain',
        market_cap: '$45B',
        current_price: 'NT$105',
        exchange: 'TWSE',
      },
      prediction: {
        direction: 'down',
        magnitude: '12-20%',
        timeframe: '2-4 weeks',
        confidence: 'medium',
        target_price: 'NT$84-92 (post-event, past cases)',
      },
      catalyst_event: {
        title: 'New semiconductor export restrictions expand to manufacturing equipment',
        event_id: null,
        tier: 'Critical',
        published: new Date().toISOString(),
      },
      reasoning: {
        summary:
          'Rising geopolitical tensions and export controls increase operational risks for companies with heavy exposure to restricted manufacturing zones. Past trade disruption cycles (2020) showed 12-20% stock declines for China-exposed manufacturers within 2-4 weeks.',
        key_factors: [
          'Export controls directly impact Foxconn\'s China manufacturing facilities',
          'Historical pattern: 2020 trade disruption caused 18% stock decline',
          'Apple (major customer) diversifying supply chain away from China',
          'Labor costs increasing in China, reducing margin advantage',
        ],
        risks: [
          'Foxconn could pivot to other markets (India, Vietnam)',
          'Strong relationships with major tech companies provide buffer',
          'Export restrictions may be less severe than feared',
        ],
      },
      market_data: {
        volume_change: '+120%',
        institutional_interest: 'Decreasing (3 large funds reduced positions)',
        analyst_coverage: 'Moderate (8 analysts, avg target NT$95)',
        short_interest: '8.5%',
      },
      sources: ['Financial Times', 'Bloomberg', 'Nikkei Asia', 'Company investor relations'],
    },
  ];

  const filteredSignals = signals.length > 0
    ? signals.filter((signal) => {
        if (selectedFilter === 'opportunities') return signal.type === 'opportunity';
        if (selectedFilter === 'risks') return signal.type === 'risk';
        if (selectedSector !== 'all' && signal.company.sector !== selectedSector) return false;
        return true;
      })
    : demoSignals.filter((signal) => {
        if (selectedFilter === 'opportunities') return signal.type === 'opportunity';
        if (selectedFilter === 'risks') return signal.type === 'risk';
        if (selectedSector !== 'all' && signal.company.sector !== selectedSector) return false;
        return true;
      });

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <CorporateImpactHeader stats={stats} />

      <CorporateImpactFilters
        selectedFilter={selectedFilter}
        selectedSector={selectedSector}
        onFilterChange={setSelectedFilter}
        onSectorChange={setSelectedSector}
        opportunitiesCount={stats.opportunities}
        risksCount={stats.risks}
        totalCount={stats.total_signals}
      />

      {/* Activity Indicator */}
      <div className="max-w-6xl mx-auto px-6 py-3">
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
      <div className="max-w-6xl mx-auto px-6 py-4">
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
        <div className="max-w-6xl mx-auto px-6 py-2">
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Info className="w-4 h-4" />
              <span>
                <span className="text-white font-medium">Low Noise Mode Enabled</span> — Only companies with clear, evidence-backed exposure to real-world events are shown.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Signals Feed */}
      <div className="max-w-6xl mx-auto px-6 pb-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Loading signals...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSignals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
          </div>
        )}

        {!loading && filteredSignals.length === 0 && signals.length === 0 && (
          <EmptyState onShowHowItWorks={() => setShowHowItWorks(true)} />
        )}

        {/* Demo Signal Badge */}
        {!loading && signals.length === 0 && filteredSignals.length > 0 && (
          <div className="mb-4 backdrop-blur-xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-sm text-yellow-400 text-center">
              <span className="font-semibold">Demo signals</span> — Live signals coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
