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
import { Loader2, ExternalLink, Sparkles, TrendingUp, BookOpen, Users, AlertTriangle, Building2, Quote, Clock, History } from 'lucide-react';

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
  comparable_events?: Array<{
    event: string;
    date: string;
    outcome: string;
  }>;
  key_stakeholders?: Array<{
    name: string;
    role: string;
    impact: string;
  }>;
  risk_factors?: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  impacted_sectors?: Array<{
    sector: string;
    impact_level: 'low' | 'medium' | 'high';
    reasoning: string;
  }>;
  expert_quotes?: Array<{
    quote: string;
    source: string;
    date?: string;
  }>;
  timeline?: Array<{
    date: string;
    event: string;
  }>;
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
      
      // Extract sector and region from signal if available
      // Try to extract from title/summary if not directly available
      let sector: string | undefined = undefined;
      let region: string | undefined = undefined;
      
      // Common sector keywords
      const sectorKeywords: Record<string, string> = {
        'energy': 'Energy',
        'oil': 'Energy',
        'gas': 'Energy',
        'renewable': 'Energy',
        'defense': 'Defense',
        'military': 'Defense',
        'technology': 'Technology',
        'semiconductor': 'Technology',
        'chip': 'Technology',
        'mining': 'Materials',
        'supply chain': 'Supply Chain',
        'manufacturing': 'Manufacturing',
        'finance': 'Financial',
        'banking': 'Financial',
        'agriculture': 'Agriculture',
        'food': 'Agriculture',
      };
      
      // Common region keywords
      const regionKeywords: Record<string, string> = {
        'china': 'Asia',
        'russia': 'Europe',
        'europe': 'Europe',
        'nato': 'Europe',
        'middle east': 'Middle East',
        'south america': 'South America',
        'africa': 'Africa',
        'asia': 'Asia',
        'pacific': 'Asia-Pacific',
      };
      
      // Try to extract sector from title/summary
      const signalText = `${signal.title} ${signalSummary}`.toLowerCase();
      for (const [keyword, sectorName] of Object.entries(sectorKeywords)) {
        if (signalText.includes(keyword)) {
          sector = sectorName;
          break;
        }
      }
      
      // Try to extract region from title/summary
      for (const [keyword, regionName] of Object.entries(regionKeywords)) {
        if (signalText.includes(keyword)) {
          region = regionName;
          break;
        }
      }
      
      const response = await enrichSignalWithPerplexity(signal.id, {
        signalTitle: signal.title,
        signalSummary: signalSummary,
        sector,
        region,
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

          {enrichment.comparable_events && enrichment.comparable_events.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-text-secondary" />
                <h4 className="text-sm font-semibold text-text-primary">Comparable Past Events</h4>
              </div>
              <div className="space-y-3">
                {enrichment.comparable_events.map((event, idx) => (
                  <div key={idx} className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-lg">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm font-medium text-text-primary">{event.event}</span>
                      <span className="text-xs text-text-tertiary ml-2">{event.date}</span>
                    </div>
                    <p className="text-xs text-text-secondary">{event.outcome}</p>
                  </div>
                ))}
              </div>
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

          {enrichment.expert_quotes && enrichment.expert_quotes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Quote className="w-4 h-4 text-text-secondary" />
                <h4 className="text-sm font-semibold text-text-primary">Expert Quotes</h4>
              </div>
              <div className="space-y-3">
                {enrichment.expert_quotes.map((quote, idx) => (
                  <div key={idx} className="p-3 bg-white/[0.03] border-l-2 border-[#E1463E] rounded">
                    <p className="text-sm text-text-secondary italic mb-2">"{quote.quote}"</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-tertiary">— {quote.source}</span>
                      {quote.date && <span className="text-xs text-text-tertiary">{quote.date}</span>}
                    </div>
                  </div>
                ))}
              </div>
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

          {enrichment.impacted_sectors && enrichment.impacted_sectors.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-text-secondary" />
                <h4 className="text-sm font-semibold text-text-primary">Impacted Sectors</h4>
              </div>
              <div className="space-y-2">
                {enrichment.impacted_sectors.map((sector, idx) => (
                  <div key={idx} className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text-primary">{sector.sector}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        sector.impact_level === 'high' ? 'bg-red-500/20 text-red-400' :
                        sector.impact_level === 'medium' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {sector.impact_level.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{sector.reasoning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {enrichment.key_stakeholders && enrichment.key_stakeholders.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-text-secondary" />
                <h4 className="text-sm font-semibold text-text-primary">Key Stakeholders Affected</h4>
              </div>
              <div className="space-y-2">
                {enrichment.key_stakeholders.map((stakeholder, idx) => (
                  <div key={idx} className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-lg">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <span className="text-sm font-medium text-text-primary">{stakeholder.name}</span>
                        <span className="text-xs text-text-tertiary ml-2">— {stakeholder.role}</span>
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary">{stakeholder.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {enrichment.risk_factors && enrichment.risk_factors.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-text-secondary" />
                <h4 className="text-sm font-semibold text-text-primary">Risk Factors</h4>
              </div>
              <div className="space-y-2">
                {enrichment.risk_factors.map((risk, idx) => (
                  <div key={idx} className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text-primary">{risk.factor}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        risk.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                        risk.severity === 'medium' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {risk.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{risk.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {enrichment.timeline && enrichment.timeline.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-text-secondary" />
                <h4 className="text-sm font-semibold text-text-primary">Timeline of Similar Events</h4>
              </div>
              <div className="space-y-2">
                {enrichment.timeline.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-2">
                    <div className="flex-shrink-0 w-20 text-xs text-text-tertiary">{item.date}</div>
                    <div className="flex-1 text-sm text-text-secondary">{item.event}</div>
                  </div>
                ))}
              </div>
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
          <h3 className="text-sm font-semibold text-text-primary mb-1">Enrich with Perplexity AI</h3>
          <p className="text-xs text-text-secondary">
            Get comprehensive analysis: comparable past events, expert quotes, impacted sectors, risk factors, and key stakeholders
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
