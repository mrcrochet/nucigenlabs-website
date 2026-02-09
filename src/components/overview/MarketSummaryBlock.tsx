/**
 * Market summary — daily digest from GET /api/market-digest (Perplexity).
 */

import { useState, useEffect } from 'react';
import { BarChart3, ExternalLink, Loader2 } from 'lucide-react';
import { apiUrl } from '../../lib/api-base';

interface MarketDigestData {
  summary: string;
  sources: { title: string; url: string }[];
  generatedAt: string;
}

export default function MarketSummaryBlock() {
  const [data, setData] = useState<MarketDigestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl('/api/market-digest'))
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success && json.data) setData(json.data);
        else setError(true);
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
  }, []);

  if (loading) {
    return (
      <div className="col-span-1 sm:col-span-12 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 flex items-center justify-center gap-2 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Market summary…</span>
      </div>
    );
  }

  if (error || !data) return null;

  return (
    <div className="col-span-1 sm:col-span-12 rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-4 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-[#E1463E]/20 ring-1 ring-[#E1463E]/20">
          <BarChart3 className="w-5 h-5 text-[#E1463E]" />
        </div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Market summary</h2>
        <span className="text-xs text-slate-500 ml-auto">
          {new Date(data.generatedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>
      <div className="prose prose-invert prose-sm max-w-none">
        <p className="text-slate-300 leading-relaxed whitespace-pre-line">{data.summary}</p>
      </div>
      {data.sources.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/[0.06]">
          <p className="text-xs text-slate-500 mb-2">Sources</p>
          <div className="flex flex-wrap gap-2">
            {data.sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.06] text-slate-400 hover:text-[#E1463E] text-xs transition-colors"
              >
                {s.title}
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
