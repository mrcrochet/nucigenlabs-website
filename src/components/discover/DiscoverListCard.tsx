/**
 * DiscoverListCard Component
 * 
 * List view version of DiscoverCard - horizontal layout
 */

import { useState } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Bookmark, Eye, Flame, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { DiscoverItem } from './DiscoverCard';
import ShareMenu from './ShareMenu';

interface DiscoverListCardProps {
  item: DiscoverItem;
  onSave?: (itemId: string) => Promise<void>;
  onView?: (itemId: string) => void;
  onShare?: (itemId: string, platform: string) => void;
}

export default function DiscoverListCard({ item, onSave, onView, onShare }: DiscoverListCardProps) {
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

  const getTier = (): 'critical' | 'strategic' | 'background' => {
    if (item.tier) return item.tier;
    const sourceCount = item.sources.length;
    const relevance = item.metadata.relevance_score || 0;
    
    if (relevance >= 90 && sourceCount >= 30) return 'critical';
    if (relevance >= 70 || sourceCount >= 10) return 'strategic';
    return 'background';
  };

  const tier = getTier();

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

  const tierClasses = {
    critical: 'border-[#E1463E]/30 bg-[#E1463E]/5',
    strategic: 'border-white/10 bg-white/5',
    background: 'border-white/5 bg-white/[0.02]',
  };

  return (
    <Card 
      hover 
      onClick={handleClick}
      className={`p-4 border cursor-pointer transition-all duration-200 overflow-hidden ${tierClasses[tier]}`}
    >
      <div className="flex gap-4">
        {/* Thumbnail (smaller in list view) */}
        {item.thumbnail && tier !== 'background' && (
          <div className="flex-shrink-0 w-32 h-24 overflow-hidden rounded-lg bg-white/5">
            <img
              src={item.thumbnail}
              alt={item.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="category">{item.category}</Badge>
              {item.metadata.relevance_score > 85 && tier !== 'critical' && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-[#E1463E]/20 border border-[#E1463E]/30 rounded text-xs text-[#E1463E] font-light">
                  <Flame className="w-3 h-3" />
                  Trending
                </span>
              )}
              {tier === 'critical' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E1463E]/20 border border-[#E1463E]/40 rounded-full text-xs text-[#E1463E] font-medium">
                  <AlertCircle className="w-3 h-3" />
                  Market Moving
                </span>
              )}
            </div>
            <span className="text-xs text-slate-600 font-light uppercase tracking-wide flex-shrink-0">
              {item.type}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-light text-white mb-2 leading-snug line-clamp-2">
            {item.title}
          </h3>

          {/* Summary */}
          <p className="text-sm text-slate-400 font-light mb-3 line-clamp-2">
            {item.summary}
          </p>

          {/* Footer: Meta info */}
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-[8px]">📰</span>
              </div>
              <span className="font-light">{item.sources.length} sources</span>
            </div>
            {item.metadata.published_at && (
              <span className="font-light">
                • {formatDate(item.metadata.published_at)}
              </span>
            )}
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded ${consensusInfo.bg} ${consensusInfo.border} border`}>
              <ConsensusIcon className={`w-3 h-3 ${consensusInfo.color}`} />
              <span className={`font-light ${consensusInfo.color}`}>
                {consensusInfo.label}
              </span>
            </div>
            {item.engagement.views > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{item.engagement.views}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
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
