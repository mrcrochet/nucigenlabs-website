/**
 * EventEnrichment - Enrichissement Perplexity on-demand pour événements
 * 
 * Affiche un bouton pour enrichir l'événement avec Perplexity
 * et montre le contexte enrichi une fois chargé
 */

import { useState } from 'react';
import { Sparkles, Loader2, ExternalLink } from 'lucide-react';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import { chatWithPerplexity } from '../../lib/api/perplexity-api';
import type { Event } from '../../types/intelligence';

interface EventEnrichmentProps {
  event: Event;
}

export default function EventEnrichment({ event }: EventEnrichmentProps) {
  const [enriched, setEnriched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enrichmentData, setEnrichmentData] = useState<{
    context?: string;
    citations?: string[];
    related_questions?: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEnrich = async () => {
    if (enriched || loading) return;

    setLoading(true);
    setError(null);

    try {
      // Build query for Perplexity
      const query = `Provide context and analysis for this geopolitical/industrial event:

Title: ${event.headline || event.title}
Summary: ${event.summary || 'No summary available'}
${event.location ? `Location: ${event.location}` : ''}
${event.sector ? `Sector: ${event.sector}` : ''}
${event.region ? `Region: ${event.region}` : ''}

Provide:
1. Historical context: Similar events in the past and their outcomes
2. Current significance: Why this event matters now
3. Potential implications: What to watch for
4. Citations: Reliable sources for this information`;

      const response = await chatWithPerplexity({
        messages: [
          {
            role: 'system',
            content: 'You are a geopolitical and industrial intelligence analyst. Provide detailed, factual context with citations.',
          },
          {
            role: 'user',
            content: query,
          },
        ],
        model: 'sonar-pro',
        options: {
          return_citations: true,
          return_related_questions: true,
          max_tokens: 1500,
        },
      });

      if (response.success && response.data) {
        const content = response.data.choices[0]?.message?.content || '';
        const citations = response.data.choices[0]?.message?.citations || response.data.citations || [];
        const relatedQuestions = response.data.related_questions || [];

        setEnrichmentData({
          context: content,
          citations,
          related_questions: relatedQuestions,
        });
        setEnriched(true);
      } else {
        throw new Error(response.error || 'Failed to enrich event');
      }
    } catch (err: any) {
      console.error('[EventEnrichment] Error:', err);
      setError(err.message || 'Failed to enrich event');
    } finally {
      setLoading(false);
    }
  };

  if (!enriched && !loading && !error) {
    return (
      <Card>
        <button
          onClick={handleEnrich}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-background-glass-subtle border border-borders-subtle rounded-lg hover:bg-background-glass-medium hover:border-borders-medium transition-colors text-text-primary"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Enrich with Perplexity</span>
        </button>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="w-4 h-4 animate-spin text-primary-red" />
          <span className="text-sm text-text-secondary">Enriching event context...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-sm text-red-500 py-2">{error}</div>
        <button
          onClick={handleEnrich}
          className="mt-2 text-xs text-text-secondary hover:text-text-primary"
        >
          Try again
        </button>
      </Card>
    );
  }

  if (!enrichmentData) {
    return null;
  }

  return (
    <Card>
      <SectionHeader title="Enriched Context" />
      
      <div className="space-y-4 mt-4">
        {enrichmentData.context && (
          <div>
            <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">
              {enrichmentData.context}
            </p>
          </div>
        )}

        {enrichmentData.citations && enrichmentData.citations.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">
              Citations
            </h4>
            <div className="space-y-1">
              {enrichmentData.citations.map((citation, index) => (
                <a
                  key={index}
                  href={citation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-text-secondary hover:text-primary-red transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="truncate">{citation}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {enrichmentData.related_questions && enrichmentData.related_questions.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">
              Related Questions
            </h4>
            <div className="space-y-1">
              {enrichmentData.related_questions.map((question, index) => (
                <p key={index} className="text-xs text-text-tertiary italic">
                  {question}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
