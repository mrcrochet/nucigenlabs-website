/**
 * Buckets Tabs
 * 
 * Tabs for switching between Events, Actors, Assets, Sources
 */

interface BucketsTabsProps {
  activeBucket: 'events' | 'actors' | 'assets' | 'sources';
  onBucketChange: (bucket: 'events' | 'actors' | 'assets' | 'sources') => void;
  counts: {
    events: number;
    actors: number;
    assets: number;
    sources: number;
  };
}

export default function BucketsTabs({ activeBucket, onBucketChange, counts }: BucketsTabsProps) {
  const tabs = [
    { id: 'events' as const, label: 'Events', count: counts.events },
    { id: 'actors' as const, label: 'Actors', count: counts.actors },
    { id: 'assets' as const, label: 'Assets', count: counts.assets },
    { id: 'sources' as const, label: 'Sources', count: counts.sources },
  ];

  return (
    <div className="flex items-center gap-1 mb-6 border-b border-gray-900">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onBucketChange(tab.id)}
          className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
            activeBucket === tab.id
              ? 'text-red-400 border-red-500'
              : 'text-gray-500 hover:text-gray-400 border-transparent'
          }`}
        >
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  );
}
