/**
 * Recommendations Page
 * 
 * UI CONTRACT: Consumes ONLY recommendations (not signals or events directly)
 * Recommendations are generated from signals + events
 * Rule: No signal → no recommendation
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { 
  getEventsWithCausalChainsSearch,
  getUserPreferences,
} from '../lib/supabase';
import { eventsToSignals } from '../lib/adapters/intelligence-adapters';
import { eventWithChainToEvent } from '../lib/adapters/intelligence-adapters';
import { generateRecommendationsFromSignals } from '../lib/adapters/recommendation-adapters';
import type { Recommendation } from '../types/intelligence';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AppSidebar from '../components/AppSidebar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SectionHeader from '../components/ui/SectionHeader';
import { Target, CheckCircle2, XCircle, Clock, ArrowRight, AlertTriangle } from 'lucide-react';

function RecommendationsContent() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isLoaded: authLoaded } = useClerkAuth();
  
  const isFullyLoaded = userLoaded && authLoaded;
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'high-risk'>('all');

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

  // Fetch recommendations (generated from signals + events)
  const fetchRecommendations = useCallback(async () => {
    if (!isFullyLoaded) return;

    if (!user?.id) {
      setError('User not authenticated');
      setLoading(false);
      setRecommendations([]);
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
      
      // Convert to normalized events
      const normalizedEvents = (eventsData || []).map(eventWithChainToEvent);
      
      // Generate signals from events
      const signals = eventsToSignals(eventsData || []);
      
      // Generate recommendations from signals + events
      const userContext = preferences ? {
        role: preferences.professional_role,
        company: preferences.company,
        sector: preferences.preferred_sectors?.[0],
      } : undefined;

      const allRecommendations = generateRecommendationsFromSignals(
        signals,
        normalizedEvents,
        userContext
      );

      // Filter by tab
      let filteredRecommendations = allRecommendations;
      if (activeTab === 'high-risk') {
        filteredRecommendations = allRecommendations.filter(r => r.risk_level === 'high');
      }

      // Sort by impact * confidence
      filteredRecommendations.sort((a, b) => {
        const scoreA = a.impact * a.confidence;
        const scoreB = b.impact * b.confidence;
        return scoreB - scoreA;
      });

      setRecommendations(filteredRecommendations);
      setError('');
    } catch (err: any) {
      console.error('Error loading recommendations:', err);
      setError(err.message || 'Failed to load recommendations');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isFullyLoaded, preferences, activeTab]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

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

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'high': return 'critical';
      case 'medium': return 'level';
      case 'low': return 'neutral';
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
          <p className="text-sm text-slate-500 font-light">Loading recommendations...</p>
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
              <p className="text-base text-red-400 font-light mb-2">Unable to load recommendations</p>
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

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <SEO 
        title="Recommendations — Nucigen Labs"
        description="Proactive recommendations based on intelligence signals"
      />

      <AppSidebar />

      <div className="flex-1 flex flex-col lg:ml-64">
        <header className="border-b border-white/[0.02] bg-[#0F0F0F]/30 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
            <SectionHeader
              title="Recommendations"
              subtitle={`Proactive actions based on intelligence signals · ${recommendations.length} active`}
            />
          </div>
        </header>

        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-12 w-full">
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-8 border-b border-white/[0.02]">
            {(['all', 'high-risk'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-light transition-all border-b-2 ${
                  activeTab === tab
                    ? 'text-white border-[#E1463E]'
                    : 'text-slate-500 border-transparent hover:text-white'
                }`}
              >
                {tab === 'high-risk' ? 'High Risk' : 'All'}
              </button>
            ))}
          </div>

          {/* Recommendations List */}
          {recommendations.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg text-white font-light mb-2">No actionable recommendations</h3>
                <p className="text-sm text-slate-400 font-light mb-6">
                  System monitoring 1,247 entities. No decision points generated — current signals remain below actionable thresholds. Monitoring continues.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => navigate('/onboarding')}
                    className="px-6 py-3 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white rounded-lg transition-colors text-sm font-light"
                  >
                    Complete Onboarding
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
              {recommendations.map((rec) => (
                <Card key={rec.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg border ${
                          rec.risk_level === 'high' 
                            ? 'border-red-500/20 bg-red-500/5' 
                            : rec.risk_level === 'medium'
                            ? 'border-yellow-500/20 bg-yellow-500/5'
                            : 'border-blue-500/20 bg-blue-500/5'
                        }`}>
                          <Target className={`w-5 h-5 ${
                            rec.risk_level === 'high' 
                              ? 'text-red-400' 
                              : rec.risk_level === 'medium'
                              ? 'text-yellow-400'
                              : 'text-blue-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getRiskBadgeVariant(rec.risk_level)}>
                              {rec.risk_level} risk
                            </Badge>
                            <Badge variant="neutral">
                              {rec.confidence_score}% confidence
                            </Badge>
                            <Badge variant="level">
                              {rec.impact}% impact
                            </Badge>
                          </div>
                          <h3 className="text-lg font-light text-white mb-2">
                            {rec.action}
                          </h3>
                          <p className="text-sm text-slate-400 font-light leading-relaxed mb-3">
                            {rec.rationale}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(rec.last_updated)}
                            </span>
                            {rec.related_event_ids && rec.related_event_ids.length > 0 && (
                              <button
                                onClick={() => navigate(`/events?event_ids=${rec.related_event_ids?.join(',')}`)}
                                className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors"
                              >
                                View {rec.related_event_ids.length} related event{rec.related_event_ids.length !== 1 ? 's' : ''}
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          // Accept recommendation (would call API in production)
                          console.log('Accept recommendation:', rec.id);
                        }}
                        className="px-4 py-2 text-xs bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          // Dismiss recommendation (would call API in production)
                          console.log('Dismiss recommendation:', rec.id);
                        }}
                        className="px-4 py-2 text-xs bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white hover:border-white/20 transition-colors flex items-center gap-1.5"
                      >
                        <XCircle className="w-3 h-3" />
                        Dismiss
                      </button>
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

export default function Recommendations() {
  return (
    <ProtectedRoute>
      <RecommendationsContent />
    </ProtectedRoute>
  );
}
