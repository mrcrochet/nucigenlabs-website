/**
 * OpportunitiesCard - 1-2 opportunités ou scénarios
 * 
 * Affiche les opportunités ou scénarios positifs détectés
 */

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { TrendingUp, Lightbulb } from 'lucide-react';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import { getSignalsFromEvents, getOrCreateSupabaseUserId } from '../../lib/supabase';
import type { Signal } from '../../types/intelligence';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  type: 'opportunity' | 'scenario';
  time_horizon: string;
  signal_id: string;
  confidence: number;
}

export default function OpportunitiesCard() {
  const { user } = useUser();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOpportunities = async () => {
      try {
        const userId = user ? await getOrCreateSupabaseUserId(user.id) : undefined;
        
        // Get signals from last 7 days
        const signals = await getSignalsFromEvents(
          {
            dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            dateTo: new Date().toISOString(),
          },
          userId
        );

        // Filter for positive/opportunity signals
        // Look for signals with high confidence and positive implications
        const opportunitySignals = signals
          .filter(s => (s.confidence_score || 0) >= 75)
          .sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0))
          .slice(0, 2)
          .map(signal => ({
            id: `opp-${signal.id}`,
            title: signal.title,
            description: signal.summary || signal.why_it_matters || 'Opportunity detected',
            type: 'opportunity' as const,
            time_horizon: signal.time_horizon || 'medium',
            signal_id: signal.id,
            confidence: signal.confidence_score || 0,
          }));

        setOpportunities(opportunitySignals);
      } catch (error) {
        console.error('Error loading opportunities:', error);
        setOpportunities([]);
      } finally {
        setLoading(false);
      }
    };

    loadOpportunities();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <SectionHeader title="Opportunities" />
        <div className="h-32 animate-pulse bg-background-glass-subtle rounded-lg mt-4" />
      </Card>
    );
  }

  if (opportunities.length === 0) {
    return (
      <Card>
        <SectionHeader title="Opportunities" />
        <div className="text-text-secondary text-sm mt-4">
          No clear opportunities identified at this time.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader title="Opportunities" />
      
      <div className="space-y-4 mt-4">
        {opportunities.map((opp) => (
          <div
            key={opp.id}
            className="p-4 bg-background-glass-subtle rounded-lg border border-borders-subtle hover:border-borders-medium transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {opp.type === 'opportunity' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <Lightbulb className="w-4 h-4 text-blue-500" />
                )}
                <Link
                  to={`/signals/${opp.signal_id}`}
                  className="text-sm font-medium text-text-primary hover:text-primary-red transition-colors"
                >
                  {opp.title}
                </Link>
              </div>
            </div>
            
            <p className="text-xs text-text-secondary mb-3 leading-relaxed">
              {opp.description}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-text-tertiary">
              <span>Horizon: {opp.time_horizon}</span>
              <span>Confidence: {opp.confidence}%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
