/**
 * EvidenceSourcesPanel
 * 
 * List sources:
 * - source name + URL + published_at
 * - excerpt (80-140 chars)
 * - CTA: open
 */

import { ExternalLink, Calendar } from 'lucide-react';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import type { Event } from '../../types/intelligence';

interface EvidenceSourcesPanelProps {
  event: Event;
}

export default function EvidenceSourcesPanel({ event }: EvidenceSourcesPanelProps) {
  const sources = event.sources || [];

  if (sources.length === 0) {
    return (
      <Card>
        <SectionHeader title="Evidence Sources" />
        <div className="mt-4 text-sm text-text-secondary">
          No sources available
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader title="Evidence Sources" />
      
      <div className="mt-4 space-y-4">
        {sources.map((source, index) => (
          <div
            key={index}
            className="p-4 bg-background-glass-subtle rounded-lg border border-borders-subtle hover:bg-background-glass-medium transition-colors"
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-text-primary mb-1">
                  {source.name || 'Unknown Source'}
                </h4>
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-red hover:text-primary-redHover flex items-center gap-1"
                  >
                    <span className="truncate">{source.url}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                )}
              </div>
            </div>

            {/* Excerpt placeholder (would come from source data) */}
            <p className="text-xs text-text-tertiary line-clamp-2 mt-2">
              Source excerpt would appear here (80-140 characters)...
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
