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
import AppSidebar from '../components/AppSidebar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SectionHeader from '../components/ui/SectionHeader';
import { Bell, AlertTriangle, Clock, ArrowRight, CheckCircle } from 'lucide-react';

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
          <p className="text-sm text-slate-500 font-light">Loading alerts...</p>
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
              <p className="text-base text-red-400 font-light mb-2">Unable to load alerts</p>
              <p className="text-sm text-slate-400 font-light">{error}</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-light"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const unreadCount = alerts.length; // All alerts are "unread" in this implementation

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <SEO 
        title="Alerts — Nucigen Labs"
        description="Critical alerts requiring immediate attention"
      />

      <AppSidebar />

      <div className="flex-1 flex flex-col lg:ml-64">
        <header className="border-b border-white/[0.02] bg-[#0F0F0F]/30 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
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
          </div>
        </header>

        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-12 w-full">
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
              <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-lg text-slate-500 font-light mb-4">
                No alerts at this time.
              </p>
              <p className="text-sm text-slate-600 font-light">
                Alerts will appear here when critical thresholds are exceeded.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card 
                  key={alert.id} 
                  className={`p-6 ${
                    alert.severity === 'critical' 
                      ? 'border-red-500/20 bg-red-500/5' 
                      : alert.severity === 'high'
                      ? 'border-yellow-500/20 bg-yellow-500/5'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${
                          alert.severity === 'critical'
                            ? 'bg-red-500/20 border border-red-500/30'
                            : alert.severity === 'high'
                            ? 'bg-yellow-500/20 border border-yellow-500/30'
                            : 'bg-orange-500/20 border border-orange-500/30'
                        }`}>
                          <AlertTriangle className={`w-5 h-5 ${
                            alert.severity === 'critical' 
                              ? 'text-red-400' 
                              : alert.severity === 'high'
                              ? 'text-yellow-400'
                              : 'text-orange-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <Badge variant="neutral">
                              {alert.impact}% impact
                            </Badge>
                            <Badge variant="level">
                              {alert.confidence}% confidence
                            </Badge>
                          </div>
                          <h3 className="text-lg font-light text-white mb-2">
                            {alert.title}
                          </h3>
                          <p className="text-sm text-slate-300 font-light leading-relaxed mb-2">
                            {alert.trigger_reason}
                          </p>
                          <p className="text-xs text-slate-500 font-light mb-3">
                            Threshold exceeded: {alert.threshold_exceeded}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(alert.last_updated)}
                            </span>
                            {alert.related_event_ids && alert.related_event_ids.length > 0 && (
                              <button
                                onClick={() => navigate(`/events?event_ids=${alert.related_event_ids?.join(',')}`)}
                                className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors"
                              >
                                View {alert.related_event_ids.length} related event{alert.related_event_ids.length !== 1 ? 's' : ''}
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        // Mark as read (would call API in production)
                        console.log('Mark alert as read:', alert.id);
                      }}
                      className="px-4 py-2 text-xs bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Mark Read
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function Alerts() {
  return (
    <ProtectedRoute>
      <AlertsContent />
    </ProtectedRoute>
  );
}
