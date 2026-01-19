/**
 * Search Top Bar
 * 
 * Features:
 * - Search input with autosuggest
 * - Mode toggle (Fast/Standard/Deep)
 * - Buttons: Search, Save Search, Export
 * - Link paste detection
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Zap, Gauge, Layers, Save, Download, Link as LinkIcon, Loader2, Settings } from 'lucide-react';
import type { SearchMode } from '../../types/search';

interface SearchTopBarProps {
  query: string;
  mode: SearchMode;
  onQueryChange: (query: string) => void;
  onModeChange: (mode: SearchMode) => void;
  onSearch: (query: string) => void;
  onLinkPaste: (url: string) => void;
  onSaveSearch: () => void;
  onOpenFilters?: () => void;
}

export default function SearchTopBar({
  query,
  mode,
  onQueryChange,
  onModeChange,
  onSearch,
  onLinkPaste,
  onSaveSearch,
  onOpenFilters,
}: SearchTopBarProps) {
  const [isPastingLink, setIsPastingLink] = useState(false);
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const urlDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (urlDetectionTimeoutRef.current) {
        clearTimeout(urlDetectionTimeoutRef.current);
      }
    };
  }, []);

  // Robust URL regex pattern
  const URL_REGEX = /^https?:\/\/.+/i;

  // Check if text is a valid URL
  const isValidUrl = (text: string): boolean => {
    if (!text || typeof text !== 'string') return false;
    
    // First check with regex for performance
    if (!URL_REGEX.test(text.trim())) return false;
    
    // Then validate with URL constructor for accuracy
    try {
      const url = new URL(text.trim());
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Detect URL paste
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text').trim();
    
    if (isValidUrl(pastedText)) {
      e.preventDefault();
      setIsPastingLink(true);
      setIsProcessingUrl(true);
      
      // Clear input immediately
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      
      // Trigger link paste
      onLinkPaste(pastedText);
      
      // Reset state after processing (will be reset by parent when done)
      setTimeout(() => {
        setIsPastingLink(false);
        setIsProcessingUrl(false);
      }, 3000);
    }
  }, [onLinkPaste]);

  // Handle input change - detect URL with debouncing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    
    // Clear previous timeout
    if (urlDetectionTimeoutRef.current) {
      clearTimeout(urlDetectionTimeoutRef.current);
    }
    
    // Check if input is a URL (with slight delay to avoid false positives while typing)
    urlDetectionTimeoutRef.current = setTimeout(() => {
      if (isValidUrl(value)) {
        setIsPastingLink(true);
        setIsProcessingUrl(true);
        onLinkPaste(value);
        
        // Reset state after processing
        setTimeout(() => {
          setIsPastingLink(false);
          setIsProcessingUrl(false);
        }, 3000);
        return;
      }
    }, 500); // 500ms debounce for URL detection

    // Always update query for normal typing
    onQueryChange(value);
  }, [onQueryChange, onLinkPaste]);

  // Handle submit
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  }, [query, onSearch]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onPaste={handlePaste}
            placeholder={isPastingLink ? "Processing link..." : "Search events, actors, sectors, risks... or paste a URL"}
            className="w-full pl-12 pr-32 py-3 bg-background-glass-subtle border border-borders-subtle rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-[#E1463E]/50 focus:bg-background-glass-medium transition-all"
          />
          {isPastingLink && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 text-[#E1463E]">
              {isProcessingUrl ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LinkIcon className="w-4 h-4" />
              )}
              <span className="text-sm">{isProcessingUrl ? 'Processing...' : 'URL detected'}</span>
            </div>
          )}
        </div>
      </form>

      {/* Mode Toggle and Actions */}
      <div className="flex items-center justify-between">
        {/* Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onModeChange('fast')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === 'fast'
                ? 'bg-[#E1463E]/20 text-[#E1463E] border border-[#E1463E]/50'
                : 'bg-background-glass-subtle text-text-secondary hover:text-text-primary border border-borders-subtle'
            }`}
          >
            <Zap className="w-4 h-4" />
            Fast
          </button>
          <button
            onClick={() => onModeChange('standard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === 'standard'
                ? 'bg-[#E1463E]/20 text-[#E1463E] border border-[#E1463E]/50'
                : 'bg-background-glass-subtle text-text-secondary hover:text-text-primary border border-borders-subtle'
            }`}
          >
            <Gauge className="w-4 h-4" />
            Standard
          </button>
          <button
            onClick={() => onModeChange('deep')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === 'deep'
                ? 'bg-[#E1463E]/20 text-[#E1463E] border border-[#E1463E]/50'
                : 'bg-background-glass-subtle text-text-secondary hover:text-text-primary border border-borders-subtle'
            }`}
          >
            <Layers className="w-4 h-4" />
            Deep
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onOpenFilters && (
            <button
              onClick={onOpenFilters}
              className="flex items-center gap-2 px-4 py-2 bg-background-glass-subtle hover:bg-background-glass-medium border border-borders-subtle rounded-md text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              title="Refine search filters"
            >
              <Settings className="w-4 h-4" />
              Refine
            </button>
          )}
          <button
            onClick={onSaveSearch}
            className="flex items-center gap-2 px-4 py-2 bg-background-glass-subtle hover:bg-background-glass-medium border border-borders-subtle rounded-md text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
