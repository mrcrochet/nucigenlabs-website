/**
 * Overview map side panel – Top events + Top corporate impacts.
 * Glass morphism, color bar per event type, staggered animation, hover.
 * Top events section is retractable.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ChevronDown, ChevronRight } from 'lucide-react';
import type {
  OverviewEventSummary,
  OverviewCorporateImpactSummary,
} from '../../types/overview';
import { getLayerColor } from '../../utils/colorSystem';

export interface OverviewMapSidePanelProps {
  top_events: OverviewEventSummary[];
  top_impacts: OverviewCorporateImpactSummary[];
  /** When provided, called on event click (for flyTo + navigate). Pass (event, signal) if signal has coords. */
  onEventClick?: (event: OverviewEventSummary, signal?: { lon: number; lat: number }) => void;
  /** When provided, called on impact click (for navigate). */
  onImpactClick?: (impact: OverviewCorporateImpactSummary) => void;
}

const DEFAULT_EVENT_COLOR = '#F9B234';

function eventColor(event: OverviewEventSummary): string {
  return event.type ? getLayerColor(event.type, 'main') : DEFAULT_EVENT_COLOR;
}

export default function OverviewMapSidePanel({
  top_events,
  top_impacts,
  onEventClick,
  onImpactClick,
}: OverviewMapSidePanelProps) {
  const [topEventsOpen, setTopEventsOpen] = useState(true);

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden bg-transparent">
      {/* Top events — rétractable */}
      <div
        className="border-b border-white/[0.1] overview-panel-glass overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(15,20,25,0.8), rgba(20,25,30,0.6))',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        <button
          type="button"
          onClick={() => setTopEventsOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-white/[0.04] transition-colors"
          aria-expanded={topEventsOpen}
          aria-label={topEventsOpen ? 'Rétracter Top events' : 'Afficher Top events'}
        >
          <h3 className="text-xs font-semibold text-gray-300/95 uppercase tracking-wider">
            Top events
          </h3>
          {topEventsOpen ? (
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />
          )}
        </button>
        {topEventsOpen && (
          <div className="px-4 pb-5 pt-0">
            <ul className="space-y-2.5">
              {top_events.length === 0 ? (
                <li className="text-xs text-gray-500 py-2">Aucun événement pour cette période.</li>
              ) : (
              top_events.slice(0, 3).map((event, index) => (
                <li
                  key={event.id}
                  className="overview-stagger-item overview-event-item flex gap-2 opacity-0 text-gray-200/95 rounded-lg py-1.5 pr-2 -mx-1 transition-all duration-200 hover:translate-x-1 hover:bg-white/[0.04]"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    borderLeft: `3px solid ${eventColor(event)}`,
                  }}
                >
                  {onEventClick ? (
                    <button
                      type="button"
                      onClick={() => onEventClick(event)}
                      className="flex-1 min-w-0 text-left w-full"
                    >
                      <div className="text-sm font-medium">{event.label_short}</div>
                      <div className="text-xs text-gray-400/85">{event.impact_one_line}</div>
                    </button>
                  ) : (
                    <Link
                      to={event.investigate_id || '/search'}
                      className="flex-1 min-w-0 block"
                    >
                      <div className="text-sm font-medium">{event.label_short}</div>
                      <div className="text-xs text-gray-400/85">{event.impact_one_line}</div>
                    </Link>
                  )}
                </li>
              ))
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Top corporate impacts — same glass style */}
      <div
        className="p-4 pb-5 flex-1 overview-panel-glass"
        style={{
          background: 'linear-gradient(135deg, rgba(15,20,25,0.7), rgba(20,25,30,0.5))',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        <h3 className="text-xs font-semibold text-gray-300/95 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-gray-400/90" />
          Top corporate impacts
        </h3>
        <ul className="space-y-2.5">
          {top_impacts.length === 0 ? (
            <li className="text-xs text-gray-500 py-2">Aucun impact corporate.</li>
          ) : (
          top_impacts.slice(0, 3).map((impact, idx) => (
            <li
              key={idx}
              className="overview-stagger-item opacity-0 text-gray-200/95 rounded-lg py-1.5 pr-2 -mx-1 transition-all duration-200 hover:translate-x-1 hover:bg-white/[0.04]"
              style={{ animationDelay: `${240 + idx * 50}ms` }}
            >
              {onImpactClick ? (
                <button
                  type="button"
                  onClick={() => onImpactClick(impact)}
                  className="text-left w-full"
                >
                  <div className="text-sm font-medium">{impact.name}</div>
                  <div className="text-xs text-gray-400/85">{impact.impact_one_line}</div>
                </button>
              ) : (
                <Link
                  to={impact.investigate_id || '/search'}
                  className="block"
                >
                  <div className="text-sm font-medium">{impact.name}</div>
                  <div className="text-xs text-gray-400/85">{impact.impact_one_line}</div>
                </Link>
              )}
            </li>
          ))
          )}
        </ul>
      </div>
    </div>
  );
}
