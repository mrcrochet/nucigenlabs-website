/**
 * SignalFilters - Left filter panel
 * 
 * Filters:
 * - Theme
 * - Sector
 * - Region
 * - Strength min
 * - Confidence min
 * - Time window
 */

import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import { Slider } from '../ui/Slider';

interface Filters {
  theme: string;
  sector: string;
  region: string;
  strengthMin: number;
  confidenceMin: number;
  timeWindow: '24h' | '7d' | '30d';
}

interface SignalFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export default function SignalFilters({
  filters,
  onFiltersChange,
}: SignalFiltersProps) {
  const updateFilter = (key: keyof Filters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Card>
      <SectionHeader title="Filters" />
      
      <div className="mt-4 space-y-6">
        {/* Theme */}
        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">
            Theme
          </label>
          <select
            value={filters.theme}
            onChange={(e) => updateFilter('theme', e.target.value)}
            className="w-full px-3 py-2 bg-background-glass-subtle border border-borders-subtle rounded-lg text-text-primary text-sm focus:outline-none focus:border-borders-medium"
          >
            <option value="">All Themes</option>
            <option value="Geopolitical">Geopolitical</option>
            <option value="Economic">Economic</option>
            <option value="Supply Chain">Supply Chain</option>
            <option value="Regulatory">Regulatory</option>
            <option value="Security">Security</option>
            <option value="Market">Market</option>
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

        {/* Strength Min */}
        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">
            Strength Min: {filters.strengthMin}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={filters.strengthMin}
            onChange={(e) => updateFilter('strengthMin', Number(e.target.value))}
            className="w-full h-2 bg-background-glass-medium rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Confidence Min */}
        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">
            Confidence Min: {filters.confidenceMin}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={filters.confidenceMin}
            onChange={(e) => updateFilter('confidenceMin', Number(e.target.value))}
            className="w-full h-2 bg-background-glass-medium rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Time Window */}
        <div>
          <label className="text-sm font-medium text-text-secondary mb-2 block">
            Time Window
          </label>
          <div className="flex gap-2">
            {(['24h', '7d', '30d'] as const).map((window) => (
              <button
                key={window}
                onClick={() => updateFilter('timeWindow', window)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                  filters.timeWindow === window
                    ? 'bg-primary-red text-text-primary'
                    : 'bg-background-glass-subtle text-text-secondary hover:bg-background-glass-medium'
                }`}
              >
                {window}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
