/**
 * Comparable Events Modal
 * 
 * Displays historical events similar to the current event that triggered the signal
 */

import { useState, useEffect } from 'react';
import { X, ExternalLink, Calendar, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ComparableEvent {
  id: string;
  title: string;
  description?: string;
  published_at: string;
  discover_category?: string;
  discover_tier?: string;
  similarity_score?: number;
  similarity_factors?: string[];
  comparison_insights?: string;
  outcome_differences?: string;
  lessons_learned?: string;
}

interface ComparableEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string | null;
  eventTitle: string;
  companyName: string;
  signalType: 'opportunity' | 'risk';
}

export default function ComparableEventsModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  companyName,
  signalType,
}: ComparableEventsModalProps) {
  const [events, setEvents] = useState<ComparableEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && eventId) {
      loadComparableEvents();
    }
  }, [isOpen, eventId]);

  const loadComparableEvents = async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/corporate-impact/comparable-events?event_id=${eventId}&company=${encodeURIComponent(companyName)}&type=${signalType}`);
      
      if (!response.ok) {
        throw new Error('Failed to load comparable events');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setEvents(data.data.events || []);
      } else {
        setEvents([]);
      }
    } catch (error: any) {
      console.error('[ComparableEvents] Error loading events:', error);
      setError(error.message || 'Failed to load comparable events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="backdrop-blur-xl bg-gradient-to-br from-[#0A0A0A] to-[#0F0F0F] border border-white/[0.15] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
          <div className="flex-1">
            <h2 className="text-2xl font-light text-white mb-2">Comparable Past Events</h2>
            <p className="text-sm text-slate-400">
              Historical events similar to <span className="text-white font-medium">"{eventTitle}"</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Showing how similar pressure reshaped markets before
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">Finding comparable events...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-[#E1463E] mx-auto mb-4" />
              <p className="text-slate-400">{error}</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">
                No comparable historical events found. This may be a unique event pattern.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.15] rounded-xl p-4 hover:border-white/[0.25] transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {event.discover_tier && (
                          <span className="px-2 py-0.5 backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/20 to-[#E1463E]/10 border border-[#E1463E]/30 rounded text-xs font-semibold text-[#E1463E]">
                            {event.discover_tier}
                          </span>
                        )}
                        {event.discover_category && (
                          <span className="px-2 py-0.5 backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded text-xs font-medium text-slate-400">
                            {event.discover_category}
                          </span>
                        )}
                        {event.similarity_score && (
                          <span className="px-2 py-0.5 backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/30 rounded text-xs font-semibold text-green-400">
                            {Math.round(event.similarity_score * 100)}% similar
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-medium text-white mb-1">{event.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(event.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                    {event.id && (
                      <Link
                        to={`/events-feed/${event.id}`}
                        className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                      </Link>
                    )}
                  </div>

                  {event.similarity_factors && event.similarity_factors.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-slate-400 mb-1">Similarity Factors:</p>
                      <div className="flex flex-wrap gap-1">
                        {event.similarity_factors.map((factor, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded text-xs text-slate-400"
                          >
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {event.comparison_insights && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-slate-400 mb-1">Comparison Insights:</p>
                      <p className="text-sm text-slate-300">{event.comparison_insights}</p>
                    </div>
                  )}

                  {event.outcome_differences && (
                    <div className="mb-3 p-3 backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        {signalType === 'opportunity' ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-[#E1463E]" />
                        )}
                        <p className="text-xs font-semibold text-slate-400">Historical Outcome:</p>
                      </div>
                      <p className="text-sm text-slate-300">{event.outcome_differences}</p>
                    </div>
                  )}

                  {event.lessons_learned && (
                    <div className="p-3 backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg">
                      <p className="text-xs font-semibold text-blue-400 mb-1">Lessons Learned:</p>
                      <p className="text-sm text-slate-300">{event.lessons_learned}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/[0.08]">
          <p className="text-xs text-slate-500 text-center">
            These comparisons are based on replay-validated historical patterns. Observed exposure mapping, not future predictions.
          </p>
        </div>
      </div>
    </div>
  );
}
