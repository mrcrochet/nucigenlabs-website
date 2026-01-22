/**
 * MarketCard Component
 * 
 * Displays a single market insight (company stock impact prediction)
 */

import { useState } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Clock, ExternalLink, Lock, ArrowUpRight, ArrowDownRight, ChevronDown } from 'lucide-react';
import type { MarketInsight, MarketFeatureFlags } from '../../types/market';

interface MarketCardProps {
  insight: MarketInsight;
  flags: MarketFeatureFlags;
  onView?: (insightId: string) => void;
}

export default function MarketCard({ insight, flags, onView }: MarketCardProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    if (onView) {
      onView(insight.id);
    }
    if (insight.event?.id) {
      navigate(`/events/${insight.event.id}`);
    }
  };

  const getTimeHorizonLabel = (horizon: string) => {
    switch (horizon) {
      case 'short': return 'Days-Weeks';
      case 'medium': return 'Weeks-Months';
      case 'long': return 'Months-Years';
      default: return horizon;
    }
  };

  const getConfidenceColor = (confidence?: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const isUp = insight.direction === 'up';
  const DirectionIcon = isUp ? TrendingUp : TrendingDown;
  const ArrowIcon = isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <Card
      className="p-4 hover:bg-gray-800/50 transition-all cursor-pointer group"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Company Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
              {insight.company.name}
            </h3>
            <Badge variant="outline" className="text-xs">
              {insight.company.ticker}
            </Badge>
            {insight.company.exchange && (
              <Badge variant="outline" className="text-xs opacity-60">
                {insight.company.exchange}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 mb-3">
            {/* Direction Badge */}
            <Badge
              className={`${
                isUp
                  ? 'bg-green-500/20 text-green-300 border-green-500/30'
                  : 'bg-red-500/20 text-red-300 border-red-500/30'
              } flex items-center gap-1`}
            >
              <DirectionIcon className="w-3 h-3" />
              {isUp ? 'UP' : 'DOWN'}
            </Badge>

            {/* Probability (if visible) */}
            {flags.canViewConfidence && insight.probability !== undefined && (
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                {Math.round(insight.probability * 100)}% likely
              </Badge>
            )}

            {/* Confidence (if visible) */}
            {flags.canViewConfidence && insight.confidence && (
              <Badge className={getConfidenceColor(insight.confidence)}>
                {insight.confidence} confidence
              </Badge>
            )}

            {/* Time Horizon */}
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Clock className="w-3 h-3" />
              {getTimeHorizonLabel(insight.time_horizon)}
            </Badge>
          </div>

          {/* Sector */}
          {insight.company.sector && (
            <Badge variant="outline" className="text-xs mb-3">
              {insight.company.sector}
            </Badge>
          )}

          {/* Thesis */}
          <p className={`text-sm text-gray-300 mb-3 ${!flags.canViewFullThesis ? 'line-clamp-2' : ''}`}>
            {insight.thesis}
            {!flags.canViewFullThesis && (
              <span className="text-blue-400 ml-1">(Upgrade to unlock full thesis)</span>
            )}
          </p>

          {/* Supporting Evidence (if visible and expanded) */}
          {isExpanded && flags.canViewSupportingEvidence && insight.supporting_evidence && insight.supporting_evidence.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <h4 className="text-xs font-semibold text-gray-400 mb-2">Supporting Evidence</h4>
              <div className="space-y-2">
                {insight.supporting_evidence.slice(0, 3).map((evidence, idx) => (
                  <a
                    key={idx}
                    href={evidence.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-start gap-2 text-xs text-blue-300 hover:text-blue-200 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{evidence.source}</div>
                      <div className="text-gray-400 line-clamp-1">{evidence.description}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Event Link */}
          {insight.event && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/events/${insight.event!.id}`);
                }}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                View Event: {insight.event.headline}
                <ArrowIcon className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Expand/Collapse Button */}
        {flags.canViewSupportingEvidence && insight.supporting_evidence && insight.supporting_evidence.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
    </Card>
  );
}
