/**
 * DiscoverTabs Component
 * 
 * Main navigation tabs: For You, Top, Topics
 */

interface DiscoverTabsProps {
  selected: string;
  onSelect: (tab: string) => void;
}

export default function DiscoverTabs({ selected, onSelect }: DiscoverTabsProps) {
  const tabs = [
    { id: 'for-you', label: 'For You' },
    { id: 'top', label: 'Top' },
    { id: 'topics', label: 'Topics' },
  ];

  return (
    <div className="flex items-center gap-1 border-b border-white/10 pb-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={`px-4 py-2 text-sm font-light transition-colors ${
            selected === tab.id
              ? 'text-white border-b-2 border-[#E1463E]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
