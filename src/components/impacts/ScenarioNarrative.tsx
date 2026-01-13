/**
 * ScenarioNarrative - Scenario narrative
 */

import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import type { Impact } from '../../types/intelligence';

interface ScenarioNarrativeProps {
  impact: Impact;
}

export default function ScenarioNarrative({ impact }: ScenarioNarrativeProps) {
  return (
    <Card>
      <SectionHeader title="Scenario Narrative" />
      
      <div className="mt-4">
        {impact.scenario_summary ? (
          <p className="text-text-primary leading-relaxed">
            {impact.scenario_summary}
          </p>
        ) : (
          <p className="text-text-secondary text-sm">
            No scenario narrative available
          </p>
        )}
      </div>
    </Card>
  );
}
