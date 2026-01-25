/**
 * WatchlistButton Component
 * 
 * Button to add/remove entities from watchlist
 * Shows current watch status and toggles on click
 */

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface WatchlistButtonProps {
  entityType: 'company' | 'country' | 'sector' | 'supply-chain' | 'signal' | 'event';
  entityId: string;
  entityName: string;
  entityMetadata?: Record<string, any>;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'icon';
}

export default function WatchlistButton({
  entityType,
  entityId,
  entityName,
  entityMetadata,
  size = 'md',
  variant = 'default',
}: WatchlistButtonProps) {
  const { user } = useUser();
  const [isWatched, setIsWatched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  // Check watchlist status on mount
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    checkWatchlistStatus();
  }, [user?.id, entityType, entityId]);

  const checkWatchlistStatus = async () => {
    try {
      const response = await fetch(
        `/api/watchlists/check?entity_type=${entityType}&entity_id=${encodeURIComponent(entityId)}`,
        {
          headers: {
            'x-clerk-user-id': user?.id || '',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsWatched(data.data?.is_watched || false);
      }
    } catch (error) {
      console.error('Error checking watchlist status:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWatchlist = async () => {
    if (!user?.id) {
      toast.error('Please sign in to add to watchlist');
      return;
    }

    setToggling(true);

    try {
      if (isWatched) {
        // Remove from watchlist
        const response = await fetch(`/api/watchlists?entity_type=${entityType}&entity_id=${encodeURIComponent(entityId)}`, {
          method: 'DELETE',
          headers: {
            'x-clerk-user-id': user.id,
          },
        });

        if (response.ok) {
          setIsWatched(false);
          toast.success(`Removed ${entityName} from watchlist`);
        } else {
          throw new Error('Failed to remove from watchlist');
        }
      } else {
        // Add to watchlist
        const response = await fetch('/api/watchlists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-clerk-user-id': user.id,
          },
          body: JSON.stringify({
            entity_type: entityType,
            entity_id: entityId,
            entity_name: entityName,
            entity_metadata: entityMetadata || {},
          }),
        });

        if (response.ok) {
          setIsWatched(true);
          toast.success(`Added ${entityName} to watchlist`);
        } else {
          const data = await response.json();
          throw new Error(data.error || 'Failed to add to watchlist');
        }
      }
    } catch (error: any) {
      console.error('Error toggling watchlist:', error);
      toast.error(error.message || 'Failed to update watchlist');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 opacity-50 cursor-not-allowed"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
      </button>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleWatchlist}
        disabled={toggling}
        className={`p-2 rounded-lg transition-all ${
          isWatched
            ? 'bg-[#E1463E]/20 text-[#E1463E] hover:bg-[#E1463E]/30'
            : 'bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/[0.05]'
        }`}
        title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
      >
        {toggling ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isWatched ? (
          <Eye className="w-4 h-4" />
        ) : (
          <EyeOff className="w-4 h-4" />
        )}
      </button>
    );
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <button
      onClick={toggleWatchlist}
      disabled={toggling}
      className={`flex items-center gap-2 ${sizeClasses[size]} rounded-lg transition-all font-light ${
        isWatched
          ? 'bg-[#E1463E]/20 text-[#E1463E] border border-[#E1463E]/30 hover:bg-[#E1463E]/30'
          : variant === 'ghost'
          ? 'bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/[0.05] border border-white/[0.05]'
          : 'bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/[0.05] border border-white/[0.05]'
      } ${toggling ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {toggling ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isWatched ? (
        <>
          <Eye className="w-4 h-4" />
          <span>Watching</span>
        </>
      ) : (
        <>
          <EyeOff className="w-4 h-4" />
          <span>Watch</span>
        </>
      )}
    </button>
  );
}
