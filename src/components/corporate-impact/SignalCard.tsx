/**
 * Signal Card Component
 * 
 * Expandable card displaying a market signal (opportunity or risk)
 * Adapted to Nucigen dark design system
 */

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ExternalLink,
  Sparkles,
  DollarSign,
  AlertTriangle,
  Zap,
  Link as LinkIcon,
  FileText,
  ArrowRight,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MarketSignal } from '../../types/corporate-impact';
import ConfidenceBreakdown from './ConfidenceBreakdown';
import ComparableEventsModal from './ComparableEventsModal';
import ExposureBreakdownModal from './ExposureBreakdownModal';
import EventImpactAnalysisSection from './EventImpactAnalysisSection';
import ESGScoresBlock from './ESGScoresBlock';

// Helper component for expandable evidence source sections
function EvidenceSourceSection({ 
  title, 
  icon, 
  sources 
}: { 
  title: string; 
  icon: string; 
  sources: Array<string | { type: string; title?: string; url?: string; description?: string }> 
}) {
  const [expanded, setExpanded] = useState(false);
  
  // Extract URLs from sources
  const webSources = sources
    .map(s => {
      if (typeof s === 'string') {
        // Try to extract URL from string
        const urlMatch = s.match(/https?:\/\/[^\s\)]+/);
        if (urlMatch) {
          try {
            const url = urlMatch[0];
            const hostname = new URL(url).hostname.replace('www.', '');
            return {
              title: s.replace(urlMatch[0], '').trim() || hostname,
              url: url,
              description: null,
            };
          } catch {
            return null;
          }
        }
        return null;
      } else if (s.url) {
        try {
          const hostname = new URL(s.url).hostname.replace('www.', '');
          return {
            title: s.title || hostname,
            url: s.url,
            description: s.description || null,
          };
        } catch {
          return null;
        }
      }
      return null;
    })
    .filter(Boolean) as Array<{ title: string; url: string; description: string | null }>;

  const hasWebSources = webSources.length > 0;

  return (
    <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.15] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:from-white/[0.08] hover:to-white/[0.04] transition-all"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-medium text-white">{title}</span>
          {hasWebSources && (
            <span className="text-xs text-slate-500">({webSources.length} sources)</span>
          )}
        </div>
        <ChevronRight
          className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-white/[0.08]">
          {hasWebSources ? (
            <div className="space-y-2 mt-3">
              {webSources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 p-2 backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg hover:from-white/[0.05] hover:to-white/[0.02] transition-all group"
                >
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-[#E1463E] transition-colors flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-300 group-hover:text-white transition-colors line-clamp-2">
                      {source.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 truncate">
                      {(() => {
                        try {
                          return new URL(source.url).hostname.replace('www.', '');
                        } catch {
                          return source.url;
                        }
                      })()}
                    </div>
                    {source.description && (
                      <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {source.description}
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="mt-3 text-sm text-slate-400 italic">
              Sources web en cours de collecte...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface SignalCardProps {
  signal: MarketSignal;
}

export default function SignalCard({ signal }: SignalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showConfidence, setShowConfidence] = useState(false);
  const [showComparableEvents, setShowComparableEvents] = useState(false);
  const [showExposureBreakdown, setShowExposureBreakdown] = useState(false);
  const isOpportunity = signal.type === 'opportunity';

  // Calculate confidence percentage from confidence string
  const getConfidencePercent = (confidence: string): number => {
    const map: Record<string, number> = {
      high: 85,
      'medium-high': 72,
      medium: 60,
      'medium-low': 45,
      low: 30,
    };
    return map[confidence.toLowerCase()] || 60;
  };

  // Check if company is "underground" (small cap, < $10B market cap)
  const isUndergroundCompany = (marketCap: string | null): boolean => {
    if (!marketCap) return false;
    // Parse market cap (e.g., "$5.2B", "$500M", "$1.2T")
    const match = marketCap.match(/\$?([\d.]+)([BMKT])?/i);
    if (!match) return false;
    const value = parseFloat(match[1]);
    const unit = (match[2] || '').toUpperCase();
    const multiplier: Record<string, number> = { B: 1, M: 0.001, K: 0.000001, T: 1000 };
    const marketCapValue = value * (multiplier[unit] || 1);
    return marketCapValue < 10; // Less than $10B
  };

  // Format unavailable data with institutional wording
  const formatDataAvailability = (value: string | null | undefined): string | null => {
    if (!value) return null;
    const unavailablePatterns = [
      /not available/i,
      /not available in search results/i,
      /n\/a/i,
      /na/i,
    ];
    if (unavailablePatterns.some(pattern => pattern.test(value))) {
      return null; // Return null to hide it, or use badge below
    }
    return value;
  };

  // Check if data is unavailable
  const isDataUnavailable = (value: string | null | undefined): boolean => {
    if (!value) return true;
    const unavailablePatterns = [
      /not available/i,
      /not available in search results/i,
      /n\/a/i,
      /na/i,
    ];
    return unavailablePatterns.some(pattern => pattern.test(value));
  };

  const confidencePercent = getConfidencePercent(signal.prediction.confidence);
  const isCritical = !isOpportunity; // Risk = critical for timeline dot

  return (
    <>
      <div className="relative ml-6 sm:ml-12 mb-6 sm:mb-8">
        {/* Timeline: vertical line + dot — less margin on mobile */}
        <div className="absolute -left-6 sm:-left-12 top-0 h-full w-px bg-gray-800" aria-hidden />
        <div
          className={`absolute -left-[25px] sm:-left-[49px] top-6 w-2 h-2 border border-gray-900 rounded-full ${
            isCritical ? 'bg-[#E1463E]' : 'bg-gray-500'
          }`}
          aria-hidden
        />

        <div
          className={`bg-gray-900/50 border cursor-pointer transition-colors hover:bg-gray-900/80 ${
            isCritical ? 'border-gray-700' : 'border-gray-800'
          } ${expanded ? 'border-gray-600' : ''}`}
          onClick={() => setExpanded(!expanded)}
        >
          <div className="p-5">
            {/* Header: type label + badge + chevron */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                    {isOpportunity ? 'Opportunity' : 'Risk'}
                  </span>
                  {isCritical && (
                    <span className="text-xs text-gray-400 border border-gray-700 px-2 py-0.5 rounded">
                      Critical
                    </span>
                  )}
                </div>
                <h3 className="text-base font-semibold text-gray-200 mb-2">{signal.company.name}</h3>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {signal.company.ticker && (
                    <span className="font-mono text-gray-400">{signal.company.ticker}</span>
                  )}
                  {signal.company.sector && <span>{signal.company.sector}</span>}
                  <span>{signal.prediction.timeframe}</span>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-600 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </div>

            {/* Description */}
            <p className="text-sm text-gray-400 leading-relaxed mb-3">
              {signal.reasoning.summary}
            </p>

            {/* Impact line — mockup style */}
            <div className="flex items-baseline gap-2 text-xs mb-3 pt-3 border-t border-gray-800">
              <span className="text-gray-500">Impact:</span>
              <span className="text-gray-300">
                {isOpportunity ? '+' : ''}{signal.prediction.magnitude}
                {signal.prediction.target_price && ` · Target range: ${signal.prediction.target_price}`}
              </span>
            </div>

            {/* Confidence bar — mockup style */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Confidence:</span>
              <div className="flex-1 bg-gray-800 h-1 rounded overflow-hidden">
                <div
                  className={`h-1 ${isOpportunity ? 'bg-green-500/80' : 'bg-gray-400'}`}
                  style={{ width: `${confidencePercent}%` }}
                  aria-hidden
                />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfidence(true);
                }}
                className="text-xs text-gray-400 font-mono hover:text-gray-300 transition-colors"
              >
                {confidencePercent}%
              </button>
            </div>

            {/* Linked Event — compact */}
            <div className="mt-4 p-3 bg-gray-800/50 border border-gray-800 rounded-lg">
              <div className="flex items-start gap-2">
                <LinkIcon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" aria-hidden />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Triggered by</p>
                  {signal.catalyst_event.event_id ? (
                    <Link
                      to={`/events-feed/${signal.catalyst_event.event_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="group flex items-center gap-2 text-sm text-gray-200 hover:text-[#E1463E] transition-colors"
                    >
                      <span className="font-medium">{signal.catalyst_event.title}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden />
                    </Link>
                  ) : (
                    <p className="text-sm text-gray-200 font-medium">{signal.catalyst_event.title}</p>
                  )}
                  <span className="text-xs text-gray-500 mt-1 block">
                    {new Date(signal.catalyst_event.published).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Expanded Content — mockup style */}
            {expanded && (
              <div className="mt-5 pt-5 border-t border-gray-800 space-y-4" onClick={(e) => e.stopPropagation()}>
                {/* Key Facts */}
                <div>
                  <h4 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
                    Key Factors
                  </h4>
                  <ul className="space-y-1.5">
                    {signal.reasoning.key_factors.map((factor, idx) => (
                      <li key={idx} className="text-xs text-gray-400 flex items-start gap-2 leading-relaxed">
                        <span className="text-gray-600 mt-1 shrink-0">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Key Risks */}
                <div>
                  <h4 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
                    Key Risks
                  </h4>
                  <ul className="space-y-1.5">
                    {signal.reasoning.risks.map((risk, idx) => (
                      <li key={idx} className="text-xs text-gray-400 flex items-start gap-2 leading-relaxed">
                        <span className="text-gray-600 mt-1 shrink-0">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ESG scores (Open Sustainability Index) — optional, only when data available */}
                <ESGScoresBlock companyName={signal.company.name} enabled={expanded} />

                {/* Event-level causal analysis */}
                {signal.catalyst_event.event_id && (
                  <EventImpactAnalysisSection eventId={signal.catalyst_event.event_id} />
                )}

                {/* View Source Materials — mockup style */}
                {signal.sources && signal.sources.length > 0 && (
                  <button
                    type="button"
                    className="w-full px-4 py-2 border border-gray-700 text-gray-400 text-xs hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      const firstWithUrl = signal.sources.find(s => typeof s === 'object' && (s as { url?: string }).url);
                      const url = firstWithUrl && typeof firstWithUrl === 'object' ? (firstWithUrl as { url?: string }).url : null;
                      if (url) window.open(url, '_blank');
                    }}
                  >
                    <ExternalLink className="w-3 h-3" aria-hidden />
                    View Source Materials
                  </button>
                )}

              {/* Trade Impact Section */}
              {signal.trade_impact && (
                <div className="p-4 backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    <h4 className="font-semibold text-white text-sm">Trade Impact</h4>
                    <span className="ml-auto px-2 py-0.5 backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 border border-blue-500/30 rounded text-xs font-semibold text-blue-400">
                      UN Comtrade
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">Impact Type</span>
                      <span className="text-sm font-semibold text-white">{signal.trade_impact.impact_type}</span>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">Direction</span>
                      <span className={`text-sm font-semibold ${
                        signal.trade_impact.direction === 'Positive' ? 'text-green-400' :
                        signal.trade_impact.direction === 'Negative' ? 'text-[#E1463E]' :
                        'text-yellow-400'
                      }`}>
                        {signal.trade_impact.direction}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Trade Impact Score</span>
                      <span className="text-sm font-semibold text-white">
                        {(signal.trade_impact.trade_impact_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {signal.trade_impact.trade_evidence && signal.trade_impact.trade_evidence.length > 0 && (
                    <div className="pt-3 border-t border-blue-500/20">
                      <p className="text-xs font-semibold text-slate-400 mb-2">Trade Evidence</p>
                      <div className="space-y-1.5">
                        {signal.trade_impact.trade_evidence.map((evidence, idx) => (
                          <div key={idx} className="text-xs text-slate-300">
                            <span className="font-medium text-blue-400">{evidence.metric}:</span>
                            <span className="ml-1">{evidence.value}</span>
                            {evidence.description && (
                              <span className="ml-1 text-slate-500">({evidence.description})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Market Data */}
              {Object.keys(signal.market_data).length > 0 && (
                <div className="p-3 backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.15] rounded-xl">
                  <h4 className="font-semibold text-white mb-2 text-sm">Market Data Signals</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {signal.market_data.volume_change && (
                      <div>
                        <span className="text-slate-400">Volume Change:</span>
                        <span className="ml-1 font-semibold text-white">{signal.market_data.volume_change}</span>
                      </div>
                    )}
                    {signal.market_data.short_interest && (
                      <div>
                        <span className="text-slate-400">Short Interest:</span>
                        <span className="ml-1 font-semibold text-white">{signal.market_data.short_interest}</span>
                      </div>
                    )}
                    {signal.market_data.institutional_interest && (
                      <div className="col-span-2">
                        <span className="text-slate-400">Institutional:</span>
                        <span className="ml-1 font-semibold text-white">
                          {signal.market_data.institutional_interest}
                        </span>
                      </div>
                    )}
                    {signal.market_data.analyst_coverage && (
                      <div className="col-span-2">
                        <span className="text-slate-400">Analysts:</span>
                        <span className="ml-1 font-semibold text-white">{signal.market_data.analyst_coverage}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Evidence Section */}
              <div>
                <h4 className="font-semibold text-white mb-3 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Evidence
                </h4>
                <div className="space-y-3">
                  {/* Perplexity Research Section */}
                  {signal.sources.some(s => {
                    const sourceStr = typeof s === 'string' ? s : s.type;
                    return sourceStr === 'perplexity' || (typeof s === 'string' && s.toLowerCase().includes('perplexity'));
                  }) && (
                    <EvidenceSourceSection
                      title="Perplexity Research"
                      icon="🔍"
                      sources={signal.sources.filter(s => {
                        const sourceStr = typeof s === 'string' ? s : s.type;
                        return sourceStr === 'perplexity' || (typeof s === 'string' && s.toLowerCase().includes('perplexity'));
                      })}
                    />
                  )}

                  {/* Market Analysis Section */}
                  {signal.sources.some(s => {
                    const sourceStr = typeof s === 'string' ? s : s.type;
                    return sourceStr === 'market_analysis' || (typeof s === 'string' && s.toLowerCase().includes('market'));
                  }) && (
                    <EvidenceSourceSection
                      title="Market Analysis"
                      icon="📊"
                      sources={signal.sources.filter(s => {
                        const sourceStr = typeof s === 'string' ? s : s.type;
                        return sourceStr === 'market_analysis' || (typeof s === 'string' && s.toLowerCase().includes('market'));
                      })}
                    />
                  )}

                  {/* Other Sources (Comtrade, etc.) */}
                  {signal.sources.filter(s => {
                    const sourceStr = typeof s === 'string' ? s : s.type;
                    return !sourceStr.toLowerCase().includes('perplexity') && 
                           !sourceStr.toLowerCase().includes('market') &&
                           sourceStr !== 'perplexity' &&
                           sourceStr !== 'market_analysis';
                  }).length > 0 && (
                    <div className="space-y-2">
                      {signal.sources.filter(s => {
                        const sourceStr = typeof s === 'string' ? s : s.type;
                        return !sourceStr.toLowerCase().includes('perplexity') && 
                               !sourceStr.toLowerCase().includes('market') &&
                               sourceStr !== 'perplexity' &&
                               sourceStr !== 'market_analysis';
                      }).map((source, idx) => {
                        const sourceStr = typeof source === 'string' ? source : source.title || source.type;
                        const sourceUrl = typeof source === 'object' ? source.url : null;
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-sm text-slate-400 p-2 backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg"
                          >
                            <span className="text-[#E1463E]">📰</span>
                            {sourceUrl ? (
                              <a
                                href={sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-300 hover:text-[#E1463E] transition-colors underline underline-offset-2"
                              >
                                {sourceStr}
                              </a>
                            ) : (
                              <span>{sourceStr}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Premium Features (Coming Soon) */}
              <div className="pt-2 border-t border-white/[0.08]">
                <div className="grid grid-cols-2 gap-2">
                  <button className="group relative px-4 py-3 backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.15] rounded-lg hover:from-white/[0.08] hover:to-white/[0.04] transition-all text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-white">Show comparable past events</span>
                    </div>
                    <span className="text-xs text-slate-500">Premium</span>
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/20 to-[#E1463E]/10 border border-[#E1463E]/30 rounded text-xs font-semibold text-[#E1463E]">
                      Coming Soon
                    </div>
                  </button>
                  <button className="group relative px-4 py-3 backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.15] rounded-lg hover:from-white/[0.08] hover:to-white/[0.04] transition-all text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-white">Why this company?</span>
                    </div>
                    <span className="text-xs text-slate-500">Exposure breakdown</span>
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/20 to-[#E1463E]/10 border border-[#E1463E]/30 rounded text-xs font-semibold text-[#E1463E]">
                      Coming Soon
                    </div>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button className="flex-1 py-2 px-4 bg-[#E1463E] text-white rounded-lg hover:bg-[#E1463E]/90 transition-colors text-sm font-medium">
                  Track & get notified on pressure changes
                </button>
                {signal.catalyst_event.event_id && (
                  <Link
                    to={`/events-feed/${signal.catalyst_event.event_id}`}
                    className="px-4 py-2 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.15] rounded-lg hover:from-white/[0.12] hover:to-white/[0.04] transition-all flex items-center justify-center"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </Link>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Confidence Breakdown Modal */}
      {showConfidence && (
        <ConfidenceBreakdown
          confidence={confidencePercent}
          onClose={() => setShowConfidence(false)}
        />
      )}

      {/* Comparable Events Modal */}
      {showComparableEvents && (
        <ComparableEventsModal
          isOpen={showComparableEvents}
          onClose={() => setShowComparableEvents(false)}
          eventId={signal.catalyst_event.event_id}
          eventTitle={signal.catalyst_event.title}
          companyName={signal.company.name}
          signalType={signal.type}
        />
      )}

      {/* Exposure Breakdown Modal */}
      {showExposureBreakdown && (
        <ExposureBreakdownModal
          isOpen={showExposureBreakdown}
          onClose={() => setShowExposureBreakdown(false)}
          companyName={signal.company.name}
          companyTicker={signal.company.ticker}
          companySector={signal.company.sector}
          eventTitle={signal.catalyst_event.title}
          signalType={signal.type}
          reasoning={signal.reasoning}
          marketData={signal.market_data}
        />
      )}
    </>
  );
}
