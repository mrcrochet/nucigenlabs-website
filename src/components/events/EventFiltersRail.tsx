/**
 * EventFiltersRail - Left filter panel
 * 
 * Filters:
 * - type
 * - country/region
 * - sector
 * - source_type (newsapi_ai, tavily, twelvedata)
 * - confidence slider
 * - time range
 */

import { Slider } from '../ui/Slider';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';

interface Filters {
  type: string;
  country: string;
  region: string;
  sector: string;
  source_type: string;
  confidence: [number, number];
  timeRange: '24h' | '7d' | '30d';
}

interface EventFiltersRailProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export default function EventFiltersRail({
  filters,
  onFiltersChange,
}: EventFiltersRailProps) {
  const updateFilter = (key: keyof Filters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Card>
      <SectionHeader title="Filters" />
      
      <div className="mt-4 space-y-6">
        {/* Event Type */}
        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">
            Event Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => updateFilter('type', e.target.value)}
            className="w-full px-3 py-2 bg-background-glass-subtle border border-borders-subtle rounded-lg text-text-primary text-sm focus:outline-none focus:border-borders-medium"
          >
            <option value="">All Types</option>
            <option value="Geopolitical">Geopolitical</option>
            <option value="SupplyChain">Supply Chain</option>
            <option value="Regulatory">Regulatory</option>
            <option value="Security">Security</option>
            <option value="Market">Market</option>
            <option value="Industrial">Industrial</option>
          </select>
        </div>

        {/* Region */}
        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">
            Region
          </label>
          <select
            value={filters.region}
            onChange={(e) => updateFilter('region', e.target.value)}
            className="w-full px-3 py-2 bg-background-glass-subtle border border-borders-subtle rounded-lg text-text-primary text-sm focus:outline-none focus:border-borders-medium"
          >
            <option value="">All Regions</option>
            <option value="North America">North America</option>
            <option value="Europe">Europe</option>
            <option value="Asia">Asia</option>
            <option value="Middle East">Middle East</option>
            <option value="Africa">Africa</option>
            <option value="South America">South America</option>
          </select>
        </div>

        {/* Sector */}
        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">
            Sector
          </label>
          <select
            value={filters.sector}
            onChange={(e) => updateFilter('sector', e.target.value)}
            className="w-full px-3 py-2 bg-background-glass-subtle border border-borders-subtle rounded-lg text-text-primary text-sm focus:outline-none focus:border-borders-medium"
          >
            <option value="">All Sectors</option>
            <option value="Energy">Energy</option>
            <option value="Technology">Technology</option>
            <option value="Finance">Finance</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Commodities">Commodities</option>
            <option value="Logistics">Logistics</option>
          </select>
        </div>

        {/* Source Type */}
        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">
            Source Type
          </label>
          <select
            value={filters.source_type}
            onChange={(e) => updateFilter('source_type', e.target.value)}
            className="w-full px-3 py-2 bg-background-glass-subtle border border-borders-subtle rounded-lg text-text-primary text-sm focus:outline-none focus:border-borders-medium"
          >
            <option value="">All Sources</option>
            <option value="newsapi_ai">NewsAPI.ai</option>
            <option value="tavily">Tavily</option>
            <option value="twelvedata">Twelve Data</option>
            <option value="firecrawl">Firecrawl</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        {/* Confidence Slider */}
        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">
            Confidence: {filters.confidence[0]}% - {filters.confidence[1]}%
          </label>
          <Slider
            value={filters.confidence}
            onChange={(value) => updateFilter('confidence', value)}
            min={0}
            max={100}
            step={5}
          />
        </div>

        {/* Time Range */}
        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">
            Time Range
          </label>
          <div className="flex gap-2">
            {(['24h', '7d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => updateFilter('timeRange', range)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                  filters.timeRange === range
                    ? 'bg-primary-red text-text-primary'
                    : 'bg-background-glass-subtle text-text-secondary hover:bg-background-glass-medium'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
