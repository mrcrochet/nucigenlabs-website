/**
 * ProbabilityPanel - Probability panel
 */

import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import type { Impact } from '../../types/intelligence';

interface ProbabilityPanelProps {
  impact: Impact;
}

export default function ProbabilityPanel({ impact }: ProbabilityPanelProps) {
  return (
    <Card>
      <SectionHeader title="Probability & Magnitude" />
      
      <div className="mt-4 space-y-6">
        {/* Probability */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">Probability</span>
            <span className="text-xl font-semibold text-text-primary">
              {impact.probability}%
            </span>
          </div>
          <div className="w-full h-3 bg-background-glass-medium rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-red"
              style={{ width: `${impact.probability}%` }}
            />
          </div>
        </div>

        {/* Magnitude */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">Magnitude</span>
            <span className="text-xl font-semibold text-text-primary">
              {impact.magnitude}%
            </span>
          </div>
          <div className="w-full h-3 bg-background-glass-medium rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-red"
              style={{ width: `${impact.magnitude}%` }}
            />
          </div>
        </div>

        {/* Timeframe */}
        <div className="pt-4 border-t border-borders-subtle">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Timeframe</span>
            <Badge variant="neutral">{impact.timeframe}</Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
