/**
 * Real-time Corporate Impact query via Perplexity API.
 * User can ask a question; optional industry context is sent with the query.
 */

import { useState } from 'react';
import { Send, Loader2, ExternalLink, Sparkles } from 'lucide-react';
import { safeFetchJson } from '../../lib/safe-fetch-json';

interface CorporateImpactPerplexityQueryProps {
  /** Pre-fill industry context from current filter (e.g. selected industries) */
  industries?: string[];
}

export default function CorporateImpactPerplexityQuery({ industries = [] }: CorporateImpactPerplexityQueryProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    answer: string;
    citations: string[];
    related_questions?: string[];
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const json = await safeFetchJson<{ success: boolean; data?: typeof result; error?: string }>(
        '/api/corporate-impact/perplexity-query',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: q,
            industries: industries.length > 0 ? industries : undefined,
          }),
        }
      );
      if (!json.success) {
        setError(json.error || 'Request failed');
        return;
      }
      setResult(json.data ?? null);
    } catch (err: any) {
      setError(err?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.1] rounded-xl p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-[#E1463E]" />
        <h3 className="font-semibold text-white text-sm">Recherche en temps réel (Perplexity)</h3>
      </div>
      <p className="text-slate-400 text-xs font-light mb-4">
        Posez une question sur l’impact corporate ; la réponse est générée en direct via Perplexity.
        {industries.length > 0 && (
          <span className="block mt-1">Contexte : {industries.join(', ')}</span>
        )}
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex. Quels secteurs sont les plus exposés aux tensions sur les semi-conducteurs ?"
          className="flex-1 px-4 py-2.5 bg-white/[0.06] border border-white/[0.12] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2.5 bg-[#E1463E] hover:bg-[#E1463E]/90 disabled:opacity-50 text-white rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Envoyer
        </button>
      </form>
      {error && (
        <p className="mt-3 text-sm text-[#E1463E]">{error}</p>
      )}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Carte principale : Réponse */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.15] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.08] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E1463E]" />
              <span className="text-sm font-semibold text-white">Réponse</span>
            </div>
            <div className="p-4">
              <p className="text-slate-300 font-light text-sm leading-relaxed whitespace-pre-wrap">{result.answer}</p>
            </div>
          </div>

          {/* Carte : Sources */}
          {result.citations && result.citations.length > 0 && (
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.15] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.08] flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-white">Sources</span>
                <span className="text-xs text-slate-500">({result.citations.length})</span>
              </div>
              <div className="p-4 space-y-2">
                {result.citations.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all group"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-[#E1463E] flex-shrink-0" />
                    <span className="text-sm text-slate-300 group-hover:text-white truncate">
                      {url.replace(/^https?:\/\//, '').split('/')[0]}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Carte : Questions liées */}
          {result.related_questions && result.related_questions.length > 0 && (
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.15] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.08]">
                <span className="text-sm font-semibold text-white">Questions liées</span>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {result.related_questions.slice(0, 5).map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setQuery(q)}
                    className="px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-slate-300 text-sm font-light hover:bg-[#E1463E]/10 hover:border-[#E1463E]/30 hover:text-white transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
