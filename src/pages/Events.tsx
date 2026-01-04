/**
 * PHASE 2C: Events Page
 * 
 * Displays nucigen_events with their causal chains in a clean, analyst-grade interface
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getEventsWithCausalChainsSearch, 
  countSearchResults,
  type EventWithChain,
  type CausalChain 
} from '../lib/supabase';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AppSidebar from '../components/AppSidebar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SectionHeader from '../components/ui/SectionHeader';
import MetaRow from '../components/ui/MetaRow';
import { MapPin, Building2, TrendingUp, Clock, Search, Filter, X, ChevronLeft, ChevronRight, Sparkles, Loader2 } from 'lucide-react';

function EventsContent() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventWithChain[]>([]);
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
      
      // Fetch events with search (using debounced query)
      const [eventsData, count] = await Promise.all([
        getEventsWithCausalChainsSearch({
          searchQuery: debouncedSearchQuery || undefined,
          sectorFilter: selectedSectors.length > 0 ? selectedSectors : undefined,
          regionFilter: selectedRegions.length > 0 ? selectedRegions : undefined,
          eventTypeFilter: selectedEventTypes.length > 0 ? selectedEventTypes : undefined,
          timeHorizonFilter: selectedTimeHorizons.length > 0 ? selectedTimeHorizons : undefined,
          limit: eventsPerPage,
          offset: offset,
        }),
        countSearchResults({
          searchQuery: debouncedSearchQuery || undefined,
          sectorFilter: selectedSectors.length > 0 ? selectedSectors : undefined,
          regionFilter: selectedRegions.length > 0 ? selectedRegions : undefined,
          eventTypeFilter: selectedEventTypes.length > 0 ? selectedEventTypes : undefined,
          timeHorizonFilter: selectedTimeHorizons.length > 0 ? selectedTimeHorizons : undefined,
        }),
      ]);
      
      console.log('Events loaded:', eventsData?.length || 0, 'Total:', count);
      setEvents(eventsData || []);
      setTotalCount(count);
    } catch (err: any) {
      console.error('Error loading events:', err);
      setError(err.message || 'Failed to load events');
      setEvents([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery, selectedSectors, selectedRegions, selectedEventTypes, selectedTimeHorizons, currentPage, eventsPerPage]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const getTimeHorizonLabel = (horizon: string) => {
    switch (horizon) {
      case 'hours':
        return 'Hours';
      case 'days':
        return 'Days';
      case 'weeks':
        return 'Weeks';
      default:
        return horizon;
    }
  };


  // Extract unique filter options from all available events (for filter dropdowns)
  // Note: This is a simplified version. In production, you might want to fetch
  // distinct values from the database for better performance
  const filterOptions = useMemo(() => {
    const sectors = new Set<string>();
    const regions = new Set<string>();
    const eventTypes = new Set<string>();
    const timeHorizons = new Set<string>();

    events.forEach(event => {
      if (event.sector) sectors.add(event.sector);
      if (event.region) regions.add(event.region);
      if (event.event_type) eventTypes.add(event.event_type);
      
      const chain = event.nucigen_causal_chains?.[0];
      if (chain) {
        chain.affected_sectors?.forEach(s => sectors.add(s));
        chain.affected_regions?.forEach(r => regions.add(r));
        timeHorizons.add(chain.time_horizon);
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
      // Use full URL in development, proxy in production
      const apiUrl = import.meta.env.DEV 
        ? 'http://localhost:3001/live-search'
        : '/api/live-search';
      
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
        console.error('JSON parse error:', parseError);
        console.error('Response text:', text);
        throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`);
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
      console.error('Live search error:', error);
      setLiveSearchError(error.message || 'Failed to search live events. Please make sure the API server is running (npm run api:server).');
    } finally {
      setIsSearchingLive(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-500 font-light">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
          <button
            onClick={() => navigate('/app')}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-light"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <SEO 
        title="Events — Nucigen Labs"
        description="Structured events with causal chains"
      />

      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <header className="border-b border-white/[0.02] bg-[#0F0F0F]/30 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
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
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-12 w-full">
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
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {liveSearchError}
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
            <p className="text-lg text-slate-500 font-light mb-4">No events with causal chains found.</p>
            <p className="text-sm text-slate-600 font-light">
              Events will appear here once they have been processed and causal chains have been generated.
            </p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-slate-500 font-light mb-4">No events match your filters.</p>
            <button
              onClick={clearFilters}
              className="text-sm text-slate-400 hover:text-white transition-colors font-light"
            >
              Clear filters to see all events
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-8">
              {paginatedEvents.map((event) => {
              // Get first causal chain (should always exist due to filter)
              const chain = event.nucigen_causal_chains && 
                           Array.isArray(event.nucigen_causal_chains) && 
                           event.nucigen_causal_chains.length > 0
                           ? event.nucigen_causal_chains[0]
                           : null;

              // Skip if no chain (shouldn't happen, but safety check)
              if (!chain) {
                return null;
              }

              return (
                <Card
                  key={event.id}
                  hover
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="p-8"
                >
                  {/* Event Header */}
                  <div className="mb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-light text-white mb-3 leading-snug">
                          {event.summary}
                        </h2>
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          {event.sector && (
                            <Badge variant="sector">
                              <Building2 className="w-3 h-3 mr-1.5" />
                              {event.sector}
                            </Badge>
                          )}
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
                        ...(event.confidence !== null ? [{
                          label: 'Confidence',
                          value: event.confidence,
                          variant: 'confidence' as const,
                        }] : []),
                        ...(event.impact_score !== null ? [{
                          label: 'Impact',
                          value: event.impact_score,
                          variant: 'impact' as const,
                        }] : []),
                      ]}
                    />
                  </div>

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
                </Card>
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
        </main>
      </div>
    </div>
  );
}

export default function Events() {
  return (
    <ProtectedRoute>
      <EventsContent />
    </ProtectedRoute>
  );
}

