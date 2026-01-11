/**
 * Intelligence Feed Page
 * 
 * UI CONTRACT: Consumes ONLY signals (not raw events)
 * Signals are synthesized from multiple events
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { 
  getEventsWithCausalChainsSearch, 
  getUserPreferences,
} from '../lib/supabase';
import { eventsToSignals, filterSignalsByPreferences } from '../lib/adapters/intelligence-adapters';
import type { Signal } from '../types/intelligence';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AppSidebar from '../components/AppSidebar';
import OnboardingBanner from '../components/OnboardingBanner';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SectionHeader from '../components/ui/SectionHeader';
import { Search, MapPin, Building2, TrendingUp, Clock, Sparkles, ArrowRight } from 'lucide-react';

function IntelligenceFeedContent() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isLoaded: authLoaded } = useClerkAuth();
  
  const isFullyLoaded = userLoaded && authLoaded;
  const navigate = useNavigate();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'top' | 'recent' | 'critical'>('top');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  // Fetch events and convert to signals
  const fetchSignals = useCallback(async () => {
    if (!isFullyLoaded) return;

    if (!user?.id) {
      setError('User not authenticated');
      setLoading(false);
      setSignals([]);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Build search options
      let searchOptions: any = {
        searchQuery: debouncedSearchQuery || undefined,
        limit: 100,
      };

      // Apply tab-specific filters
      switch (activeTab) {
        case 'critical':
          searchOptions.minImpactScore = 0.7;
          break;
        case 'top':
        case 'recent':
          break;
      }

      // Apply preference-based filters
      if (preferences) {
        if (preferences.preferred_sectors && preferences.preferred_sectors.length > 0) {
          searchOptions.sectorFilter = preferences.preferred_sectors;
        }
        if (preferences.preferred_regions && preferences.preferred_regions.length > 0) {
          searchOptions.regionFilter = preferences.preferred_regions;
        }
        if (preferences.preferred_event_types && preferences.preferred_event_types.length > 0) {
          searchOptions.eventTypeFilter = preferences.preferred_event_types;
        }
        if (preferences.min_impact_score !== null && preferences.min_impact_score !== undefined) {
          searchOptions.minImpactScore = Math.max(
            searchOptions.minImpactScore || 0,
            preferences.min_impact_score
          );
        }
        if (preferences.min_confidence_score !== null && preferences.min_confidence_score !== undefined) {
          searchOptions.minConfidenceScore = preferences.min_confidence_score;
        }
        if (preferences.preferred_time_horizons && preferences.preferred_time_horizons.length > 0) {
          searchOptions.timeHorizonFilter = preferences.preferred_time_horizons;
        }
      }

      // Fetch events (source of truth)
      const eventsData = await getEventsWithCausalChainsSearch(searchOptions, user.id);
      
      // Convert events to signals
      const allSignals = eventsToSignals(eventsData || []);
      
      // Filter by preferences
      const filteredSignals = filterSignalsByPreferences(allSignals, preferences);
      
      // Sort signals based on active tab
      let sortedSignals = [...filteredSignals];
      
      switch (activeTab) {
        case 'top':
          // Sort by impact * confidence (highest first)
          sortedSignals.sort((a, b) => {
            const scoreA = a.impact_score * a.confidence_score;
            const scoreB = b.impact_score * b.confidence_score;
            return scoreB - scoreA;
          });
          break;
        case 'recent':
          // Sort by last_updated (newest first)
          sortedSignals.sort((a, b) => {
            return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();
          });
          break;
        case 'critical':
          // Sort by impact_score (highest first)
          sortedSignals.sort((a, b) => b.impact_score - a.impact_score);
          break;
      }

      setSignals(sortedSignals);
      setError('');
    } catch (err: any) {
      console.error('Error loading signals:', err);
      
      let errorMessage = 'Failed to load intelligence signals';
      if (err.message?.includes('not authenticated')) {
        errorMessage = 'Please log in to view signals.';
      } else if (err.message?.includes('Supabase is not configured')) {
        errorMessage = 'Database is not configured. Please check your environment variables.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setSignals([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery, activeTab, preferences, user?.id, isFullyLoaded]);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

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

  const getImpactBadgeVariant = (impact: number) => {
    if (impact >= 80) return 'critical';
    if (impact >= 60) return 'level';
    return 'neutral';
  };

  const getHorizonLabel = (horizon: string) => {
    switch (horizon) {
      case 'immediate': return 'Immediate';
      case 'short': return 'Short-term';
      case 'medium': return 'Medium-term';
      case 'long': return 'Long-term';
      default: return horizon;
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
          <p className="text-sm text-slate-500 font-light">Loading intelligence signals...</p>
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
              <p className="text-base text-red-400 font-light mb-2">Unable to load signals</p>
              <p className="text-sm text-slate-400 font-light">{error}</p>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white rounded-lg transition-colors text-sm font-light"
              >
                Retry
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-light"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <SEO 
        title="Intelligence Feed — Nucigen Labs"
        description="Live intelligence signals with prioritized insights"
      />

      <AppSidebar />

      <div className="flex-1 flex flex-col lg:ml-64">
        <header className="border-b border-white/[0.02] bg-[#0F0F0F]/30 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
            <div className="flex items-center justify-between">
              <SectionHeader
                title="Intelligence Feed"
                subtitle={`Synthesized signals · Updated ${signals[0] ? formatTimeAgo(signals[0].last_updated) : 'recently'}`}
              />
              {signals.length > 0 && (
                <Badge variant="critical" className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  {signals.length} signal{signals.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-12 w-full">
          <OnboardingBanner />
          
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search signals, sectors, regions..."
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

          {/* Signals List */}
          {signals.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                {debouncedSearchQuery ? (
                  <>
                    <p className="text-lg text-slate-500 font-light mb-4">No signals found</p>
                    <p className="text-sm text-slate-600 font-light">
                      Try adjusting your search or filters.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg text-slate-500 font-light mb-4">No intelligence signals available</p>
                    <p className="text-sm text-slate-600 font-light">
                      Signals will appear here once events are processed and synthesized.
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {signals.map((signal) => (
                <Card
                  key={signal.id}
                  hover
                  onClick={() => {
                    // Navigate to events page filtered by related events
                    if (signal.related_event_ids.length > 0) {
                      navigate(`/events?event_ids=${signal.related_event_ids.join(',')}`);
                    } else {
                      navigate('/events');
                    }
                  }}
                  className="p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-lg font-light text-white leading-snug">
                          {signal.title}
                        </h3>
                        <Badge variant={getImpactBadgeVariant(signal.impact_score)}>
                          {signal.impact_score}% impact
                        </Badge>
                        <Badge variant="neutral">
                          {signal.confidence_score}% confidence
                        </Badge>
                        <Badge variant="level">
                          {getHorizonLabel(signal.time_horizon)}
                        </Badge>
                      </div>
                      
                      <p className="text-slate-300 font-light leading-relaxed mb-4">
                        {signal.summary}
                      </p>

                      {signal.why_it_matters && (
                        <p className="text-sm text-slate-400 font-light italic mb-4">
                          {signal.why_it_matters}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(signal.last_updated)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <TrendingUp className="w-3 h-3" />
                          {signal.source_count} related event{signal.source_count !== 1 ? 's' : ''}
                        </span>
                        {signal.scope !== 'global' && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" />
                            {signal.scope}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (signal.related_event_ids.length > 0) {
                          navigate(`/events?event_ids=${signal.related_event_ids.join(',')}`);
                        } else {
                          navigate('/events');
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.03] transition-all text-sm font-light"
                    >
                      View Events
                      <ArrowRight className="w-4 h-4" />
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

export default function IntelligenceFeed() {
  return (
    <ProtectedRoute>
      <IntelligenceFeedContent />
    </ProtectedRoute>
  );
}
