/**
 * TopRisksCard - Top 3 risques émergents
 * 
 * Affiche les 3 risques les plus importants détectés
 * avec explication et horizon temporel
 */

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import { getSignalsFromEvents, getOrCreateSupabaseUserId } from '../../lib/supabase';
import type { Signal } from '../../types/intelligence';

interface Risk {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  time_horizon: string;
  signal_id: string;
  impact_score: number;
}

export default function TopRisksCard() {
  const { user } = useUser();
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRisks = async () => {
      try {
        const userId = user ? await getOrCreateSupabaseUserId(user.id) : undefined;
        
        // Get high-impact signals from last 7 days
        const signals = await getSignalsFromEvents(
          {
            dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            dateTo: new Date().toISOString(),
          },
          userId
        );

        // Filter and convert to risks
        // Focus on signals with high impact and negative implications
        const riskSignals = signals
          .filter(s => (s.impact_score || 0) >= 70)
          .sort((a, b) => (b.impact_score || 0) - (a.impact_score || 0))
          .slice(0, 3)
          .map(signal => {
            // Determine severity based on impact score
            let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
            if ((signal.impact_score || 0) >= 90) severity = 'critical';
            else if ((signal.impact_score || 0) >= 80) severity = 'high';
            else if ((signal.impact_score || 0) >= 70) severity = 'medium';
            else severity = 'low';

            return {
              id: `risk-${signal.id}`,
              title: signal.title,
              description: signal.summary || signal.why_it_matters || 'Risk detected',
              severity,
              time_horizon: signal.time_horizon || 'medium',
              signal_id: signal.id,
              impact_score: signal.impact_score || 0,
            };
          });

        setRisks(riskSignals);
      } catch (error) {
        console.error('Error loading risks:', error);
        setRisks([]);
      } finally {
        setLoading(false);
      }
    };

    loadRisks();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <SectionHeader title="Top Risks" />
        <div className="h-48 animate-pulse bg-background-glass-subtle rounded-lg mt-4" />
      </Card>
    );
  }

  if (risks.length === 0) {
    return (
      <Card className="max-h-80 overflow-y-auto">
        <SectionHeader title="Top Risks" subtitle="Emerging threats" />
        <div className="mt-3 p-4 backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.15] rounded-xl">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-3 backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-green-400" />
            </div>
            <h4 className="text-xs font-semibold text-text-primary mb-1.5">Risk environment stable</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              No significant risks detected in the last 7 days. System continues monitoring for threshold breaches.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const severityColors = {
    low: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    medium: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
    high: 'bg-red-500/20 text-red-500 border-red-500/30',
    critical: 'bg-red-600/20 text-red-600 border-red-600/30',
  };

  const severityLabels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };

  return (
    <Card className="max-h-80 overflow-y-auto">
      <SectionHeader title="Top Risks" subtitle="Emerging threats" />
      
      <div className="space-y-2 mt-3">
        {risks.slice(0, 3).map((risk, index) => (
          <div
            key={risk.id}
            className="p-3 bg-background-glass-subtle rounded-lg border border-borders-subtle hover:border-borders-medium transition-colors"
          >
            <div className="flex items-start justify-between mb-1.5">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <AlertTriangle className="w-3.5 h-3.5 text-primary-red flex-shrink-0" />
                <Link
                  to={`/signals/${risk.signal_id}`}
                  className="text-xs font-medium text-text-primary hover:text-primary-red transition-colors truncate"
                >
                  {risk.title}
                </Link>
              </div>
              <Badge
                variant="neutral"
                className={`${severityColors[risk.severity]} border text-xs`}
              >
                {severityLabels[risk.severity]}
              </Badge>
            </div>
            
            <p className="text-xs text-text-secondary mb-2 leading-relaxed line-clamp-2">
              {risk.description}
            </p>
            
            <div className="flex items-center gap-3 text-xs text-text-tertiary">
              <span>{risk.time_horizon}</span>
              <span>{risk.impact_score}/100</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
