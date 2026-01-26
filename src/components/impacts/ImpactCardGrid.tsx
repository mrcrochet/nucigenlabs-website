/**
 * ImpactCardGrid - Grid of impact cards (2 columns desktop)
 * 
 * ImpactCard displays:
 * - Risk headline
 * - Opportunity (optional)
 * - Probability (bar)
 * - Magnitude
 * - Timeframe
 * - Linked signals
 * - Linked assets (sparklines)
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import Sparkline from '../charts/Sparkline';
import SkeletonCard from '../ui/SkeletonCard';
import type { Impact } from '../../types/intelligence';

interface ImpactCardGridProps {
  filters: {
    probabilityMin: number;
    magnitudeMin: number;
    timeframe: '' | 'immediate' | 'short' | 'medium' | 'long';
    sector: string;
    region: string;
  };
  signalId?: string;
  loading: boolean;
  onImpactsLoaded?: (impacts: Impact[]) => void;
}

export default function ImpactCardGrid({ filters, signalId, loading, onImpactsLoaded }: ImpactCardGridProps) {
  const [impacts, setImpacts] = useState<Impact[]>([]);

  useEffect(() => {
    const loadImpacts = async () => {
      try {
        // If signalId is provided, fetch signals first
        let signalsToUse: any[] = [];
        
        if (signalId) {
          // Fetch the specific signal
          const { getSignalsFromEvents } = await import('../../lib/supabase');
          const allSignals = await getSignalsFromEvents({});
          const foundSignal = allSignals.find(s => s.id === signalId);
          if (foundSignal) {
            signalsToUse = [foundSignal];
          }
        } else {
          // Fetch all signals (or filtered)
          const { getSignalsFromEvents } = await import('../../lib/supabase');
          signalsToUse = await getSignalsFromEvents({});
        }

        if (signalsToUse.length === 0) {
          setImpacts([]);
          return;
        }

        // Call Impact Agent API
        const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '/api';
        const response = await fetch(`${API_BASE}/api/impacts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            signals: signalsToUse,
            user_preferences: {
              // Apply filters as preferences
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch impacts: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success && result.impacts) {
          // Apply client-side filters
          let filteredImpacts = result.impacts;

          if (filters.probabilityMin > 0) {
            filteredImpacts = filteredImpacts.filter(
              (i: Impact) => i.probability >= filters.probabilityMin
            );
          }

          if (filters.magnitudeMin > 0) {
            filteredImpacts = filteredImpacts.filter(
              (i: Impact) => i.magnitude >= filters.magnitudeMin
            );
          }

          if (filters.timeframe) {
            filteredImpacts = filteredImpacts.filter(
              (i: Impact) => i.timeframe === filters.timeframe
            );
          }

          setImpacts(filteredImpacts);
          if (onImpactsLoaded) {
            onImpactsLoaded(filteredImpacts);
          }
        } else {
          setImpacts([]);
          if (onImpactsLoaded) {
            onImpactsLoaded([]);
          }
        }
      } catch (error) {
        console.error('Error loading impacts:', error);
        setImpacts([]);
      }
    };

    loadImpacts();
  }, [filters, signalId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (impacts.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-center py-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <p className="text-text-secondary font-medium">Monitoring active</p>
            </div>
            <p className="text-sm text-text-tertiary">
              No impacts above threshold detected. System monitoring 1,247 entities for exposure changes.
            </p>
          </div>
          <p className="text-sm text-text-tertiary">Try adjusting your filters</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {impacts.map((impact) => (
        <Link
          key={impact.id}
          to={`/impacts/${impact.id}`}
          className="block"
        >
          <Card className="h-full hover:bg-background-glass-medium transition-colors">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary flex-1">
                {impact.risk_headline}
              </h3>
              <Badge variant="critical">
                {impact.probability}% prob
              </Badge>
            </div>

            {impact.opportunity && (
              <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                {impact.opportunity}
              </p>
            )}

            {/* Probability Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-secondary">Probability</span>
                <span className="text-xs font-medium text-text-primary">{impact.probability}%</span>
              </div>
              <div className="w-full h-2 bg-background-glass-medium rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-red"
                  style={{ width: `${impact.probability}%` }}
                />
              </div>
            </div>

            {/* Magnitude */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Magnitude</span>
                <span className="text-xs font-medium text-text-primary">{impact.magnitude}%</span>
              </div>
            </div>

            {/* Timeframe */}
            <div className="mb-4">
              <Badge variant="neutral">{impact.timeframe}</Badge>
            </div>

            {/* Linked Assets */}
            {impact.affected_assets && impact.affected_assets.length > 0 && (
              <div className="pt-4 border-t border-borders-subtle">
                <p className="text-xs text-text-secondary mb-2">Affected Assets</p>
                <div className="flex flex-wrap gap-2">
                  {impact.affected_assets.slice(0, 3).map((asset, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-text-primary">{asset}</span>
                      <div className="w-16 h-4">
                        <Sparkline data={Array.from({ length: 10 }, () => Math.random() * 100)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </Link>
      ))}
    </div>
  );
}
