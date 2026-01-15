/**
 * SignalEnrichment - Component to enrich signals with Perplexity
 * 
 * Shows enriched context when user clicks "Enrich with Perplexity"
 */

import { useState } from 'react';
import { enrichSignalWithPerplexity } from '../../lib/api/perplexity-api';
import type { Signal } from '../../types/intelligence';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Loader2, ExternalLink, Sparkles, TrendingUp, BookOpen } from 'lucide-react';

interface SignalEnrichmentProps {
  signal: Signal;
  userPreferences?: {
    preferred_sectors?: string[];
    preferred_regions?: string[];
  };
}

interface EnrichmentData {
  historical_context?: string;
  expert_analysis?: string;
  market_implications?: string;
  citations?: string[];
  related_questions?: string[];
  confidence?: number;
}

export default function SignalEnrichment({ signal, userPreferences }: SignalEnrichmentProps) {
  const [enrichment, setEnrichment] = useState<EnrichmentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enriched, setEnriched] = useState(false);

  const handleEnrich = async () => {
    if (enriched) return; // Already enriched

    setLoading(true);
    setError(null);

    try {
      // Ensure we have at least a summary
      const signalSummary = signal.summary || signal.why_it_matters || 'Signal detected with significant implications';
      
      const response = await enrichSignalWithPerplexity(signal.id, {
        signalTitle: signal.title,
        signalSummary: signalSummary,
        sector: undefined, // Will be extracted from signal if needed
        region: undefined, // Will be extracted from signal if needed
        user_preferences: userPreferences,
      });

      if (response.success && response.data) {
        setEnrichment(response.data);
        setEnriched(true);
        setError(null);
      } else {
        const errorMsg = response.error || 'Failed to enrich signal';
        console.error('[SignalEnrichment] Enrichment failed:', errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to enrich signal. Please check your Perplexity API key configuration.';
      console.error('[SignalEnrichment] Error:', err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (enrichment) {
    return (
      <Card className="mt-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#E1463E]" />
            <h3 className="text-lg font-semibold text-text-primary">Enriched Analysis</h3>
            {enrichment.confidence && (
              <Badge variant="level" className="ml-2">
                {enrichment.confidence}% confidence
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {enrichment.historical_context && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-text-secondary" />
                <h4 className="text-sm font-semibold text-text-primary">Historical Context</h4>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                {enrichment.historical_context}
              </p>
            </div>
          )}

          {enrichment.expert_analysis && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-text-secondary" />
                <h4 className="text-sm font-semibold text-text-primary">Expert Analysis</h4>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                {enrichment.expert_analysis}
              </p>
            </div>
          )}

          {enrichment.market_implications && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-text-secondary" />
                <h4 className="text-sm font-semibold text-text-primary">Market Implications</h4>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                {enrichment.market_implications}
              </p>
            </div>
          )}

          {enrichment.citations && enrichment.citations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">Sources</h4>
              <div className="space-y-1">
                {enrichment.citations.map((citation, idx) => (
                  <a
                    key={idx}
                    href={citation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-text-tertiary hover:text-text-primary transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="truncate">{citation}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {enrichment.related_questions && enrichment.related_questions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">Related Questions</h4>
              <ul className="space-y-1">
                {enrichment.related_questions.map((question, idx) => (
                  <li key={idx} className="text-xs text-text-tertiary">
                    • {question}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-1">Enrich with Perplexity</h3>
          <p className="text-xs text-text-secondary">
            Get historical context, expert analysis, and market implications
          </p>
        </div>
        <button
          onClick={handleEnrich}
          disabled={loading}
          className="px-4 py-2 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white rounded-lg text-sm font-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enriching...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Enrich
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400 mb-1">Failed to enrich signal</p>
          <p className="text-xs text-red-300/70">{error}</p>
          {error.includes('API key') && (
            <p className="text-xs text-red-300/50 mt-2">
              Please check your Perplexity API key configuration in the backend.
            </p>
          )}
          <button
            onClick={() => {
              setError(null);
              setEnriched(false);
              handleEnrich();
            }}
            className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
          >
            Try again
          </button>
        </div>
      )}
    </Card>
  );
}
