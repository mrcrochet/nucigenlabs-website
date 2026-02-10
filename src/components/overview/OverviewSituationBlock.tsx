/**
 * Overview Situation Block – Perplexity-powered brief (global or by country).
 * Sobre, high-tech: carte rectangulaire, texte concis.
 */

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { getOverviewSituation } from '../../lib/api/overview-api';

export interface OverviewSituationBlockProps {
  /** When set, fetches situation for this country; otherwise global. */
  country?: string | null;
}

export default function OverviewSituationBlock({ country = null }: OverviewSituationBlockProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSummary(null);
    getOverviewSituation({ country: country || undefined })
      .then((data) => {
        if (cancelled) return;
        setSummary(data.summary);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [country]);

  const label = country ? `Situation — ${country}` : 'Situation — Global';

  return (
    <div className="rounded-lg border border-white/[0.06] bg-black/50 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.06]">
        <Sparkles className="w-3.5 h-3.5 text-cyan-500/80" aria-hidden />
        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
          {label}
        </span>
      </div>
      <div className="p-3 min-h-[4rem]">
        {loading && (
          <div className="flex items-center gap-2 text-zinc-500">
            <div className="w-4 h-4 rounded-full border-2 border-cyan-500/30 border-t-cyan-500/80 animate-spin" />
            <span className="text-[11px]">Perplexity…</span>
          </div>
        )}
        {error && (
          <p className="text-[11px] text-zinc-500 uppercase tracking-wider">
            {error}
          </p>
        )}
        {!loading && !error && summary && (
          <p className="text-[11px] text-zinc-300 leading-relaxed">
            {summary}
          </p>
        )}
      </div>
    </div>
  );
}
