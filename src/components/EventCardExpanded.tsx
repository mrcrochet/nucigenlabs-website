/**
 * EventCardExpanded Component
 * 
 * Displays expanded event details inline within the Events list
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './ui/Card';
import Badge from './ui/Badge';
import SectionHeader from './ui/SectionHeader';
import MetaRow from './ui/MetaRow';
import MarketDataPanel from './market/MarketDataPanel';
import { 
  ArrowLeft, 
  Link2, 
  History, 
  Clock, 
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import type { Event } from '../types/intelligence';
import type { 
  EventRelationship, 
  HistoricalComparison, 
  ScenarioPrediction 
} from '../lib/supabase';

interface EventDetailData {
  event: any;
  context: any | null;
  documents: any[];
  relationships: EventRelationship[];
  historicalComparisons: HistoricalComparison[];
  scenarios: ScenarioPrediction[];
}

interface EventCardExpandedProps {
  event: Event;
  details: EventDetailData;
  onCollapse: () => void;
  getTimeHorizonLabel: (horizon: string) => string;
}

export default function EventCardExpanded({
  event,
  details,
  onCollapse,
  getTimeHorizonLabel,
}: EventCardExpandedProps) {
  const navigate = useNavigate();
  const [showRelationships, setShowRelationships] = useState(true);
  const [showHistorical, setShowHistorical] = useState(true);
  const [showScenarios, setShowScenarios] = useState(true);

  const eventData = details.event;
  const chain = eventData?.nucigen_causal_chains?.[0] || null;
  const context = details.context;
  const documents = details.documents || [];
  const relationships = details.relationships || [];
  const historicalComparisons = details.historicalComparisons || [];
  const scenarios = details.scenarios || [];

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

  return (
    <Card className="p-8 bg-white/[0.03] border-white/10">
      {/* Header with collapse button */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/[0.02]">
        <h3 className="text-lg font-light text-white">Additional Details</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/events/${event.id}`)}
            className="text-sm text-slate-400 hover:text-white transition-colors font-light flex items-center gap-2"
          >
            <span>View full page</span>
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={onCollapse}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/[0.02] rounded-lg border border-white/[0.05] transition-all flex items-center gap-2 font-light"
          >
            <ChevronUp className="w-4 h-4" />
            <span>Collapse</span>
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Event Context */}
        {context && (
          <div>
            <SectionHeader title="Context" />
            {context.historical_context && (
              <div className="mb-4">
                <div className="text-xs text-slate-600 mb-2 font-light uppercase tracking-wide">
                  Historical Context
                </div>
                <p className="text-sm text-slate-300 font-light leading-relaxed">
                  {context.historical_context}
                </p>
              </div>
            )}
            {context.background_explanation && (
              <div className="mb-4">
                <div className="text-xs text-slate-600 mb-2 font-light uppercase tracking-wide">
                  Background
                </div>
                <p className="text-sm text-slate-300 font-light leading-relaxed">
                  {context.background_explanation}
                </p>
              </div>
            )}
            {context.similar_events && context.similar_events.length > 0 && (
              <div>
                <div className="text-xs text-slate-600 mb-2 font-light uppercase tracking-wide">
                  Similar Events
                </div>
                <div className="space-y-2">
                  {context.similar_events.map((similar: any, idx: number) => (
                    <div key={idx} className="text-sm text-slate-400 font-light">
                      • {similar.title} ({similar.date})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Official Documents */}
        {documents.length > 0 && (
          <div>
            <SectionHeader title="Official Documents" />
            <div className="space-y-2">
              {documents.map((doc) => (
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
                        <Badge variant="level" className="text-xs capitalize">
                          {doc.source_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-slate-600 font-light">
                          {doc.domain}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors flex-shrink-0" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Related Events */}
        {relationships.length > 0 && (
          <div>
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
              <div className="space-y-3">
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

        {/* Historical Comparisons */}
        {historicalComparisons.length > 0 && (
          <div>
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
                          <div className="text-xs text-slate-600 mb-1 font-light uppercase tracking-wide">
                            Insights
                          </div>
                          <p className="text-sm text-slate-300 font-light leading-relaxed">
                            {comp.comparison_insights}
                          </p>
                        </div>
                      )}
                      {comp.lessons_learned && (
                        <div className="mb-3">
                          <div className="text-xs text-slate-600 mb-1 font-light uppercase tracking-wide">
                            Lessons Learned
                          </div>
                          <p className="text-sm text-slate-300 font-light leading-relaxed">
                            {comp.lessons_learned}
                          </p>
                        </div>
                      )}
                      {comp.outcome_differences && (
                        <div>
                          <div className="text-xs text-slate-600 mb-1 font-light uppercase tracking-wide">
                            Outcome Differences
                          </div>
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

        {/* Scenario Predictions */}
        {scenarios.length > 0 && (
          <div>
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
      </div>
    </Card>
  );
}
