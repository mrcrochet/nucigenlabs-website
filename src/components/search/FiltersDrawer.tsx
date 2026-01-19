/**
 * Filters Drawer
 * 
 * Slide-in drawer from right for advanced filters
 * Replaces FiltersSidebar in main layout
 */

import { X } from 'lucide-react';
import FiltersSidebar from './FiltersSidebar';
import type { SearchFilters } from '../../types/search';

interface FiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

export default function FiltersDrawer({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: FiltersDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background-overlay/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-background-base border-l border-borders-subtle shadow-xl overflow-y-auto transform transition-transform">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text-primary">Refine Search</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-background-glass-subtle rounded-lg transition-colors"
              aria-label="Close filters"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
          
          {/* Filters Content */}
          <FiltersSidebar
            filters={filters}
            onFiltersChange={onFiltersChange}
          />
        </div>
      </div>
    </div>
  );
}
