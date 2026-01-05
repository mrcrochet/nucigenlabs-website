/**
 * PHASE 3B: Quality Dashboard
 * 
 * Dashboard for monitoring quality metrics and validations
 */

import { useState, useEffect } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AppSidebar from '../components/AppSidebar';
import Card from '../components/ui/Card';
import SectionHeader from '../components/ui/SectionHeader';
import { createClient } from '@supabase/supabase-js';
import { TrendingUp, TrendingDown, CheckCircle, XCircle, AlertCircle, BarChart3 } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface QualityMetrics {
  metric_date: string;
  phase1_total_events: number;
  phase1_approved_count: number;
  phase1_rejected_count: number;
  phase1_needs_revision_count: number;
  phase1_avg_accuracy: number | null;
  phase1_avg_relevance: number | null;
  phase1_avg_completeness: number | null;
  phase2b_total_chains: number;
  phase2b_approved_count: number;
  phase2b_rejected_count: number;
  phase2b_needs_revision_count: number;
  phase2b_avg_logical_coherence: number | null;
  phase2b_avg_causality_strength: number | null;
  phase2b_avg_time_horizon_accuracy: number | null;
  overall_quality_score: number | null;
}

function QualityDashboardContent() {
  const { isLoaded: userLoaded } = useUser();
  const { isLoaded: authLoaded } = useClerkAuth();
  
  // Force user to load by accessing auth state
  // Note: QualityDashboard doesn't need user data, but we ensure Clerk is loaded
  const isFullyLoaded = userLoaded && authLoaded;
  const [metrics, setMetrics] = useState<QualityMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        const endDate = new Date();
        const startDate = new Date();
        
        switch (selectedPeriod) {
          case '7d':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(endDate.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(endDate.getDate() - 90);
            break;
        }

        const { data, error } = await supabase
          .from('quality_metrics')
          .select('*')
          .eq('metric_type', 'daily')
          .gte('metric_date', startDate.toISOString().split('T')[0])
          .lte('metric_date', endDate.toISOString().split('T')[0])
          .order('metric_date', { ascending: true });

        if (error) throw error;
        setMetrics(data || []);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [selectedPeriod, isFullyLoaded]);

  const latestMetrics = metrics[metrics.length - 1];
  const previousMetrics = metrics[metrics.length - 2];

  const getTrend = (current: number | null, previous: number | null) => {
    if (current === null || previous === null) return null;
    return current > previous ? 'up' : current < previous ? 'down' : 'neutral';
  };

  const formatPercentage = (value: number | null) => {
    if (value === null) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-500 font-light">Loading quality metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <SEO
        title="Quality Dashboard — Nucigen Labs"
        description="Monitor quality metrics and validations"
      />

      <AppSidebar />

      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <header className="border-b border-white/[0.02] bg-[#0F0F0F]/30 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
            <div className="flex items-center justify-between">
              <SectionHeader
                title="Quality Dashboard"
                subtitle="Monitor extraction quality and validation metrics"
              />
              <div className="flex gap-2">
                {(['7d', '30d', '90d'] as const).map(period => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
                      selectedPeriod === period
                        ? 'bg-white/[0.05] text-white border border-white/10'
                        : 'text-slate-500 hover:text-white hover:bg-white/[0.02]'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-12 w-full">
          {!latestMetrics ? (
            <Card className="p-12 text-center">
              <p className="text-lg text-slate-500 font-light mb-4">No quality metrics available yet.</p>
              <p className="text-sm text-slate-600 font-light">
                Metrics will appear here once validations are submitted.
              </p>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Overall Quality Score */}
              <Card className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-light text-white">Overall Quality Score</h2>
                  {previousMetrics && latestMetrics.overall_quality_score !== null && previousMetrics.overall_quality_score !== null && (
                    <div className="flex items-center gap-2">
                      {getTrend(latestMetrics.overall_quality_score, previousMetrics.overall_quality_score) === 'up' ? (
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      ) : getTrend(latestMetrics.overall_quality_score, previousMetrics.overall_quality_score) === 'down' ? (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      ) : null}
                    </div>
                  )}
                </div>
                <div className="text-5xl font-light text-white mb-2">
                  {formatPercentage(latestMetrics.overall_quality_score)}
                </div>
                <p className="text-sm text-slate-500 font-light">
                  Based on {latestMetrics.phase1_total_events + latestMetrics.phase2b_total_chains} validations
                </p>
              </Card>

              {/* Phase 1 Metrics */}
              <Card className="p-8">
                <SectionHeader title="Phase 1: Event Extraction" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <div className="text-sm text-slate-500 font-light mb-2">Average Accuracy</div>
                    <div className="text-2xl font-light text-white">
                      {formatPercentage(latestMetrics.phase1_avg_accuracy)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 font-light mb-2">Average Relevance</div>
                    <div className="text-2xl font-light text-white">
                      {formatPercentage(latestMetrics.phase1_avg_relevance)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 font-light mb-2">Average Completeness</div>
                    <div className="text-2xl font-light text-white">
                      {formatPercentage(latestMetrics.phase1_avg_completeness)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="text-sm text-slate-400 font-light">Approved</div>
                      <div className="text-xl font-light text-white">{latestMetrics.phase1_approved_count}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <div>
                      <div className="text-sm text-slate-400 font-light">Rejected</div>
                      <div className="text-xl font-light text-white">{latestMetrics.phase1_rejected_count}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <div>
                      <div className="text-sm text-slate-400 font-light">Needs Revision</div>
                      <div className="text-xl font-light text-white">{latestMetrics.phase1_needs_revision_count}</div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Phase 2B Metrics */}
              <Card className="p-8">
                <SectionHeader title="Phase 2B: Causal Chain Extraction" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <div className="text-sm text-slate-500 font-light mb-2">Average Logical Coherence</div>
                    <div className="text-2xl font-light text-white">
                      {formatPercentage(latestMetrics.phase2b_avg_logical_coherence)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 font-light mb-2">Average Causality Strength</div>
                    <div className="text-2xl font-light text-white">
                      {formatPercentage(latestMetrics.phase2b_avg_causality_strength)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 font-light mb-2">Average Time Horizon Accuracy</div>
                    <div className="text-2xl font-light text-white">
                      {formatPercentage(latestMetrics.phase2b_avg_time_horizon_accuracy)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="text-sm text-slate-400 font-light">Approved</div>
                      <div className="text-xl font-light text-white">{latestMetrics.phase2b_approved_count}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <div>
                      <div className="text-sm text-slate-400 font-light">Rejected</div>
                      <div className="text-xl font-light text-white">{latestMetrics.phase2b_rejected_count}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <div>
                      <div className="text-sm text-slate-400 font-light">Needs Revision</div>
                      <div className="text-xl font-light text-white">{latestMetrics.phase2b_needs_revision_count}</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function QualityDashboard() {
  return (
    <ProtectedRoute>
      <QualityDashboardContent />
    </ProtectedRoute>
  );
}

