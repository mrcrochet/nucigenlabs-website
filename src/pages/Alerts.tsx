/**
 * PHASE 3C: Alerts Page
 * 
 * Functional alerts page with user alert management
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AppSidebar from '../components/AppSidebar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SectionHeader from '../components/ui/SectionHeader';
import { createClient } from '@supabase/supabase-js';
import { Bell, Settings, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface UserAlert {
  id: string;
  user_id: string;
  nucigen_event_id: string;
  alert_type: string;
  priority: string;
  match_reasons: string[];
  status: string;
  created_at: string;
  nucigen_events: {
    id: string;
    summary: string;
    event_type: string;
    sector: string | null;
    region: string | null;
    impact_score: number | null;
    confidence: number | null;
    created_at: string;
  };
}

function AlertsContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'unread' | 'all'>('unread');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchAlerts() {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('user_alerts')
          .select(`
            *,
            nucigen_events (
              id,
              summary,
              event_type,
              sector,
              region,
              impact_score,
              confidence,
              created_at
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const alertsData = (data || []) as UserAlert[];
        setAlerts(alertsData);
        setUnreadCount(alertsData.filter(a => a.status === 'unread').length);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAlerts();
  }, [user]);

  const markAsRead = async (alertId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_alerts')
        .update({
          status: 'read',
          read_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .eq('user_id', user.id);

      if (error) throw error;

      setAlerts(alerts.map(a => a.id === alertId ? { ...a, status: 'read' } : a));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const dismissAlert = async (alertId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_alerts')
        .update({
          status: 'dismissed',
          dismissed_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .eq('user_id', user.id);

      if (error) throw error;

      setAlerts(alerts.filter(a => a.id !== alertId));
      if (alerts.find(a => a.id === alertId)?.status === 'unread') {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'normal':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'high_impact':
        return <AlertCircle className="w-4 h-4" />;
      case 'sector_match':
      case 'region_match':
        return <Bell className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const filteredAlerts = activeTab === 'unread'
    ? alerts.filter(a => a.status === 'unread')
    : alerts;

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

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <SEO
        title="Alerts — Nucigen Labs"
        description="Your personalized event alerts"
      />

      <AppSidebar />

      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <header className="border-b border-white/[0.02] bg-[#0F0F0F]/30 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
            <div className="flex items-center justify-between">
              <div>
                <SectionHeader
                  title="Alerts"
                  subtitle={`${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''}`}
                />
              </div>
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.03] transition-all text-sm font-light"
              >
                <Settings className="w-4 h-4" />
                <span>Configure</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-12 w-full">
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-8 border-b border-white/[0.02]">
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-6 py-3 text-sm font-light transition-all border-b-2 ${
                activeTab === 'unread'
                  ? 'text-white border-[#E1463E]'
                  : 'text-slate-500 border-transparent hover:text-white'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 text-sm font-light transition-all border-b-2 ${
                activeTab === 'all'
                  ? 'text-white border-[#E1463E]'
                  : 'text-slate-500 border-transparent hover:text-white'
              }`}
            >
              All ({alerts.length})
            </button>
          </div>

          {/* Alerts List */}
          {filteredAlerts.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.05] rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-xl font-light text-white mb-2">
                {activeTab === 'unread' ? 'No unread alerts' : 'No alerts yet'}
              </h3>
              <p className="text-sm text-slate-500 font-light">
                {activeTab === 'unread'
                  ? 'You\'re all caught up!'
                  : 'Alerts will appear here when events match your preferences.'}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => {
                const event = alert.nucigen_events;
                if (!event) return null;

                return (
                  <Card
                    key={alert.id}
                    className={`p-6 ${alert.status === 'unread' ? 'border-l-4 border-l-[#E1463E]' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          {getAlertTypeIcon(alert.alert_type)}
                          <Badge variant="neutral" className={getPriorityColor(alert.priority)}>
                            {alert.priority}
                          </Badge>
                          {alert.status === 'unread' && (
                            <div className="w-2 h-2 bg-[#E1463E] rounded-full"></div>
                          )}
                        </div>

                        <h3
                          className="text-lg font-light text-white mb-2 cursor-pointer hover:text-[#E1463E] transition-colors"
                          onClick={() => {
                            navigate(`/events/${event.id}`);
                            if (alert.status === 'unread') {
                              markAsRead(alert.id);
                            }
                          }}
                        >
                          {event.summary}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 mb-3 text-sm text-slate-500 font-light">
                          {event.sector && (
                            <Badge variant="sector">{event.sector}</Badge>
                          )}
                          {event.region && (
                            <Badge variant="region">{event.region}</Badge>
                          )}
                          {event.event_type && (
                            <Badge variant="level">{event.event_type}</Badge>
                          )}
                          {event.impact_score !== null && (
                            <span>Impact: {(event.impact_score * 100).toFixed(0)}%</span>
                          )}
                        </div>

                        <div className="mb-4">
                          <p className="text-xs text-slate-600 mb-1">Why this alert:</p>
                          <ul className="text-sm text-slate-400 font-light space-y-1">
                            {alert.match_reasons.map((reason, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-[#E1463E] mt-1">•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-600 font-light">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(alert.created_at).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {alert.status === 'unread' && (
                          <button
                            onClick={() => markAsRead(alert.id)}
                            className="p-2 text-slate-500 hover:text-white hover:bg-white/[0.02] rounded-lg transition-all"
                            title="Mark as read"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Dismiss"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
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
