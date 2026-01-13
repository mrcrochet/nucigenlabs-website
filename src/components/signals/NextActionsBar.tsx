/**
 * NextActionsBar - Actions for signal
 * 
 * Actions:
 * - "Generate impact scenarios"
 * - "Create alert"
 * - "Add to watchlist"
 */

import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import { Target, Bell, Bookmark } from 'lucide-react';
import type { Signal } from '../../types/intelligence';

interface NextActionsBarProps {
  signal: Signal;
}

export default function NextActionsBar({ signal }: NextActionsBarProps) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-text-secondary">Next Actions:</span>
        
        <Link
          to={`/impacts?signal_id=${signal.id}`}
          className="flex items-center gap-2 px-4 py-2 bg-background-glass-subtle rounded-lg hover:bg-background-glass-medium transition-colors text-sm text-text-primary"
        >
          <Target className="w-4 h-4" />
          <span>Generate Impact Scenarios</span>
        </Link>

        <button className="flex items-center gap-2 px-4 py-2 bg-background-glass-subtle rounded-lg hover:bg-background-glass-medium transition-colors text-sm text-text-primary">
          <Bell className="w-4 h-4" />
          <span>Create Alert</span>
        </button>

        <button className="flex items-center gap-2 px-4 py-2 bg-background-glass-subtle rounded-lg hover:bg-background-glass-medium transition-colors text-sm text-text-primary">
          <Bookmark className="w-4 h-4" />
          <span>Add to Watchlist</span>
        </button>
      </div>
    </Card>
  );
}
