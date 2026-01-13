/**
 * Events Page
 * 
 * UI CONTRACT: Consumes ONLY events (source of truth)
 * Events are normalized, factual events without interpretation
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { 
  getEventsWithCausalChainsSearch, 
  countSearchResults,
  getEventById,
  getEventContext,
  getOfficialDocuments,
  getEventRelationships,
  getHistoricalComparisons,
  getScenarioPredictions,
  type EventWithChain,
  type EventRelationship,
  type HistoricalComparison,
  type ScenarioPrediction,
} from '../lib/supabase';
import { cache, CacheKeys } from '../lib/cache';
import { eventWithChainToEvent } from '../lib/adapters/intelligence-adapters';
import type { Event } from '../types/intelligence';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AppShell from '../components/layout/AppShell';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SectionHeader from '../components/ui/SectionHeader';
import SkeletonCard from '../components/ui/SkeletonCard';
import MetaRow from '../components/ui/MetaRow';
import EventCardExpanded from '../components/EventCardExpanded';
import MarketDataPanel from '../components/market/MarketDataPanel';
import MarketMetricsCompact from '../components/market/MarketMetricsCompact';
import { MapPin, Building2, TrendingUp, Clock, Search, Filter, X, ChevronLeft, ChevronRight, Sparkles, Loader2 } from 'lucide-react';

function EventsContent() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isLoaded: authLoaded } = useClerkAuth();
  
  // Force user to load by accessing auth state
  const isFullyLoaded = userLoaded && authLoaded;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedTimeHorizons, setSelectedTimeHorizons] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [liveSearchQuery, setLiveSearchQuery] = useState('');
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [liveSearchError, setLiveSearchError] = useState('');
  
  // Expansion state
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [expandedEventDetails, setExpandedEventDetails] = useState<EventDetailData | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 5;

  // Debounce search query to avoid too many requests
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch events with server-side search
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const offset = (currentPage - 1) * eventsPerPage;
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Check if filtering by specific event IDs (from signal click)
      const eventIdsParam = searchParams.get('event_ids');
      const eventIds = eventIdsParam ? eventIdsParam.split(',') : undefined;

      // Check cache first
      const cacheKey = CacheKeys.events(user.id, debouncedSearchQuery || 'all');
      const cachedEvents = cache.get<Event[]>(cacheKey);
      
      // Fetch events with search (using debounced query)
      let eventsData: EventWithChain[] | null = null;
      let count = 0;
      
      try {
        [eventsData, count] = await Promise.all([
          getEventsWithCausalChainsSearch({
            searchQuery: debouncedSearchQuery || undefined,
            sectorFilter: selectedSectors.length > 0 ? selectedSectors : undefined,
            regionFilter: selectedRegions.length > 0 ? selectedRegions : undefined,
            eventTypeFilter: selectedEventTypes.length > 0 ? selectedEventTypes : undefined,
            timeHorizonFilter: selectedTimeHorizons.length > 0 ? selectedTimeHorizons : undefined,
            limit: eventsPerPage,
            offset: offset,
          }, user.id),
          countSearchResults({
            searchQuery: debouncedSearchQuery || undefined,
            sectorFilter: selectedSectors.length > 0 ? selectedSectors : undefined,
            regionFilter: selectedRegions.length > 0 ? selectedRegions : undefined,
            eventTypeFilter: selectedEventTypes.length > 0 ? selectedEventTypes : undefined,
            timeHorizonFilter: selectedTimeHorizons.length > 0 ? selectedTimeHorizons : undefined,
          }, user.id),
        ]);
        
        // Convert EventWithChain to Event (UI contract)
        let normalizedEvents = (eventsData || []).map(eventWithChainToEvent);
        
        // Filter by event IDs if provided
        if (eventIds && eventIds.length > 0) {
          normalizedEvents = normalizedEvents.filter(e => eventIds.includes(e.id));
        }
        
        // Cache successful response (3 minutes)
        cache.set(cacheKey, normalizedEvents, 3 * 60 * 1000);
        
        setEvents(normalizedEvents);
        setTotalCount(count);
      } catch (fetchError: any) {
        // Fallback to cache if fetch fails
        if (cachedEvents && cachedEvents.length > 0) {
          console.warn('Fetch failed, using cached data:', fetchError.message);
          setEvents(cachedEvents);
          setTotalCount(cachedEvents.length);
          setError('Showing cached data. Some information may be outdated.');
        } else {
          throw fetchError;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load events');
      setEvents([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery, selectedSectors, selectedRegions, selectedEventTypes, selectedTimeHorizons, currentPage, eventsPerPage, user?.id, isFullyLoaded]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Types for expanded event details
  interface EventDetailData {
    event: any; // EventWithChain from getEventById
    context: any | null;
    documents: any[];
    relationships: EventRelationship[];
    historicalComparisons: HistoricalComparison[];
    scenarios: ScenarioPrediction[];
  }

  // Load all event details for expansion
  const loadEventDetails = async (eventId: string): Promise<EventDetailData> => {
    const [eventData, contextData, documentsData, relationshipsData, historicalData, scenariosData] = await Promise.all([
      getEventById(eventId).catch(() => null),
      getEventContext(eventId).catch(() => null),
      getOfficialDocuments(eventId).catch(() => []),
      getEventRelationships(eventId).catch(() => []),
      getHistoricalComparisons(eventId).catch(() => []),
      getScenarioPredictions(eventId).catch(() => []),
    ]);

    return {
      event: eventData,
      context: contextData,
      documents: documentsData || [],
      relationships: relationshipsData || [],
      historicalComparisons: historicalData || [],
      scenarios: scenariosData || [],
    };
  };

  // Handle event expansion/collapse
  const handleEventExpand = async (eventId: string) => {
    if (expandedEventId === eventId) {
      // Collapse if already expanded
      setExpandedEventId(null);
      setExpandedEventDetails(null);
      return;
    }
    
    setExpandedEventId(eventId);
    setLoadingDetails(eventId);
    
    try {
      const details = await loadEventDetails(eventId);
      setExpandedEventDetails(details);
      
      // Scroll to expanded card after a short delay to allow rendering
      setTimeout(() => {
        const element = document.getElementById(`event-card-${eventId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    } catch (error) {
      console.error('Error loading event details:', error);
      setError('Failed to load event details');
      setExpandedEventId(null);
    } finally {
      setLoadingDetails(null);
    }
  };

  const getTimeHorizonLabel = (horizon: string) => {
    switch (horizon) {
      case 'immediate':
      case 'hours':
        return 'Immediate';
      case 'short':
      case 'days':
        return 'Short-term';
      case 'medium':
      case 'weeks':
        return 'Medium-term';
      case 'long':
        return 'Long-term';
      default:
        return horizon;
    }
  };


  // Extract unique filter options from all available events (for filter dropdowns)
  const filterOptions = useMemo(() => {
    const sectors = new Set<string>();
    const regions = new Set<string>();
    const eventTypes = new Set<string>();
    const timeHorizons = new Set<string>();

    events.forEach(event => {
      if (event.sectors && event.sectors.length > 0) {
        event.sectors.forEach(s => sectors.add(s));
      }
      if (event.region) regions.add(event.region);
      if (event.event_type) eventTypes.add(event.event_type);
      
      // Time horizon from event
      if (event.horizon) {
        timeHorizons.add(event.horizon);
      }
    });

    return {
      sectors: Array.from(sectors).sort(),
      regions: Array.from(regions).sort(),
      eventTypes: Array.from(eventTypes).sort(),
      timeHorizons: Array.from(timeHorizons).sort(),
    };
  }, [events]);

  // Pagination (server-side)
  const totalPages = Math.ceil(totalCount / eventsPerPage);
  const paginatedEvents = events; // Events are already paginated from server

  // Reset to page 1 when filters change (but not on debounced search)
  useEffect(() => {
    if (debouncedSearchQuery === searchQuery) {
      setCurrentPage(1);
    }
  }, [selectedSectors, selectedRegions, selectedEventTypes, selectedTimeHorizons]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSectors([]);
    setSelectedRegions([]);
    setSelectedEventTypes([]);
    setSelectedTimeHorizons([]);
  };

  const hasActiveFilters = searchQuery || 
    selectedSectors.length > 0 || 
    selectedRegions.length > 0 || 
    selectedEventTypes.length > 0 || 
    selectedTimeHorizons.length > 0;

  // Handle live search - Search real-world events and create structured summaries
  const handleLiveSearch = async () => {
    if (!liveSearchQuery.trim() || isSearchingLive) return;

    setIsSearchingLive(true);
    setLiveSearchError('');

    try {
      // Call backend service to search and create event
      // Use Vite proxy in both dev and production
      const apiUrl = '/api/live-search';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: liveSearchQuery.trim() }),
      });

      // Read response body ONCE (can only be read once)
      const contentType = response.headers.get('content-type');
      const text = await response.text();

      // Check if response is ok
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        if (text) {
          try {
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            // If not JSON, use text as error message
            errorMessage = text || errorMessage;
          }
        }
        throw new Error(errorMessage);
      }

      // Check if response has content
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from server. Make sure the API server is running.');
      }

      // Check Content-Type
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Invalid response format. Server returned: ${text.substring(0, 100)}`);
      }

      // Parse JSON response
      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        throw new Error(`Invalid response from server. Please try again.`);
      }

      if (result.success && result.event) {
        // Success! Refresh events list and navigate to the new event
        await fetchEvents();
        navigate(`/events/${result.event.id}`);
        setLiveSearchQuery('');
      } else {
        throw new Error(result.error || 'No event created');
      }
    } catch (error: any) {
      // Detect network errors (server not running)
      const isNetworkError = 
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('NetworkError') ||
        error.message?.includes('Network request failed') ||
        error.name === 'TypeError' ||
        error.code === 'ECONNREFUSED';
      
      let errorMessage = error.message || 'Failed to search live events.';
      
      // Check if it's a 500 error from the server
      if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
        errorMessage = 'Server error: The API server encountered an error. This could be due to missing API keys (OpenAI, Tavily) or a server configuration issue. Please check the server logs.';
      } else if (isNetworkError || errorMessage.includes('API server') || errorMessage.includes('Empty response')) {
        errorMessage = 'Failed to search live events. Please make sure the API server is running. Start it with: npm run api:server';
      }
      
      setLiveSearchError(errorMessage);
    } finally {
      setIsSearchingLive(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="col-span-12">
          <header className="mb-6">
            <SectionHeader
              title="Events"
              subtitle="Structured events with causal chains"
            />
          </header>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="col-span-12 flex items-center justify-center min-h-[400px]">
          <div className="max-w-2xl w-full text-center">
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
            <button
              onClick={() => navigate('/overview')}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-light"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SEO 
        title="Events — Nucigen Labs"
        description="Structured events with causal chains"
      />

      <div className="col-span-12">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-light text-white leading-tight mb-1">
                Events
              </h1>
              <p className="text-sm text-slate-600 font-light">
                {events.length} of {totalCount} event{totalCount !== 1 ? 's' : ''} shown
              </p>
            </div>
          </div>
        </header>
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search events, causes, effects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-white/10 focus:bg-white/[0.03] transition-all font-light"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Live Search - Search Real-World Events */}
            <div className="relative">
              <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              <input
                type="text"
                placeholder="Search real-world events (e.g., 'Fed interest rate cut', 'China trade policy')..."
                value={liveSearchQuery}
                onChange={(e) => setLiveSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && liveSearchQuery.trim() && !isSearchingLive) {
                    handleLiveSearch();
                  }
                }}
                disabled={isSearchingLive}
                className="w-full pl-12 pr-32 py-3 bg-purple-500/5 border border-purple-500/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/40 focus:bg-purple-500/10 transition-all font-light disabled:opacity-50"
              />
              <button
                onClick={handleLiveSearch}
                disabled={!liveSearchQuery.trim() || isSearchingLive}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed border border-purple-500/30 rounded-lg text-purple-300 text-sm font-light transition-all flex items-center gap-2"
              >
                {isSearchingLive ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Search Live</span>
                  </>
                )}
              </button>
            </div>
            {liveSearchError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm font-light mb-2">{liveSearchError}</p>
                {liveSearchError.includes('API server is running') && (
                  <p className="text-red-300/70 text-xs font-light">
                    The API server should run on port 3001. Check the terminal for errors.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.03] transition-all text-sm font-light"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="px-2 py-0.5 bg-[#E1463E]/20 text-[#E1463E] rounded-full text-xs">
                  {[searchQuery, ...selectedSectors, ...selectedRegions, ...selectedEventTypes, ...selectedTimeHorizons].filter(Boolean).length}
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-slate-500 hover:text-white transition-colors font-light"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 space-y-6">
              {/* Sectors */}
              <div>
                <label className="block text-sm font-light text-slate-400 mb-3">Sectors</label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.sectors.map(sector => (
                    <button
                      key={sector}
                      onClick={() => {
                        setSelectedSectors(prev =>
                          prev.includes(sector)
                            ? prev.filter(s => s !== sector)
                            : [...prev, sector]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-light transition-all ${
                        selectedSectors.includes(sector)
                          ? 'bg-[#E1463E]/20 text-[#E1463E] border border-[#E1463E]/30'
                          : 'bg-white/[0.02] text-slate-400 border border-white/[0.05] hover:bg-white/[0.03] hover:text-white'
                      }`}
                    >
                      {sector}
                    </button>
                  ))}
                </div>
              </div>

              {/* Regions */}
              <div>
                <label className="block text-sm font-light text-slate-400 mb-3">Regions</label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.regions.map(region => (
                    <button
                      key={region}
                      onClick={() => {
                        setSelectedRegions(prev =>
                          prev.includes(region)
                            ? prev.filter(r => r !== region)
                            : [...prev, region]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-light transition-all ${
                        selectedRegions.includes(region)
                          ? 'bg-[#E1463E]/20 text-[#E1463E] border border-[#E1463E]/30'
                          : 'bg-white/[0.02] text-slate-400 border border-white/[0.05] hover:bg-white/[0.03] hover:text-white'
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Types */}
              <div>
                <label className="block text-sm font-light text-slate-400 mb-3">Event Types</label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.eventTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedEventTypes(prev =>
                          prev.includes(type)
                            ? prev.filter(t => t !== type)
                            : [...prev, type]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-light transition-all ${
                        selectedEventTypes.includes(type)
                          ? 'bg-[#E1463E]/20 text-[#E1463E] border border-[#E1463E]/30'
                          : 'bg-white/[0.02] text-slate-400 border border-white/[0.05] hover:bg-white/[0.03] hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Horizons */}
              <div>
                <label className="block text-sm font-light text-slate-400 mb-3">Time Horizon</label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.timeHorizons.map(horizon => (
                    <button
                      key={horizon}
                      onClick={() => {
                        setSelectedTimeHorizons(prev =>
                          prev.includes(horizon)
                            ? prev.filter(h => h !== horizon)
                            : [...prev, horizon]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-light transition-all ${
                        selectedTimeHorizons.includes(horizon)
                          ? 'bg-[#E1463E]/20 text-[#E1463E] border border-[#E1463E]/30'
                          : 'bg-white/[0.02] text-slate-400 border border-white/[0.05] hover:bg-white/[0.03] hover:text-white'
                      }`}
                    >
                      {getTimeHorizonLabel(horizon)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {events.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              {hasActiveFilters ? (
                <>
                  <Filter className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg text-white font-light mb-2">No events match your filters</h3>
                  <p className="text-sm text-slate-400 font-light mb-6">
                    Try adjusting your filters or search query to find relevant events.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-light"
                  >
                    Clear All Filters
                  </button>
                </>
              ) : (
                <>
                  <TrendingUp className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg text-white font-light mb-2">No events available yet</h3>
                  <p className="text-sm text-slate-400 font-light mb-6">
                    Events will appear here once they have been processed and causal chains have been generated. Try using live search to find current events.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => {
                        const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                        if (input) {
                          input.focus();
                          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                      className="px-6 py-3 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white rounded-lg transition-colors text-sm font-light flex items-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      Try Live Search
                    </button>
                    <button
                      onClick={() => navigate('/intelligence')}
                      className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-light"
                    >
                      View Signals
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-8">
              {paginatedEvents.map((event) => {
              // Get causal chain from extended Event properties
              const chain = (event as any).causal_chain;
              const isExpanded = expandedEventId === event.id;
              const isLoadingDetails = loadingDetails === event.id;
              const eventDetails = isExpanded ? expandedEventDetails : null;

              return (
                <div key={event.id} id={`event-card-${event.id}`} className="relative">
                <Card
                  hover
                  onClick={() => handleEventExpand(event.id)}
                  className={`p-8 transition-all duration-300 ${isExpanded ? 'border-white/10' : ''}`}
                >
                  {/* Event Header */}
                  <div className="mb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-light text-white mb-3 leading-snug">
                          {event.headline}
                        </h2>
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          {event.sectors && event.sectors.length > 0 && event.sectors.map((sector, idx) => (
                            <Badge key={idx} variant="sector">
                              <Building2 className="w-3 h-3 mr-1.5" />
                              {sector}
                            </Badge>
                          ))}
                          {event.region && (
                            <Badge variant="region">
                              <MapPin className="w-3 h-3 mr-1.5" />
                              {event.region}
                            </Badge>
                          )}
                          {event.event_type && (
                            <Badge variant="level">
                              <TrendingUp className="w-3 h-3 mr-1.5" />
                              {event.event_type}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <MetaRow
                      items={[
                        ...(event.confidence !== null && event.confidence !== undefined ? [{
                          label: 'Confidence',
                          value: typeof event.confidence === 'number' ? event.confidence : (event.confidence * 100),
                          variant: 'confidence' as const,
                        }] : []),
                        ...(event.impact_score !== null && event.impact_score !== undefined ? [{
                          label: 'Impact',
                          value: typeof event.impact_score === 'number' ? event.impact_score : (event.impact_score * 100),
                          variant: 'impact' as const,
                        }] : []),
                      ]}
                    />
                    
                    {/* Compact Market Metrics */}
                    {event.market_data && (
                      <div className="mt-4 pt-4 border-t border-white/[0.02]">
                        <MarketMetricsCompact
                          data={{
                            symbol: event.market_data.symbol || 'N/A',
                            priceChange: event.market_data.change_percent,
                            volatilityChange: 0, // Will be calculated from API
                            volumeChange: 0, // Will be calculated from API
                            timeFrame: '24h',
                            estimatedImpact: event.impact_score && event.impact_score > 70 ? 'high' : event.impact_score && event.impact_score > 50 ? 'medium' : 'low',
                            affectedAssets: event.actors.filter(a => a !== event.market_data?.symbol),
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Market Data Panel */}
                  {event.market_data && (
                    <div className="mb-8 pb-8 border-b border-white/[0.02]">
                      <MarketDataPanel event={event} />
                    </div>
                  )}

                  {/* Why It Matters */}
                  <div className="mb-8 pb-8 border-b border-white/[0.02]">
                    <SectionHeader title="Why It Matters" />
                    <p className="text-base text-slate-300 font-light leading-relaxed">
                      {event.why_it_matters}
                    </p>
                  </div>

                  {/* Causal Chain */}
                  {chain && (
                    <div>
                      <SectionHeader title="Causal Chain" />
                      <div className="space-y-6">
                        {/* Cause */}
                        <div>
                          <div className="text-xs text-slate-600 mb-2 font-light uppercase tracking-wide">
                            Cause
                          </div>
                          <p className="text-base text-white font-light leading-relaxed">
                            {chain.cause}
                          </p>
                        </div>

                        {/* Arrow */}
                        <div className="flex items-center justify-center py-2">
                          <div className="w-px h-8 bg-white/10"></div>
                        </div>

                        {/* First Order Effect */}
                        <div>
                          <div className="text-xs text-slate-600 mb-2 font-light uppercase tracking-wide">
                            First-Order Effect
                          </div>
                          <p className="text-base text-white font-light leading-relaxed">
                            {chain.first_order_effect}
                          </p>
                        </div>

                        {/* Second Order Effect (if present) */}
                        {chain.second_order_effect && (
                          <>
                            <div className="flex items-center justify-center py-2">
                              <div className="w-px h-8 bg-white/10"></div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-600 mb-2 font-light uppercase tracking-wide">
                                Second-Order Effect
                              </div>
                              <p className="text-base text-white font-light leading-relaxed">
                                {chain.second_order_effect}
                              </p>
                            </div>
                          </>
                        )}

                        {/* Metadata */}
                        <div className="pt-6 mt-6 border-t border-white/[0.02]">
                          <MetaRow
                            items={[
                              {
                                label: 'Time horizon',
                                value: getTimeHorizonLabel(chain.time_horizon),
                                icon: Clock,
                              },
                              ...(chain.affected_sectors.length > 0 ? [{
                                label: 'Sectors',
                                value: chain.affected_sectors.join(', '),
                              }] : []),
                              ...(chain.affected_regions.length > 0 ? [{
                                label: 'Regions',
                                value: chain.affected_regions.join(', '),
                              }] : []),
                              {
                                label: 'Chain confidence',
                                value: chain.confidence,
                                variant: 'confidence' as const,
                              },
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Loading state for details */}
                  {isLoadingDetails && (
                    <div className="mt-8 pt-8 border-t border-white/[0.02]">
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                        <span className="ml-3 text-sm text-slate-500 font-light">Loading details...</span>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Expanded content */}
                {isExpanded && eventDetails && !isLoadingDetails && (
                  <div 
                    className="mt-4 overflow-hidden animate-slide-down"
                  >
                    <EventCardExpanded
                      event={event}
                      details={eventDetails}
                      onCollapse={() => handleEventExpand(event.id)}
                      getTimeHorizonLabel={getTimeHorizonLabel}
                    />
                  </div>
                )}
                </div>
              );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-lg text-sm font-light transition-all ${
                            currentPage === page
                              ? 'bg-white/[0.05] text-white border border-white/10'
                              : 'bg-white/[0.02] text-slate-400 border border-white/[0.05] hover:bg-white/[0.03] hover:text-white'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="text-slate-600">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <div className="ml-6 text-sm text-slate-500 font-light">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function Events() {
  return (
    <ProtectedRoute>
      <EventsContent />
    </ProtectedRoute>
  );
}

