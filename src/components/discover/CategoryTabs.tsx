/**
 * CategoryTabs Component
 * 
 * Horizontal scrolling tabs for category selection
 */

interface CategoryTabsProps {
  selected: string;
  onSelect: (category: string) => void;
  categories: string[];
}

export default function CategoryTabs({ selected, onSelect, categories }: CategoryTabsProps) {
  const categoryLabels: Record<string, string> = {
    all: 'All',
    tech: 'Technology',
    finance: 'Finance',
    geopolitics: 'Geopolitics',
    energy: 'Energy',
    'supply-chain': 'Supply Chain',
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={`px-4 py-2 rounded-lg text-sm font-light whitespace-nowrap transition-all ${
            selected === category
              ? 'bg-[#E1463E]/20 text-[#E1463E] border border-[#E1463E]/30'
              : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 hover:text-white'
          }`}
        >
          {categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1)}
        </button>
      ))}
    </div>
  );
}
