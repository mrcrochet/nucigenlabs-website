/**
 * Events Timeline View
 * 
 * Chronological view with:
 * - Vertical timeline grouped by date
 * - Direct effects shown below each event
 * - Predicted effects with timeframes
 * - Horizontal prediction timeline
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import type { Event } from '../../types/intelligence';
import { Clock, TrendingUp, TrendingDown, ChevronRight, AlertCircle } from 'lucide-react';

interface EventsTimelineViewProps {
  events: Event[];
  onEventClick?: (eventId: string) => void;
}

// Get tier color and emoji
const getTierStyle = (score: number | undefined) => {
  if (!score) return { color: 'bg-slate-500', emoji: '🔵', label: 'Standard' };
  if (score >= 85) return { color: 'bg-red-500', emoji: '🔴', label: 'Critical' };
  if (score >= 70) return { color: 'bg-orange-500', emoji: '🟠', label: 'Strategic' };
  if (score >= 50) return { color: 'bg-yellow-500', emoji: '🟡', label: 'Notable' };
  return { color: 'bg-blue-500', emoji: '🔵', label: 'Standard' };
};

// Format date header
const formatDateHeader = (dateStr: string) => {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'TODAY';
  if (isYesterday(date)) return 'YESTERDAY';
  return format(date, 'MMM dd, yyyy').toUpperCase();
};

export default function EventsTimelineView({ events, onEventClick }: EventsTimelineViewProps) {
  // Group events by date
  const eventsByDate = useMemo(() => {
    const groups: Record<string, Event[]> = {};
    
    events.forEach(event => {
      const dateKey = format(parseISO(event.published), 'yyyy-MM-dd');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(event);
    });

    // Sort each group by time (newest first within each day)
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => 
        new Date(b.published).getTime() - new Date(a.published).getTime()
      );
    });

    return groups;
  }, [events]);

  // Get sorted date keys (newest first)
  const sortedDates = useMemo(() => 
    Object.keys(eventsByDate).sort((a, b) => b.localeCompare(a)),
    [eventsByDate]
  );

  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No events to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sortedDates.map(dateKey => (
        <div key={dateKey}>
          {/* Date Header */}
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold text-white">
              {formatDateHeader(dateKey)}
            </h3>
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate-500">
              {eventsByDate[dateKey].length} event{eventsByDate[dateKey].length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Timeline for this date */}
          <div className="relative pl-8 border-l-2 border-white/10 space-y-4">
            {eventsByDate[dateKey].map(event => {
              const tier = getTierStyle(event.impact_score);
              const chain = (event as any).causal_chain;
              
              return (
                <div 
                  key={event.id} 
                  className="relative group"
                >
                  {/* Timeline dot */}
                  <div 
                    className={`absolute -left-[25px] w-3 h-3 rounded-full ${tier.color} ring-4 ring-[#0A0A0A]`}
                  />

                  {/* Event Card */}
                  <div 
                    onClick={() => onEventClick?.(event.id)}
                    className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{tier.emoji}</span>
                        <div>
                          <h4 className="text-sm font-medium text-white group-hover:text-white/90">
                            {event.headline}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">
                              {format(parseISO(event.published), 'HH:mm')}
                            </span>
                            {event.region && (
                              <>
                                <span className="text-slate-600">•</span>
                                <span className="text-xs text-slate-500">{event.region}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.impact_score && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            event.impact_score >= 85 ? 'bg-red-500/20 text-red-400' :
                            event.impact_score >= 70 ? 'bg-orange-500/20 text-orange-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {event.impact_score}%
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                      </div>
                    </div>

                    {/* Direct Effects (from causal chain) */}
                    {chain?.first_order_effect && (
                      <div className="ml-9 mt-3 space-y-1">
                        <div className="flex items-start gap-2 text-xs">
                          <span className="text-green-500 font-mono">└─</span>
                          <span className="text-slate-400">
                            <span className="text-green-400">Direct:</span>{' '}
                            {chain.first_order_effect.substring(0, 80)}
                            {chain.first_order_effect.length > 80 ? '...' : ''}
                          </span>
                        </div>
                        {chain.second_order_effect && (
                          <div className="flex items-start gap-2 text-xs ml-4">
                            <span className="text-blue-500 font-mono">└─</span>
                            <span className="text-slate-400">
                              <span className="text-blue-400">Predicted:</span>{' '}
                              {chain.second_order_effect.substring(0, 60)}
                              {chain.second_order_effect.length > 60 ? '...' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sectors */}
                    {event.sectors && event.sectors.length > 0 && (
                      <div className="ml-9 mt-2 flex flex-wrap gap-1">
                        {event.sectors.slice(0, 3).map((sector, idx) => (
                          <span 
                            key={idx}
                            className="text-[10px] px-1.5 py-0.5 bg-white/5 text-slate-500 rounded"
                          >
                            {sector}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Prediction Timeline (horizontal) */}
      <div className="mt-8 bg-white/[0.02] border border-white/[0.05] rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          PREDICTION TIMELINE
        </h3>
        
        <div className="relative">
          {/* Timeline axis */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
            <span className="font-semibold text-white">NOW</span>
            <span>1W</span>
            <span>2W</span>
            <span>1M</span>
            <span>2M</span>
            <span>3M</span>
            <span>6M</span>
          </div>

          {/* Timeline bar */}
          <div className="h-1 bg-gradient-to-r from-red-500 via-orange-500 via-yellow-500 to-green-500 rounded-full opacity-30" />

          {/* Prediction markers would go here based on market signals */}
          <div className="mt-4 text-center text-xs text-slate-500">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Connect to Market Signals for prediction visualization
          </div>
        </div>
      </div>
    </div>
  );
}
