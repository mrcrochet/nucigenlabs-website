/**
 * AssumptionsList - List of assumptions
 */

import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import type { Impact } from '../../types/intelligence';

interface AssumptionsListProps {
  impact: Impact;
}

export default function AssumptionsList({ impact }: AssumptionsListProps) {
  const assumptions = impact.assumptions || [];

  return (
    <Card>
      <SectionHeader title="Assumptions" />
      
      <div className="mt-4 space-y-2">
        {assumptions.map((assumption, index) => (
          <div key={index} className="flex items-start gap-2 p-3 bg-background-glass-subtle rounded-lg">
            <span className="text-text-secondary mt-1">•</span>
            <p className="text-sm text-text-primary flex-1">{assumption}</p>
          </div>
        ))}

        {assumptions.length === 0 && (
          <div className="text-sm text-text-secondary text-center py-4">
            No assumptions listed
          </div>
        )}
      </div>
    </Card>
  );
}
