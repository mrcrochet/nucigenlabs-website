/**
 * VirtualizedGrid Component
 * 
 * Virtual scrolling for grid view using react-window
 * Automatically enables for large lists (>50 items) for better performance
 */

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
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

const ITEM_HEIGHT = 400; // Approximate height of a card
const ITEM_GAP = 28; // Gap between items (1.75rem)
const COLUMNS = { mobile: 1, tablet: 2, desktop: 3 };

export default function VirtualizedGrid({
  items,
  hasNextPage,
  isFetchingNextPage,
  loadMore,
  onSave,
  onView,
  onShare,
  containerWidth = 1200,
  containerHeight = 800,
}: VirtualizedGridProps) {
  const gridRef = useRef<Grid>(null);
  const [columns, setColumns] = useState(COLUMNS.desktop);
  const [itemWidth, setItemWidth] = useState(0);

  // Calculate columns based on container width
  useEffect(() => {
    if (containerWidth < 768) {
      setColumns(COLUMNS.mobile);
    } else if (containerWidth < 1024) {
      setColumns(COLUMNS.tablet);
    } else {
      setColumns(COLUMNS.desktop);
    }
  }, [containerWidth]);

  // Calculate item width based on columns
  useEffect(() => {
    if (columns > 0 && containerWidth > 0) {
      const totalGap = (columns - 1) * ITEM_GAP;
      setItemWidth((containerWidth - totalGap) / columns);
    }
  }, [columns, containerWidth]);

  // Calculate rows needed
  const rowCount = useMemo(() => {
    return Math.ceil(items.length / columns);
  }, [items.length, columns]);

  // Use virtual scrolling for large lists (>50 items), otherwise use regular rendering
  const useVirtualScrolling = items.length > 50;

  // Cell renderer for virtual grid
  const Cell = ({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
    const index = rowIndex * columns + columnIndex;
    if (index >= items.length) {
      return <div style={style} />;
    }

    const item = items[index];
    return (
      <div style={{ ...style, padding: `0 ${ITEM_GAP / 2}px` }}>
        <div data-item-index={index}>
          <DiscoverCard
            item={item}
            onSave={onSave}
            onView={onView}
            onShare={onShare}
          />
        </div>
      </div>
    );
  };

  // Handle scroll to load more
  const handleItemsRendered = useMemo(() => {
    return ({ visibleRowStopIndex }: { visibleRowStopIndex: number }) => {
      // Load more when user scrolls near the end
      if (visibleRowStopIndex >= rowCount - 2 && hasNextPage && !isFetchingNextPage) {
        loadMore();
      }
    };
  }, [rowCount, hasNextPage, isFetchingNextPage, loadMore]);

  if (!useVirtualScrolling) {
    // Fallback to regular rendering for smaller lists
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr" style={{ gap: `${ITEM_GAP}px` }}>
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

  // Virtual scrolling for large lists
  return (
    <>
      <Grid
        ref={gridRef}
        columnCount={columns}
        columnWidth={itemWidth}
        height={containerHeight}
        rowCount={rowCount}
        rowHeight={ITEM_HEIGHT + ITEM_GAP}
        width={containerWidth}
        onItemsRendered={handleItemsRendered}
        style={{ overflowX: 'hidden' }}
      >
        {Cell}
      </Grid>
      {isFetchingNextPage && (
        <div className="mt-8 text-center py-4">
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-light">Loading more...</span>
          </div>
        </div>
      )}
    </>
  );
}
