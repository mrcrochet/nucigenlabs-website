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
      className="col-span-1 sm:col-span-12 backdrop-blur-xl bg-gradient-to-br from-background-overlay to-background-glass-subtle border-b border-borders-subtle sticky z-50"
      style={{ top: `${headerHeight}px` }}
    >
      <div className="px-6 py-4">
        {/* Main Filters Row */}
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-5 h-5 text-slate-400 flex-shrink-0" />
          
          {/* Type Filters */}
          <div className="flex gap-2 flex-1 min-w-0">
            <button
              onClick={() => onFilterChange('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedFilter === 'all'
                  ? 'backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] border border-white/[0.2] text-white'
                  : 'backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] text-slate-400 hover:from-white/[0.08] hover:to-white/[0.04]'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => onFilterChange('opportunity')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedFilter === 'opportunity'
                  ? 'backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/30 text-green-400'
                  : 'backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] text-slate-400 hover:from-green-500/10 hover:to-green-500/5'
              }`}
            >
              ↑ Opportunities ({opportunitiesCount})
            </button>
            <button
              onClick={() => onFilterChange('risk')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedFilter === 'risk'
                  ? 'backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/20 to-[#E1463E]/10 border border-[#E1463E]/30 text-[#E1463E]'
                  : 'backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] text-slate-400 hover:from-[#E1463E]/10 hover:to-[#E1463E]/5'
              }`}
            >
              ↓ Risks ({risksCount})
            </button>
          </div>

          {/* Industries multi-select */}
          {onSectorsChange && (
            <div className="relative min-w-[180px]" ref={industryDropdownRef}>
              <button
                type="button"
                onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
                className="inline-flex items-center gap-2 px-4 py-2 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.15] rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50 w-full justify-between"
              >
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="truncate">
                  {selectedSectors.length === 0 ? 'Toutes industries' : `${selectedSectors.length} industrie(s)`}
                </span>
                <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${showIndustryDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showIndustryDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1 py-2 backdrop-blur-xl bg-[#0A0A0A] border border-white/[0.15] rounded-lg shadow-xl z-50 max-h-[280px] flex flex-col">
                  <div className="px-2 pb-2 border-b border-white/[0.08]">
                    <input
                      type="text"
                      value={industrySearch}
                      onChange={(e) => setIndustrySearch(e.target.value)}
                      placeholder="Rechercher une industrie..."
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50"
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
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                            isSelected
                              ? 'bg-[#E1463E]/20 text-[#E1463E]'
                              : 'text-slate-300 hover:bg-white/[0.06]'
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
            className="px-4 py-2 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.15] rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50 min-w-[140px]"
          >
            {sectors.map((sector) => (
              <option key={sector} value={sector === 'All Sectors' ? 'all' : sector} className="bg-[#0A0A0A]">
                {sector}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="px-4 py-2 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.15] rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50 min-w-[140px]"
          >
            {categories.map((category) => (
              <option key={category} value={categoryMap[category] || 'all'} className="bg-[#0A0A0A]">
                {category}
              </option>
            ))}
          </select>

          {/* Search Toggle */}
          <button
            onClick={() => {
              setShowSearch(!showSearch);
              if (showSearch) {
                onSearchChange('');
              }
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              showSearch || searchQuery
                ? 'backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/20 to-[#E1463E]/10 border border-[#E1463E]/30 text-[#E1463E]'
                : 'backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] text-slate-400 hover:from-white/[0.08] hover:to-white/[0.04]'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Selected industries chips */}
        {onSectorsChange && selectedSectors.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedSectors.map((ind) => (
              <span
                key={ind}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E1463E]/15 border border-[#E1463E]/30 text-[#E1463E] text-xs font-medium"
              >
                {ind}
                <button
                  type="button"
                  onClick={() => onSectorsChange(selectedSectors.filter((s) => s !== ind))}
                  className="hover:bg-[#E1463E]/20 rounded p-0.5"
                  aria-label={`Remove ${ind}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search Bar */}
        {showSearch && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by company name..."
                className="w-full pl-10 pr-10 py-2 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.15] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
