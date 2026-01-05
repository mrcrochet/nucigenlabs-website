/**
 * PHASE 2D: Event Detail Page
 * 
 * THE SOURCE OF TRUTH - Core page of the product
 * Displays a single event with its complete causal chain
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getEventById, 
  getEventContext, 
  getOfficialDocuments,
  getEventRelationships,
  getHistoricalComparisons,
  getScenarioPredictions,
  type EventRelationship,
  type HistoricalComparison,
  type ScenarioPrediction
} from '../lib/supabase';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AppSidebar from '../components/AppSidebar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SectionHeader from '../components/ui/SectionHeader';
import { ArrowLeft, Link2, History, MessageSquare } from 'lucide-react';
import FeedbackModal from '../components/FeedbackModal';
import BlockRenderer from '../components/blocks/BlockRenderer';
import { useBlockPreferences } from '../hooks/useBlockPreferences';

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

interface EventDetail {
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

interface EventContext {
  id: string;
  historical_context: string | null;
  similar_events: Array<{title: string; date: string; relevance: number; url?: string}> | null;
  background_explanation: string | null;
  validation_notes: string | null;
}

interface OfficialDocument {
  id: string;
  url: string;
  title: string | null;
  content: string | null;
  domain: string;
  source_type: 'government' | 'regulator' | 'institution' | 'central_bank' | 'international_org';
  scraped_at: string;
}

function EventDetailContent() {
  const { event_id } = useParams<{ event_id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [context, setContext] = useState<EventContext | null>(null);
  const [officialDocs, setOfficialDocs] = useState<OfficialDocument[]>([]);
  const [relationships, setRelationships] = useState<EventRelationship[]>([]);
  const [historicalComparisons, setHistoricalComparisons] = useState<HistoricalComparison[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRelationships, setShowRelationships] = useState(true);
  const [showHistorical, setShowHistorical] = useState(true);
  const [showScenarios, setShowScenarios] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackComponentType, setFeedbackComponentType] = useState<'event_extraction' | 'causal_chain' | 'scenario' | 'relationship' | 'historical_comparison'>('event_extraction');
  
  // Use block preferences hook
  const { blocks, loading: blocksLoading } = useBlockPreferences('event_detail');

  useEffect(() => {
    async function fetchEvent() {
      if (!event_id) {
        setError('Event ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const [
          eventData, 
          contextData, 
          documentsData,
          relationshipsData,
          historicalData,
          scenariosData
        ] = await Promise.all([
          getEventById(event_id),
          getEventContext(event_id).catch(() => null),
          getOfficialDocuments(event_id).catch(() => []),
          getEventRelationships(event_id).catch(() => []),
          getHistoricalComparisons(event_id).catch(() => []),
          getScenarioPredictions(event_id).catch(() => []),
        ]);
        setEvent(eventData);
        setContext(contextData);
        setOfficialDocs(documentsData);
        setRelationships(relationshipsData);
        setHistoricalComparisons(historicalData);
        setScenarios(scenariosData);
      } catch (err: any) {
        console.error('Error loading event:', err);
        setError(err.message || 'Failed to load event');
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [event_id]);

  const getTimeHorizonLabel = (horizon: string) => {
    switch (horizon) {
      case 'hours': return 'Hours';
      case 'days': return 'Days';
      case 'weeks': return 'Weeks';
      default: return horizon;
    }
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-500 font-light">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error || 'Event not found'}</p>
          </div>
          <button
            onClick={() => navigate('/events')}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-light"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const chain = event.nucigen_causal_chains[0];
  
  // Sort blocks by order
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <SEO 
        title={`${event.summary.substring(0, 60)}... — Nucigen Labs`}
        description={event.summary}
      />

      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <header className="border-b border-white/[0.02] bg-[#0F0F0F]/30 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => navigate('/events')}
                className="p-2 text-slate-600 hover:text-white hover:bg-white/[0.02] rounded-xl transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-light text-white leading-tight mb-2">
                  Event Detail
                </h1>
                <p className="text-sm text-slate-600 font-light">
                  Published {formatDate(event.created_at)}
                </p>
              </div>
              <button
                onClick={() => {
                  setFeedbackComponentType('event_extraction');
                  setShowFeedbackModal(true);
                }}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/[0.02] rounded-lg border border-white/[0.05] transition-all flex items-center gap-2"
                title="Provide feedback to improve this event extraction"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Feedback</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-12 w-full">
        <Card className="p-8">
          {/* Render blocks using BlockRenderer */}
          {!blocksLoading && sortedBlocks.map((block) => (
            <BlockRenderer
              key={block.id}
              block={block}
              data={{
                event,
                chain,
                whyItMatters: event.why_it_matters,
                context,
                documents: officialDocs,
              }}
              onFeedbackClick={() => {
                setFeedbackComponentType('event_extraction');
                setShowFeedbackModal(true);
              }}
            />
          ))}

          {/* 6. Related Events (Knowledge Graph) */}
          {relationships.length > 0 && (
            <div className="mb-10 pb-10 border-b border-white/[0.02]">
              <SectionHeader 
                title="Related Events" 
                action={
                  <button
                    onClick={() => setShowRelationships(!showRelationships)}
                    className="text-xs text-slate-500 hover:text-white transition-colors"
                  >
                    {showRelationships ? 'Hide' : 'Show'}
                  </button>
                }
              />
              {showRelationships && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400 font-light leading-relaxed mb-4">
                    Events connected to this one through causal, temporal, or logical relationships.
                  </p>
                  <div className="space-y-3">
                    {relationships.map((rel) => (
                      <Card
                        key={rel.id}
                        hover
                        onClick={() => navigate(`/events/${rel.related_event_id}`)}
                        className="p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={rel.direction === 'outgoing' ? 'level' : 'neutral'}>
                                <Link2 className="w-3 h-3 mr-1" />
                                {rel.relationship_type.replace('_', ' ')}
                              </Badge>
                              <span className="text-xs text-slate-500">
                                Strength: {(rel.strength * 100).toFixed(0)}%
                              </span>
                            </div>
                            <p className="text-sm text-white font-light mb-2">
                              {rel.related_event_summary}
                            </p>
                            {rel.evidence && (
                              <p className="text-xs text-slate-400 font-light italic">
                                {rel.evidence}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            {rel.related_event_impact_score !== null && (
                              <Badge variant="impact">
                                {(rel.related_event_impact_score * 100).toFixed(0)}% impact
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7. Historical Comparisons */}
          {historicalComparisons.length > 0 && (
            <div className="mb-10 pb-10 border-b border-white/[0.02]">
              <SectionHeader 
                title="Historical Comparisons" 
                action={
                  <button
                    onClick={() => setShowHistorical(!showHistorical)}
                    className="text-xs text-slate-500 hover:text-white transition-colors"
                  >
                    {showHistorical ? 'Hide' : 'Show'}
                  </button>
                }
              />
              {showHistorical && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400 font-light leading-relaxed mb-4">
                    Similar past events and lessons learned.
                  </p>
                  <div className="space-y-4">
                    {historicalComparisons.map((comp) => (
                      <Card key={comp.id} className="p-5">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="neutral">
                                <History className="w-3 h-3 mr-1" />
                                {(comp.similarity_score * 100).toFixed(0)}% similar
                              </Badge>
                              {comp.predictive_value !== null && (
                                <Badge variant="level">
                                  {(comp.predictive_value * 100).toFixed(0)}% predictive value
                                </Badge>
                              )}
                            </div>
                            <h4 className="text-sm font-light text-white mb-2">
                              {comp.historical_event_summary}
                            </h4>
                            <p className="text-xs text-slate-500 font-light">
                              {formatDate(comp.historical_event_created_at)}
                            </p>
                          </div>
                        </div>
                        {comp.comparison_insights && (
                          <div className="mb-3">
                            <div className="text-xs text-slate-600 mb-1 font-light uppercase tracking-wide">Insights</div>
                            <p className="text-sm text-slate-300 font-light leading-relaxed">
                              {comp.comparison_insights}
                            </p>
                          </div>
                        )}
                        {comp.lessons_learned && (
                          <div className="mb-3">
                            <div className="text-xs text-slate-600 mb-1 font-light uppercase tracking-wide">Lessons Learned</div>
                            <p className="text-sm text-slate-300 font-light leading-relaxed">
                              {comp.lessons_learned}
                            </p>
                          </div>
                        )}
                        {comp.outcome_differences && (
                          <div>
                            <div className="text-xs text-slate-600 mb-1 font-light uppercase tracking-wide">Outcome Differences</div>
                            <p className="text-sm text-slate-400 font-light leading-relaxed">
                              {comp.outcome_differences}
                            </p>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 8. Scenario Predictions */}
          {scenarios.length > 0 && (
            <div className="mb-10 pb-10 border-b border-white/[0.02]">
              <SectionHeader 
                title="Scenario Predictions" 
                action={
                  <button
                    onClick={() => setShowScenarios(!showScenarios)}
                    className="text-xs text-slate-500 hover:text-white transition-colors"
                  >
                    {showScenarios ? 'Hide' : 'Show'}
                  </button>
                }
              />
              {showScenarios && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400 font-light leading-relaxed mb-4">
                    Multi-scenario analysis with probabilities for different time horizons.
                  </p>
                  {/* Group scenarios by time horizon */}
                  {['1week', '1month', '3months', '6months', '1year'].map((horizon) => {
                    const horizonScenarios = scenarios.filter(s => s.time_horizon === horizon);
                    if (horizonScenarios.length === 0) return null;

                    const getHorizonLabel = (h: string) => {
                      const labels: Record<string, string> = {
                        '1week': '1 Week',
                        '1month': '1 Month',
                        '3months': '3 Months',
                        '6months': '6 Months',
                        '1year': '1 Year',
                      };
                      return labels[h] || h;
                    };

                    return (
                      <div key={horizon} className="mb-6">
                        <h4 className="text-sm font-light text-white mb-4">
                          {getHorizonLabel(horizon)}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {horizonScenarios.map((scenario) => {
                            const getScenarioColor = (type: string) => {
                              if (type === 'optimistic') return 'border-green-500/20 bg-green-500/5';
                              if (type === 'pessimistic') return 'border-red-500/20 bg-red-500/5';
                              return 'border-blue-500/20 bg-blue-500/5';
                            };

                            return (
                              <Card key={scenario.id} className={`p-4 border-2 ${getScenarioColor(scenario.scenario_type)}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <Badge variant={scenario.scenario_type === 'pessimistic' ? 'critical' : scenario.scenario_type === 'optimistic' ? 'level' : 'neutral'}>
                                    {scenario.scenario_type.charAt(0).toUpperCase() + scenario.scenario_type.slice(1)}
                                  </Badge>
                                  <span className="text-xs text-slate-500">
                                    {(scenario.probability * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <p className="text-sm text-slate-300 font-light leading-relaxed mb-3">
                                  {scenario.predicted_outcome}
                                </p>
                                {scenario.key_indicators && scenario.key_indicators.length > 0 && (
                                  <div className="mb-2">
                                    <div className="text-xs text-slate-600 mb-1 font-light">Key Indicators</div>
                                    <ul className="text-xs text-slate-400 space-y-1">
                                      {scenario.key_indicators.slice(0, 3).map((indicator, idx) => (
                                        <li key={idx}>• {indicator}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {scenario.risk_factors && scenario.risk_factors.length > 0 && (
                                  <div className="mb-2">
                                    <div className="text-xs text-slate-600 mb-1 font-light">Risk Factors</div>
                                    <ul className="text-xs text-slate-400 space-y-1">
                                      {scenario.risk_factors.slice(0, 2).map((risk, idx) => (
                                        <li key={idx}>• {risk}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 9. Official Documents (Firecrawl) */}
          {officialDocs.length > 0 && (
            <div>
              <SectionHeader title="Official Documents" />
              <div className="space-y-3">
                <p className="text-sm text-slate-400 font-light leading-relaxed mb-4">
                  Official documents and statements from verified sources.
                </p>
                <div className="space-y-2">
                  {officialDocs.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 bg-white/[0.02] border border-white/[0.05] rounded-lg hover:bg-white/[0.03] hover:border-white/10 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h4 className="text-sm font-light text-white group-hover:text-white/90 transition-colors line-clamp-1">
                              {doc.title || doc.url}
                            </h4>
                            <Badge variant="level" className="text-xs capitalize">{doc.source_type}</Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-slate-600 font-light">
                              {doc.domain}
                            </span>
                            <span className="text-xs text-slate-600 font-light">→</span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
        </main>
      </div>

      {/* Feedback Modal */}
      {event && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          componentType={feedbackComponentType}
          eventId={event.id}
          causalChainId={event.nucigen_causal_chains?.[0]?.id}
          originalContent={{
            event_type: event.event_type,
            summary: event.summary,
            why_it_matters: event.why_it_matters,
            impact_score: event.impact_score,
            confidence: event.confidence,
          }}
        />
      )}
    </div>
  );
}

export default function EventDetail() {
  return (
    <ProtectedRoute>
      <EventDetailContent />
    </ProtectedRoute>
  );
}

