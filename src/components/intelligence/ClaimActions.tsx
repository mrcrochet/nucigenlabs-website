/**
 * ClaimActions Component
 * Reusable action buttons for claims (Bookmark, Share, Create Alert, Expand/Collapse)
 * Bookmark state is persisted via GET/POST/DELETE /api/intelligence/claims/saved|save
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Share2, Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '../../lib/api-base';
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
  const { user } = useUser();
  const navigate = useNavigate();
  const [savedClaimIds, setSavedClaimIds] = useState<string[]>([]);
  const isBookmarked = savedClaimIds.includes(claim.id);

  useEffect(() => {
    if (!user?.id) {
      setSavedClaimIds([]);
      return;
    }
    let cancelled = false;
    const url = apiUrl(`/api/intelligence/claims/saved?userId=${encodeURIComponent(user.id)}`);
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.success) return;
        setSavedClaimIds(Array.isArray(data.claimIds) ? data.claimIds : []);
      })
      .catch(() => { if (!cancelled) setSavedClaimIds([]); });
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleBookmark = useCallback(async () => {
    if (!user?.id) {
      toast.info('Connectez-vous pour enregistrer.');
      return;
    }
    const base = apiUrl('/api/intelligence/claims/save');
    const nextBookmarked = !isBookmarked;
    try {
      if (nextBookmarked) {
        const res = await fetch(base, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, claimId: claim.id, variant }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to save');
        setSavedClaimIds((prev) => (prev.includes(claim.id) ? prev : [...prev, claim.id]));
        toast.success('Added to watchlist');
      } else {
        const res = await fetch(`${base}?userId=${encodeURIComponent(user.id)}&claimId=${encodeURIComponent(claim.id)}`, { method: 'DELETE' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to remove');
        setSavedClaimIds((prev) => prev.filter((id) => id !== claim.id));
        toast.success('Removed from watchlist');
      }
    } catch (e: any) {
      toast.error(e?.message || (nextBookmarked ? 'Failed to save' : 'Failed to remove'));
    }
  }, [user?.id, claim.id, variant, isBookmarked]);

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
