/**
 * PressureCard — Displays a pressure-enriched signal
 *
 * Shows system tag, impact order, magnitude bar, probability/confidence,
 * time horizon, transmission channels, and an investigate CTA.
 */

import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import type { PressureSignal, PressureSystem } from '../../types/intelligence';
import { Clock, ArrowRight, Zap, BarChart3, ExternalLink } from 'lucide-react';

interface PressureCardProps {
  signal: PressureSignal;
}

const SYSTEM_COLORS: Record<PressureSystem, { bg: string; text: string; border: string }> = {
  Security: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  Maritime: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  Energy: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  Industrial: { bg: 'bg-slate-400/15', text: 'text-slate-300', border: 'border-slate-400/30' },
  Monetary: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
};

const ORDER_LABELS: Record<1 | 2 | 3, string> = {
  1: '1st Order',
  2: '2nd Order',
  3: '3rd Order',
};

function getHorizonBucket(days: number): string {
  if (days <= 7) return 'Immediate';
  if (days <= 30) return 'Short-term';
  if (days <= 90) return 'Medium-term';
  return 'Long-term';
}

function getMagnitudeColor(magnitude: number): string {
  if (magnitude >= 80) return 'bg-[#E1463E]';
  if (magnitude >= 60) return 'bg-amber-500';
  if (magnitude >= 40) return 'bg-yellow-500';
  return 'bg-slate-500';
}

function getDivergenceStyle(absDiv: number): { color: string; label: string } {
  if (absDiv >= 0.25) return { color: 'text-red-400', label: 'Strong' };
  if (absDiv >= 0.10) return { color: 'text-amber-400', label: 'Moderate' };
  return { color: 'text-emerald-400', label: 'Aligned' };
}

export default function PressureCard({ signal }: PressureCardProps) {
  const navigate = useNavigate();
  const p = signal.pressure;
  const systemStyle = SYSTEM_COLORS[p.system];
  const horizonBucket = getHorizonBucket(p.time_horizon_days);

  return (
    <Card hover className="p-5 transition-all duration-300 hover:scale-[1.003]">
      <div className="space-y-4">
        {/* Top row: System tag + Impact order + Time horizon */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${systemStyle.bg} ${systemStyle.text} ${systemStyle.border}`}
          >
            {p.system}
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
              p.impact_order === 1
                ? 'bg-white/10 text-white border-white/20'
                : p.impact_order === 2
                  ? 'bg-white/[0.06] text-slate-300 border-white/10'
                  : 'bg-white/[0.03] text-slate-400 border-white/[0.06]'
            }`}
          >
            {ORDER_LABELS[p.impact_order]}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500 ml-auto">
            <Clock className="w-3 h-3" />
            {p.time_horizon_days}d — {horizonBucket}
          </span>
        </div>

        {/* Title + Summary */}
        <div>
          <h3 className="text-base font-semibold text-white leading-snug mb-1">
            {signal.title}
          </h3>
          <p className="text-sm text-slate-400 font-light leading-relaxed line-clamp-2">
            {signal.summary}
          </p>
        </div>

        {/* Magnitude bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Magnitude</span>
            <span className="text-xs font-medium text-white">{p.magnitude_estimate}/100</span>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getMagnitudeColor(p.magnitude_estimate)}`}
              style={{ width: `${p.magnitude_estimate}%` }}
            />
          </div>
        </div>

        {/* Probability + Confidence row */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-xs text-slate-300">
              Prob. {Math.round(p.probability_estimate * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">
            <span className="text-xs text-slate-300">
              Conf. {Math.round(p.confidence_score * 100)}%
            </span>
          </div>
          <span className="text-xs text-slate-600 ml-auto">
            {signal.source_count || signal.related_event_ids?.length || 0} sources
          </span>
        </div>

        {/* Transmission channels */}
        {p.transmission_channels.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {p.transmission_channels.map((ch) => (
              <span
                key={ch}
                className="px-2 py-0.5 rounded text-[10px] text-slate-500 bg-white/[0.03] border border-white/[0.05]"
              >
                {ch}
              </span>
            ))}
          </div>
        )}

        {/* Polymarket divergence */}
        {signal.polymarket && (
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 space-y-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[10px] uppercase tracking-wider text-slate-500">
                Prediction Market
              </span>
              <span className={`text-[10px] font-medium ml-auto ${getDivergenceStyle(signal.polymarket.divergence_abs).color}`}>
                {getDivergenceStyle(signal.polymarket.divergence_abs).label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Crowd</span>
                <span className="text-xs font-medium text-white">
                  {Math.round(signal.polymarket.crowd_probability * 100)}%
                </span>
              </div>
              <span className="text-slate-600">vs</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Model</span>
                <span className="text-xs font-medium text-white">
                  {Math.round(signal.polymarket.model_probability * 100)}%
                </span>
              </div>
              <span className={`text-xs font-medium ml-auto ${getDivergenceStyle(signal.polymarket.divergence_abs).color}`}>
                {signal.polymarket.divergence > 0 ? '+' : ''}{Math.round(signal.polymarket.divergence * 100)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug line-clamp-1">
              {signal.polymarket.question}
            </p>
            {signal.polymarket.market_url && (
              <a
                href={signal.polymarket.market_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
              >
                Polymarket
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        )}

        {/* CTA */}
        <button
          type="button"
          onClick={() => navigate(`/signals/${signal.id}`)}
          className="flex items-center gap-1.5 text-xs text-[#E1463E] hover:text-white transition-colors font-medium mt-1"
        >
          Investigate Impact
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </Card>
  );
}
