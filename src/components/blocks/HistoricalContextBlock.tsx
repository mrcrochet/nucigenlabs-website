/**
 * HistoricalContextBlock Component
 * 
 * Displays historical context from Tavily enrichment
 */

import { HistoricalContextBlock as HistoricalContextBlockType } from '../../types/blocks';
import SectionHeader from '../ui/SectionHeader';
import Card from '../ui/Card';
import { History, ExternalLink } from 'lucide-react';

interface HistoricalContextBlockProps {
  block: HistoricalContextBlockType;
  context: {
    historical_context?: string | null;
    similar_events?: Array<{title: string; date: string; relevance: number; url?: string}> | null;
    background_explanation?: string | null;
    validation_notes?: string | null;
  } | null | undefined;
}

export default function HistoricalContextBlock({ block, context }: HistoricalContextBlockProps) {
  if (!context) {
    return null;
  }

  const maxSimilarEvents = block.config?.maxSimilarEvents || 5;
  const showBackground = block.config?.showBackground !== false;
  const showValidation = block.config?.showValidation !== false;

  const similarEvents = context.similar_events?.slice(0, maxSimilarEvents) || [];

  // Don't render if no content
  if (!context.historical_context && similarEvents.length === 0 && !context.background_explanation) {
    return null;
  }

  return (
    <div className="mb-10 pb-10 border-b border-white/[0.02]">
      <SectionHeader title="Historical Context" />
      <div className="space-y-4">
        {context.historical_context && (
          <div>
            <p className="text-sm text-slate-300 font-light leading-relaxed">
              {context.historical_context}
            </p>
          </div>
        )}

        {showBackground && context.background_explanation && (
          <div className="mt-4">
            <div className="text-xs text-slate-600 mb-2 font-light uppercase tracking-wide">
              Background
            </div>
            <p className="text-sm text-slate-400 font-light leading-relaxed">
              {context.background_explanation}
            </p>
          </div>
        )}

        {similarEvents.length > 0 && (
          <div className="mt-6">
            <div className="text-xs text-slate-600 mb-3 font-light uppercase tracking-wide flex items-center gap-2">
              <History className="w-3 h-3" />
              Similar Events
            </div>
            <div className="space-y-3">
              {similarEvents.map((event, index) => (
                <Card key={index} className="p-4 hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white mb-1">
                        {event.title}
                      </h4>
                      <p className="text-xs text-slate-500 font-light">
                        {event.date}
                      </p>
                      {event.relevance && (
                        <div className="mt-2">
                          <span className="text-xs text-slate-600">
                            Relevance: {(event.relevance * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                    {event.url && (
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-white transition-colors"
                        title="Open source"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {showValidation && context.validation_notes && (
          <div className="mt-6 pt-6 border-t border-white/[0.02]">
            <div className="text-xs text-slate-600 mb-2 font-light uppercase tracking-wide">
              Validation Notes
            </div>
            <p className="text-sm text-slate-400 font-light leading-relaxed">
              {context.validation_notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

