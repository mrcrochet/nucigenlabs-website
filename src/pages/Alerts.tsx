/**
 * Alerts Page
 * 
 * UI CONTRACT: Consumes ONLY alerts (not signals or events directly)
 * Alerts are triggered when thresholds are exceeded
 * Rule: No threshold exceeded → no alert
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { 
  getEventsWithCausalChainsSearch,
  getUserPreferences,
} from '../lib/supabase';
import { eventsToSignals } from '../lib/adapters/intelligence-adapters';
import { detectAlertsFromSignals } from '../lib/adapters/alert-adapters';
import type { Alert } from '../types/intelligence';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AppShell from '../components/layout/AppShell';
import SkeletonCard from '../components/ui/SkeletonCard';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SectionHeader from '../components/ui/SectionHeader';
import { Bell, AlertTriangle, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import IntelligentAlertCard from '../components/alerts/IntelligentAlertCard';

function AlertsContent() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isLoaded: authLoaded } = useClerkAuth();
  
  const isFullyLoaded = userLoaded && authLoaded;
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'critical'>('all');

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

  // Fetch alerts (generated from signals when thresholds exceeded)
  const fetchAlerts = useCallback(async () => {
    if (!isFullyLoaded) return;

    if (!user?.id) {
      setError('User not authenticated');
      setLoading(false);
      setAlerts([]);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Fetch events
      const searchOptions: any = {
        limit: 100,
      };

      if (preferences) {
        if (preferences.preferred_sectors && preferences.preferred_sectors.length > 0) {
          searchOptions.sectorFilter = preferences.preferred_sectors;
        }
        if (preferences.preferred_regions && preferences.preferred_regions.length > 0) {
          searchOptions.regionFilter = preferences.preferred_regions;
        }
      }

      const eventsData = await getEventsWithCausalChainsSearch(searchOptions, user.id);
      
      // Generate signals from events
      const signals = eventsToSignals(eventsData || []);
      
      // Detect alerts from signals (thresholds exceeded)
      const thresholds = {
        impact_threshold: preferences?.min_impact_score ? preferences.min_impact_score * 100 : 70,
        confidence_threshold: preferences?.min_confidence_score ? preferences.min_confidence_score * 100 : 60,
        severity_level: activeTab === 'critical' ? 'critical' : 'moderate',
      };

      const allAlerts = detectAlertsFromSignals(signals, thresholds);

      // Filter by tab
      let filteredAlerts = allAlerts;
      if (activeTab === 'critical') {
        filteredAlerts = allAlerts.filter(a => a.severity === 'critical');
      }

      setAlerts(filteredAlerts);
      setError('');
    } catch (err: any) {
      console.error('Error loading alerts:', err);
      setError(err.message || 'Failed to load alerts');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isFullyLoaded, preferences, activeTab]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

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

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high': return 'level';
      case 'moderate': return 'neutral';
      default: return 'neutral';
    }
  };

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

  if (loading) {
    return (
      <AppShell>
        <div className="col-span-1 sm:col-span-12">
          <header className="mb-6">
            <SectionHeader
              title="Alerts"
              subtitle="Loading alerts..."
            />
          </header>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="col-span-1 sm:col-span-12 flex items-center justify-center min-h-[400px]">
          <div className="max-w-2xl w-full text-center">
            <div className="mb-6 p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-base text-red-400 font-light mb-2">Unable to load alerts</p>
              <p className="text-sm text-slate-400 font-light">{error}</p>
            </div>
            <button
              onClick={() => navigate('/overview')}
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-light"
            >
              Back to Overview
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const unreadCount = alerts.length; // All alerts are "unread" in this implementation

  return (
    <AppShell>
      <SEO 
        title="Alerts — Nucigen Labs"
        description="Critical alerts requiring immediate attention"
      />

      <div className="col-span-1 sm:col-span-12">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <SectionHeader
              title="Alerts"
              subtitle={`Thresholds exceeded · ${unreadCount} active alert${unreadCount !== 1 ? 's' : ''}`}
            />
            {unreadCount > 0 && (
              <Badge variant="critical" className="flex items-center gap-1.5">
                <Bell className="w-3 h-3" />
                {unreadCount} unread
              </Badge>
            )}
          </div>
        </header>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 border-b border-white/[0.02]">
          {(['all', 'critical'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-light transition-all border-b-2 ${
                activeTab === tab
                  ? 'text-white border-[#E1463E]'
                  : 'text-slate-500 border-transparent hover:text-white'
              }`}
            >
              {tab === 'critical' ? 'Critical Only' : 'All Alerts'}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        {alerts.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg text-white font-light mb-2">All clear</h3>
              <p className="text-sm text-slate-400 font-light mb-6">
                No alerts at this time. Alerts will appear here when critical thresholds are exceeded based on your preferences.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => navigate('/settings/alerts')}
                  className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-light"
                >
                  Configure Alerts
                </button>
                <button
                  onClick={() => navigate('/intelligence')}
                  className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-light"
                >
                  View Signals
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id}>
                <IntelligentAlertCard
                  alert={alert}
                  onMarkRead={(alertId) => {
                    // Mark as read (would call API in production)
                    console.log('Mark alert as read:', alertId);
                  }}
                />
                {/* Additional actions */}
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(alert.last_updated)}
                  </span>
                  {alert.related_event_ids && alert.related_event_ids.length > 0 && (
                    <button
                      onClick={() => navigate(`/events-feed?event_ids=${alert.related_event_ids?.join(',')}`)}
                      className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors"
                    >
                      View {alert.related_event_ids.length} related event{alert.related_event_ids.length !== 1 ? 's' : ''}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  {alert.related_signal_ids && alert.related_signal_ids.length > 0 && (
                    <button
                      onClick={() => navigate(`/signals/${alert.related_signal_ids[0]}`)}
                      className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors"
                    >
                      View Signal
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function Alerts() {
  return (
    <ProtectedRoute>
      <AlertsContent />
    </ProtectedRoute>
  );
}
