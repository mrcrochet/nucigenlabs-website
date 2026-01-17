/**
 * DiscoverSearch Component
 * 
 * Search bar for discovering specific topics
 * Similar to Perplexity's search functionality
 */

import { useState, useCallback, useEffect, forwardRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Search, X } from 'lucide-react';

interface DiscoverSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

const DiscoverSearch = forwardRef<HTMLInputElement, DiscoverSearchProps>(
  ({ onSearch, placeholder = "Search topics, trends, or ask a question...", debounceMs = 500 }, ref) => {
    const [query, setQuery] = useState('');

    // Debounced search callback
    const debouncedSearch = useDebouncedCallback(
      (value: string) => {
        onSearch(value.trim());
      },
      debounceMs
    );

    // Update search when query changes (debounced)
    useEffect(() => {
      debouncedSearch(query);
    }, [query, debouncedSearch]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
      e.preventDefault();
      // Immediately trigger search on submit (bypass debounce)
      if (query.trim()) {
        debouncedSearch.cancel(); // Cancel pending debounced call
        onSearch(query.trim());
      }
    }, [query, onSearch, debouncedSearch]);

    const handleClear = useCallback(() => {
      setQuery('');
      debouncedSearch.cancel(); // Cancel pending debounced call
      onSearch(''); // Clear immediately
    }, [onSearch, debouncedSearch]);

    return (
      <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            ref={ref}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 font-light focus:outline-none focus:border-[#E1463E]/50 focus:bg-white/10 transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    );
  }
);

DiscoverSearch.displayName = 'DiscoverSearch';

export default DiscoverSearch;
