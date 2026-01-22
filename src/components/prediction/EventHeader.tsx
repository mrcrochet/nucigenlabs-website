/**
 * Event Header Component
 * 
 * Displays event title, location, date, confidence badge
 * Anchors the user immediately
 */

import { MapPin, Clock, Brain, FileText, RefreshCw } from 'lucide-react';
import Badge from '../ui/Badge';

interface EventHeaderProps {
  eventTitle: string;
  eventRegion?: string;
  eventSectors?: string[];
  lastUpdated?: string;
  confidence?: 'high' | 'medium' | 'low';
  sourceCount?: number;
  prediction?: { from_cache?: boolean };
}

export default function EventHeader({
  eventTitle,
  eventRegion,
  eventSectors,
  lastUpdated,
  confidence,
  sourceCount,
  prediction,
}: EventHeaderProps) {
  const getConfidenceBadge = () => {
    if (!confidence) return null;
    
    const variants = {
      high: { variant: 'category' as const, label: 'High Confidence' },
      medium: { variant: 'level' as const, label: 'Medium Confidence' },
      low: { variant: 'neutral' as const, label: 'Low Confidence' },
    };

    const config = variants[confidence];
    return (
      <Badge variant={config.variant}>
        <Brain className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatLastUpdated = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffHours < 1) {
        return `${diffMinutes}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
      }
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Sectors/Topics */}
      {eventSectors && eventSectors.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {eventSectors.map((sector, idx) => (
            <Badge key={idx} variant="sector">
              {sector}
            </Badge>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-light text-text-primary leading-tight">
        {eventTitle}
      </h1>

      {/* Metadata */}
      <div className="flex items-center gap-6 flex-wrap text-sm text-text-secondary">
        {eventRegion && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>Region: {eventRegion}</span>
          </div>
        )}

        {lastUpdated && formatLastUpdated(lastUpdated) && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Last updated: {formatLastUpdated(lastUpdated)}</span>
          </div>
        )}

        {confidence && (
          <div className="flex items-center gap-2">
            {getConfidenceBadge()}
          </div>
        )}

        {sourceCount !== undefined && (
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Based on: {sourceCount} verified sources</span>
          </div>
        )}

        {prediction?.from_cache && (
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span className="text-xs text-text-tertiary">Cached</span>
          </div>
        )}
      </div>
    </div>
  );
}
