/**
 * EventHeaderBlock Component
 * 
 * Displays the event header with summary, tags, metrics, and actions
 */

import { EventHeaderBlock as EventHeaderBlockType } from '../../types/blocks';
import Badge from '../ui/Badge';
import MetaRow from '../ui/MetaRow';
import { Building2, MapPin, TrendingUp, Clock, MessageSquare } from 'lucide-react';

interface EventHeaderBlockProps {
  block: EventHeaderBlockType;
  event: {
    summary: string;
    sector: string | null;
    region: string | null;
    event_type: string | null;
    confidence: number | null;
    impact_score: number | null;
    created_at: string;
  };
  onFeedbackClick?: () => void;
}

export default function EventHeaderBlock({ block, event, onFeedbackClick }: EventHeaderBlockProps) {
  if (!event) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const metaItems = [];
  
  if (block.config?.showMetrics) {
    if (event.confidence !== null) {
      metaItems.push({
        label: 'Confidence',
        value: event.confidence,
        variant: 'confidence' as const,
      });
    }
    if (event.impact_score !== null) {
      metaItems.push({
        label: 'Impact',
        value: event.impact_score,
        variant: 'impact' as const,
      });
    }
  }
  
  metaItems.push({
    label: 'Published',
    value: formatDate(event.created_at),
  });

  return (
    <div className="mb-10 pb-10 border-b border-white/[0.02]">
      <h2 className="text-2xl font-light text-white mb-6 leading-snug">
        {event.summary}
      </h2>

      {/* Tags */}
      {block.config?.showTags && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {event.sector && (
            <Badge variant="sector">
              <Building2 className="w-3 h-3 mr-1.5" />
              {event.sector}
            </Badge>
          )}
          {event.region && (
            <Badge variant="region">
              <MapPin className="w-3 h-3 mr-1.5" />
              {event.region}
            </Badge>
          )}
          {event.event_type && (
            <Badge variant="level">
              <TrendingUp className="w-3 h-3 mr-1.5" />
              {event.event_type}
            </Badge>
          )}
        </div>
      )}

      {/* Metrics */}
      {block.config?.showMetrics && metaItems.length > 0 && (
        <MetaRow items={metaItems} />
      )}

      {/* Actions */}
      {block.config?.showActions && onFeedbackClick && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={onFeedbackClick}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/[0.02] rounded-lg border border-white/[0.05] transition-all flex items-center gap-2"
            title="Provide feedback to improve this event extraction"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Feedback</span>
          </button>
        </div>
      )}
    </div>
  );
}

