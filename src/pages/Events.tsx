/**
 * PHASE 2C: Events Page
 * 
 * Displays nucigen_events with their causal chains in a clean, analyst-grade interface
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEventsWithCausalChains } from '../lib/supabase';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AppSidebar from '../components/AppSidebar';
import { MapPin, Building2, TrendingUp, Clock, Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface CausalChain {
  id: string;
  cause: string;
  first_order_effect: string;
  second_order_effect: string | null;
  affected_sectors: string[];
  affected_regions: string[];
  time_horizon: 'hours' | 'days' | 'weeks';
  confidence: number;
}

interface EventWithChain {
  id: string;
  event_type: string;
  event_subtype: string | null;
  summary: string;
  country: string | null;
  region: string | null;
  sector: string | null;
  actors: string[];
  why_it_matters: string;
  first_order_effect: string | null;
  second_order_effect: string | null;
  impact_score: number | null;
  confidence: number | null;
  created_at: string;
  nucigen_causal_chains: CausalChain[];
}

function EventsContent() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventWithChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedTimeHorizons, setSelectedTimeHorizons] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 5;

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        setError('');
        const data = await getEventsWithCausalChains();
        console.log('Events loaded:', data?.length || 0);
        setEvents(data || []);
      } catch (err: any) {
        console.error('Error loading events:', err);
        setError(err.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500/80';
    if (confidence >= 0.6) return 'text-yellow-500/80';
    return 'text-orange-500/80';
  };

  const getImpactColor = (impact: number) => {
    if (impact >= 0.8) return 'text-red-500/80';
    if (impact >= 0.6) return 'text-orange-500/80';
    return 'text-yellow-500/80';
  };

  // Extract unique filter options
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

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const chain = event.nucigen_causal_chains?.[0];
      
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSummary = event.summary?.toLowerCase().includes(query);
        const matchesWhyItMatters = event.why_it_matters?.toLowerCase().includes(query);
        const matchesCause = chain?.cause?.toLowerCase().includes(query);
        const matchesEffect = chain?.first_order_effect?.toLowerCase().includes(query) ||
                            chain?.second_order_effect?.toLowerCase().includes(query);
        
        if (!matchesSummary && !matchesWhyItMatters && !matchesCause && !matchesEffect) {
          return false;
        }
      }

      // Sector filter
      if (selectedSectors.length > 0) {
        const eventSector = event.sector?.toLowerCase();
        const chainSectors = chain?.affected_sectors?.map(s => s.toLowerCase()) || [];
        const matches = selectedSectors.some(s => 
          eventSector === s.toLowerCase() || chainSectors.includes(s.toLowerCase())
        );
        if (!matches) return false;
      }

      // Region filter
      if (selectedRegions.length > 0) {
        const eventRegion = event.region?.toLowerCase();
        const chainRegions = chain?.affected_regions?.map(r => r.toLowerCase()) || [];
        const matches = selectedRegions.some(r => 
          eventRegion === r.toLowerCase() || chainRegions.includes(r.toLowerCase())
        );
        if (!matches) return false;
      }

      // Event type filter
      if (selectedEventTypes.length > 0) {
        if (!event.event_type || !selectedEventTypes.includes(event.event_type)) {
          return false;
        }
      }

      // Time horizon filter
      if (selectedTimeHorizons.length > 0) {
        if (!chain || !selectedTimeHorizons.includes(chain.time_horizon)) {
          return false;
        }
      }

      return true;
    });
  }, [events, searchQuery, selectedSectors, selectedRegions, selectedEventTypes, selectedTimeHorizons]);

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * eventsPerPage;
    return filteredEvents.slice(startIndex, startIndex + eventsPerPage);
  }, [filteredEvents, currentPage, eventsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSectors, selectedRegions, selectedEventTypes, selectedTimeHorizons]);

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
                  {filteredEvents.length} of {events.length} event{events.length !== 1 ? 's' : ''} shown
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
        ) : filteredEvents.length === 0 ? (
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
                <article
                  key={event.id}
                  className="bg-white/[0.02] rounded-2xl p-8 border border-white/[0.02] hover:bg-white/[0.03] hover:border-white/[0.05] transition-all cursor-pointer"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  {/* Event Header */}
                  <div className="mb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-light text-white mb-3 leading-snug">
                          {event.summary}
                        </h2>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-light">
                          {event.country && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" />
                              <span>{event.country}</span>
                              {event.region && <span>• {event.region}</span>}
                            </div>
                          )}
                          {event.sector && (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-4 h-4" />
                              <span>{event.sector}</span>
                            </div>
                          )}
                          {event.event_type && (
                            <div className="flex items-center gap-1.5">
                              <TrendingUp className="w-4 h-4" />
                              <span>{event.event_type}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        {event.confidence !== null && (
                          <div className="text-right">
                            <div className={`text-sm font-light ${getConfidenceColor(event.confidence)}`}>
                              {(event.confidence * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-slate-600">confidence</div>
                          </div>
                        )}
                        {event.impact_score !== null && (
                          <div className="text-right">
                            <div className={`text-sm font-light ${getImpactColor(event.impact_score)}`}>
                              {(event.impact_score * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-slate-600">impact</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Why It Matters */}
                  <div className="mb-8 pb-8 border-b border-white/[0.02]">
                    <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wide">
                      Why It Matters
                    </h3>
                    <p className="text-base text-slate-300 font-light leading-relaxed">
                      {event.why_it_matters}
                    </p>
                  </div>

                  {/* Causal Chain */}
                  {chain && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-400 mb-6 uppercase tracking-wide">
                        Causal Chain
                      </h3>
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
                          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 font-light">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              <span>Time horizon: {getTimeHorizonLabel(chain.time_horizon)}</span>
                            </div>
                            {chain.affected_sectors.length > 0 && (
                              <div>
                                <span className="text-slate-600">Sectors: </span>
                                <span>{chain.affected_sectors.join(', ')}</span>
                              </div>
                            )}
                            {chain.affected_regions.length > 0 && (
                              <div>
                                <span className="text-slate-600">Regions: </span>
                                <span>{chain.affected_regions.join(', ')}</span>
                              </div>
                            )}
                            <div className="ml-auto">
                              <span className="text-slate-600">Chain confidence: </span>
                              <span className={getConfidenceColor(chain.confidence)}>
                                {(chain.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
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

