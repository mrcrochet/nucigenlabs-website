/**
 * Result Details Drawer
 * 
 * Slide-over drawer showing detailed information about a result
 */

import { X, ExternalLink, BookOpen, Bell, Eye } from 'lucide-react';
import type { SearchResult } from '../../types/search';

interface ResultDetailsDrawerProps {
  result: SearchResult;
  isOpen: boolean;
  onClose: () => void;
  onExploreDeeper: () => void;
}

export default function ResultDetailsDrawer({
  result,
  isOpen,
  onClose,
  onExploreDeeper,
}: ResultDetailsDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-background-base border-l border-borders-subtle shadow-xl overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                {result.title}
              </h2>
              <div className="flex items-center gap-4 text-sm text-text-secondary">
                <span>{result.source}</span>
                <span>{new Date(result.publishedAt).toLocaleDateString()}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-background-glass-subtle rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Summary */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">Summary</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              {result.summary}
            </p>
          </div>

          {/* Entities */}
          {result.entities.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-2">Entities</h3>
              <div className="flex flex-wrap gap-2">
                {result.entities.map((entity, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-background-glass-subtle border border-borders-subtle rounded text-xs text-text-secondary"
                  >
                    {entity.name} ({entity.type})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Facts */}
          {result.content && (
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-2">Content</h3>
              <p className="text-sm text-text-secondary leading-relaxed line-clamp-6">
                {result.content.substring(0, 500)}...
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t border-borders-subtle">
            <button
              onClick={() => window.open(result.url, '_blank')}
              className="flex items-center gap-2 px-4 py-2 bg-background-glass-subtle hover:bg-background-glass-medium border border-borders-subtle rounded-md text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open Original
            </button>
            <button
              onClick={onExploreDeeper}
              className="flex items-center gap-2 px-4 py-2 bg-[#E1463E]/20 hover:bg-[#E1463E]/30 border border-[#E1463E]/50 rounded-md text-sm font-medium text-[#E1463E] hover:text-[#E1463E] transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Explore Deeper
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-background-glass-subtle hover:bg-background-glass-medium border border-borders-subtle rounded-md text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              <Bell className="w-4 h-4" />
              Create Alert
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-background-glass-subtle hover:bg-background-glass-medium border border-borders-subtle rounded-md text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              <Eye className="w-4 h-4" />
              Add to Watchlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
