/**
 * Corporate Impact Filters
 * 
 * Filter controls for Corporate Impact page
 */

import { Filter } from 'lucide-react';

interface CorporateImpactFiltersProps {
  selectedFilter: 'all' | 'opportunity' | 'risk';
  selectedSector: string;
  onFilterChange: (filter: 'all' | 'opportunity' | 'risk') => void;
  onSectorChange: (sector: string) => void;
  opportunitiesCount: number;
  risksCount: number;
  totalCount: number;
}

export default function CorporateImpactFilters({
  selectedFilter,
  selectedSector,
  onFilterChange,
  onSectorChange,
  opportunitiesCount,
  risksCount,
  totalCount,
}: CorporateImpactFiltersProps) {
  const sectors = [
    'All Sectors',
    'Technology',
    'Energy',
    'Materials',
    'Renewable Energy',
    'Software',
    'Finance',
    'Healthcare',
    'Industrial',
  ];

  return (
    <div className="backdrop-blur-xl bg-gradient-to-br from-[#0A0A0A] to-[#0F0F0F] border-b border-white/[0.08] sticky top-[172px] z-40">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-slate-400" />
          <div className="flex gap-2 flex-1">
            <button
              onClick={() => onFilterChange('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedFilter === 'all'
                  ? 'backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] border border-white/[0.2] text-white'
                  : 'backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] text-slate-400 hover:from-white/[0.08] hover:to-white/[0.04]'
              }`}
            >
              All Signals ({totalCount})
            </button>
            <button
              onClick={() => onFilterChange('opportunity')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedFilter === 'opportunity'
                  ? 'backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/30 text-green-400'
                  : 'backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] text-slate-400 hover:from-green-500/10 hover:to-green-500/5'
              }`}
            >
              Opportunities ({opportunitiesCount})
            </button>
            <button
              onClick={() => onFilterChange('risk')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedFilter === 'risk'
                  ? 'backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/20 to-[#E1463E]/10 border border-[#E1463E]/30 text-[#E1463E]'
                  : 'backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] text-slate-400 hover:from-[#E1463E]/10 hover:to-[#E1463E]/5'
              }`}
            >
              Risks ({risksCount})
            </button>
          </div>

          <select
            value={selectedSector}
            onChange={(e) => onSectorChange(e.target.value)}
            className="px-4 py-2 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.15] rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50"
          >
            {sectors.map((sector) => (
              <option key={sector} value={sector === 'All Sectors' ? 'all' : sector} className="bg-[#0A0A0A]">
                {sector}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
