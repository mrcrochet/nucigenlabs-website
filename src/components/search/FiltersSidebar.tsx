/**
 * Filters Sidebar
 * 
 * Collapsable filters for advanced search
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import type { SearchFilters } from '../../types/search';

interface FiltersSidebarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

export default function FiltersSidebar({ filters, onFiltersChange }: FiltersSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['timeRange']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Filters</h3>
        <button
          onClick={resetFilters}
          className="text-xs text-text-secondary hover:text-text-primary"
        >
          Reset
        </button>
      </div>

      {/* Time Range */}
      <FilterSection
        title="Time Range"
        isExpanded={expandedSections.has('timeRange')}
        onToggle={() => toggleSection('timeRange')}
      >
        <div className="space-y-2">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <label key={range} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="timeRange"
                value={range}
                checked={filters.timeRange === range}
                onChange={(e) => updateFilter('timeRange', e.target.value)}
                className="w-4 h-4 text-[#E1463E] bg-background-glass-subtle border-borders-subtle focus:ring-[#E1463E]"
              />
              <span className="text-sm text-text-secondary">{range}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Regions */}
      <FilterSection
        title="Regions"
        isExpanded={expandedSections.has('regions')}
        onToggle={() => toggleSection('regions')}
      >
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Add region..."
            className="w-full px-3 py-2 bg-background-glass-subtle border border-borders-subtle rounded-md text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-[#E1463E]/50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value) {
                const newRegions = [...(filters.regions || []), e.currentTarget.value];
                updateFilter('regions', newRegions);
                e.currentTarget.value = '';
              }
            }}
          />
          <div className="flex flex-wrap gap-2">
            {filters.regions?.map((region, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-1 bg-background-glass-subtle border border-borders-subtle rounded-md text-xs text-text-primary"
              >
                {region}
                <button
                  onClick={() => {
                    const newRegions = filters.regions?.filter((_, i) => i !== idx);
                    updateFilter('regions', newRegions);
                  }}
                  className="hover:text-text-primary"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </FilterSection>

      {/* Confidence */}
      <FilterSection
        title="Min Confidence"
        isExpanded={expandedSections.has('confidence')}
        onToggle={() => toggleSection('confidence')}
      >
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={filters.minConfidence || 0.5}
            onChange={(e) => updateFilter('minConfidence', parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-slate-400 text-center">
            {(filters.minConfidence || 0.5).toFixed(1)}
          </div>
        </div>
      </FilterSection>

      {/* Dedupe */}
      <FilterSection
        title="Options"
        isExpanded={expandedSections.has('options')}
        onToggle={() => toggleSection('options')}
      >
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.dedupe || false}
            onChange={(e) => updateFilter('dedupe', e.target.checked)}
            className="w-4 h-4 text-[#E1463E] bg-background-glass-subtle border-borders-subtle rounded focus:ring-[#E1463E]"
          />
          <span className="text-sm text-text-secondary">Deduplicate results</span>
        </label>
      </FilterSection>
    </div>
  );
}

function FilterSection({
  title,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background-glass-subtle border border-borders-subtle rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text-primary hover:text-text-primary transition-colors"
      >
        <span>{title}</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-borders-subtle">
          {children}
        </div>
      )}
    </div>
  );
}
