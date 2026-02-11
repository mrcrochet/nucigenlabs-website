/**
 * DiscoverSearch Component
 *
 * Search bar with autocomplete suggestions dropdown.
 * Similar to Perplexity's search functionality.
 */

import { useState, useCallback, useEffect, useRef, forwardRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Search, X } from 'lucide-react';
import { apiUrl } from '../../lib/api-base';

interface Suggestion {
  text: string;
  category: string | null;
}

interface DiscoverSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  initialQuery?: string;
}

const DiscoverSearch = forwardRef<HTMLInputElement, DiscoverSearchProps>(
  ({ onSearch, placeholder = "Search topics, trends, or ask a question...", debounceMs = 500, initialQuery }, ref) => {
    const [query, setQuery] = useState(initialQuery || '');
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sync internal query when initialQuery changes externally (e.g. globe bridge)
    useEffect(() => {
      if (initialQuery !== undefined && initialQuery !== query) {
        setQuery(initialQuery);
      }
    }, [initialQuery]);

    // Debounced search callback
    const debouncedSearch = useDebouncedCallback(
      (value: string) => {
        onSearch(value.trim());
      },
      debounceMs
    );

    // Debounced suggestions fetch
    const debouncedFetchSuggestions = useDebouncedCallback(
      async (value: string) => {
        if (value.trim().length < 2) {
          setSuggestions([]);
          return;
        }
        try {
          const res = await fetch(apiUrl(`/api/discover/suggestions?q=${encodeURIComponent(value.trim())}`));
          const data = await res.json();
          if (data.success && Array.isArray(data.suggestions)) {
            setSuggestions(data.suggestions);
            setShowSuggestions(data.suggestions.length > 0);
          }
        } catch {
          // silently fail
        }
      },
      300
    );

    // Update search when query changes (debounced)
    useEffect(() => {
      debouncedSearch(query);
      debouncedFetchSuggestions(query);
    }, [query, debouncedSearch, debouncedFetchSuggestions]);

    // Close suggestions on outside click
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setShowSuggestions(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectSuggestion = useCallback((text: string) => {
      setQuery(text);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      debouncedSearch.cancel();
      debouncedFetchSuggestions.cancel();
      onSearch(text.trim());
    }, [onSearch, debouncedSearch, debouncedFetchSuggestions]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      } else if (e.key === 'Enter' && highlightedIndex >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[highlightedIndex].text);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    }, [showSuggestions, suggestions, highlightedIndex, selectSuggestion]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
      e.preventDefault();
      setShowSuggestions(false);
      if (query.trim()) {
        debouncedSearch.cancel();
        debouncedFetchSuggestions.cancel();
        onSearch(query.trim());
      }
    }, [query, onSearch, debouncedSearch, debouncedFetchSuggestions]);

    const handleClear = useCallback(() => {
      setQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      debouncedSearch.cancel();
      debouncedFetchSuggestions.cancel();
      onSearch('');
    }, [onSearch, debouncedSearch, debouncedFetchSuggestions]);

    return (
      <div className="relative w-full max-w-2xl" ref={dropdownRef}>
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              ref={ref}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 font-light focus:outline-none focus:border-[#E1463E]/50 focus:bg-white/10 transition-all"
              autoComplete="off"
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

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectSuggestion(suggestion.text)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                  highlightedIndex === idx
                    ? 'bg-white/10 text-white'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-sm font-light truncate flex-1">{suggestion.text}</span>
                {suggestion.category && (
                  <span className="text-[10px] text-slate-500 font-light shrink-0 uppercase tracking-wider">
                    {suggestion.category}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

DiscoverSearch.displayName = 'DiscoverSearch';

export default DiscoverSearch;
