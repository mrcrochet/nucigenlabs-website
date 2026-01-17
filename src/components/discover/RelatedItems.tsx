/**
 * RelatedItems Component
 * 
 * Displays related/similar items based on tags, category, and concepts
 */

import { useState, useEffect } from 'react';
import { Sparkles, ExternalLink } from 'lucide-react';
import type { DiscoverItem } from './DiscoverCard';
import DiscoverCard from './DiscoverCard';

interface RelatedItemsProps {
  currentItem: DiscoverItem;
  allItems: DiscoverItem[];
  onItemClick?: (item: DiscoverItem) => void;
  limit?: number;
}

export default function RelatedItems({ 
  currentItem, 
  allItems, 
  onItemClick,
  limit = 3 
}: RelatedItemsProps) {
  const [relatedItems, setRelatedItems] = useState<DiscoverItem[]>([]);

  useEffect(() => {
    // Find related items based on:
    // 1. Shared tags (highest priority)
    // 2. Same category
    // 3. Similar concepts (if available)
    
    const currentTags = new Set(currentItem.tags || []);
    const currentCategory = currentItem.category;
    
    const scoredItems = allItems
      .filter(item => item.id !== currentItem.id)
      .map(item => {
        let score = 0;
        
        // Tag overlap (weight: 10 points per tag)
        const itemTags = new Set(item.tags || []);
        const sharedTags = [...currentTags].filter(tag => itemTags.has(tag));
        score += sharedTags.length * 10;
        
        // Category match (weight: 5 points)
        if (item.category === currentCategory) {
          score += 5;
        }
        
        // Similar relevance score (weight: 1 point per 10 score difference)
        const scoreDiff = Math.abs((item.metadata.relevance_score || 0) - (currentItem.metadata.relevance_score || 0));
        score += Math.max(0, 10 - Math.floor(scoreDiff / 10));
        
        return { item, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ item }) => item);
    
    setRelatedItems(scoredItems);
  }, [currentItem, allItems, limit]);

  if (relatedItems.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 pt-8 border-t border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-slate-400" />
        <h3 className="text-lg font-light text-white">Related Items</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatedItems.map(item => (
          <div key={item.id}>
            <DiscoverCard
              item={item}
              onView={onItemClick ? () => onItemClick(item) : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
