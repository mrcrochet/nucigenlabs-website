/**
 * Event Impact Analysis Section
 *
 * Displays event-level causal analysis from event_impact_analyses:
 * causal chain, exposure channels, affected sectors, impact assessment.
 * Fetches via GET /api/corporate-impact/event-analysis/:eventId
 */

import { useState, useEffect, useCallback } from 'react';
import { GitBranch, Layers, Target, Shield, Loader2, Sparkles } from 'lucide-react';
import { safeFetchJson } from '../../lib/safe-fetch-json';

interface AffectedSector {
  sector: string;
  rationale: string;
}

interface ExposureChannel {
  channel: string;
  explanation: string;
}

interface ImpactAssessment {
  direction?: string;
  intensity?: string;
  time_horizon?: string;
}

interface EventImpactAnalysisData {
  id: string;
  event_id: string;
  event_type: string;
  event_scope: string;
  affected_sectors: AffectedSector[];
  causal_chain: string[];
  exposure_channels: ExposureChannel[];
  impact_assessment: ImpactAssessment;
  confidence_level: string;
  confidence_rationale: string | null;
  impact_score: number | null;
  created_at: string;
}

interface EventImpactAnalysisSectionProps {
  eventId: string | null;
}

function fetchAnalysis(eventId: string): Promise<EventImpactAnalysisData | null> {
  return fetch(`/api/corporate-impact/event-analysis/${eventId}`)
    .then((res) => res.json())
    .then((json) => (json.success && json.data ? json.data : null));
}

export default function EventImpactAnalysisSection({ eventId }: EventImpactAnalysisSectionProps) {
  const [data, setData] = useState<EventImpactAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(() => {
    if (!eventId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetchAnalysis(eventId)
      .then(setData)
      .catch((err) => {
        setError(err?.message || 'Failed to load analysis');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerateAnalysis = useCallback(() => {
    if (!eventId) return;
    setGenerating(true);
    setError(null);
    safeFetchJson<{ success: boolean; data?: EventImpactAnalysisData; error?: string }>(
      '/api/corporate-impact/event-analysis',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      }
    )
      .then((json) => {
        if (json.success && json.data) {
          setData(json.data);
        } else {
          setError(json.error || 'Generation failed');
        }
      })
      .catch((err) => {
        setError(err?.message || 'Request failed');
      })
      .finally(() => setGenerating(false));
  }, [eventId]);

  if (!eventId) return null;
  if (loading) {
    return (
      <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg flex items-center gap-3">
        <Loader2 className="w-4 h-4 text-gray-500 animate-spin flex-shrink-0" aria-hidden />
        <span className="text-xs text-gray-500">Loading causal analysis…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
        <p className="text-xs text-gray-500">{error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
        <p className="text-xs text-gray-500 mb-3">No causal analysis yet for this event.</p>
        <button
          type="button"
          onClick={handleGenerateAnalysis}
          disabled={generating}
          className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-700 text-gray-400 text-xs hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {generating ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" aria-hidden />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3" aria-hidden />
              Generate analysis
            </>
          )}
        </button>
      </div>
    );
  }

  const ia = data.impact_assessment || {};
  const directionColor =
    ia.direction === 'Positive' ? 'text-green-400' : ia.direction === 'Negative' ? 'text-[#E1463E]' : 'text-amber-400';

  return (
    <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg space-y-4">
      <h4 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
        <GitBranch className="w-3.5 h-3.5" aria-hidden />
        Causal Chain Analysis
        {data.impact_score != null && (
          <span className="ml-auto font-mono text-gray-400">{data.impact_score}</span>
        )}
      </h4>

      {/* Causal chain — timeline style */}
      {data.causal_chain && data.causal_chain.length > 0 && (
        <div className="space-y-0">
          {data.causal_chain.map((step, idx) => (
            <div key={idx} className="relative pl-4 ml-2 mb-3 border-l border-gray-800">
              <div className="absolute -left-[9px] top-1 w-2 h-2 rounded-full bg-gray-600 border border-gray-900" aria-hidden />
              <p className="text-sm text-gray-400 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      )}

      {/* Exposure channels */}
      {data.exposure_channels && data.exposure_channels.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" aria-hidden />
            Exposure channels
          </p>
          <ul className="space-y-1.5">
            {data.exposure_channels.map((ch, idx) => (
              <li key={idx} className="text-xs text-gray-400">
                <span className="font-medium text-gray-300">{ch.channel}:</span>{' '}
                <span>{ch.explanation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Affected sectors */}
      {data.affected_sectors && data.affected_sectors.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" aria-hidden />
            Affected sectors
          </p>
          <ul className="space-y-1.5">
            {data.affected_sectors.map((s, idx) => (
              <li key={idx} className="text-xs text-gray-400">
                <span className="font-medium text-gray-300">{s.sector}:</span>{' '}
                <span>{s.rationale}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Impact assessment + confidence */}
      <div className="pt-3 border-t border-gray-800 flex flex-wrap gap-4 text-xs">
        {ia.direction && (
          <div>
            <span className="text-gray-500">Direction</span>
            <p className={`font-medium ${directionColor}`}>{ia.direction}</p>
          </div>
        )}
        {ia.intensity && (
          <div>
            <span className="text-gray-500">Intensity</span>
            <p className="text-gray-300 font-medium">{ia.intensity}</p>
          </div>
        )}
        {ia.time_horizon && (
          <div>
            <span className="text-gray-500">Horizon</span>
            <p className="text-gray-300 font-medium">{ia.time_horizon}</p>
          </div>
        )}
        {data.confidence_level && (
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-gray-500" aria-hidden />
            <div>
              <span className="text-gray-500">Confidence</span>
              <p className="text-gray-300 font-medium">{data.confidence_level}</p>
              {data.confidence_rationale && (
                <p className="text-gray-500 font-light mt-0.5">{data.confidence_rationale}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
