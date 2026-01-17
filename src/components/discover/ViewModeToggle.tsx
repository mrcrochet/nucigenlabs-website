/**
 * ViewModeToggle Component
 * 
 * Toggle between grid and list view modes
 */

import { Grid3x3, List } from 'lucide-react';

export type ViewMode = 'grid' | 'list';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
      <button
        onClick={() => onViewModeChange('grid')}
        className={`p-2 rounded transition-colors ${
          viewMode === 'grid'
            ? 'bg-white/10 text-white'
            : 'text-slate-500 hover:text-white hover:bg-white/5'
        }`}
        title="Grid view"
        aria-label="Switch to grid view"
      >
        <Grid3x3 className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        className={`p-2 rounded transition-colors ${
          viewMode === 'list'
            ? 'bg-white/10 text-white'
            : 'text-slate-500 hover:text-white hover:bg-white/5'
        }`}
        title="List view"
        aria-label="Switch to list view"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}
