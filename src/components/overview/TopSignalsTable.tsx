/**
 * TopSignalsTable - 10 rows
 * name, strength, confidence, linkedAssets, updatedAt
 * 
 * Data: GET /signals?sort=strength&range=7d&limit=10
 */

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import { getSignalsFromEvents, getOrCreateSupabaseUserId } from '../../lib/supabase';
import type { Signal } from '../../types/intelligence';

interface TopSignalsTableProps {
  limit?: number;
}

export default function TopSignalsTable({ limit = 10 }: TopSignalsTableProps) {
  const { user } = useUser();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSignals = async () => {
      try {
        const userId = user ? await getOrCreateSupabaseUserId(user.id) : undefined;
        const allSignals = await getSignalsFromEvents(
          {
            dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            dateTo: new Date().toISOString(),
          },
          userId
        );
        
        // Sort by strength (impact_score) and take top N
        const topSignals = allSignals
          .sort((a, b) => (b.impact_score || 0) - (a.impact_score || 0))
          .slice(0, limit);
        
        setSignals(topSignals);
      } catch (error) {
        console.error('Error loading signals:', error);
        setSignals([]);
      } finally {
        setLoading(false);
      }
    };

    loadSignals();
  }, [user]);

  if (loading) {
    return (
      <Card className="p-5">
        <div className="h-64 animate-pulse bg-background-glass-subtle rounded-lg" />
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <SectionHeader title="Top Signals" />
      
      <div className="mt-4 table-scroll">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-borders-subtle">
              <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Signal</th>
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
                className="border-b border-borders-subtle hover:bg-background-glass-subtle transition-colors"
              >
                <td className="py-3 px-4">
                  <Link
                    to={`/signals/${signal.id}`}
                    className="text-text-primary hover:text-primary-red transition-colors"
                  >
                    {signal.title}
                  </Link>
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
