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
      <Card className="max-h-64 overflow-y-auto">
        <SectionHeader title="Opportunities" subtitle="Positive scenarios" />
        <div className="mt-3 p-4 backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.15] rounded-xl">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-3 backdrop-blur-xl bg-gradient-to-br from-slate-500/20 to-slate-500/10 border border-slate-500/30 rounded-full flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-slate-400" />
            </div>
            <h4 className="text-xs font-semibold text-text-primary mb-1.5">Monitoring for opportunities</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              No clear opportunities identified at this time. System analyzes signals for positive scenarios with high confidence.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-h-64 overflow-y-auto">
      <SectionHeader title="Opportunities" subtitle="Positive scenarios" />
      
      <div className="space-y-2 mt-3">
        {opportunities.slice(0, 2).map((opp) => (
          <div
            key={opp.id}
            className="p-3 bg-background-glass-subtle rounded-lg border border-borders-subtle hover:border-borders-medium transition-colors"
          >
            <div className="flex items-start justify-between mb-1.5">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {opp.type === 'opportunity' ? (
                  <TrendingUp className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                ) : (
                  <Lightbulb className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                )}
                <Link
                  to={`/signals/${opp.signal_id}`}
                  className="text-xs font-medium text-text-primary hover:text-primary-red transition-colors truncate"
                >
                  {opp.title}
                </Link>
              </div>
            </div>
            
            <p className="text-xs text-text-secondary mb-2 leading-relaxed line-clamp-2">
              {opp.description}
            </p>
            
            <div className="flex items-center gap-3 text-xs text-text-tertiary">
              <span>{opp.time_horizon}</span>
              <span>{opp.confidence}%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
