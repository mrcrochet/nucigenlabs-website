/**
 * Overview map side panel (V1) – Top 3 events, Top 3 corporate impacts, CTA to Investigate.
 */

import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight } from 'lucide-react';
import type {
  OverviewEventSummary,
  OverviewCorporateImpactSummary,
} from '../../types/overview';

export interface OverviewMapSidePanelProps {
  top_events: OverviewEventSummary[];
  top_impacts: OverviewCorporateImpactSummary[];
}

export default function OverviewMapSidePanel({
  top_events,
  top_impacts,
}: OverviewMapSidePanelProps) {
  const navigate = useNavigate();

  const goToInvestigate = () => navigate('/investigations');

  return (
    <div className="flex flex-col h-full border border-gray-800 bg-gray-900/30 rounded-lg overflow-hidden">
      {/* Top 3 events */}
      <div className="p-4 pb-5 border-b border-gray-800">
        <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
          Top events
        </h3>
        <ul className="space-y-2.5">
          {top_events.slice(0, 3).map((event) => (
            <li key={event.id}>
              <div className="text-sm font-medium text-gray-200">{event.label_short}</div>
              <div className="text-xs text-gray-500">{event.impact_one_line}</div>
            </li>
          ))}
        </ul>
      </div>

      {/* Top 3 corporate impacts */}
      <div className="p-4 pb-5 border-b border-gray-800 flex-1">
        <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-gray-400" />
          Top corporate impacts
        </h3>
        <ul className="space-y-2.5">
          {top_impacts.slice(0, 3).map((impact, idx) => (
            <li key={idx}>
              <div className="text-sm font-medium text-gray-200">{impact.name}</div>
              <div className="text-xs text-gray-500">{impact.impact_one_line}</div>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="p-4">
        <button
          type="button"
          onClick={goToInvestigate}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-100 text-sm font-semibold rounded transition-colors"
        >
          Go to Investigate
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
