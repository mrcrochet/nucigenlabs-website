import { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  suggestions?: string[];
}

export default function SearchBar({ 
  placeholder = "Search for events, assets, regions...",
  onSearch,
  suggestions = []
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && onSearch) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-3.5 bg-white/[0.02] border border-white/[0.04] rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-white/[0.08] focus:bg-white/[0.03] transition-all text-base font-light"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-white hover:bg-white/[0.03] rounded-lg transition-all"
          title="AI suggestions"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}

