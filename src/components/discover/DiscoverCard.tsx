/**
 * DiscoverCard Component
 * 
 * Displays a single discover item (article, topic, trend, insight)
 */

import { useState } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Bookmark, ExternalLink, TrendingUp, Eye, HelpCircle, Clock, Flame } from 'lucide-react';
import SourceIcon from './SourceIcon';

export interface DiscoverItem {
  id: string;
  type: 'article' | 'topic' | 'trend' | 'insight';
  title: string;
  summary: string;
  thumbnail?: string;
  sources: Array<{
    name: string;
    url: string;
    date: string;
  }>;
  category: string;
  tags: string[];
  engagement: {
    views: number;
    saves: number;
    questions: number;
  };
  personalization_score?: number;
  metadata: {
    published_at: string;
    updated_at: string;
    relevance_score: number;
  };
  related_questions?: string[];
}

interface DiscoverCardProps {
  item: DiscoverItem;
  onSave?: (itemId: string) => Promise<void>;
  onView?: (itemId: string) => void;
}

export default function DiscoverCard({ item, onSave, onView }: DiscoverCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaving || !onSave) return;

    setIsSaving(true);
    try {
      await onSave(item.id);
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Error saving item:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClick = () => {
    if (onView) {
      onView(item.id);
    }
  };

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

  return (
    <Card 
      hover 
      onClick={handleClick}
      className="p-6 flex flex-col h-full cursor-pointer transition-all duration-200 overflow-hidden"
    >
      {/* Thumbnail Image (like Perplexity) */}
      {item.thumbnail && (
        <div className="mb-4 -mx-6 -mt-6">
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-48 object-cover"
            onError={(e) => {
              // Hide image if it fails to load
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Header: Category Badge + Type + Trending */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="category">{item.category}</Badge>
          {item.metadata.relevance_score > 85 && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-[#E1463E]/20 border border-[#E1463E]/30 rounded text-xs text-[#E1463E] font-light">
              <Flame className="w-3 h-3" />
              Trending
            </span>
          )}
        </div>
        <span className="text-xs text-slate-600 font-light uppercase tracking-wide">
          {item.type}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-xl font-light text-white mb-3 leading-snug line-clamp-2">
        {item.title}
      </h3>

      {/* Summary */}
      <p className="text-sm text-slate-400 font-light mb-4 flex-grow line-clamp-3">
        {item.summary}
      </p>

      {/* Reading Time */}
      <div className="flex items-center gap-1 text-xs text-slate-600 mb-4">
        <Clock className="w-3 h-3" />
        <span className="font-light">{calculateReadingTime(item.summary)} min read</span>
      </div>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {item.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-white/5 border border-white/5 rounded text-xs text-slate-500 font-light"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Related Questions (like Perplexity) - Clickable */}
      {item.related_questions && item.related_questions.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <HelpCircle className="w-3 h-3" />
            <span className="font-light">Related questions</span>
          </div>
          <div className="space-y-1">
            {item.related_questions.slice(0, 2).map((question, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  // Navigate to research page or open modal with Perplexity answer
                  window.location.href = `/research?q=${encodeURIComponent(question)}`;
                }}
                className="w-full text-left text-xs text-slate-400 font-light pl-5 line-clamp-1 hover:text-[#E1463E] transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sources */}
      {item.sources.length > 0 && (
        <div className="mb-4 space-y-2">
          {item.sources.slice(0, 2).map((source, idx) => (
            <a
              key={idx}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-3 p-2 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 hover:border-white/10 transition-all group"
            >
              <SourceIcon domain={source.url} name={source.name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-400 font-light truncate group-hover:text-slate-300 transition-colors">
                  {source.name}
                </div>
                <div className="text-[10px] text-slate-600 font-light">
                  {formatDate(source.date)}
                </div>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
            </a>
          ))}
        </div>
      )}

      {/* Footer: Engagement + Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-4 text-xs text-slate-600">
          {item.engagement.views > 0 && (
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{item.engagement.views}</span>
            </div>
          )}
          {item.engagement.saves > 0 && (
            <div className="flex items-center gap-1">
              <Bookmark className="w-3 h-3" />
              <span>{item.engagement.saves}</span>
            </div>
          )}
          {item.metadata.relevance_score > 70 && (
            <div className="flex items-center gap-1 text-[#E1463E]">
              <TrendingUp className="w-3 h-3" />
              <span>High relevance</span>
            </div>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || !onSave}
          className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isSaved
              ? 'bg-[#E1463E]/20 text-[#E1463E]'
              : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'
          }`}
          title={isSaved ? 'Saved' : 'Save to library'}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>
    </Card>
  );
}
