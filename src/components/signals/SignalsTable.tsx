/**
 * SignalsTable - Main signals table
 * 
 * Table columns EXACT:
 * - Signal
 * - Theme
 * - Strength
 * - Confidence
 * - #events
 * - Linked assets
 * - Updated
 * 
 * FORBIDDEN: projections, future scenarios
 */

import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import SkeletonCard from '../ui/SkeletonCard';
import type { Signal } from '../../types/intelligence';

interface SignalsTableProps {
  signals: Signal[];
  loading: boolean;
  onSignalClick: (signalId: string) => void;
}

export default function SignalsTable({ signals, loading, onSignalClick }: SignalsTableProps) {
  if (loading) {
    return (
      <Card>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </Card>
    );
  }

  if (signals.length === 0) {
    return (
      <Card>
        <SectionHeader title="Signals" />
        <div className="mt-4 text-center py-12">
          <p className="text-text-secondary mb-4">No signals found</p>
          <p className="text-sm text-text-tertiary">Try adjusting your filters</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader title="Signals" />
      
      <div className="mt-4 table-scroll">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-borders-subtle">
              <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Signal</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Theme</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Strength</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Confidence</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary"># Events</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Linked Assets</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Updated</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((signal) => (
              <tr
                key={signal.id}
                className="border-b border-borders-subtle hover:bg-background-glass-subtle transition-colors cursor-pointer"
                onClick={() => onSignalClick(signal.id)}
              >
                <td className="py-3 px-4">
                  <Link
                    to={`/signals/${signal.id}`}
                    className="text-text-primary hover:text-primary-red transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {signal.title}
                  </Link>
                </td>
                <td className="py-3 px-4">
                  <Badge variant="neutral">
                    {signal.scope || 'Unknown'}
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-background-glass-medium rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-red"
                        style={{ width: `${signal.impact_score || 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-text-secondary">{signal.impact_score || 0}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <Badge variant="neutral">{signal.confidence_score || 0}%</Badge>
                </td>
                <td className="py-3 px-4 text-sm text-text-secondary">
                  {signal.related_event_ids?.length || 0}
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs text-text-tertiary">—</span>
                </td>
                <td className="py-3 px-4 text-sm text-text-tertiary">
                  {new Date(signal.last_updated).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
