/**
 * Search Home Page
 * 
 * Simple, focused search entry point
 * Single central field that accepts text, URLs, or questions
 * Auto-detects input type on backend
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Search, Loader2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AnimatedEventsBackground from '../components/search/AnimatedEventsBackground';
import SearchNavMenu from '../components/search/SearchNavMenu';

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

function SearchHomeContent() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUrl, setIsUrl] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const urlDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (urlDetectionTimeoutRef.current) {
        clearTimeout(urlDetectionTimeoutRef.current);
      }
    };
  }, []);

  // Detect URL in input
  useEffect(() => {
    if (urlDetectionTimeoutRef.current) {
      clearTimeout(urlDetectionTimeoutRef.current);
    }

    urlDetectionTimeoutRef.current = setTimeout(() => {
      setIsUrl(isValidUrl(query));
    }, 300);

    return () => {
      if (urlDetectionTimeoutRef.current) {
        clearTimeout(urlDetectionTimeoutRef.current);
      }
    };
  }, [query]);

  // Cmd+K / Ctrl+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle search submission
  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!query.trim()) {
      return;
    }

    setIsProcessing(true);
    setSearchError(null);

    try {
      const requestBody = {
        query: query.trim(),
        inputType: isValidUrl(query.trim()) ? 'url' : 'text',
      };
      const requestHeaders = {
        'Content-Type': 'application/json',
        ...(user?.id && { 'x-clerk-user-id': user.id }),
      };

      const response = await fetch('/api/search/session', {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create search session';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success && data.sessionId && data.session) {
        localStorage.setItem(`search-session-${data.sessionId}`, JSON.stringify(data.session));
        navigate(`/search/session/${data.sessionId}`);
      } else {
        throw new Error(data.error || 'Failed to create session');
      }
    } catch (error: any) {
      console.error('[SearchHome] Error:', error);
      const message = error.message || 'Please try again';
      setSearchError(message);
      toast.error('Search failed', {
        description: message,
        duration: 5000,
      });
      setIsProcessing(false);
    }
  }, [query, navigate, user?.id]);

  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text').trim();
    
    if (isValidUrl(pastedText)) {
      setQuery(pastedText);
      // Auto-submit URL after paste
      setTimeout(() => {
        handleSearch();
      }, 100);
    }
  }, [handleSearch]);

  return (
    <div className="min-h-screen bg-background-base relative overflow-hidden">
      <SEO title="Search | Nucigen Labs" description="Search events, actors, assets, and sources with AI-powered intelligence" />
      
      {/* Navigation Menu */}
      <SearchNavMenu />
      
      {/* Animated Events Background */}
      <AnimatedEventsBackground />
      
      {/* Centered Search Bar */}
      <div className="fixed inset-0 flex items-center justify-center z-20 pointer-events-none">
        <div className="w-full max-w-2xl px-4 pointer-events-auto">
          {/* Logo */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-light text-text-primary">Nucigen</h1>
          </div>
          
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                setQuery(e.target.value);
                if (searchError) setSearchError(null);
              }}
                onPaste={handlePaste}
                placeholder="Search anything, or paste a link"
                disabled={isProcessing}
                className="w-full pl-12 pr-28 py-3 text-base bg-background-glass-subtle/90 backdrop-blur-sm border border-borders-subtle rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-[#E1463E]/50 focus:bg-background-glass-medium transition-all disabled:opacity-50"
              />
              
              {/* Right side indicators */}
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                {isUrl && !isProcessing && (
                  <div className="flex items-center gap-1.5 text-[#E1463E]">
                    <LinkIcon className="w-4 h-4" />
                    <span className="text-xs">URL</span>
                  </div>
                )}
                {isProcessing && (
                  <Loader2 className="w-4 h-4 text-[#E1463E] animate-spin" />
                )}
                {!isProcessing && (
                  <button
                    type="submit"
                    disabled={!query.trim()}
                    className="px-4 py-1.5 bg-[#E1463E] hover:bg-[#E1463E]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Search
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Erreur inline (a11y + visibilité) */}
          {searchError && (
            <p
              role="alert"
              className="mt-3 text-center text-sm text-red-400"
            >
              {searchError}
            </p>
          )}
          {/* Helper text */}
          <p className="mt-3 text-center text-xs text-text-tertiary">
            Search events, actors, sectors, risks, or paste a URL to analyze
            <span className="hidden sm:inline"> · <kbd className="px-1 py-0.5 rounded bg-borders-subtle text-text-tertiary font-mono text-[10px]">⌘K</kbd> focus</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SearchHome() {
  return (
    <ProtectedRoute>
      <SearchHomeContent />
    </ProtectedRoute>
  );
}
