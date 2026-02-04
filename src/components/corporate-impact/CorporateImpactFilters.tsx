/**
 * Corporate Impact Filters
 *
 * Filter controls: Type, Industries (multi-select), Sector (single), Category, Search.
 */

import { Filter, Search, X, ChevronDown, Building2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { mergeIndustries } from '../../constants/industries';

interface CorporateImpactFiltersProps {
  selectedFilter: 'all' | 'opportunity' | 'risk';
  selectedSector: string;
  selectedSectors?: string[];
  selectedCategory: string;
  searchQuery: string;
  onFilterChange: (filter: 'all' | 'opportunity' | 'risk') => void;
  onSectorChange: (sector: string) => void;
  onSectorsChange?: (sectors: string[]) => void;
  onCategoryChange: (category: string) => void;
  onSearchChange: (search: string) => void;
  opportunitiesCount: number;
  risksCount: number;
  totalCount: number;
  availableSectors?: string[];
  availableCategories?: string[];
}

export default function CorporateImpactFilters({
  selectedFilter,
  selectedSector,
  selectedSectors = [],
  selectedCategory,
  searchQuery,
  onFilterChange,
  onSectorChange,
  onSectorsChange,
  onCategoryChange,
  onSearchChange,
  opportunitiesCount,
  risksCount,
  totalCount,
  availableSectors = [],
  availableCategories = [],
}: CorporateImpactFiltersProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [industrySearch, setIndustrySearch] = useState('');
  const [headerHeight, setHeaderHeight] = useState(244);
  const headerRef = useRef<HTMLDivElement>(null);
  const industryDropdownRef = useRef<HTMLDivElement>(null);

  const industries = mergeIndustries(availableSectors);
  const filteredIndustries = industrySearch.trim()
    ? industries.filter((i) => i.toLowerCase().includes(industrySearch.toLowerCase()))
    : industries;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (industryDropdownRef.current && !industryDropdownRef.current.contains(e.target as Node)) {
        setShowIndustryDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate header height dynamically
  useEffect(() => {
    const calculateHeaderHeight = () => {
      // TopNav: 64px (h-16)
      const topNavHeight = 64;
      // Header: measure actual height
      const headerElement = document.querySelector('[data-corporate-impact-header]');
      const headerActualHeight = headerElement?.getBoundingClientRect().height || 180;
      
      setHeaderHeight(topNavHeight + headerActualHeight);
    };

    calculateHeaderHeight();
    window.addEventListener('resize', calculateHeaderHeight);
    return () => window.removeEventListener('resize', calculateHeaderHeight);
  }, []);

  const sectors = availableSectors.length > 0
    ? ['All Sectors', ...availableSectors]
    : ['All Sectors', 'Technology', 'Energy', 'Materials', 'Renewable Energy', 'Software', 'Finance', 'Healthcare', 'Industrial'];

  // Map display names to database values
  const categoryMap: Record<string, string> = {
    'All Categories': 'all',
    'Geopolitics': 'geopolitics',
    'Finance': 'finance',
    'Energy': 'energy',
    'Supply Chain': 'supply-chain',
  };

  const categories = [
    'All Categories',
    'Geopolitics',
    'Finance',
    'Energy',
    'Supply Chain',
  ];

  return (
    <div
      ref={headerRef}
      className="col-span-1 sm:col-span-12 bg-black border-b border-gray-900 sticky z-50"
      style={{ top: `${headerHeight}px` }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 min-w-0">
        {/* Main Filters Row — mockup style; no overlap: type buttons don't grow/shrink into dropdown */}
        <div className="flex items-center gap-3 flex-wrap overflow-x-auto pb-1 scroll-touch">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden />

          {/* Type Filters — flex-none so they don't overlap with Industries */}
          <div className="flex gap-2 flex-none flex-wrap items-center">
            <button
              onClick={() => onFilterChange('all')}
              className={`px-3 py-2 sm:py-1.5 rounded border text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[44px] sm:min-h-0 ${
                selectedFilter === 'all'
                  ? 'border-gray-600 bg-gray-800 text-gray-200'
                  : 'border-gray-800 text-gray-500 hover:bg-gray-900 hover:text-gray-400'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => onFilterChange('opportunity')}
              className={`px-3 py-2 sm:py-1.5 rounded border text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[44px] sm:min-h-0 ${
                selectedFilter === 'opportunity'
                  ? 'border-green-500/40 bg-green-500/10 text-green-400'
                  : 'border-gray-800 text-gray-500 hover:bg-gray-900 hover:text-gray-400'
              }`}
            >
              ↑ Opportunities ({opportunitiesCount})
            </button>
            <button
              onClick={() => onFilterChange('risk')}
              className={`px-3 py-2 sm:py-1.5 rounded border text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[44px] sm:min-h-0 ${
                selectedFilter === 'risk'
                  ? 'border-[#E1463E]/40 bg-[#E1463E]/10 text-[#E1463E]'
                  : 'border-gray-800 text-gray-500 hover:bg-gray-900 hover:text-gray-400'
              }`}
            >
              ↓ Risks ({risksCount})
            </button>
          </div>

          {/* Industries multi-select — shrink-0 to avoid being overlapped */}
          {onSectorsChange && (
            <div className="relative min-w-[160px] shrink-0" ref={industryDropdownRef}>
              <button
                type="button"
                onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900/50 border border-gray-800 rounded text-xs font-medium text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-600 w-full justify-between hover:bg-gray-900"
              >
                <Building2 className="w-3.5 h-3.5 text-gray-500" aria-hidden />
                <span className="truncate">
                  {selectedSectors.length === 0 ? 'All industries' : `${selectedSectors.length} industrie${selectedSectors.length > 1 ? 's' : ''}`}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 text-gray-500 transition-transform ${showIndustryDropdown ? 'rotate-180' : ''}`} aria-hidden />
              </button>
              {showIndustryDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1 py-2 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-50 max-h-[280px] flex flex-col">
                  <div className="px-2 pb-2 border-b border-gray-800">
                    <input
                      type="text"
                      value={industrySearch}
                      onChange={(e) => setIndustrySearch(e.target.value)}
                      placeholder="Search industry..."
                      className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-600"
                    />
                  </div>
                  <div className="overflow-y-auto max-h-[220px] px-2 pt-2">
                    {filteredIndustries.map((ind) => {
                      const isSelected = selectedSectors.includes(ind);
                      return (
                        <button
                          key={ind}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              onSectorsChange(selectedSectors.filter((s) => s !== ind));
                            } else {
                              onSectorsChange([...selectedSectors, ind]);
                            }
                          }}
                          className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${
                            isSelected ? 'bg-[#E1463E]/20 text-[#E1463E]' : 'text-gray-400 hover:bg-gray-800'
                          }`}
                        >
                          {ind}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sector Filter (single, quick) */}
          <select
            value={selectedSector}
            onChange={(e) => onSectorChange(e.target.value)}
            className="shrink-0 px-3 py-1.5 bg-gray-900/50 border border-gray-800 rounded text-xs font-medium text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-600 min-w-[120px]"
          >
            {sectors.map((sector) => (
              <option key={sector} value={sector === 'All Sectors' ? 'all' : sector} className="bg-gray-900">
                {sector}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="shrink-0 px-3 py-1.5 bg-gray-900/50 border border-gray-800 rounded text-xs font-medium text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-600 min-w-[120px]"
          >
            {categories.map((category) => (
              <option key={category} value={categoryMap[category] || 'all'} className="bg-gray-900">
                {category}
              </option>
            ))}
          </select>

          {/* Search Toggle */}
          <button
            type="button"
            onClick={() => {
              setShowSearch(!showSearch);
              if (showSearch) onSearchChange('');
            }}
            className={`p-2 rounded border transition-colors ${
              showSearch || searchQuery
                ? 'border-[#E1463E]/40 bg-[#E1463E]/10 text-[#E1463E]'
                : 'border-gray-800 text-gray-500 hover:bg-gray-900 hover:text-gray-400'
            }`}
            aria-label={showSearch ? 'Hide search' : 'Show search'}
          >
            <Search className="w-3.5 h-3.5" aria-hidden />
          </button>
        </div>

        {/* Selected industries chips */}
        {onSectorsChange && selectedSectors.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedSectors.map((ind) => (
              <span
                key={ind}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-gray-800 border border-gray-700 text-gray-300 text-xs font-medium"
              >
                {ind}
                <button
                  type="button"
                  onClick={() => onSectorsChange(selectedSectors.filter((s) => s !== ind))}
                  className="hover:bg-gray-700 rounded p-0.5"
                  aria-label={`Remove ${ind}`}
                >
                  <X className="w-3 h-3" aria-hidden />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search Bar */}
        {showSearch && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" aria-hidden />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by company name..."
                className="w-full pl-9 pr-9 py-1.5 bg-gray-900 border border-gray-800 rounded text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-600"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" aria-hidden />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
