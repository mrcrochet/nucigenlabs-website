/**
 * PHASE 7: Recommendations Page
 * 
 * Displays proactive recommendations for the current user
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { 
  getUserRecommendations, 
  updateRecommendationStatus,
  getUnreadRecommendationsCount,
  type UserRecommendation 
} from '../lib/supabase';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AppSidebar from '../components/AppSidebar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SectionHeader from '../components/ui/SectionHeader';
import { Target, CheckCircle2, XCircle, Clock, AlertCircle, TrendingUp, TrendingDown, Eye } from 'lucide-react';

function RecommendationsContent() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isLoaded: authLoaded } = useClerkAuth();
  
  // Force user to load by accessing auth state
  const isFullyLoaded = userLoaded && authLoaded;
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<UserRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchRecommendations() {
      // Wait for user and auth to be fully loaded
      if (!isFullyLoaded) {
        return;
      }

      // If user is not authenticated, show error
      if (!user?.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        const [recsData, count] = await Promise.all([
          getUserRecommendations(
            activeTab === 'pending' ? 'pending' : undefined,
            undefined,
            100,
            user.id
          ),
          getUnreadRecommendationsCount(user.id),
        ]);
        
        setRecommendations(recsData || []);
        setUnreadCount(count);
      } catch (err: any) {
        console.error('Error loading recommendations:', err);
        setError(err.message || 'Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, [activeTab, user?.id, isFullyLoaded]);

  const handleStatusUpdate = async (recId: string, newStatus: 'acknowledged' | 'completed' | 'dismissed') => {
    if (!user?.id) return;
    try {
      await updateRecommendationStatus(recId, newStatus, user.id);
      // Refresh recommendations
      const [recsData, count] = await Promise.all([
        getUserRecommendations(
          activeTab === 'pending' ? 'pending' : undefined,
          undefined,
          100,
          user.id
        ),
        getUnreadRecommendationsCount(user.id),
      ]);
      setRecommendations(recsData || []);
      setUnreadCount(count);
    } catch (err: any) {
      console.error('Error updating recommendation:', err);
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'act': return AlertCircle;
      case 'prepare': return Clock;
      case 'monitor': return Eye;
      case 'investigate': return Target;
      case 'mitigate': return TrendingDown;
      case 'capitalize': return TrendingUp;
      default: return Target;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 border-red-500/20 bg-red-500/5';
      case 'medium': return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5';
      case 'low': return 'text-blue-400 border-blue-500/20 bg-blue-500/5';
      default: return 'text-slate-400 border-slate-500/20 bg-slate-500/5';
    }
  };

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
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
          <button
            onClick={() => navigate('/app')}
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
        title="Recommendations — Nucigen Labs"
        description="Proactive recommendations based on your preferences"
      />

      <AppSidebar />

      <div className="flex-1 flex flex-col lg:ml-64">
        <header className="border-b border-white/[0.02] bg-[#0F0F0F]/30 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
            <SectionHeader
              title="Recommendations"
              subtitle={`Proactive actions based on your preferences · ${unreadCount} pending`}
            />
          </div>
        </header>

        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-12 w-full">
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-8 border-b border-white/[0.02]">
            {(['pending', 'all'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-light transition-all border-b-2 ${
                  activeTab === tab
                    ? 'text-white border-[#E1463E]'
                    : 'text-slate-500 border-transparent hover:text-white'
                }`}
              >
                {tab === 'pending' ? `Pending (${unreadCount})` : 'All'}
              </button>
            ))}
          </div>

          {/* Recommendations List */}
          {recommendations.length === 0 ? (
            <div className="text-center py-20">
              <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-lg text-slate-500 font-light mb-4">
                {activeTab === 'pending' 
                  ? 'No pending recommendations.' 
                  : 'No recommendations yet.'}
              </p>
              <p className="text-sm text-slate-600 font-light">
                Recommendations will appear here as we analyze events relevant to your preferences.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec) => {
                const Icon = getRecommendationIcon(rec.recommendation_type);
                const priorityColor = getPriorityColor(rec.priority);

                return (
                  <Card key={rec.id} className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg border ${priorityColor}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={rec.priority === 'high' ? 'critical' : rec.priority === 'medium' ? 'level' : 'neutral'}>
                                {rec.priority} priority
                              </Badge>
                              <Badge variant="sector">
                                {rec.recommendation_type}
                              </Badge>
                              {rec.urgency_score !== null && (
                                <span className="text-xs text-slate-500">
                                  Urgency: {(rec.urgency_score * 100).toFixed(0)}%
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-light text-white mb-2">
                              {rec.action}
                            </h3>
                            <p className="text-sm text-slate-400 font-light leading-relaxed mb-3">
                              {rec.reasoning}
                            </p>
                            {rec.deadline && (
                              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                                <Clock className="w-3 h-3" />
                                Deadline: {new Date(rec.deadline).toLocaleDateString()}
                              </div>
                            )}
                            <button
                              onClick={() => navigate(`/events/${rec.event_id}`)}
                              className="text-xs text-slate-500 hover:text-white transition-colors"
                            >
                              View related event →
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {rec.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(rec.id, 'acknowledged')}
                              className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Acknowledge
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(rec.id, 'dismissed')}
                              className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white hover:border-white/20 transition-colors flex items-center gap-1.5"
                            >
                              <XCircle className="w-3 h-3" />
                              Dismiss
                            </button>
                          </>
                        )}
                        {rec.status === 'acknowledged' && (
                          <button
                            onClick={() => handleStatusUpdate(rec.id, 'completed')}
                            className="px-3 py-1.5 text-xs bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 hover:bg-green-500/20 transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Mark Complete
                          </button>
                        )}
                        {rec.status === 'completed' && (
                          <Badge variant="level" className="text-xs">
                            Completed
                          </Badge>
                        )}
                        {rec.status === 'dismissed' && (
                          <Badge variant="neutral" className="text-xs">
                            Dismissed
                          </Badge>
                        )}
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

export default function Recommendations() {
  return (
    <ProtectedRoute>
      <RecommendationsContent />
    </ProtectedRoute>
  );
}

