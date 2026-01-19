/**
 * Search Within Results
 * 
 * Inline search bar to filter displayed results by text content
 */

import { useState, useMemo, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import type { SearchResult } from '../../types/search';

interface SearchWithinResultsProps {
  results: SearchResult[];
  onFilteredResultsChange: (filtered: SearchResult[]) => void;
  placeholder?: string;
}

export default function SearchWithinResults({
  results,
  onSearchQueryChange,
  placeholder = "Search within results...",
  currentQuery = '',
}: SearchWithinResultsProps) {
  const [searchQuery, setSearchQuery] = useState(currentQuery);

  // Filter results based on search query
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return results;
    }

    const query = searchQuery.toLowerCase().trim();
    return results.filter((result) => {
      // Search in title
      if (result.title.toLowerCase().includes(query)) {
        return true;
      }
      // Search in summary
      if (result.summary.toLowerCase().includes(query)) {
        return true;
      }
      // Search in source
      if (result.source.toLowerCase().includes(query)) {
        return true;
      }
      // Search in tags
      if (result.tags.some(tag => tag.toLowerCase().includes(query))) {
        return true;
      }
      // Search in entities
      if (result.entities.some(entity => entity.name.toLowerCase().includes(query))) {
        return true;
      }
      // Search in content if available
      if (result.content?.toLowerCase().includes(query)) {
        return true;
      }
      return false;
    });
  }, [results, searchQuery]);

  // Notify parent of query change
  useMemo(() => {
    onSearchQueryChange(searchQuery);
  }, [searchQuery, onSearchQueryChange]);

  const handleClear = useCallback(() => {
    setSearchQuery('');
  }, []);

  const hasResults = filteredResults.length > 0;
  const hasQuery = searchQuery.trim().length > 0;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 text-sm bg-background-glass-subtle border border-borders-subtle rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary/50 focus:bg-background-glass-medium transition-all"
        />
        {hasQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-text-tertiary hover:text-text-primary transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Results count indicator */}
      {hasQuery && (
        <div className="mt-2 text-xs text-text-tertiary">
          {hasResults ? (
            <span>
              {filteredResults.length} of {results.length} results match "{searchQuery}"
            </span>
          ) : (
            <span className="text-red-400">
              No results match "{searchQuery}"
            </span>
          )}
        </div>
      )}
    </div>
  );
}
