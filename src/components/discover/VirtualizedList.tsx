/**
 * VirtualizedList Component
 * 
 * Virtual scrolling for list view - simplified version
 * Falls back to regular rendering for smaller lists
 */

import type { DiscoverItem } from './DiscoverCard';
import DiscoverListCard from './DiscoverListCard';

interface VirtualizedListProps {
  items: DiscoverItem[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  loadMore: () => void;
  onSave?: (itemId: string) => Promise<void>;
  onView?: (itemId: string) => void;
  onShare?: (itemId: string, platform: string) => void;
  containerHeight?: number;
}

export default function VirtualizedList({
  items,
  hasNextPage,
  isFetchingNextPage,
  loadMore,
  onSave,
  onView,
  onShare,
}: VirtualizedListProps) {
  // For now, render normally with pagination
  // Virtual scrolling can be added later if needed
  return (
    <>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id} data-item-index={index}>
            <DiscoverListCard
              item={item}
              onSave={onSave}
              onView={onView}
              onShare={onShare}
            />
          </div>
        ))}
      </div>
      {hasNextPage && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMore}
            disabled={isFetchingNextPage}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </>
  );
}
