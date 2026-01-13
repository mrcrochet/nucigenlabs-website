/**
 * ActiveSignalsList - Active signals affecting this asset
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import { getSignalsFromEvents } from '../../lib/supabase';
import type { Signal } from '../../types/intelligence';

interface ActiveSignalsListProps {
  symbol: string;
}

export default function ActiveSignalsList({ symbol }: ActiveSignalsListProps) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSignals = async () => {
      try {
        // TODO: Filter signals by symbol/asset
        const allSignals = await getSignalsFromEvents({
          limit: 10,
        });
        setSignals(allSignals);
      } catch (error) {
        console.error('Error loading active signals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSignals();
  }, [symbol]);

  if (loading) {
    return (
      <Card>
        <div className="h-64 animate-pulse bg-background-glass-subtle rounded-lg" />
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader title="Active Signals" />
      
      <div className="mt-4 space-y-3">
        {signals.map((signal) => (
          <Link
            key={signal.id}
            to={`/signals/${signal.id}`}
            className="block p-3 bg-background-glass-subtle rounded-lg hover:bg-background-glass-medium transition-colors"
          >
            <h4 className="text-sm font-medium text-text-primary mb-2">
              {signal.title}
            </h4>
            <div className="flex items-center gap-2 flex-wrap text-xs text-text-tertiary">
              <Badge variant="neutral">Impact: {signal.impact_score || 0}%</Badge>
              <Badge variant="neutral">Confidence: {signal.confidence_score || 0}%</Badge>
              <span>•</span>
              <span>{new Date(signal.last_updated).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}

        {signals.length === 0 && (
          <div className="text-sm text-text-secondary text-center py-4">
            No active signals
          </div>
        )}
      </div>
    </Card>
  );
}
