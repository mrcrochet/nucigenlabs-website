/**
 * SignalExplanation - Explain Like an Analyst
 * 
 * Displays:
 * - Why the signal is significant
 * - Historical precedents
 * - Invalidation conditions
 */

import { useState, useEffect } from 'react';
import { History, AlertTriangle, Loader2 } from 'lucide-react';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import type { Signal } from '../../types/intelligence';
import { getNormalizedEventById } from '../../lib/supabase';
import { useUser } from '@clerk/clerk-react';

interface SignalExplanationData {
  why_significant: string;
  historical_precedents: Array<{
    event: string;
    outcome: string;
    similarity: string;
  }>;
  invalidation_conditions: string[];
  confidence: number;
}

interface SignalExplanationProps {
  signal: Signal;
}

export default function SignalExplanation({ signal }: SignalExplanationProps) {
  const { user } = useUser();
  const [explanation, setExplanation] = useState<SignalExplanationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!signal || !signal.id) {
      setLoading(false);
      return;
    }

    const loadExplanation = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load related events for context
        const relatedEvents = signal.related_event_ids
          ? await Promise.all(
              signal.related_event_ids.slice(0, 5).map(async (eventId) => {
                try {
                  const event = await getNormalizedEventById(eventId);
                  return {
                    title: event.summary || event.headline || event.title,
                    sector: event.sectors?.[0] || undefined,
                    region: event.location || undefined,
                  };
                } catch (err) {
                  console.warn(`[SignalExplanation] Failed to load event ${eventId}:`, err);
                  return null;
                }
              })
            )
          : [];

        const validEvents = relatedEvents.filter(e => e !== null) as Array<{
          title: string;
          sector?: string;
          region?: string;
        }>;

        // Call explanation API
        const API_BASE = import.meta.env.DEV ? '/api' : '/api';
        const response = await fetch(`${API_BASE}/signals/${signal.id}/explain`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            signal: {
              id: signal.id,
              title: signal.title,
              summary: signal.summary || signal.why_it_matters || 'Signal detected',
              impact_score: signal.impact_score || 0,
              confidence_score: signal.confidence_score || 0,
              scope: signal.scope || 'global',
              time_horizon: signal.time_horizon || 'medium',
            },
            relatedEvents: validEvents,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to generate explanation' }));
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to generate explanation`);
        }

        const result = await response.json();
        if (result.success && result.data) {
          setExplanation(result.data);
        } else {
          throw new Error(result.error || 'No explanation data received');
        }
      } catch (err: any) {
        console.error('[SignalExplanation] Error:', err);
        setError(err.message || 'Failed to load explanation');
      } finally {
        setLoading(false);
      }
    };

    if (signal && signal.id) {
      loadExplanation();
    }
  }, [signal.id, user]);

  if (loading) {
    return (
      <Card>
        <SectionHeader title="Signal Explanation" />
        <div className="flex items-center justify-center gap-2 py-8">
          <Loader2 className="w-4 h-4 animate-spin text-primary-red" />
          <span className="text-sm text-text-secondary">Generating explanation...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <SectionHeader title="Signal Explanation" />
        <div className="py-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400 mb-2">Unable to generate explanation</p>
            <p className="text-xs text-red-300/70">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                loadExplanation();
              }}
              className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </Card>
    );
  }

  if (!explanation) {
    return null;
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <SectionHeader title="Signal Explanation" />
        <Badge variant="neutral">
          Confidence: {explanation.confidence}%
        </Badge>
      </div>

      <div className="space-y-6 mt-4">
        {/* Why Significant */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-2">
            Why This Signal Matters
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            {explanation.why_significant}
          </p>
        </div>

        {/* Historical Precedents */}
        {explanation.historical_precedents && explanation.historical_precedents.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-text-secondary" />
              <h3 className="text-sm font-semibold text-text-primary">
                Historical Precedents
              </h3>
            </div>
            <div className="space-y-3">
              {explanation.historical_precedents.map((precedent, index) => (
                <div
                  key={index}
                  className="p-3 bg-background-glass-subtle rounded-lg border border-borders-subtle hover:border-borders-medium transition-colors"
                >
                  <p className="text-sm font-medium text-text-primary mb-1">
                    {precedent.event}
                  </p>
                  <p className="text-xs text-text-secondary mb-2">
                    Outcome: {precedent.outcome}
                  </p>
                  <p className="text-xs text-text-tertiary italic">
                    Similarity: {precedent.similarity}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invalidation Conditions */}
        {explanation.invalidation_conditions && explanation.invalidation_conditions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <h3 className="text-sm font-semibold text-text-primary">
                Invalidation Conditions
              </h3>
            </div>
            <div className="space-y-2">
              {explanation.invalidation_conditions.map((condition, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 bg-background-glass-subtle rounded border border-borders-subtle"
                >
                  <span className="text-text-tertiary mt-0.5">•</span>
                  <p className="text-xs text-text-secondary flex-1">{condition}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
