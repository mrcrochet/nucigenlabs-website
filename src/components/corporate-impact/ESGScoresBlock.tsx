/**
 * ESG scores block — Open Sustainability Index.
 * Fetches GET /api/esg/scores?company=... and displays E, S, G when available.
 */

import { useState, useEffect } from 'react';
import { ExternalLink, Leaf, Users, Shield } from 'lucide-react';
import { apiUrl } from '../../lib/api-base';

export interface ESGScoresData {
  companyName: string;
  environmental?: number | null;
  social?: number | null;
  governance?: number | null;
  overall?: number | null;
  sourceUrl: string;
}

interface ESGScoresBlockProps {
  companyName: string;
  /** Optional: skip fetch (e.g. when card is collapsed) */
  enabled?: boolean;
}

export default function ESGScoresBlock({ companyName, enabled = true }: ESGScoresBlockProps) {
  const [data, setData] = useState<ESGScoresData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled || !companyName.trim()) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({ company: companyName.trim() });
    fetch(apiUrl(`/api/esg/scores?${params.toString()}`))
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success && json.data) setData(json.data);
        else setData(null);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, companyName]);

  if (loading || error || !data) return null;

  const hasAny = [data.environmental, data.social, data.governance, data.overall].some(
    (v) => typeof v === 'number'
  );
  if (!hasAny) return null;

  const scoreLabel = (v: number | null | undefined) =>
    v != null ? (typeof v === 'number' ? `${Math.round(v)}` : '—') : '—';

  return (
    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center gap-2 mb-2">
        <Leaf className="w-4 h-4 text-emerald-500" aria-hidden />
        <h4 className="text-xs text-gray-500 uppercase tracking-wider font-medium">ESG scores</h4>
        <a
          href={data.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-slate-500 hover:text-[#E1463E] flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          Open Sustainability Index
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-slate-400">E</span>
          </div>
          <span className="text-sm font-semibold text-white">{scoreLabel(data.environmental)}</span>
        </div>
        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs text-slate-400">S</span>
          </div>
          <span className="text-sm font-semibold text-white">{scoreLabel(data.social)}</span>
        </div>
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-slate-400">G</span>
          </div>
          <span className="text-sm font-semibold text-white">{scoreLabel(data.governance)}</span>
        </div>
      </div>
    </div>
  );
}
