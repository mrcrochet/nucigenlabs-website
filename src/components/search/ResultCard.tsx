/**
 * Result Card
 * 
 * Displays a single search result
 */

import { ExternalLink, TrendingUp, Search } from 'lucide-react';
import type { SearchResult } from '../../types/search';

interface ResultCardProps {
  result: SearchResult;
  onClick: () => void;
  onExploreDeeper: () => void;
}

export default function ResultCard({ result, onClick, onExploreDeeper }: ResultCardProps) {
  return (
    <div
      className="bg-background-glass-subtle border border-borders-subtle rounded-lg p-4 hover:border-borders-medium transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Title */}
        <h3 className="text-base font-semibold text-text-primary line-clamp-2">
          {result.title}
        </h3>

        {/* Summary */}
        <p className="text-sm text-text-secondary line-clamp-2">
          {result.summary}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-text-tertiary">
          <span>{result.source}</span>
          <span>{new Date(result.publishedAt).toLocaleDateString()}</span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {(result.relevanceScore * 100).toFixed(0)}%
          </span>
        </div>

        {/* Tags */}
        {result.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {result.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-background-glass-medium rounded text-xs text-text-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-borders-subtle">
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(result.url, '_blank');
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-background-glass-medium hover:bg-background-glass-subtle rounded text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Open
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExploreDeeper();
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#E1463E]/20 hover:bg-[#E1463E]/30 border border-[#E1463E]/50 rounded text-xs text-[#E1463E] hover:text-[#E1463E] transition-colors"
          >
            <Search className="w-3 h-3" />
            Explore Deeper
          </button>
        </div>
      </div>
    </div>
  );
}
