/**
 * Intelligence Risks Page
 * 
 * Dedicated page for Top Risks analysis
 * Deep dive into warnings and high-certainty risk claims
 */

import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, TrendingUp, Filter, Calendar, Search as SearchIcon, ExternalLink } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import SEO from '../components/SEO';
import ProtectedRoute from '../components/ProtectedRoute';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SectionHeader from '../components/ui/SectionHeader';
import ClaimActions from '../components/intelligence/ClaimActions';
import type { Claim } from '../types/search';

interface LocationState {
  claims?: Claim[];
  query?: string;
}

export default function IntelligenceRisks() {
  return (
    <ProtectedRoute>
      <IntelligenceRisksContent />
    </ProtectedRoute>
  );
}

function IntelligenceRisksContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  
  const [sortBy, setSortBy] = useState<'certainty' | 'timeHorizon' | 'actor'>('certainty');
  const [filterCertainty, setFilterCertainty] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedClaims, setExpandedClaims] = useState<Set<string>>(new Set());
  const [filterEntity, setFilterEntity] = useState<string | null>(null);
  const [filterSector, setFilterSector] = useState<string | null>(null);
  const [filterRegion, setFilterRegion] = useState<string | null>(null);

  // Get claims from location state or empty array
  const allClaims = useMemo(() => {
    if (state?.claims) {
      return state.claims.filter(c => c.type === 'warning' && c.certainty >= 0.6);
    }
    return [];
  }, [state]);

  // Sort and filter claims
  const filteredClaims = useMemo(() => {
    let filtered = allClaims.filter(c => {
      if (c.certainty < filterCertainty) return false;
      if (searchQuery && !c.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterEntity && (!c.entities || !c.entities.includes(filterEntity))) return false;
      if (filterSector && (!c.sectors || !c.sectors.includes(filterSector))) return false;
      if (filterRegion && (!c.regions || !c.regions.includes(filterRegion))) return false;
      return true;
    });
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'certainty':
          return b.certainty - a.certainty;
        case 'timeHorizon':
          const horizonOrder = { immediate: 0, short: 1, medium: 2, long: 3 };
          return horizonOrder[a.timeHorizon] - horizonOrder[b.timeHorizon];
        case 'actor':
          return a.actor.localeCompare(b.actor);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [allClaims, sortBy, filterCertainty, searchQuery, filterEntity, filterSector, filterRegion]);

  const getTimeHorizonLabel = (horizon: Claim['timeHorizon']) => {
    switch (horizon) {
      case 'immediate': return 'Immediate';
      case 'short': return 'Short-term';
      case 'medium': return 'Medium-term';
      case 'long': return 'Long-term';
      default: return horizon;
    }
  };

  const avgCertainty = allClaims.length > 0
    ? allClaims.reduce((sum, c) => sum + c.certainty, 0) / allClaims.length
    : 0;

  return (
    <AppShell>
      <SEO 
        title="Top Risks — Intelligence | Nucigen Labs"
        description="Detailed analysis of high-certainty risk warnings and threats"
      />

      <div className="col-span-1 sm:col-span-12">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <SectionHeader
            title="Top Risks"
            subtitle={`${allClaims.length} high-certainty warnings identified`}
          />
        </div>

        {/* Statistics */}
        {allClaims.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-tertiary font-light mb-1">Total Risks</p>
                  <p className="text-2xl font-semibold text-text-primary">{allClaims.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500 opacity-50" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-tertiary font-light mb-1">Avg Certainty</p>
                  <p className="text-2xl font-semibold text-red-500">{(avgCertainty * 100).toFixed(0)}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-red-500 opacity-50" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-tertiary font-light mb-1">Immediate Risks</p>
                  <p className="text-2xl font-semibold text-text-primary">
                    {allClaims.filter(c => c.timeHorizon === 'immediate').length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-text-secondary opacity-50" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-tertiary font-light mb-1">Unique Actors</p>
                  <p className="text-2xl font-semibold text-text-primary">
                    {new Set(allClaims.map(c => c.actor)).size}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-text-secondary opacity-50" />
              </div>
            </Card>
          </div>
        )}

        {/* Search Bar */}
        <Card className="p-4 mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search claims..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-white/20"
            />
          </div>
        </Card>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-text-secondary" />
              <span className="text-sm text-text-secondary font-light">Filters:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-tertiary">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 bg-white/[0.02] border border-white/[0.08] rounded-lg text-sm text-text-primary focus:outline-none focus:border-white/20"
              >
                <option value="certainty">Certainty</option>
                <option value="timeHorizon">Time Horizon</option>
                <option value="actor">Actor</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-text-tertiary">Min Certainty:</label>
              <input
                type="range"
                min="0"
                max="100"
                value={filterCertainty * 100}
                onChange={(e) => setFilterCertainty(Number(e.target.value) / 100)}
                className="w-24"
              />
              <span className="text-xs text-text-secondary w-12">
                {(filterCertainty * 100).toFixed(0)}%
              </span>
            </div>

            {/* Active Filters */}
            {(filterEntity || filterSector || filterRegion) && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-tertiary">Active:</span>
                {filterEntity && (
                  <button
                    onClick={() => setFilterEntity(null)}
                    className="px-2 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded text-xs hover:bg-red-500/30 transition-colors"
                  >
                    Entity: {filterEntity} ×
                  </button>
                )}
                {filterSector && (
                  <button
                    onClick={() => setFilterSector(null)}
                    className="px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-xs hover:bg-blue-500/30 transition-colors"
                  >
                    Sector: {filterSector} ×
                  </button>
                )}
                {filterRegion && (
                  <button
                    onClick={() => setFilterRegion(null)}
                    className="px-2 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-xs hover:bg-purple-500/30 transition-colors"
                  >
                    Region: {filterRegion} ×
                  </button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Risks List */}
        {filteredClaims.length === 0 ? (
          <Card className="p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-text-tertiary mx-auto mb-4 opacity-50" />
            <h3 className="text-lg text-text-primary font-light mb-2">No risks found</h3>
            <p className="text-sm text-text-secondary font-light">
              {allClaims.length === 0
                ? 'No high-certainty warnings identified in this search.'
                : 'Try adjusting your filters to see more risks.'}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredClaims.map((claim) => {
              const isExpanded = expandedClaims.has(claim.id);
              return (
                <Card 
                  key={claim.id} 
                  id={`claim-${claim.id}`}
                  className="p-6 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-light text-text-primary mb-3 leading-relaxed">
                        {claim.text}
                      </h3>
                      
                      {/* Actions */}
                      <div className="mb-3">
                        <ClaimActions
                          claim={claim}
                          isExpanded={isExpanded}
                          onToggleExpand={() => {
                            const newSet = new Set(expandedClaims);
                            if (newSet.has(claim.id)) {
                              newSet.delete(claim.id);
                            } else {
                              newSet.add(claim.id);
                            }
                            setExpandedClaims(newSet);
                          }}
                          variant="risks"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="critical">
                          {(claim.certainty * 100).toFixed(0)}% certain
                        </Badge>
                        <Badge variant="neutral">
                          {getTimeHorizonLabel(claim.timeHorizon)}
                        </Badge>
                        {claim.actor && claim.actor !== 'implied' && (
                          <button
                            onClick={() => navigate(`/search?q=${encodeURIComponent(claim.actor)}&actor=${encodeURIComponent(claim.actor)}`)}
                            className="px-2 py-1 bg-white/[0.02] border border-white/[0.08] rounded text-xs text-text-secondary hover:text-text-primary hover:bg-white/[0.05] transition-colors"
                          >
                            {claim.actor}
                          </button>
                        )}
                        {claim.sectors && claim.sectors.length > 0 && (
                          <>
                            {claim.sectors.map((sector, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setFilterSector(filterSector === sector ? null : sector);
                                }}
                                className={`px-2 py-1 rounded text-xs border transition-colors ${
                                  filterSector === sector
                                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                    : 'bg-blue-500/10 text-blue-300 border-blue-500/20 hover:bg-blue-500/20'
                                }`}
                              >
                                {sector}
                              </button>
                            ))}
                          </>
                        )}
                        {claim.regions && claim.regions.length > 0 && (
                          <>
                            {claim.regions.map((region, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setFilterRegion(filterRegion === region ? null : region);
                                }}
                                className={`px-2 py-1 rounded text-xs border transition-colors ${
                                  filterRegion === region
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                    : 'bg-purple-500/10 text-purple-300 border-purple-500/20 hover:bg-purple-500/20'
                                }`}
                              >
                                {region}
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <>
                {/* Evidence */}
                {claim.evidence && claim.evidence.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/[0.05]">
                    <p className="text-xs text-text-tertiary font-light mb-2 uppercase tracking-wider">
                      Supporting Evidence
                    </p>
                    <div className="space-y-3">
                      {claim.evidence.map((evidence, idx) => (
                        <div key={idx} className="pl-4 border-l-2 border-red-500/30">
                          <p className="text-sm text-text-secondary font-light italic mb-1">
                            "{typeof evidence === 'string' ? evidence : evidence.text}"
                          </p>
                          {typeof evidence !== 'string' && evidence.type === 'article' && evidence.url && (
                            <a
                              href={evidence.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors mt-1"
                            >
                              <span>{evidence.title || new URL(evidence.url).hostname}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {typeof evidence !== 'string' && evidence.type === 'historical_pattern' && evidence.historicalContext && (
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-xs text-yellow-500 font-light">
                                📜 Historical Pattern:
                              </span>
                              <span className="text-xs text-text-tertiary font-light">
                                {evidence.historicalContext}
                              </span>
                            </div>
                          )}
                          {typeof evidence !== 'string' && evidence.source && (
                            <span className="text-xs text-text-tertiary font-light mt-1 block">
                              {evidence.source}
                              {evidence.publishedAt && ` • ${new Date(evidence.publishedAt).toLocaleDateString()}`}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                      {/* Entities */}
                      {claim.entities && claim.entities.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/[0.05]">
                          <p className="text-xs text-text-tertiary font-light mb-2 uppercase tracking-wider">
                            Related Entities
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {claim.entities.map((entity, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setFilterEntity(filterEntity === entity ? null : entity);
                                  navigate(`/search?q=${encodeURIComponent(entity)}&entity=${encodeURIComponent(entity)}`);
                                }}
                                className={`px-2 py-1 rounded text-xs border transition-colors ${
                                  filterEntity === entity
                                    ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                    : 'bg-white/[0.02] text-text-secondary border-white/[0.08] hover:text-text-primary hover:bg-white/[0.05]'
                                }`}
                              >
                                {entity}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
