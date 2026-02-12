/**
 * SignalHeroCard - Hero card for critical signal (impact >= 80)
 *
 * Full-width horizontal layout with large impact circle,
 * complete summary, and "Why it matters" always visible.
 */

import Badge from '../ui/Badge';
import Card from '../ui/Card';
import { MapPin, Clock, TrendingUp } from 'lucide-react';
import type { Signal } from '../../types/intelligence';

interface SignalHeroCardProps {
  signal: Signal;
  onClick: () => void;
  formatTimeAgo: (dateString: string) => string;
}

export default function SignalHeroCard({ signal, onClick, formatTimeAgo }: SignalHeroCardProps) {
  const getHorizonLabel = (horizon: string) => {
    switch (horizon) {
      case 'immediate': return 'Immediate';
      case 'short': return 'Short-term';
      case 'medium': return 'Medium-term';
      case 'long': return 'Long-term';
      default: return horizon;
    }
  };

  const strokeColor = signal.impact_score >= 80 ? '#E1463E' : signal.impact_score >= 60 ? '#f59e0b' : '#6366f1';
  const circumference = 2 * Math.PI * 34;

  return (
    <Card
      hover
      onClick={onClick}
      className="p-6 sm:p-8 border-l-4 border-l-[#E1463E] shadow-[0_0_30px_rgba(225,70,62,0.15)] transition-all duration-300 hover:scale-[1.005] hover:shadow-[0_0_40px_rgba(225,70,62,0.25)] mb-6"
    >
      <div className="flex items-start gap-6">
        {/* Impact Circle - Large */}
        <div className="flex-shrink-0 hidden sm:block">
          <div className="relative w-20 h-20">
            <svg className="transform -rotate-90 w-20 h-20">
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="5"
                fill="none"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke={strokeColor}
                strokeWidth="5"
                fill="none"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${circumference * (1 - (signal.impact_score || 0) / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-white">
                {signal.impact_score || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="critical" className="text-xs font-semibold">
              Critical Signal
            </Badge>
          </div>

          <h2 className="text-2xl font-semibold text-white leading-snug mb-3">
            {signal.title}
          </h2>

          <p className="text-slate-300 font-light leading-relaxed mb-4 text-sm sm:text-base">
            {signal.summary}
          </p>

          {signal.why_it_matters && (
            <div className="p-3 bg-[#E1463E]/10 border border-[#E1463E]/20 rounded-lg mb-4">
              <p className="text-sm text-slate-300 font-light">
                <span className="font-semibold text-[#E1463E]">Why it matters: </span>
                {signal.why_it_matters}
              </p>
            </div>
          )}

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Badge variant="critical" className="text-sm px-3 py-1">
              {signal.impact_score}% impact
            </Badge>
            <Badge variant="neutral" className="text-sm px-3 py-1">
              {signal.confidence_score}% confidence
            </Badge>
            <Badge variant="level" className="text-sm px-3 py-1">
              {getHorizonLabel(signal.time_horizon)}
            </Badge>
            {signal.scope !== 'global' && (
              <Badge variant="neutral" className="text-sm px-3 py-1">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                {signal.scope}
              </Badge>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 text-xs text-slate-500 pt-3 border-t border-white/[0.05]">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(signal.last_updated)}
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" />
              {signal.source_count || signal.related_event_ids?.length || 0} related events
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
