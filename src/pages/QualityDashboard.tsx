/**
 * Quality Dashboard
 * 
 * UI CONTRACT: Consumes ONLY metrics (not business content)
 * Metrics are system-level quality indicators
 * No business content here - pure system monitoring
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { 
  getEventsWithCausalChainsSearch,
} from '../lib/supabase';
import { eventsToSignals } from '../lib/adapters/intelligence-adapters';
import { assessQualityFromLogs } from '../lib/adapters/metric-adapters';
import type { Metric } from '../types/intelligence';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AppSidebar from '../components/AppSidebar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SectionHeader from '../components/ui/SectionHeader';
import Metric from '../components/ui/Metric';
import { BarChart3, CheckCircle, XCircle, AlertCircle, Clock, Activity, TrendingUp, TrendingDown } from 'lucide-react';

function QualityDashboardContent() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isLoaded: authLoaded } = useClerkAuth();
  
  const isFullyLoaded = userLoaded && authLoaded;
  const [metric, setMetric] = useState<Metric | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  // Fetch quality metrics
  const fetchMetrics = useCallback(async () => {
    if (!isFullyLoaded) return;

    if (!user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Fetch events to calculate metrics
      const eventsData = await getEventsWithCausalChainsSearch({ limit: 1000 }, user.id);
      
      // Generate signals to count
      const signals = eventsToSignals(eventsData || []);

      // Calculate time window
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

      // Simulate pipeline logs (in production, this would come from actual logs)
      const pipelineLogs = {
        events_processed: eventsData?.length || 0,
        signals_generated: signals.length,
        recommendations_active: 0, // Would come from recommendations table
        alerts_triggered: 0, // Would come from alerts table
        errors: 0, // Would come from error logs
        latency_ms: [100, 150, 120, 200, 180], // Simulated latency
      };

      const timeWindow = {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      };

      const qualityMetric = assessQualityFromLogs(pipelineLogs, timeWindow);
      setMetric(qualityMetric);
      setError('');
    } catch (err: any) {
      console.error('Error loading metrics:', err);
      setError(err.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, [user?.id, isFullyLoaded, selectedPeriod]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (!isFullyLoaded) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-500 font-light">Loading...</p>
        </div>
      </div>
    );
  }

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

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex">
        <AppSidebar />
        <div className="flex-1 flex items-center justify-center px-4 lg:ml-64">
          <div className="max-w-2xl w-full text-center">
            <div className="mb-6 p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-base text-red-400 font-light mb-2">Unable to load metrics</p>
              <p className="text-sm text-slate-400 font-light">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!metric) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex">
        <AppSidebar />
        <div className="flex-1 flex items-center justify-center px-4 lg:ml-64">
          <div className="max-w-2xl w-full text-center">
            <p className="text-lg text-slate-500 font-light">No metrics available</p>
          </div>
        </div>
      </div>
    );
  }

  const getCoverageStatus = (score: number) => {
    if (score >= 80) return { color: 'text-green-400', icon: CheckCircle, label: 'Excellent' };
    if (score >= 60) return { color: 'text-yellow-400', icon: AlertCircle, label: 'Good' };
    if (score >= 40) return { color: 'text-orange-400', icon: AlertCircle, label: 'Fair' };
    return { color: 'text-red-400', icon: XCircle, label: 'Poor' };
  };

  const coverageStatus = getCoverageStatus(metric.coverage_score);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <SEO 
        title="Quality Dashboard — Nucigen Labs"
        description="System quality metrics and performance monitoring"
      />

      <AppSidebar />

      <div className="flex-1 flex flex-col lg:ml-64">
        <header className="border-b border-white/[0.02] bg-[#0F0F0F]/30 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
            <div className="flex items-center justify-between">
              <SectionHeader
                title="Quality Dashboard"
                subtitle={`System metrics · Last updated ${new Date(metric.last_updated).toLocaleString()}`}
              />
              <div className="flex items-center gap-2">
                {(['7d', '30d', '90d'] as const).map(period => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-1.5 text-xs font-light rounded-lg transition-all ${
                      selectedPeriod === period
                        ? 'bg-[#E1463E]/20 text-[#E1463E] border border-[#E1463E]/30'
                        : 'bg-white/[0.02] text-slate-500 border border-white/[0.05] hover:bg-white/[0.03]'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-12 w-full">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Metric
              label="Coverage Score"
              value={`${metric.coverage_score}%`}
              icon={BarChart3}
            />
            <Metric
              label="Average Latency"
              value={`${metric.latency_ms}ms`}
              icon={Clock}
            />
            <Metric
              label="Error Rate"
              value={`${(metric.error_rate * 100).toFixed(2)}%`}
              icon={Activity}
            />
            <Metric
              label="Events Processed"
              value={metric.events_processed || 0}
              icon={Activity}
            />
          </div>

          {/* Coverage Status */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-lg border ${
                coverageStatus.color.includes('green') 
                  ? 'border-green-500/20 bg-green-500/5'
                  : coverageStatus.color.includes('yellow')
                  ? 'border-yellow-500/20 bg-yellow-500/5'
                  : coverageStatus.color.includes('orange')
                  ? 'border-orange-500/20 bg-orange-500/5'
                  : 'border-red-500/20 bg-red-500/5'
              }`}>
                {coverageStatus.icon && <coverageStatus.icon className={`w-6 h-6 ${coverageStatus.color}`} />}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-light text-white mb-1">
                  System Coverage: {coverageStatus.label}
                </h3>
                <p className="text-sm text-slate-400 font-light">
                  {metric.coverage_score}% coverage score
                </p>
              </div>
            </div>
            <div className="w-full bg-white/[0.02] rounded-full h-2 mb-4">
              <div 
                className={`h-2 rounded-full transition-all ${
                  metric.coverage_score >= 80 
                    ? 'bg-green-500' 
                    : metric.coverage_score >= 60
                    ? 'bg-yellow-500'
                    : metric.coverage_score >= 40
                    ? 'bg-orange-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${metric.coverage_score}%` }}
              />
            </div>
          </Card>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="p-6">
              <h3 className="text-lg font-light text-white mb-4">Processing Metrics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 font-light">Events Processed</span>
                  <span className="text-sm text-white font-light">{metric.events_processed || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 font-light">Signals Generated</span>
                  <span className="text-sm text-white font-light">{metric.signals_generated || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 font-light">Recommendations Active</span>
                  <span className="text-sm text-white font-light">{metric.recommendations_active || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 font-light">Alerts Triggered</span>
                  <span className="text-sm text-white font-light">{metric.alerts_triggered || 0}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-light text-white mb-4">Performance Metrics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 font-light">Average Latency</span>
                  <span className="text-sm text-white font-light">{metric.latency_ms}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 font-light">Error Rate</span>
                  <span className={`text-sm font-light ${
                    metric.error_rate < 0.01 
                      ? 'text-green-400' 
                      : metric.error_rate < 0.05
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}>
                    {(metric.error_rate * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 font-light">Data Sources Active</span>
                  <span className="text-sm text-white font-light">{metric.data_sources_active || 0}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Validation Notes */}
          {metric.validation_notes && (
            <Card className="p-6">
              <h3 className="text-lg font-light text-white mb-4">Validation Notes</h3>
              <p className="text-sm text-slate-300 font-light leading-relaxed">
                {metric.validation_notes}
              </p>
            </Card>
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
