/**
 * VirtualizedGrid Component
 * 
 * Virtual scrolling for grid view - simplified version
 * Falls back to regular rendering for smaller lists
 */

import React, { useMemo } from 'react';
import type { DiscoverItem } from './DiscoverCard';
import DiscoverCard from './DiscoverCard';

interface VirtualizedGridProps {
  items: DiscoverItem[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  loadMore: () => void;
  onSave?: (itemId: string) => Promise<void>;
  onView?: (itemId: string) => void;
  onShare?: (itemId: string, platform: string) => void;
  containerWidth?: number;
  containerHeight?: number;
}

export default function VirtualizedGrid({
  items,
  hasNextPage,
  isFetchingNextPage,
  loadMore,
  onSave,
  onView,
  onShare,
}: VirtualizedGridProps) {
  // For now, render normally with pagination
  // Virtual scrolling can be added later if needed
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr" style={{ gap: '1.75rem' }}>
        {items.map((item, index) => (
          <div key={item.id} data-item-index={index}>
            <DiscoverCard
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
