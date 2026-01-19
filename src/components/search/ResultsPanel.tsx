/**
 * Results Panel
 * 
 * Displays search results with buckets (Events, Actors, Assets, Sources)
 */

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import BucketsTabs from './BucketsTabs';
import ResultCard from './ResultCard';
import type { SearchResult, SearchBuckets } from '../../types/search';

interface ResultsPanelProps {
  results: SearchResult[];
  buckets: SearchBuckets;
  isLoading: boolean;
  onResultClick: (resultId: string) => void;
  onExploreDeeper: (resultId: string) => void;
}

export default function ResultsPanel({
  results,
  buckets,
  isLoading,
  onResultClick,
  onExploreDeeper,
}: ResultsPanelProps) {
  const [activeBucket, setActiveBucket] = useState<'events' | 'actors' | 'assets' | 'sources'>('events');

  const getActiveResults = () => {
    switch (activeBucket) {
      case 'events':
        return buckets.events;
      case 'actors':
        return [];
      case 'assets':
        return [];
      case 'sources':
        return [];
      default:
        return results;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#E1463E] animate-spin" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">No results found. Try a different query.</p>
      </div>
    );
  }

  const activeResults = getActiveResults();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          {results.length} {results.length === 1 ? 'result' : 'results'}
        </h2>
      </div>

      {/* Buckets Tabs */}
      <BucketsTabs
        activeBucket={activeBucket}
        onBucketChange={setActiveBucket}
        counts={{
          events: buckets.events.length,
          actors: buckets.actors.length,
          assets: buckets.assets.length,
          sources: buckets.sources.length,
        }}
      />

      {/* Results List */}
      <div className="space-y-3">
        {activeResults.length === 0 ? (
          <p className="text-text-secondary text-center py-8">No items in this bucket.</p>
        ) : (
          activeResults.map((result) => (
            <ResultCard
              key={result.id}
              result={result}
              onClick={() => onResultClick(result.id)}
              onExploreDeeper={() => onExploreDeeper(result.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
