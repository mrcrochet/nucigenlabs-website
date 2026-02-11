/**
 * DiscoverHeroCard — Full-width hero card for the top critical Discover item.
 * Horizontal layout (image left, content right) on desktop.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, ExternalLink, TrendingUp, Eye, Clock, AlertCircle, CheckCircle2, AlertTriangle, Brain, Flame } from 'lucide-react';
import Badge from '../ui/Badge';
import SourceIcon from './SourceIcon';
import ShareMenu from './ShareMenu';
import { trackPredictionView } from '../../lib/analytics';
import type { DiscoverItem } from './DiscoverCard';

interface DiscoverHeroCardProps {
  item: DiscoverItem;
  onSave?: (itemId: string) => Promise<void>;
  onView?: (itemId: string) => void;
  onShare?: (itemId: string, platform: string) => void;
}

export default function DiscoverHeroCard({ item, onSave, onView, onShare }: DiscoverHeroCardProps) {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
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
    onView?.(item.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  };

  const readingTime = Math.ceil(item.summary.split(/\s+/).length / 200);

  const consensusConfig = {
    high: { icon: CheckCircle2, color: 'text-green-400', label: 'High consensus', bg: 'bg-green-400/10', border: 'border-green-400/20' },
    fragmented: { icon: AlertTriangle, color: 'text-yellow-400', label: 'Fragmented narrative', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
    disputed: { icon: AlertCircle, color: 'text-red-400', label: 'Disputed views', bg: 'bg-red-400/10', border: 'border-red-400/20' },
  };

  const consensus = item.consensus || (item.sources.length >= 40 ? 'high' : item.sources.length >= 15 ? 'fragmented' : 'disputed');
  const consensusInfo = consensusConfig[consensus];
  const ConsensusIcon = consensusInfo.icon;

  const sourceLabel = item.id.startsWith('perplexity-')
    ? 'Perplexity'
    : (item.sources?.[0]?.name || 'Nucigen');

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer rounded-xl border border-[#E1463E]/30 bg-gradient-to-r from-[#E1463E]/8 to-transparent overflow-hidden transition-all duration-200 hover:border-[#E1463E]/50 hover:bg-[#E1463E]/5"
    >
      <div className="flex flex-col md:flex-row">
        {/* Left: Thumbnail */}
        {item.thumbnail && (
          <div className="md:w-[360px] md:flex-shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50" />
            <img
              src={item.thumbnail}
              alt={item.title}
              loading="eager"
              className="w-full h-56 md:h-full object-cover relative z-10"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            {/* Gradient overlay for text readability on mobile */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-20 md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-[#0a0a0a]/80" />
          </div>
        )}

        {/* Right: Content */}
        <div className="flex-1 p-6 md:p-8 flex flex-col">
          {/* Top badges */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#E1463E]/20 border border-[#E1463E]/40 rounded-full text-xs text-[#E1463E] font-medium">
              <AlertCircle className="w-3 h-3" />
              Market Moving
            </span>
            <Badge variant="category">{item.category}</Badge>
            <span className="text-[10px] text-slate-500 font-light">{sourceLabel}</span>
            {item.metadata.relevance_score > 85 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-[#E1463E]/20 border border-[#E1463E]/30 rounded text-xs text-[#E1463E] font-light">
                <Flame className="w-3 h-3" />
                Trending
              </span>
            )}
          </div>

          {/* Title — larger */}
          <h2 className="text-2xl md:text-3xl font-light text-white mb-3 leading-snug group-hover:text-white/90 transition-colors">
            {item.title}
          </h2>

          {/* Summary — full, no clamp */}
          <p className="text-sm text-slate-400 font-light mb-4 leading-relaxed">
            {item.summary}
          </p>

          {/* Impact block — prominent */}
          {item.impact && (
            <div className="mb-4 p-4 bg-white/5 border-l-3 border-[#E1463E]/60 rounded-r-lg" style={{ borderLeftWidth: 3 }}>
              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">Why it matters</div>
              <div className="text-sm text-white font-light leading-relaxed">{item.impact}</div>
            </div>
          )}

          {/* Meta row: consensus + reading time + date + sources */}
          <div className="flex items-center gap-4 flex-wrap mb-4 text-xs">
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded ${consensusInfo.bg} ${consensusInfo.border} border`}>
              <ConsensusIcon className={`w-3 h-3 ${consensusInfo.color}`} />
              <span className={`font-light ${consensusInfo.color}`}>
                {consensusInfo.label} ({item.sources.length} sources)
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-600">
              <Clock className="w-3 h-3" />
              <span className="font-light">{readingTime} min read</span>
            </div>
            {item.metadata.published_at && (
              <span className="text-slate-600 font-light">
                {formatDate(item.metadata.published_at)}
              </span>
            )}
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {item.tags.slice(0, 5).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-white/5 border border-white/5 rounded text-xs text-slate-500 font-light"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Sources row (first 3) */}
          {item.sources.length > 0 && (
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {item.sources.slice(0, 3).map((source, idx) => (
                <a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 px-2 py-1.5 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 transition-all text-xs"
                >
                  <SourceIcon domain={source.url} name={source.name} size="sm" />
                  <span className="text-slate-400 font-light">{source.name}</span>
                  <ExternalLink className="w-3 h-3 text-slate-600" />
                </a>
              ))}
            </div>
          )}

          {/* Footer: Engagement + Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
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
              {(item.type === 'topic' || item.type === 'trend') && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.id) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    trackPredictionView(item.id, { source: 'discover_hero', item_type: item.type });
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
                onShare={(platform) => onShare?.(item.id, platform)}
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
        </div>
      </div>
    </div>
  );
}
