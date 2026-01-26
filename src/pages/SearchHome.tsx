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
import { Search, Loader2, Link as LinkIcon, Map } from 'lucide-react';
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

  // Handle search submission
  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!query.trim()) {
      return;
    }

    setIsProcessing(true);

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchHome.tsx:86',message:'handleSearch entry',data:{query:query.trim(),inputType:isValidUrl(query.trim())?'url':'text',hasUser:!!user,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})}).catch(()=>{});
    // #endregion

    try {
      const requestBody = {
        query: query.trim(),
        inputType: isValidUrl(query.trim()) ? 'url' : 'text',
      };
      const requestHeaders = {
        'Content-Type': 'application/json',
        ...(user?.id && { 'x-clerk-user-id': user.id }),
      };

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchHome.tsx:95',message:'Before fetch',data:{url:'/api/search/session',method:'POST',headers:requestHeaders,body:requestBody},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'})}).catch(()=>{});
      // #endregion

      // Create search session
      let response;
      try {
        response = await fetch('/api/search/session', {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(requestBody),
        });
      } catch (fetchError: any) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchHome.tsx:103',message:'Fetch network error',data:{errorName:fetchError?.name,errorMessage:fetchError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'})}).catch(()=>{});
        // #endregion
        
        // Network error - likely API server not running
        throw new Error('API server is not running. Please start it with: npm run api:server');
      }

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchHome.tsx:110',message:'After fetch',data:{ok:response.ok,status:response.status,statusText:response.statusText,headers:Object.fromEntries(response.headers.entries())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
      // #endregion

      if (!response.ok) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchHome.tsx:115',message:'Response not OK',data:{status:response.status,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D,E'})}).catch(()=>{});
        // #endregion
        
        // Try to get error message from response
        let errorMessage = 'Failed to create search session';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = `${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchHome.tsx:115',message:'Response data parsed',data:{success:data.success,sessionId:data.sessionId,hasSession:!!data.session,error:data.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D,E'})}).catch(()=>{});
      // #endregion
      
      if (data.success && data.sessionId && data.session) {
        // Store session in localStorage (client-side for now)
        localStorage.setItem(`search-session-${data.sessionId}`, JSON.stringify(data.session));
        
        // Navigate to workspace
        navigate(`/search/session/${data.sessionId}`);
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchHome.tsx:123',message:'Invalid response format',data:{success:data.success,sessionId:data.sessionId,hasSession:!!data.session,error:data.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        throw new Error(data.error || 'Failed to create session');
      }
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SearchHome.tsx:128',message:'Error caught',data:{errorName:error?.name,errorMessage:error?.message,errorStack:error?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D'})}).catch(()=>{});
      // #endregion
      console.error('[SearchHome] Error:', error);
      toast.error('Search failed', {
        description: error.message || 'Please try again',
        duration: 5000,
      });
      setIsProcessing(false);
    }
  }, [query, navigate]);

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
    <div className="min-h-screen bg-background-base bg-grain relative overflow-hidden">
      <SEO title="Search | Nucigen Labs" description="Search events, actors, assets, and sources with AI-powered intelligence" />
      
      {/* Animated Events Background - Must be first to be behind everything */}
      <AnimatedEventsBackground />
      
      {/* Navigation Menu */}
      <SearchNavMenu />
      
      {/* Centered Search Bar */}
      <div className="relative z-20 flex items-center justify-center min-h-screen pointer-events-none">
        <div className="w-full max-w-2xl px-4 pointer-events-auto relative z-30">
          {/* Logo */}
          <div className="mb-6 text-center">
            <h1 className="text-3xl sm:text-4xl font-light text-text-primary mb-2">Nucigen</h1>
            <div className="flex items-center justify-center gap-2 text-sm text-text-secondary">
              <Map className="w-4 h-4 text-[#E1463E]" />
              <span>Search any event, entity, sector — Nucigen will map exposure</span>
            </div>
          </div>
          
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onPaste={handlePaste}
                placeholder="Search any event, entity, sector, or paste a link"
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

          {/* Helper text */}
          <p className="mt-3 text-center text-xs text-text-tertiary">
            Nucigen maps exposure to real-world pressure — not predictions
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
