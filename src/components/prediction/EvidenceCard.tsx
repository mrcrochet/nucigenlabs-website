/**
 * Evidence Card Component
 * 
 * Displays a single evidence item (article or historical pattern)
 * with clickable link and relevance explanation
 */

import { ExternalLink, FileText, History, BarChart3 } from 'lucide-react';
import type { EvidenceItem } from '../../types/prediction';

interface EvidenceCardProps {
  evidence: EvidenceItem;
  index?: number;
}

export default function EvidenceCard({ evidence, index }: EvidenceCardProps) {
  const getIcon = () => {
    switch (evidence.type) {
      case 'article':
        return <FileText className="w-4 h-4" />;
      case 'historical_pattern':
        return <History className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = () => {
    switch (evidence.type) {
      case 'article':
        return 'Article';
      case 'historical_pattern':
        return 'Historical Pattern';
      default:
        return 'Source';
    }
  };

  const getTypeColor = () => {
    switch (evidence.type) {
      case 'article':
        return 'text-blue-400';
      case 'historical_pattern':
        return 'text-amber-400';
      default:
        return 'text-text-secondary';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return null;
    }
  };

  const isClickable = evidence.url && evidence.url !== 'Not confirmed by available sources.';

  return (
    <div className="group">
      {isClickable ? (
        <a
          href={evidence.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 bg-white/[0.02] border border-white/[0.08] rounded-lg hover:bg-white/[0.05] hover:border-white/[0.15] transition-all duration-200"
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`flex-shrink-0 mt-0.5 ${getTypeColor()}`}>
              {getIcon()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
              {/* Type badge */}
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-light uppercase tracking-wider ${getTypeColor()}`}>
                  {getTypeLabel()}
                </span>
                {index !== undefined && (
                  <span className="text-xs text-text-tertiary">#{index + 1}</span>
                )}
              </div>

              {/* Title */}
              <h4 className="text-sm font-medium text-text-primary leading-snug group-hover:text-blue-400 transition-colors">
                {evidence.title || 'Untitled'}
              </h4>

              {/* Metadata */}
              <div className="flex items-center gap-3 text-xs text-text-tertiary mt-1">
                {evidence.publisher && (
                  <span>{evidence.publisher}</span>
                )}
                {evidence.date && formatDate(evidence.date) && (
                  <span>• {formatDate(evidence.date)}</span>
                )}
                {evidence.date_range && (
                  <span>• {evidence.date_range}</span>
                )}
              </div>

              {/* Relevance */}
              {evidence.why_relevant && (
                <p className="text-xs text-text-secondary font-light mt-2 leading-relaxed">
                  {evidence.why_relevant}
                </p>
              )}

              {/* Snippet (if available) */}
              {evidence.snippet && (
                <p className="text-xs text-text-tertiary italic mt-2 line-clamp-2">
                  "{evidence.snippet}"
                </p>
              )}

              {/* External link indicator */}
              <div className="flex items-center gap-1 mt-2 text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-3 h-3" />
                <span>Open source</span>
              </div>
            </div>
          </div>
        </a>
      ) : (
        <div className="p-4 bg-white/[0.02] border border-white/[0.08] rounded-lg opacity-60">
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 mt-0.5 ${getTypeColor()}`}>
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-light uppercase tracking-wider text-text-tertiary">
                {getTypeLabel()}
              </span>
              <p className="text-sm text-text-secondary mt-1">
                {evidence.title || 'Not confirmed by available sources.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
