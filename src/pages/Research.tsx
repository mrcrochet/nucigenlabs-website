/**
 * Research Page - Minimalist centered search design with animated background
 * 
 * Design: Centered layout with large search bar
 * Background: Scrolling news cards (AnimatedEventsBackground)
 * Focus: Search any event, entity, sector, or paste a link
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { Search, Loader2, BookOpen } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AppShell from '../components/layout/AppShell';
import AnimatedEventsBackground from '../components/search/AnimatedEventsBackground';

function ResearchContent() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isLoaded: authLoaded } = useClerkAuth();
  
  const isFullyLoaded = userLoaded && authLoaded;
  const navigate = useNavigate();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    setSearchError('');

    try {
      // Check if it's a URL
      const isUrl = /^https?:\/\//.test(searchQuery.trim());
      
      if (isUrl) {
        // Handle URL analysis
        navigate(`/search?url=${encodeURIComponent(searchQuery.trim())}`);
        return;
      }

      // Handle text search
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } catch (err: any) {
      console.error('Search error:', err);
      setSearchError(err.message || 'Failed to search');
    } finally {
      setIsSearching(false);
    }
  };

  if (!isFullyLoaded) {
    return (
      <AppShell>
        <div className="col-span-1 sm:col-span-12 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-slate-500 font-light">Loading...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] relative overflow-hidden">
      <SEO 
        title="Research — Nucigen"
        description="Search any event, entity, sector — Nucigen will map exposure"
      />
      
      {/* Animated Events Background - Must be first to be behind everything */}
      <AnimatedEventsBackground />
      
      {/* Overlay to ensure content is visible */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/80 via-[#0A0A0A]/60 to-[#0A0A0A]/80 z-10 pointer-events-none"></div>
      
      {/* Centered Search Content */}
      <div className="relative z-20 flex items-center justify-center min-h-screen pointer-events-none">
        <div className="w-full max-w-3xl px-4 pointer-events-auto relative z-30">
          {/* Main Title - Nucigen */}
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-serif text-white mb-6 text-center tracking-tight" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
            Nucigen
          </h1>

          {/* First Tagline */}
          <div className="flex items-center justify-center gap-2 mb-12 text-white text-lg sm:text-xl font-light" style={{ textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}>
            <BookOpen className="w-5 h-5 text-[#E1463E]" />
            <span>Search any event, entity, sector — Nucigen will map exposure</span>
          </div>

          {/* Large Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <div className="flex items-center bg-white/[0.2] backdrop-blur-md border border-white/[0.2] rounded-full overflow-hidden shadow-2xl">
                <Search className="absolute left-4 w-5 h-5 text-slate-300 pointer-events-none z-10" />
                <input
                  type="text"
                  placeholder="Search any event, entity, sector, or paste a link"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim() && !isSearching) {
                      handleSearch();
                    }
                  }}
                  disabled={isSearching}
                  className="flex-1 pl-12 pr-28 py-4 sm:py-5 bg-transparent text-white placeholder-slate-300 focus:outline-none font-light text-base sm:text-lg disabled:opacity-50"
                />
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isSearching}
                  className="absolute right-2 px-8 py-4 sm:py-5 bg-[#F0C4B4] hover:bg-[#E8B5A0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-base sm:text-lg transition-all flex items-center gap-2 whitespace-nowrap rounded-full shadow-lg"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    'Search'
                  )}
                </button>
              </div>
            </div>

            {/* Search error */}
            {searchError && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg backdrop-blur-sm">
                <p className="text-red-300 text-sm font-light text-center">{searchError}</p>
              </div>
            )}
          </div>

          {/* Second Tagline */}
          <p className="text-sm sm:text-base text-slate-300 font-light text-center max-w-2xl mx-auto" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
            Nucigen maps exposure to real-world pressure — not predictions
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Research() {
  return (
    <ProtectedRoute>
      <ResearchContent />
    </ProtectedRoute>
  );
}
