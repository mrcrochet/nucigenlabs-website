/**
 * Overview side panel — Top events + Top corporate impacts.
 * Sobre, high-tech : fond plat, bordures fines, typo stricte.
 */

import { useState, useEffect } from 'react';
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
  onEventClick?: (event: OverviewEventSummary, signal?: { lon: number; lat: number }) => void;
  onImpactClick?: (impact: OverviewCorporateImpactSummary) => void;
  lastUpdated?: Date | null;
}

const DEFAULT_EVENT_COLOR = '#71717a';

function eventColor(event: OverviewEventSummary): string {
  return event.type ? getLayerColor(event.type, 'main') : DEFAULT_EVENT_COLOR;
}

function formatUpdatedAgo(date: Date): string {
  const s = Math.round((Date.now() - date.getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 120) return '1m';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 2 ? '1h' : `${h}h`;
}

export default function OverviewMapSidePanel({
  top_events,
  top_impacts,
  onEventClick,
  onImpactClick,
  lastUpdated,
}: OverviewMapSidePanelProps) {
  const [topEventsOpen, setTopEventsOpen] = useState(true);
  const [updatedLabel, setUpdatedLabel] = useState<string>('');

  useEffect(() => {
    if (!lastUpdated) {
      setUpdatedLabel('');
      return;
    }
    setUpdatedLabel(formatUpdatedAgo(lastUpdated));
    const t = setInterval(() => setUpdatedLabel(formatUpdatedAgo(lastUpdated)), 15000);
    return () => clearInterval(t);
  }, [lastUpdated]);

  return (
    <div className="flex flex-col">
      {/* Top events */}
      <div className="border-b border-white/[0.06]">
        <button
          type="button"
          onClick={() => setTopEventsOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-white/[0.02] transition-colors"
          aria-expanded={topEventsOpen}
          aria-label={topEventsOpen ? 'Rétracter Top events' : 'Afficher Top events'}
        >
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Top events</span>
          {topEventsOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" aria-hidden />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" aria-hidden />
          )}
        </button>
        {topEventsOpen && (
          <div className="px-3 pb-3 pt-0">
            <ul className="space-y-2">
              {top_events.length === 0 ? (
                <li className="text-[11px] text-zinc-600 py-2 px-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">No events</li>
              ) : (
                top_events.slice(0, 3).map((event) => (
                  <li key={event.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                    {onEventClick ? (
                      <button
                        type="button"
                        onClick={() => onEventClick(event)}
                        className="w-full flex gap-2 py-2 pl-2.5 pr-2.5 text-left hover:bg-white/[0.03] transition-colors border-l-2"
                        style={{ borderLeftColor: eventColor(event) }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-medium text-zinc-200 truncate">{event.label_short}</div>
                          <div className="text-[10px] text-zinc-500 truncate mt-0.5">{event.impact_one_line}</div>
                        </div>
                      </button>
                    ) : (
                      <Link
                        to={event.investigate_id || '/search'}
                        className="flex gap-2 py-2 pl-2.5 pr-2.5 block hover:bg-white/[0.03] transition-colors border-l-2"
                        style={{ borderLeftColor: eventColor(event) }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-medium text-zinc-200 truncate">{event.label_short}</div>
                          <div className="text-[10px] text-zinc-500 truncate mt-0.5">{event.impact_one_line}</div>
                        </div>
                      </Link>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Top corporate impacts */}
      <div className="px-3 py-3">
        <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <Building2 className="w-3 h-3 text-zinc-600" />
          Top corporate impacts
        </h3>
        <ul className="space-y-2">
          {top_impacts.length === 0 ? (
            <li className="text-[11px] text-zinc-600 py-2 px-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">None</li>
          ) : (
            top_impacts.slice(0, 3).map((impact, idx) => (
              <li key={idx} className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                {onImpactClick ? (
                  <button
                    type="button"
                    onClick={() => onImpactClick(impact)}
                    className="w-full py-2 px-2.5 text-left hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="text-[12px] font-medium text-zinc-200 truncate">{impact.name}</div>
                    <div className="text-[10px] text-zinc-500 truncate mt-0.5">{impact.impact_one_line}</div>
                  </button>
                ) : (
                  <Link to={impact.investigate_id || '/search'} className="block py-2 px-2.5 hover:bg-white/[0.03] transition-colors">
                    <div className="text-[12px] font-medium text-zinc-200 truncate">{impact.name}</div>
                    <div className="text-[10px] text-zinc-500 truncate mt-0.5">{impact.impact_one_line}</div>
                  </Link>
                )}
              </li>
            ))
          )}
        </ul>
        {updatedLabel && (
          <p className="mt-3 pt-2 border-t border-white/[0.04] flex items-center gap-1.5 text-[9px] text-zinc-600 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/60 animate-pulse" aria-hidden />
            {updatedLabel}
          </p>
        )}
      </div>
    </div>
  );
}
