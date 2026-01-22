/**
 * Scenario Timeline Component
 * 
 * Visualizes how scenario probabilities change over time
 * Shows trend analysis and probability evolution
 */

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import Card from '../ui/Card';
import type { EventPrediction } from '../../types/prediction';

interface ScenarioTimelineProps {
  eventId: string;
  currentPrediction: EventPrediction;
}

interface HistoricalSnapshot {
  recorded_at: string;
  prediction_json: EventPrediction;
}

export default function ScenarioTimeline({ eventId, currentPrediction }: ScenarioTimelineProps) {
  const [history, setHistory] = useState<HistoricalSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [eventId]);

  const loadHistory = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/predictions/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error loading prediction history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/[0.05] rounded w-1/3" />
          <div className="h-32 bg-white/[0.05] rounded" />
        </div>
      </Card>
    );
  }

  if (history.length === 0) {
    return null; // Don't show if no history
  }

  // Combine current with history
  const allSnapshots = [
    {
      recorded_at: currentPrediction.generated_at,
      prediction_json: currentPrediction,
    },
    ...history,
  ].sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());

  // Get scenario trends
  const getScenarioTrend = (scenarioId: string) => {
    if (allSnapshots.length < 2) return null;

    const current = allSnapshots[0].prediction_json.outlooks.find(o => o.id === scenarioId);
    const previous = allSnapshots[1].prediction_json.outlooks.find(o => o.id === scenarioId);

    if (!current || !previous) return null;

    const diff = current.probability - previous.probability;
    if (Math.abs(diff) < 0.01) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-light text-text-primary">
            Scenario Evolution
          </h3>
        </div>
        <p className="text-sm text-text-secondary font-light">
          How probabilities have changed over {allSnapshots.length} snapshot{allSnapshots.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Timeline Chart */}
      <div className="space-y-4">
        {currentPrediction.outlooks.map((outlook) => {
          const trend = getScenarioTrend(outlook.id);
          const historicalProbabilities = allSnapshots
            .map(s => {
              const scenario = s.prediction_json.outlooks.find(o => o.id === outlook.id);
              return scenario ? scenario.probability : null;
            })
            .filter((p): p is number => p !== null);

          if (historicalProbabilities.length < 2) return null;

          const minProb = Math.min(...historicalProbabilities);
          const maxProb = Math.max(...historicalProbabilities);
          const range = maxProb - minProb || 0.01;

          return (
            <div key={outlook.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary">
                    {outlook.title}
                  </span>
                  {trend && (
                    <span className="text-xs">
                      {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-400" />}
                      {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
                      {trend === 'stable' && <Minus className="w-3 h-3 text-text-tertiary" />}
                    </span>
                  )}
                </div>
                <div className="text-xs text-text-tertiary">
                  {(outlook.probability * 100).toFixed(1)}%
                </div>
              </div>

              {/* Mini Chart */}
              <div className="relative h-8 bg-white/[0.02] rounded border border-white/[0.05] overflow-hidden">
                <div className="absolute inset-0 flex items-center">
                  {historicalProbabilities.map((prob, idx) => {
                    const x = (idx / (historicalProbabilities.length - 1)) * 100;
                    const normalizedProb = (prob - minProb) / range;
                    const y = 100 - (normalizedProb * 100);

                    return (
                      <div
                        key={idx}
                        className="absolute w-2 h-2 bg-blue-400 rounded-full"
                        style={{
                          left: `${x}%`,
                          bottom: `${y}%`,
                          transform: 'translate(-50%, 50%)',
                        }}
                        title={`${(prob * 100).toFixed(1)}% - ${new Date(allSnapshots[idx].recorded_at).toLocaleDateString()}`}
                      />
                    );
                  })}

                  {/* Line connecting points */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <polyline
                      points={historicalProbabilities
                        .map((prob, idx) => {
                          const x = (idx / (historicalProbabilities.length - 1)) * 100;
                          const normalizedProb = (prob - minProb) / range;
                          const y = 100 - (normalizedProb * 100);
                          return `${x},${y}`;
                        })
                        .join(' ')}
                      fill="none"
                      stroke="rgba(59, 130, 246, 0.3)"
                      strokeWidth="1"
                    />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline Legend */}
      <div className="mt-6 pt-6 border-t border-white/[0.05]">
        <div className="flex items-center justify-between text-xs text-text-tertiary">
          <span>
            First recorded: {new Date(allSnapshots[allSnapshots.length - 1].recorded_at).toLocaleDateString()}
          </span>
          <span>
            Latest: {new Date(allSnapshots[0].recorded_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Card>
  );
}
