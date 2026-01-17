/**
 * AdvancedFilters Component
 * 
 * Advanced filter modal with tags, consensus, tier, sources, and score filters
 */

import { useState } from 'react';
import { X, Filter, Tag, CheckCircle2, AlertTriangle, AlertCircle, TrendingUp, Layers, Sliders } from 'lucide-react';
import Badge from '../ui/Badge';

export interface AdvancedFilters {
  tags?: string[];
  consensus?: ('high' | 'fragmented' | 'disputed')[];
  tier?: ('critical' | 'strategic' | 'background')[];
  minSources?: number;
  maxSources?: number;
  minScore?: number;
  maxScore?: number;
}

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  availableTags?: string[];
}

export default function AdvancedFilters({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  availableTags = [],
}: AdvancedFiltersProps) {
  const [localFilters, setLocalFilters] = useState<AdvancedFilters>(filters);

  if (!isOpen) return null;

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: AdvancedFilters = {};
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    onClose();
  };

  const hasActiveFilters = 
    (localFilters.tags && localFilters.tags.length > 0) ||
    (localFilters.consensus && localFilters.consensus.length > 0) ||
    (localFilters.tier && localFilters.tier.length > 0) ||
    localFilters.minSources !== undefined ||
    localFilters.maxSources !== undefined ||
    localFilters.minScore !== undefined ||
    localFilters.maxScore !== undefined;

  const toggleTag = (tag: string) => {
    setLocalFilters(prev => ({
      ...prev,
      tags: prev.tags?.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...(prev.tags || []), tag],
    }));
  };

  const toggleConsensus = (consensus: 'high' | 'fragmented' | 'disputed') => {
    setLocalFilters(prev => ({
      ...prev,
      consensus: prev.consensus?.includes(consensus)
        ? prev.consensus.filter(c => c !== consensus)
        : [...(prev.consensus || []), consensus],
    }));
  };

  const toggleTier = (tier: 'critical' | 'strategic' | 'background') => {
    setLocalFilters(prev => ({
      ...prev,
      tier: prev.tier?.includes(tier)
        ? prev.tier.filter(t => t !== tier)
        : [...(prev.tier || []), tier],
    }));
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-white/10 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Sliders className="w-5 h-5 text-slate-400" />
              <h2 className="text-xl font-light text-white">Advanced Filters</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Tags Filter */}
            <div>
              <label className="flex items-center gap-2 text-sm font-light text-white mb-3">
                <Tag className="w-4 h-4 text-slate-400" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.length > 0 ? (
                  availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-light transition-colors ${
                        localFilters.tags?.includes(tag)
                          ? 'bg-[#E1463E]/20 border border-[#E1463E]/40 text-[#E1463E]'
                          : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {tag}
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No tags available</p>
                )}
              </div>
            </div>

            {/* Consensus Filter */}
            <div>
              <label className="flex items-center gap-2 text-sm font-light text-white mb-3">
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
                Consensus
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'high' as const, label: 'High Consensus', icon: CheckCircle2, color: 'text-green-400' },
                  { value: 'fragmented' as const, label: 'Fragmented', icon: AlertTriangle, color: 'text-yellow-400' },
                  { value: 'disputed' as const, label: 'Disputed', icon: AlertCircle, color: 'text-red-400' },
                ].map(({ value, label, icon: Icon, color }) => (
                  <button
                    key={value}
                    onClick={() => toggleConsensus(value)}
                    className={`px-4 py-2 rounded-lg text-sm font-light transition-colors flex items-center gap-2 ${
                      localFilters.consensus?.includes(value)
                        ? 'bg-white/10 border border-white/20 text-white'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${localFilters.consensus?.includes(value) ? color : ''}`} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tier Filter */}
            <div>
              <label className="flex items-center gap-2 text-sm font-light text-white mb-3">
                <Layers className="w-4 h-4 text-slate-400" />
                Tier
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'critical' as const, label: 'Critical', color: 'text-[#E1463E]' },
                  { value: 'strategic' as const, label: 'Strategic', color: 'text-slate-400' },
                  { value: 'background' as const, label: 'Background', color: 'text-slate-500' },
                ].map(({ value, label, color }) => (
                  <button
                    key={value}
                    onClick={() => toggleTier(value)}
                    className={`px-4 py-2 rounded-lg text-sm font-light transition-colors ${
                      localFilters.tier?.includes(value)
                        ? 'bg-white/10 border border-white/20 text-white'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sources Range */}
            <div>
              <label className="flex items-center gap-2 text-sm font-light text-white mb-3">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                Number of Sources
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">Min</label>
                  <input
                    type="number"
                    min="0"
                    value={localFilters.minSources || ''}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      minSources: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    }))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-light focus:outline-none focus:border-white/20"
                  />
                </div>
                <span className="text-slate-500 mt-6">to</span>
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">Max</label>
                  <input
                    type="number"
                    min="0"
                    value={localFilters.maxSources || ''}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      maxSources: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    }))}
                    placeholder="∞"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-light focus:outline-none focus:border-white/20"
                  />
                </div>
              </div>
            </div>

            {/* Score Range */}
            <div>
              <label className="flex items-center gap-2 text-sm font-light text-white mb-3">
                <Filter className="w-4 h-4 text-slate-400" />
                Relevance Score
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">Min</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={localFilters.minScore || ''}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      minScore: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    }))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-light focus:outline-none focus:border-white/20"
                  />
                </div>
                <span className="text-slate-500 mt-6">to</span>
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">Max</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={localFilters.maxScore || ''}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      maxScore: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    }))}
                    placeholder="100"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-light focus:outline-none focus:border-white/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-white/10">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Reset
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-light"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 bg-[#E1463E] border border-[#E1463E] rounded-lg text-white hover:bg-[#E1463E]/90 transition-colors text-sm font-light"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
