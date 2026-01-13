/**
 * ImpactFilters - Impact filters
 */

import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';

interface Filters {
  probabilityMin: number;
  magnitudeMin: number;
  timeframe: '' | 'immediate' | 'short' | 'medium' | 'long';
  sector: string;
  region: string;
}

interface ImpactFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export default function ImpactFilters({
  filters,
  onFiltersChange,
}: ImpactFiltersProps) {
  const updateFilter = (key: keyof Filters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Card>
      <SectionHeader title="Filters" />
      
      <div className="mt-4 grid grid-cols-5 gap-4">
        {/* Probability Min */}
        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">
            Probability Min: {filters.probabilityMin}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={filters.probabilityMin}
            onChange={(e) => updateFilter('probabilityMin', Number(e.target.value))}
            className="w-full h-2 bg-background-glass-medium rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Magnitude Min */}
        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">
            Magnitude Min: {filters.magnitudeMin}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={filters.magnitudeMin}
            onChange={(e) => updateFilter('magnitudeMin', Number(e.target.value))}
            className="w-full h-2 bg-background-glass-medium rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Timeframe */}
        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">
            Timeframe
          </label>
          <select
            value={filters.timeframe}
            onChange={(e) => updateFilter('timeframe', e.target.value)}
            className="w-full px-3 py-2 bg-background-glass-subtle border border-borders-subtle rounded-lg text-text-primary text-sm focus:outline-none focus:border-borders-medium"
          >
            <option value="">All Timeframes</option>
            <option value="immediate">Immediate</option>
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
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
      </div>
    </Card>
  );
}
