/**
 * GlobeFiltersBar — Horizontal filter controls for Actualité globe events.
 * Region, sector, source type, confidence range.
 */

import { Filter, RotateCcw } from 'lucide-react';

interface EventFilters {
  type: string;
  country: string;
  region: string;
  sector: string;
  source_type: string;
  confidence: [number, number];
  timeRange: '24h' | '7d' | '30d';
}

interface GlobeFiltersBarProps {
  filters: EventFilters;
  onFiltersChange: (filters: EventFilters) => void;
  onReset: () => void;
}

const REGIONS = [
  { value: '', label: 'All regions' },
  { value: 'Europe', label: 'Europe' },
  { value: 'Middle East', label: 'Middle East' },
  { value: 'Asia', label: 'Asia' },
  { value: 'Africa', label: 'Africa' },
  { value: 'North America', label: 'North America' },
  { value: 'South America', label: 'South America' },
  { value: 'Oceania', label: 'Oceania' },
];

const SECTORS = [
  { value: '', label: 'All sectors' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Energy', label: 'Energy' },
  { value: 'Defense', label: 'Defense' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Supply Chain', label: 'Supply Chain' },
];

const SOURCE_TYPES = [
  { value: '', label: 'All sources' },
  { value: 'tavily', label: 'News (Tavily)' },
  { value: 'newsapi_ai', label: 'NewsAPI' },
  { value: 'firecrawl', label: 'Official docs' },
];

export default function GlobeFiltersBar({ filters, onFiltersChange, onReset }: GlobeFiltersBarProps) {
  const hasActiveFilters = filters.region || filters.sector || filters.source_type || filters.confidence[0] > 0 || filters.confidence[1] < 100;

  const updateFilter = <K extends keyof EventFilters>(key: K, value: EventFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
        <Filter className="w-3.5 h-3.5" />
      </div>

      {/* Region */}
      <select
        value={filters.region}
        onChange={(e) => updateFilter('region', e.target.value)}
        className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white font-light focus:outline-none focus:border-white/20 appearance-none cursor-pointer"
      >
        {REGIONS.map((r) => (
          <option key={r.value} value={r.value} className="bg-[#1A1A1A]">{r.label}</option>
        ))}
      </select>

      {/* Sector */}
      <select
        value={filters.sector}
        onChange={(e) => updateFilter('sector', e.target.value)}
        className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white font-light focus:outline-none focus:border-white/20 appearance-none cursor-pointer"
      >
        {SECTORS.map((s) => (
          <option key={s.value} value={s.value} className="bg-[#1A1A1A]">{s.label}</option>
        ))}
      </select>

      {/* Source type */}
      <select
        value={filters.source_type}
        onChange={(e) => updateFilter('source_type', e.target.value)}
        className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white font-light focus:outline-none focus:border-white/20 appearance-none cursor-pointer"
      >
        {SOURCE_TYPES.map((s) => (
          <option key={s.value} value={s.value} className="bg-[#1A1A1A]">{s.label}</option>
        ))}
      </select>

      {/* Confidence min */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <span className="font-light">Conf.</span>
        <input
          type="range"
          min={0}
          max={100}
          step={10}
          value={filters.confidence[0]}
          onChange={(e) => updateFilter('confidence', [Number(e.target.value), filters.confidence[1]])}
          className="w-16 h-1 accent-[#E1463E] cursor-pointer"
        />
        <span className="text-slate-500 font-mono text-[10px] w-6 text-right">{filters.confidence[0]}%</span>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      )}
    </div>
  );
}
