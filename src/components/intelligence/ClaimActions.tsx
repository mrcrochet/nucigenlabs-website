/**
 * ClaimActions Component
 * 
 * Reusable action buttons for claims (Bookmark, Share, Create Alert, Expand/Collapse)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Share2, Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import type { Claim } from '../../types/search';

interface ClaimActionsProps {
  claim: Claim;
  isExpanded: boolean;
  onToggleExpand: () => void;
  variant?: 'risks' | 'predictions' | 'implications';
}

export default function ClaimActions({
  claim,
  isExpanded,
  onToggleExpand,
  variant = 'risks',
}: ClaimActionsProps) {
  const navigate = useNavigate();
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? 'Removed from watchlist' : 'Added to watchlist');
    // TODO: Save to backend/database
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}#claim-${claim.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const handleCreateAlert = () => {
    // Navigate to alerts page with claim pre-filled
    const claimText = encodeURIComponent(claim.text);
    navigate(`/alerts?claim=${claimText}&type=${variant}`);
  };

  const getBookmarkClasses = () => {
    if (isBookmarked) {
      switch (variant) {
        case 'risks':
          return 'bg-red-500/20 text-red-500';
        case 'predictions':
          return 'bg-blue-500/20 text-blue-500';
        case 'implications':
          return 'bg-purple-500/20 text-purple-500';
        default:
          return 'bg-red-500/20 text-red-500';
      }
    }
    return 'bg-white/[0.02] text-text-secondary hover:text-text-primary hover:bg-white/[0.05]';
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={handleBookmark}
        className={`p-2 rounded-lg transition-colors ${getBookmarkClasses()}`}
        title={isBookmarked ? 'Remove from watchlist' : 'Add to watchlist'}
      >
        <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
      </button>

      <button
        onClick={handleShare}
        className="p-2 rounded-lg bg-white/[0.02] text-text-secondary hover:text-text-primary hover:bg-white/[0.05] transition-colors"
        title="Share claim"
      >
        <Share2 className="w-4 h-4" />
      </button>

      <button
        onClick={handleCreateAlert}
        className="p-2 rounded-lg bg-white/[0.02] text-text-secondary hover:text-text-primary hover:bg-white/[0.05] transition-colors"
        title="Create alert for this claim"
      >
        <Bell className="w-4 h-4" />
      </button>

      <button
        onClick={onToggleExpand}
        className="p-2 rounded-lg bg-white/[0.02] text-text-secondary hover:text-text-primary hover:bg-white/[0.05] transition-colors"
        title={isExpanded ? 'Collapse details' : 'Expand details'}
      >
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
