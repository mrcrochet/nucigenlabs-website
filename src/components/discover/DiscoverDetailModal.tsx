/**
 * DiscoverDetailModal Component
 * 
 * Modal showing full details of a discover item
 * Similar to Perplexity's detail view
 */

import { useEffect } from 'react';
import { X, ExternalLink, Bookmark, Clock, TrendingUp, HelpCircle } from 'lucide-react';
import type { DiscoverItem } from './DiscoverCard';
import SourceIcon from './SourceIcon';
import RelatedItems from './RelatedItems';
import ReadingProgress from './ReadingProgress';

interface DiscoverDetailModalProps {
  item: DiscoverItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (itemId: string) => Promise<void>;
  allItems?: DiscoverItem[];
  onItemClick?: (item: DiscoverItem) => void;
  userId?: string;
}

export default function DiscoverDetailModal({
  item,
  isOpen,
  onClose,
  onSave,
  allItems = [],
  onItemClick,
  userId,
}: DiscoverDetailModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  const calculateReadingTime = (text: string) => {
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return minutes;
  };

  const handleSave = async () => {
    if (onSave) {
      try {
        await onSave(item.id);
      } catch (error) {
        console.error('Error saving item:', error);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-white/10 rounded-lg shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Thumbnail Image (if available) */}
        {item.thumbnail && (
          <div className="w-full h-64 overflow-hidden">
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/10">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded text-xs text-slate-400 font-light uppercase">
                {item.type}
              </span>
              {item.metadata.relevance_score > 85 && (
                <span className="flex items-center gap-1 px-2 py-1 bg-[#E1463E]/20 border border-[#E1463E]/30 rounded text-xs text-[#E1463E] font-light">
                  <TrendingUp className="w-3 h-3" />
                  Trending
                </span>
              )}
            </div>
            <h2 className="text-2xl font-light text-white mb-2 leading-tight">
              {item.title}
            </h2>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{calculateReadingTime(item.summary)} min read</span>
              </div>
              <span>•</span>
              <span>{formatDate(item.metadata.published_at)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" data-reading-container>
          {/* Reading Progress */}
          {userId && (
            <ReadingProgress
              itemId={item.id}
              content={item.summary}
              userId={userId}
            />
          )}

          {/* Summary */}
          <div>
            <p className="text-base text-slate-300 font-light leading-relaxed whitespace-pre-wrap">
              {item.summary}
            </p>
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-light text-slate-500 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-white/5 border border-white/10 rounded text-xs text-slate-400 font-light"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related Questions */}
          {item.related_questions && item.related_questions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-light text-slate-500">Related Questions</h3>
              </div>
              <div className="space-y-2">
                {item.related_questions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      window.location.href = `/research?q=${encodeURIComponent(question)}`;
                    }}
                    className="w-full text-left p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 font-light hover:bg-white/10 hover:border-[#E1463E]/30 transition-all"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sources */}
          {item.sources.length > 0 && (
            <div>
              <h3 className="text-sm font-light text-slate-500 mb-3">Sources</h3>
              <div className="space-y-2">
                {item.sources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all group"
                  >
                    <SourceIcon domain={source.url} name={source.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-light truncate group-hover:text-[#E1463E] transition-colors">
                        {source.name}
                      </div>
                      <div className="text-xs text-slate-500 font-light">
                        {formatDate(source.date)}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Related Items */}
          {allItems.length > 0 && (
            <RelatedItems
              currentItem={item}
              allItems={allItems}
              onItemClick={onItemClick}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10 bg-slate-900/50">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {item.engagement.views > 0 && (
              <span>{item.engagement.views} views</span>
            )}
            {item.engagement.saves > 0 && (
              <span>{item.engagement.saves} saves</span>
            )}
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Bookmark className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
}
