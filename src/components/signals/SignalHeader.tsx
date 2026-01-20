/**
 * SignalHeader - Signal detail header
 */

import Badge from '../ui/Badge';
import { Calendar, TrendingUp } from 'lucide-react';
import type { Signal } from '../../types/intelligence';

interface SignalHeaderProps {
  signal: Signal;
}

export default function SignalHeader({ signal }: SignalHeaderProps) {
  return (
    <div className="bg-background-glass-subtle border border-borders-subtle rounded-xl p-6">
      <h1 className="text-2xl font-semibold text-text-primary mb-4">
        {signal.title}
      </h1>

      <p className="text-text-secondary mb-4">{signal.summary}</p>

      <div className="flex items-center gap-4 flex-wrap">
        {/* Scope */}
        {signal.scope && (
          <Badge variant="neutral">
            Scope: {signal.scope}
          </Badge>
        )}

        {/* Time Horizon */}
        {signal.time_horizon && (
          <Badge variant="neutral">
            Horizon: {signal.time_horizon.charAt(0).toUpperCase() + signal.time_horizon.slice(1)}
          </Badge>
        )}

        {/* Impact Score */}
        <Badge variant="level">
          Impact: {signal.impact_score || 0}%
        </Badge>

        {/* Confidence Score */}
        <Badge variant="neutral">
          Confidence: {signal.confidence_score || 0}%
        </Badge>

        {/* Last Updated */}
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Calendar className="w-4 h-4" />
          <span>Updated {new Date(signal.last_updated).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
