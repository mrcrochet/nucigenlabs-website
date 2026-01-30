/**
 * DiscoverCard Component
 * 
 * Displays a single discover item (article, topic, trend, insight)
 */

import { useState } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { useNavigate } from 'react-router-dom';
import { Bookmark, ExternalLink, TrendingUp, Eye, HelpCircle, Clock, Flame, AlertCircle, CheckCircle2, AlertTriangle, Brain } from 'lucide-react';
import SourceIcon from './SourceIcon';
import ShareMenu from './ShareMenu';
import { trackPredictionView } from '../../lib/analytics';

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
  // New fields for elite features
  tier?: 'critical' | 'strategic' | 'background'; // Visual hierarchy
  impact?: string; // "Why it matters" - 1 line max
  consensus?: 'high' | 'fragmented' | 'disputed'; // Consensus signal
}

interface DiscoverCardProps {
  item: DiscoverItem;
  onSave?: (itemId: string) => Promise<void>;
  onView?: (itemId: string) => void;
  onShare?: (itemId: string, platform: string) => void;
  /** When true (e.g. on Library page), bookmark appears filled and click = unsave */
  initialSaved?: boolean;
}

export default function DiscoverCard({ item, onSave, onView, onShare, initialSaved = false }: DiscoverCardProps) {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaving || !onSave) return;

    setIsSaving(true);
    try {
      await onSave(item.id);
      setIsSaved((prev) => !prev);
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

  // Determine tier based on relevance and sources
  const getTier = (): 'critical' | 'strategic' | 'background' => {
    if (item.tier) return item.tier;
    const sourceCount = item.sources.length;
    const relevance = item.metadata.relevance_score || 0;
    
    if (relevance >= 90 && sourceCount >= 30) return 'critical';
    if (relevance >= 70 || sourceCount >= 10) return 'strategic';
    return 'background';
  };

  const tier = getTier();

  // Get type description
  const getTypeDescription = () => {
    const descriptions: Record<string, string> = {
      topic: 'Multi-source event cluster',
      insight: 'Analyst synthesis',
      article: 'Single-source perspective',
      trend: 'Emerging pattern',
    };
    return descriptions[item.type] || item.type;
  };

  // Get consensus indicator
  const getConsensus = () => {
    if (item.consensus) return item.consensus;
    const sourceCount = item.sources.length;
    if (sourceCount >= 40) return 'high';
    if (sourceCount >= 15) return 'fragmented';
    return 'disputed';
  };

  const consensus = getConsensus();

  const consensusConfig = {
    high: { icon: CheckCircle2, color: 'text-green-400', label: 'High consensus', bg: 'bg-green-400/10', border: 'border-green-400/20' },
    fragmented: { icon: AlertTriangle, color: 'text-yellow-400', label: 'Fragmented narrative', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
    disputed: { icon: AlertCircle, color: 'text-red-400', label: 'Disputed views', bg: 'bg-red-400/10', border: 'border-red-400/20' },
  };

  const consensusInfo = consensusConfig[consensus];
  const ConsensusIcon = consensusInfo.icon;

  // Source label: Perplexity (id prefix) or first source name / Nucigen
  const sourceLabel = item.id.startsWith('perplexity-')
    ? 'Perplexity'
    : (item.sources?.[0]?.name || 'Nucigen');

  // Tier-based styling
  const tierClasses = {
    critical: 'border-[#E1463E]/30 bg-[#E1463E]/5',
    strategic: 'border-white/10 bg-white/5',
    background: 'border-white/5 bg-white/[0.02]',
  };

  const tierPadding = {
    critical: 'p-6',
    strategic: 'p-6',
    background: 'p-4',
  };

  return (
    <Card 
      hover 
      onClick={handleClick}
      className={`${tierPadding[tier]} flex flex-col h-full cursor-pointer transition-all duration-200 overflow-hidden border ${tierClasses[tier]}`}
    >
      {/* Thumbnail Image (hide for background tier) */}
      {item.thumbnail && tier !== 'background' && (
        <div className={`mb-4 overflow-hidden rounded-lg ${tier === 'critical' ? '-mx-6 -mt-6' : '-mx-6 -mt-6'} relative`}>
          {/* Placeholder gradient while loading */}
          <div className={`absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 animate-pulse ${tier === 'critical' ? 'h-64' : 'h-48'}`} />
          <img
            src={item.thumbnail}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className={`w-full object-cover relative z-10 ${tier === 'critical' ? 'h-64' : 'h-48'} transition-opacity duration-300`}
            onLoad={(e) => {
              // Fade in when loaded
              (e.target as HTMLImageElement).style.opacity = '1';
            }}
            onError={(e) => {
              // Hide image if it fails to load
              (e.target as HTMLImageElement).style.display = 'none';
            }}
            style={{ opacity: 0 }}
          />
        </div>
      )}

      {/* Tier 1: Critical Badge */}
      {tier === 'critical' && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#E1463E]/20 border border-[#E1463E]/40 rounded-full text-xs text-[#E1463E] font-medium">
            <AlertCircle className="w-3 h-3" />
            Market Moving
          </span>
        </div>
      )}

      {/* Header: Category Badge + Type + Source + Trending */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="category">{item.category}</Badge>
          <span className="text-[10px] text-slate-500 font-light" title="Source">
            {sourceLabel}
          </span>
          {item.metadata.relevance_score > 85 && tier !== 'critical' && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-[#E1463E]/20 border border-[#E1463E]/30 rounded text-xs text-[#E1463E] font-light">
              <Flame className="w-3 h-3" />
              Trending
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-slate-600 font-light uppercase tracking-wide">
            {item.type}
          </span>
          <span className="text-[10px] text-slate-600 font-light italic">
            {getTypeDescription()}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-light text-white mb-3 leading-snug line-clamp-2">
        {item.title}
      </h3>

      {/* Summary */}
      <p className={`text-slate-400 font-light mb-4 flex-grow ${tier === 'background' ? 'text-xs line-clamp-2' : 'text-sm line-clamp-3'}`}>
        {item.summary}
      </p>

      {/* Impact / Why it matters (Elite feature) */}
      {item.impact && (
        <div className="mb-4 p-3 bg-white/5 border-l-2 border-[#E1463E]/50 rounded">
          <div className="text-xs text-slate-500 font-light mb-1">Impact:</div>
          <div className="text-sm text-white font-light">{item.impact}</div>
        </div>
      )}

      {/* Consensus Signal */}
      <div className="mb-4">
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded ${consensusInfo.bg} ${consensusInfo.border} border`}>
          <ConsensusIcon className={`w-3 h-3 ${consensusInfo.color}`} />
          <span className={`text-xs font-light ${consensusInfo.color}`}>
            {consensusInfo.label} ({item.sources.length} sources)
          </span>
        </div>
      </div>

      {/* Reading Time (hide for background tier) */}
      {tier !== 'background' && (
        <div className="flex items-center gap-1 text-xs text-slate-600 mb-4">
          <Clock className="w-3 h-3" />
          <span className="font-light">{calculateReadingTime(item.summary)} min read</span>
        </div>
      )}

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

      {/* Sources Count (like Perplexity) */}
      {item.sources.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-[8px]">📰</span>
            </div>
            <span className="font-light">{item.sources.length} sources</span>
          </div>
          {item.metadata.published_at && (
            <span className="text-xs text-slate-600 font-light">
              • {formatDate(item.metadata.published_at)}
            </span>
          )}
        </div>
      )}

      {/* Sources List (collapsible or in modal) */}
      {item.sources.length > 0 && tier !== 'background' && (
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
        <div className="flex items-center gap-2">
          {/* View Predictions Button (only for topic/event type items) */}
          {(item.type === 'topic' || item.type === 'trend') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                trackPredictionView(item.id, { source: 'discover_card', item_type: item.type });
                navigate(`/events/${item.id}/predictions`);
              }}
              className="p-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 transition-colors"
              title="View scenario predictions"
            >
              <Brain className="w-4 h-4" />
            </button>
          )}
          <ShareMenu
            item={{
              id: item.id,
              title: item.title,
              summary: item.summary,
              url: item.sources[0]?.url,
            }}
            onShare={(platform) => {
              if (onShare) {
                onShare(item.id, platform);
              }
            }}
          />
          <button
            onClick={handleSave}
            disabled={isSaving || !onSave}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isSaved
                ? 'bg-[#E1463E]/20 text-[#E1463E]'
                : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'
            }`}
            title={isSaved ? 'Saved' : 'Track this topic'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </Card>
  );
}
