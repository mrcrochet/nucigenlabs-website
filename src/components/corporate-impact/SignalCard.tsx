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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MarketSignal } from '../../types/corporate-impact';
import ConfidenceBreakdown from './ConfidenceBreakdown';

interface SignalCardProps {
  signal: MarketSignal;
}

export default function SignalCard({ signal }: SignalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showConfidence, setShowConfidence] = useState(false);
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

  const confidencePercent = getConfidencePercent(signal.prediction.confidence);

  return (
    <>
      <div
        className={`backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border transition-all rounded-2xl overflow-hidden ${
          isOpportunity
            ? 'border-green-500/30 hover:border-green-500/50'
            : 'border-[#E1463E]/30 hover:border-[#E1463E]/50'
        }`}
      >
        {/* Header Bar */}
        <div
          className={`h-1 ${
            isOpportunity
              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
              : 'bg-gradient-to-r from-[#E1463E] to-red-600'
          }`}
        />

        <div className="p-6">
          {/* Signal Type Badge */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              {isOpportunity ? (
                <div className="flex items-center gap-2 px-3 py-1.5 backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/30 rounded-full">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-semibold text-green-400 tracking-wide">↑ LIKELY UPSIDE</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/20 to-[#E1463E]/10 border border-[#E1463E]/30 rounded-full">
                  <TrendingDown className="w-4 h-4 text-[#E1463E]" />
                  <span className="text-xs font-semibold text-[#E1463E] tracking-wide">↓ DOWNSIDE RISK</span>
                </div>
              )}
              <button
                onClick={() => setShowConfidence(true)}
                className="px-2.5 py-1 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.15] rounded text-xs font-semibold text-white hover:from-white/[0.12] hover:to-white/[0.04] transition-all cursor-pointer"
              >
                {confidencePercent}%
              </button>
              <span className="px-2.5 py-1 backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded text-xs font-medium text-slate-400">
                {signal.prediction.timeframe}
              </span>
            </div>
            <Sparkles className="w-5 h-5 text-[#E1463E]" />
          </div>

          {/* Company Info */}
          <div className="mb-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-xl font-light text-white mb-1">{signal.company.name}</h3>
                <div className="flex items-center gap-3 text-sm text-slate-400 flex-wrap">
                  {signal.company.ticker && (
                    <>
                      <span className="font-mono font-medium text-slate-300">{signal.company.ticker}</span>
                      <span className="text-slate-600">•</span>
                    </>
                  )}
                  {signal.company.exchange && (
                    <>
                      <span>{signal.company.exchange}</span>
                      <span className="text-slate-600">•</span>
                    </>
                  )}
                  {signal.company.market_cap && <span>{signal.company.market_cap}</span>}
                </div>
              </div>
              <div className="text-right ml-4">
                {signal.company.current_price && (
                  <div className="text-2xl font-light text-white">{signal.company.current_price}</div>
                )}
                {signal.prediction.target_price && (
                  <div
                    className={`text-sm font-medium ${isOpportunity ? 'text-green-400' : 'text-[#E1463E]'}`}
                  >
                    Observed Range: {signal.prediction.target_price}
                  </div>
                )}
              </div>
            </div>
            {signal.company.sector && (
              <span className="inline-block px-2 py-1 backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded text-xs font-medium text-slate-400">
                {signal.company.sector}
              </span>
            )}
          </div>

          {/* Observed Impact Range */}
          <div
            className={`p-4 rounded-xl border mb-4 backdrop-blur-xl ${
              isOpportunity
                ? 'bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20'
                : 'bg-gradient-to-br from-[#E1463E]/10 to-[#E1463E]/5 border-[#E1463E]/20'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className={`w-5 h-5 ${isOpportunity ? 'text-green-400' : 'text-[#E1463E]'}`} />
              <span className={`font-semibold text-sm ${isOpportunity ? 'text-green-400' : 'text-[#E1463E]'}`}>
                Observed Impact Range: {isOpportunity ? '+' : ''}{signal.prediction.magnitude}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>⏱ Observed timeframe: {signal.prediction.timeframe}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 italic">
                Based on prior comparable events
              </span>
              <span className={`px-2 py-0.5 backdrop-blur-xl border rounded text-xs font-semibold ${
                isOpportunity
                  ? 'bg-gradient-to-br from-green-500/20 to-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-gradient-to-br from-[#E1463E]/20 to-[#E1463E]/10 border-[#E1463E]/30 text-[#E1463E]'
              }`}>
                Replay-validated
              </span>
            </div>
          </div>

          {/* Linked Event - Key Feature */}
          <div className="mb-4 p-3 backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.15] rounded-xl">
            <div className="flex items-start gap-2">
              <LinkIcon className="w-4 h-4 text-[#E1463E] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-400 mb-1 tracking-wide">TRIGGERED BY</p>
                {signal.catalyst_event.event_id ? (
                  <Link
                    to={`/events-feed/${signal.catalyst_event.event_id}`}
                    className="group flex items-center gap-2 text-sm text-white hover:text-[#E1463E] transition-colors"
                  >
                    <span className="font-medium">{signal.catalyst_event.title}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ) : (
                  <p className="text-sm text-white font-medium">{signal.catalyst_event.title}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500">
                    {new Date(signal.catalyst_event.published).toLocaleDateString()}
                  </span>
                  {signal.catalyst_event.tier && (
                    <span className="px-1.5 py-0.5 backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/20 to-[#E1463E]/10 border border-[#E1463E]/30 rounded text-xs font-semibold text-[#E1463E]">
                      {signal.catalyst_event.tier}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mb-4">
            <p className="text-sm text-slate-300 leading-relaxed">{signal.reasoning.summary}</p>
          </div>

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full py-3 px-4 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.15] rounded-lg text-white hover:from-white/[0.12] hover:to-white/[0.04] transition-all flex items-center justify-center gap-2 font-medium text-sm"
          >
            {expanded ? 'Show Less' : 'Deep Dive Analysis'}
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>

          {/* Expanded Content */}
          {expanded && (
            <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-4">
              {/* Key Factors */}
              <div>
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  Key Bullish Factors
                </h4>
                <ul className="space-y-2">
                  {signal.reasoning.key_factors.map((factor, idx) => (
                    <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-green-400 font-bold flex-shrink-0 mt-0.5">✓</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risks */}
              <div>
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  Key Risks
                </h4>
                <ul className="space-y-2">
                  {signal.reasoning.risks.map((risk, idx) => (
                    <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-orange-400 font-bold flex-shrink-0 mt-0.5">⚠</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>

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
                <h4 className="font-semibold text-white mb-2 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Evidence
                </h4>
                <div className="space-y-2">
                  {signal.sources.slice(0, 3).map((source, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm text-slate-400 p-2 backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg"
                    >
                      <span className="text-[#E1463E]">📰</span>
                      <span>{source}</span>
                    </div>
                  ))}
                  {signal.sources.length > 3 && (
                    <p className="text-xs text-slate-500">+ {signal.sources.length - 3} more sources</p>
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
                  Track This Signal
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

      {/* Confidence Breakdown Modal */}
      {showConfidence && (
        <ConfidenceBreakdown
          confidence={confidencePercent}
          onClose={() => setShowConfidence(false)}
        />
      )}
    </>
  );
}
