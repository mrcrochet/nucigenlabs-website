/**
 * SignalMetricsCard - Signal metrics card
 * 
 * Metrics: strength/confidence + evolution
 */

import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import Sparkline from '../charts/Sparkline';
import type { Signal } from '../../types/intelligence';

interface SignalMetricsCardProps {
  signal: Signal;
}

export default function SignalMetricsCard({ signal }: SignalMetricsCardProps) {
  // Placeholder trend data
  const strengthTrend = Array.from({ length: 7 }, () => Math.random() * 100);
  const confidenceTrend = Array.from({ length: 7 }, () => Math.random() * 100);

  return (
    <Card>
      <SectionHeader title="Signal Metrics" />
      
      <div className="mt-4 space-y-6">
        {/* Strength */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">Strength</span>
            <span className="text-lg font-semibold text-text-primary">
              {signal.impact_score || 0}%
            </span>
          </div>
          <div className="w-full h-2 bg-background-glass-medium rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-primary-red"
              style={{ width: `${signal.impact_score || 0}%` }}
            />
          </div>
          <div className="h-12">
            <Sparkline data={strengthTrend} />
          </div>
        </div>

        {/* Confidence */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">Confidence</span>
            <span className="text-lg font-semibold text-text-primary">
              {signal.confidence_score || 0}%
            </span>
          </div>
          <div className="w-full h-2 bg-background-glass-medium rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-primary-red"
              style={{ width: `${signal.confidence_score || 0}%` }}
            />
          </div>
          <div className="h-12">
            <Sparkline data={confidenceTrend} />
          </div>
        </div>

        {/* Source Count */}
        <div className="pt-4 border-t border-borders-subtle">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Source Events</span>
            <Badge variant="neutral">
              {signal.related_event_ids?.length || 0}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
