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
    <div className="flex items-center gap-2 border-b border-slate-800">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onBucketChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeBucket === tab.id
              ? 'text-[#E1463E] border-[#E1463E]'
              : 'text-text-secondary border-transparent hover:text-text-primary'
          }`}
        >
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  );
}
