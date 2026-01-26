/**
 * Events Map View
 * 
 * Geographic visualization of events with:
 * - World map with event clusters
 * - Click region to see events
 * - Color/size based on event intensity
 */

import { useState, useMemo } from 'react';
import type { Event } from '../../types/intelligence';
import { MapPin, ChevronRight, Globe, AlertCircle } from 'lucide-react';

interface EventsMapViewProps {
  events: Event[];
  onEventClick?: (eventId: string) => void;
}

// Region coordinates for map display
const REGION_COORDS: Record<string, { x: number; y: number; name: string }> = {
  'United States': { x: 22, y: 40, name: 'United States' },
  'USA': { x: 22, y: 40, name: 'United States' },
  'North America': { x: 22, y: 40, name: 'North America' },
  'Europe': { x: 48, y: 35, name: 'Europe' },
  'EU': { x: 48, y: 35, name: 'Europe' },
  'Western Europe': { x: 46, y: 35, name: 'Western Europe' },
  'Eastern Europe': { x: 55, y: 35, name: 'Eastern Europe' },
  'China': { x: 75, y: 42, name: 'China' },
  'Asia': { x: 72, y: 45, name: 'Asia' },
  'Southeast Asia': { x: 77, y: 55, name: 'Southeast Asia' },
  'Japan': { x: 85, y: 40, name: 'Japan' },
  'South Korea': { x: 82, y: 42, name: 'South Korea' },
  'Taiwan': { x: 80, y: 48, name: 'Taiwan' },
  'Middle East': { x: 55, y: 48, name: 'Middle East' },
  'Russia': { x: 65, y: 30, name: 'Russia' },
  'Ukraine': { x: 52, y: 37, name: 'Ukraine' },
  'Africa': { x: 50, y: 60, name: 'Africa' },
  'South America': { x: 30, y: 70, name: 'South America' },
  'Latin America': { x: 28, y: 60, name: 'Latin America' },
  'India': { x: 68, y: 50, name: 'India' },
  'Australia': { x: 82, y: 75, name: 'Australia' },
  'Global': { x: 50, y: 50, name: 'Global' },
};

// Get tier color
const getTierColor = (score: number | undefined) => {
  if (!score) return '#6b7280';
  if (score >= 85) return '#ef4444';
  if (score >= 70) return '#f97316';
  if (score >= 50) return '#eab308';
  return '#3b82f6';
};

export default function EventsMapView({ events, onEventClick }: EventsMapViewProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // Group events by region
  const eventsByRegion = useMemo(() => {
    const groups: Record<string, { events: Event[]; maxScore: number; coords: { x: number; y: number } }> = {};
    
    events.forEach(event => {
      const region = event.region || event.country || 'Global';
      const coords = REGION_COORDS[region] || REGION_COORDS['Global'];
      
      if (!groups[region]) {
        groups[region] = { events: [], maxScore: 0, coords };
      }
      groups[region].events.push(event);
      groups[region].maxScore = Math.max(groups[region].maxScore, event.impact_score || 0);
    });

    return groups;
  }, [events]);

  const regions = Object.entries(eventsByRegion);

  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <Globe className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No events to display</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Map Area */}
      <div className="col-span-8 bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-white">GLOBAL EVENT MAP</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Critical
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500" /> Strategic
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Standard
            </span>
          </div>
        </div>

        {/* SVG Map */}
        <div className="relative h-[450px] bg-[#0a0a0a]">
          <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#1a1a1a" strokeWidth="0.1"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />

            {/* Simplified continents */}
            <ellipse cx="25" cy="42" rx="15" ry="12" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="0.3" />
            <ellipse cx="30" cy="65" rx="8" ry="15" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="0.3" />
            <ellipse cx="50" cy="38" rx="12" ry="8" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="0.3" />
            <ellipse cx="52" cy="58" rx="10" ry="12" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="0.3" />
            <ellipse cx="72" cy="45" rx="18" ry="15" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="0.3" />
            <ellipse cx="82" cy="75" rx="8" ry="6" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="0.3" />

            {/* Region markers */}
            {regions.map(([region, data]) => {
              const isSelected = selectedRegion === region;
              const isHovered = hoveredRegion === region;
              const color = getTierColor(data.maxScore);
              const size = Math.min(2 + (data.events.length * 0.5), 5);
              
              return (
                <g key={region}>
                  {/* Glow effect */}
                  <circle
                    cx={data.coords.x}
                    cy={data.coords.y}
                    r={size * 2}
                    fill={color}
                    opacity={0.15}
                    className="animate-pulse"
                  />
                  {/* Main marker */}
                  <circle
                    cx={data.coords.x}
                    cy={data.coords.y}
                    r={isHovered || isSelected ? size * 1.3 : size}
                    fill={color}
                    opacity={isHovered || isSelected ? 0.9 : 0.7}
                    stroke={color}
                    strokeWidth={isSelected ? 0.5 : 0.2}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredRegion(region)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    onClick={() => setSelectedRegion(region === selectedRegion ? null : region)}
                  />
                  {/* Count badge */}
                  <text
                    x={data.coords.x}
                    y={data.coords.y + 0.5}
                    textAnchor="middle"
                    fontSize="1.5"
                    fill="white"
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    {data.events.length}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover tooltip */}
          {hoveredRegion && !selectedRegion && (
            <div className="absolute top-4 left-4 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span className="font-semibold text-white text-sm">{hoveredRegion}</span>
              </div>
              <div className="text-xs text-slate-400">
                {eventsByRegion[hoveredRegion].events.length} event{eventsByRegion[hoveredRegion].events.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Region Events Panel */}
      <div className="col-span-4 bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-white">
              {selectedRegion ? `EVENTS IN ${selectedRegion.toUpperCase()}` : 'SELECT A REGION'}
            </span>
          </div>
        </div>

        <div className="h-[418px] overflow-y-auto">
          {selectedRegion ? (
            <div className="p-4 space-y-3">
              {eventsByRegion[selectedRegion].events.map(event => {
                const color = getTierColor(event.impact_score);
                
                return (
                  <div
                    key={event.id}
                    onClick={() => onEventClick?.(event.id)}
                    className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-lg hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span 
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <h4 className="text-xs font-medium text-white truncate">
                            {event.headline}
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          {event.why_it_matters?.substring(0, 80)}...
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white flex-shrink-0" />
                    </div>
                    {event.impact_score && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">Impact:</span>
                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${event.impact_score}%`,
                              backgroundColor: color
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400">{event.impact_score}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-4">
              <div className="text-center">
                <MapPin className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Click a region on the map</p>
                <p className="text-xs text-slate-600 mt-1">to view events in that area</p>
              </div>
            </div>
          )}
        </div>

        {/* Region summary */}
        {!selectedRegion && (
          <div className="p-4 border-t border-white/[0.05]">
            <div className="text-xs text-slate-500 mb-2">ACTIVE REGIONS</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {regions
                .sort((a, b) => b[1].maxScore - a[1].maxScore)
                .slice(0, 5)
                .map(([region, data]) => (
                  <div 
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-white/5 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getTierColor(data.maxScore) }}
                      />
                      <span className="text-slate-300">{region}</span>
                    </div>
                    <span className="text-slate-500">{data.events.length}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
