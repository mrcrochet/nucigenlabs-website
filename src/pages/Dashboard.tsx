/**
 * PHASE 2D: Dashboard (Overview)
 * 
 * Role: Quick orientation
 * Shows "What matters now" with top 3-5 events
 * Real stats only (events ingested, last update, regions covered)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEventsWithCausalChains } from '../lib/supabase';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AppSidebar from '../components/AppSidebar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Metric from '../components/ui/Metric';
import SectionHeader from '../components/ui/SectionHeader';
import { Activity, Globe, Clock, ArrowRight, Building2, MapPin, TrendingUp } from 'lucide-react';
import PerformanceMetrics from '../components/PerformanceMetrics';

interface EventWithChain {
  id: string;
  summary: string;
  region: string | null;
  sector: string | null;
  event_type: string | null;
  impact_score: number | null;
  confidence: number | null;
  created_at: string;
  nucigen_causal_chains: any[];
}

function DashboardContent() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventWithChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const data = await getEventsWithCausalChains();
        setEvents(data || []);
      } catch (err: any) {
        console.error('Error loading events:', err);
        setError(err.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  // Get top 3-5 events (prioritized by impact * confidence)
  const topEvents = events
    .map(event => ({
      ...event,
      priority: (event.impact_score || 0) * (event.confidence || 0),
    }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5);

  // Calculate real stats
  const totalEvents = events.length;
  const uniqueRegions = new Set(events.map(e => e.region).filter(Boolean)).size;
  const lastUpdate = events.length > 0 
    ? new Date(events[0].created_at)
    : new Date();

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return 'Today';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-500 font-light">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <SEO 
        title="Dashboard — Nucigen Labs"
        description="Overview of what matters now"
      />

      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <header className="border-b border-white/[0.02] bg-[#0F0F0F]/30 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
            <SectionHeader
              title="Dashboard"
              subtitle={`Live intelligence · Updated ${formatTimeAgo(lastUpdate)}`}
            />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-12 w-full">
        {/* Performance Metrics - Optimizations Visible */}
        <div className="mb-8">
          <PerformanceMetrics />
        </div>

        {/* Real Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Metric
            label="Events Ingested"
            value={totalEvents}
            icon={Activity}
          />
          <Metric
            label="Regions Covered"
            value={uniqueRegions}
            icon={Globe}
          />
          <Metric
            label="Last Update"
            value={formatTimeAgo(lastUpdate)}
            icon={Clock}
          />
        </div>

        {/* What Matters Now */}
        <SectionHeader
          title="What Matters Now"
          subtitle="Top events prioritized by impact and confidence"
          action={
            <button
              onClick={() => navigate('/intelligence')}
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.03] transition-all text-sm font-light"
            >
              View Intelligence Feed
              <ArrowRight className="w-4 h-4" />
            </button>
          }
        />

        {error ? (
          <Card className="p-6">
            <p className="text-sm text-red-400">{error}</p>
          </Card>
        ) : topEvents.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-lg text-slate-500 font-light mb-4">No events available yet.</p>
            <p className="text-sm text-slate-600 font-light">
              Events will appear here once they have been processed.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {topEvents.map((event) => (
              <Card
                key={event.id}
                hover
                onClick={() => navigate(`/events/${event.id}`)}
                className="p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-light text-white mb-3 leading-snug">
                      {event.summary}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                      {event.sector && (
                        <Badge variant="sector">
                          <Building2 className="w-3 h-3 mr-1.5" />
                          {event.sector}
                        </Badge>
                      )}
                      {event.region && (
                        <Badge variant="region">
                          <MapPin className="w-3 h-3 mr-1.5" />
                          {event.region}
                        </Badge>
                      )}
                      {event.event_type && (
                        <Badge variant="level">
                          <TrendingUp className="w-3 h-3 mr-1.5" />
                          {event.event_type}
                        </Badge>
                      )}
                      {event.impact_score !== null && (
                        <Badge variant={event.impact_score >= 0.8 ? 'critical' : 'neutral'}>
                          {(event.impact_score * 100).toFixed(0)}% impact
                        </Badge>
                      )}
                    </div>
                  </div>
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

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

