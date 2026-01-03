/**
 * PHASE 2D: Intelligence Feed Page
 * 
 * Main intelligence feed - most visited page
 * Shows prioritized events with tabs: Top, Recent, Critical
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEventsWithCausalChains, getUserPreferences } from '../lib/supabase';
import { sortEventsByPreferences, filterEventsByPreferences, isEventHighlyRelevant } from '../lib/preferences-utils';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AppSidebar from '../components/AppSidebar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SectionHeader from '../components/ui/SectionHeader';
import MetaRow from '../components/ui/MetaRow';
import { Search, MapPin, Building2, TrendingUp, Clock, Sparkles } from 'lucide-react';

interface CausalChain {
  id: string;
  cause: string;
  first_order_effect: string;
  second_order_effect: string | null;
  affected_sectors: string[];
  affected_regions: string[];
  time_horizon: 'hours' | 'days' | 'weeks';
  confidence: number;
}

interface EventWithChain {
  id: string;
  event_type: string;
  event_subtype: string | null;
  summary: string;
  country: string | null;
  region: string | null;
  sector: string | null;
  actors: string[];
  why_it_matters: string;
  first_order_effect: string | null;
  second_order_effect: string | null;
  impact_score: number | null;
  confidence: number | null;
  created_at: string;
  nucigen_causal_chains: CausalChain[];
}

function IntelligenceFeedContent() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventWithChain[]>([]);
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'top' | 'recent' | 'critical'>('top');
  const [searchQuery, setSearchQuery] = useState('');

  // Load preferences and events
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        
        // Load preferences and events in parallel
        const [eventsData, preferencesData] = await Promise.all([
          getEventsWithCausalChains(),
          getUserPreferences().catch(() => null), // Don't fail if preferences don't exist
        ]);
        
        setEvents(eventsData || []);
        setPreferences(preferencesData);
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Filter and sort events based on active tab and preferences
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Apply preference-based filtering first (thresholds)
    if (preferences) {
      filtered = filterEventsByPreferences(filtered, preferences);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => {
        const chain = event.nucigen_causal_chains?.[0];
        return (
          event.summary?.toLowerCase().includes(query) ||
          event.why_it_matters?.toLowerCase().includes(query) ||
          event.sector?.toLowerCase().includes(query) ||
          event.region?.toLowerCase().includes(query) ||
          chain?.cause?.toLowerCase().includes(query) ||
          chain?.first_order_effect?.toLowerCase().includes(query)
        );
      });
    }

    // Tab-based sorting (with preference integration)
    switch (activeTab) {
      case 'top':
        // If preferences exist and priority is set, use preference-based sorting
        if (preferences && preferences.feed_priority) {
          filtered = sortEventsByPreferences(filtered, preferences);
        } else {
          // Default: Sort by impact_score * confidence (highest first)
          filtered.sort((a, b) => {
            const scoreA = (a.impact_score || 0) * (a.confidence || 0);
            const scoreB = (b.impact_score || 0) * (b.confidence || 0);
            return scoreB - scoreA;
          });
        }
        break;
      case 'recent':
        // If preferences exist and priority is 'recency', use preference-based sorting
        if (preferences && preferences.feed_priority === 'recency') {
          filtered = sortEventsByPreferences(filtered, preferences);
        } else {
          // Default: Sort by created_at (newest first)
          filtered.sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
        }
        break;
      case 'critical':
        // Filter by high impact (>= 0.7) and sort by impact
        filtered = filtered.filter(e => (e.impact_score || 0) >= 0.7);
        // If preferences exist, also consider relevance
        if (preferences) {
          filtered = sortEventsByPreferences(filtered, preferences);
        } else {
          filtered.sort((a, b) => (b.impact_score || 0) - (a.impact_score || 0));
        }
        break;
    }

    return filtered;
  }, [events, activeTab, searchQuery, preferences]);

  const getTimeHorizonLabel = (horizon: string) => {
    switch (horizon) {
      case 'hours': return 'Hours';
      case 'days': return 'Days';
      case 'weeks': return 'Weeks';
      default: return horizon;
    }
  };

  const getImpactBadgeVariant = (impact: number | null) => {
    if (!impact) return 'neutral';
    if (impact >= 0.8) return 'critical';
    if (impact >= 0.6) return 'level';
    return 'neutral';
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-500 font-light">Loading intelligence feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-light"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <SEO 
        title="Intelligence Feed — Nucigen Labs"
        description="Live intelligence feed with prioritized events"
      />

      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <header className="border-b border-white/[0.02] bg-[#0F0F0F]/30 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
            <SectionHeader
              title="Intelligence Feed"
              subtitle={`Live intelligence · Updated ${formatTimeAgo(events[0]?.created_at || new Date().toISOString())}`}
            />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-12 w-full">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search events, regions, sectors, actors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-white/10 focus:bg-white/[0.03] transition-all font-light"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 border-b border-white/[0.02]">
          {(['top', 'recent', 'critical'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-light transition-all border-b-2 ${
                activeTab === tab
                  ? 'text-white border-[#E1463E]'
                  : 'text-slate-500 border-transparent hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-slate-500 font-light mb-4">
              {searchQuery ? 'No events match your search.' : 'No events available.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-sm text-slate-400 hover:text-white transition-colors font-light"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => {
              const chain = event.nucigen_causal_chains?.[0];
              if (!chain) return null;

              return (
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
                      
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        {/* Relevance badge - show if highly relevant */}
                        {preferences && isEventHighlyRelevant(event, preferences) && (
                          <Badge variant="critical">
                            <Sparkles className="w-3 h-3 mr-1.5" />
                            Relevant to you
                          </Badge>
                        )}
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
                          <Badge variant={getImpactBadgeVariant(event.impact_score)}>
                            {(event.impact_score * 100).toFixed(0)}% impact
                          </Badge>
                        )}
                        <Badge variant="neutral">
                          <Clock className="w-3 h-3 mr-1.5" />
                          {getTimeHorizonLabel(chain.time_horizon)}
                        </Badge>
                        {event.confidence !== null && (
                          <Badge variant="neutral">
                            {(event.confidence * 100).toFixed(0)}% confidence
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-slate-400 font-light line-clamp-2">
                        {event.why_it_matters}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/[0.02]">
                    <MetaRow
                      items={[
                        {
                          label: 'Time',
                          value: formatTimeAgo(event.created_at),
                        },
                      ]}
                    />
                    <div className="mt-2 text-xs text-slate-500 font-light text-right">
                      Click to view details →
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

export default function IntelligenceFeed() {
  return (
    <ProtectedRoute>
      <IntelligenceFeedContent />
    </ProtectedRoute>
  );
}

