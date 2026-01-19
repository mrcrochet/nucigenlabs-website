/**
 * Unified Search Bar
 * 
 * Single input field that accepts text, URLs, or questions
 * Auto-detects input type and handles accordingly
 * Mode toggle is optional (icon-based)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Settings, Save, Loader2, Link as LinkIcon } from 'lucide-react';
import type { SearchMode } from '../../types/search';

interface UnifiedSearchBarProps {
  query: string;
  mode: SearchMode;
  onQueryChange: (query: string) => void;
  onModeChange: (mode: SearchMode) => void;
  onSearch: (query: string) => void;
  onLinkPaste: (url: string) => void;
  onSaveSearch: () => void;
  onOpenFilters?: () => void;
  isLoading?: boolean;
}

// Robust URL regex pattern
const URL_REGEX = /^https?:\/\/.+/i;

// Check if text is a valid URL
function isValidUrl(text: string): boolean {
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
}

export default function UnifiedSearchBar({
  query,
  mode,
  onQueryChange,
  onModeChange,
  onSearch,
  onLinkPaste,
  onSaveSearch,
  onOpenFilters,
  isLoading = false,
}: UnifiedSearchBarProps) {
  const [isPastingLink, setIsPastingLink] = useState(false);
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const urlDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (urlDetectionTimeoutRef.current) {
        clearTimeout(urlDetectionTimeoutRef.current);
      }
    };
  }, []);

  // Close mode menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(event.target as Node)) {
        setShowModeMenu(false);
      }
    };

    if (showModeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showModeMenu]);

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
      
      // Reset state after processing
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
    if (query.trim() && !isValidUrl(query)) {
      onSearch(query);
    }
  }, [query, onSearch]);

  // Get mode label
  const getModeLabel = () => {
    switch (mode) {
      case 'fast': return 'Fast';
      case 'standard': return 'Standard';
      case 'deep': return 'Deep';
      default: return 'Standard';
    }
  };

  // Get placeholder based on context
  const getPlaceholder = () => {
    if (isPastingLink) return 'Processing link...';
    if (isLoading) return 'Searching...';
    return 'Search events, actors, sectors, risks... or paste a URL';
  };

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
            placeholder={getPlaceholder()}
            disabled={isLoading}
            className="w-full pl-12 pr-32 py-3 bg-background-glass-subtle border border-borders-subtle rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-[#E1463E]/50 focus:bg-background-glass-medium transition-all disabled:opacity-50"
          />
          
          {/* Right side indicators */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {isPastingLink && (
              <div className="flex items-center gap-2 text-[#E1463E]">
                {isProcessingUrl ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LinkIcon className="w-4 h-4" />
                )}
                <span className="text-sm">{isProcessingUrl ? 'Processing...' : 'URL detected'}</span>
              </div>
            )}
            {isLoading && !isPastingLink && (
              <Loader2 className="w-4 h-4 text-[#E1463E] animate-spin" />
            )}
          </div>
        </div>
      </form>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        {/* Mode Toggle (Optional, icon-based) */}
        <div className="relative" ref={modeMenuRef}>
          <button
            onClick={() => setShowModeMenu(!showModeMenu)}
            className="flex items-center gap-2 px-3 py-1.5 bg-background-glass-subtle hover:bg-background-glass-medium border border-borders-subtle rounded-md text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            title={`Search mode: ${getModeLabel()}`}
          >
            <span className="text-xs">{getModeLabel()}</span>
            <span className="text-text-tertiary">▼</span>
          </button>
          
          {showModeMenu && (
            <div className="absolute top-full left-0 mt-2 bg-background-base border border-borders-subtle rounded-lg shadow-lg z-50 min-w-[120px]">
              <button
                onClick={() => {
                  onModeChange('fast');
                  setShowModeMenu(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  mode === 'fast'
                    ? 'bg-[#E1463E]/20 text-[#E1463E]'
                    : 'text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle'
                }`}
              >
                Fast
              </button>
              <button
                onClick={() => {
                  onModeChange('standard');
                  setShowModeMenu(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  mode === 'standard'
                    ? 'bg-[#E1463E]/20 text-[#E1463E]'
                    : 'text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => {
                  onModeChange('deep');
                  setShowModeMenu(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  mode === 'deep'
                    ? 'bg-[#E1463E]/20 text-[#E1463E]'
                    : 'text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle'
                }`}
              >
                Deep
              </button>
            </div>
          )}
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
