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
      <div className="p-4 backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.1] rounded-xl flex items-center gap-3">
        <Loader2 className="w-4 h-4 text-slate-400 animate-spin flex-shrink-0" />
        <span className="text-sm text-slate-400">Loading causal analysis…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4 backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.1] rounded-xl">
        <p className="text-sm text-slate-500">{error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="p-4 backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.1] rounded-xl">
        <p className="text-sm text-slate-500 mb-3">No causal analysis yet for this event.</p>
        <button
          type="button"
          onClick={handleGenerateAnalysis}
          disabled={generating}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#E1463E]/20 hover:bg-[#E1463E]/30 disabled:opacity-50 text-[#E1463E] rounded-lg text-sm font-light transition-all border border-[#E1463E]/40"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
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
    <div className="p-4 backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.1] rounded-xl space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <GitBranch className="w-4 h-4 text-[#E1463E]" />
        <h4 className="font-semibold text-white text-sm">Causal Chain & Exposure</h4>
        {data.impact_score != null && (
          <span className="ml-auto px-2 py-0.5 rounded text-xs font-medium bg-white/[0.08] text-slate-300">
            Score {data.impact_score}
          </span>
        )}
      </div>

      {/* Causal chain */}
      {data.causal_chain && data.causal_chain.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Causal chain</p>
          <div className="space-y-2">
            {data.causal_chain.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-[#E1463E] font-mono text-xs flex-shrink-0 mt-0.5">{idx + 1}.</span>
                <p className="text-sm text-slate-300 font-light">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exposure channels */}
      {data.exposure_channels && data.exposure_channels.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Exposure channels
          </p>
          <ul className="space-y-1.5">
            {data.exposure_channels.map((ch, idx) => (
              <li key={idx} className="text-sm text-slate-300">
                <span className="font-medium text-slate-200">{ch.channel}:</span>{' '}
                <span className="font-light">{ch.explanation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Affected sectors */}
      {data.affected_sectors && data.affected_sectors.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Affected sectors
          </p>
          <ul className="space-y-1.5">
            {data.affected_sectors.map((s, idx) => (
              <li key={idx} className="text-sm text-slate-300">
                <span className="font-medium text-slate-200">{s.sector}:</span>{' '}
                <span className="font-light">{s.rationale}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Impact assessment + confidence */}
      <div className="pt-3 border-t border-white/[0.08] flex flex-wrap gap-4">
        {ia.direction && (
          <div>
            <span className="text-xs text-slate-500">Direction</span>
            <p className={`text-sm font-medium ${directionColor}`}>{ia.direction}</p>
          </div>
        )}
        {ia.intensity && (
          <div>
            <span className="text-xs text-slate-500">Intensity</span>
            <p className="text-sm font-medium text-white">{ia.intensity}</p>
          </div>
        )}
        {ia.time_horizon && (
          <div>
            <span className="text-xs text-slate-500">Horizon</span>
            <p className="text-sm font-medium text-white">{ia.time_horizon}</p>
          </div>
        )}
        {data.confidence_level && (
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-500" />
            <div>
              <span className="text-xs text-slate-500">Confidence</span>
              <p className="text-sm font-medium text-white">{data.confidence_level}</p>
              {data.confidence_rationale && (
                <p className="text-xs text-slate-500 font-light mt-0.5">{data.confidence_rationale}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
