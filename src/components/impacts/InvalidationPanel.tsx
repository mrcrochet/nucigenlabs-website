/**
 * InvalidationPanel - Invalidation conditions panel
 * 
 * "What would change my mind?" (3-6 items)
 */

import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import type { Impact } from '../../types/intelligence';

interface InvalidationPanelProps {
  impact: Impact;
}

export default function InvalidationPanel({ impact }: InvalidationPanelProps) {
  const conditions = impact.invalidation_conditions || [];

  return (
    <Card>
      <SectionHeader title="What Would Change My Mind?" />
      
      <div className="mt-4">
        <p className="text-sm text-text-secondary mb-4">
          Conditions that would invalidate this impact scenario:
        </p>

        <div className="space-y-3">
          {conditions.map((condition, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-3 bg-background-glass-subtle rounded-lg border border-borders-subtle"
            >
              <span className="text-text-secondary mt-1">•</span>
              <p className="text-sm text-text-primary flex-1">{condition}</p>
            </div>
          ))}

          {conditions.length === 0 && (
            <div className="text-sm text-text-secondary text-center py-4">
              No invalidation conditions specified
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
