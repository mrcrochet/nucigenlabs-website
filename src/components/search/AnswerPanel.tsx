/**
 * Answer Panel - Perplexity Style
 * 
 * Displays synthesized answer with hyperlinked sources
 * Each sentence/paragraph shows its sources like "banquemondiale +2"
 */

import { useState, useEffect } from 'react';
import { ExternalLink, Loader2, Sparkles } from 'lucide-react';
import type { SearchResult } from '../../types/search';

interface SourceMapping {
  text: string;
  sourceIds: string[];
  sourceNames: string[];
}

interface AnswerSection {
  id: string;
  title?: string;
  content: string;
  sourceMappings: SourceMapping[];
  sources: Array<{
    id: string;
    name: string;
    url: string;
    count: number;
    resultId: string;
  }>;
}

interface SynthesizedAnswer {
  summary: string;
  sections: AnswerSection[];
  totalSources: number;
  sourceList: Array<{
    id: string;
    name: string;
    url: string;
    title: string;
    resultId: string;
  }>;
}

interface AnswerPanelProps {
  query: string;
  results: SearchResult[];
  onSourceClick?: (resultId: string) => void;
}

export default function AnswerPanel({
  query,
  results,
  onSourceClick,
}: AnswerPanelProps) {
  const [answer, setAnswer] = useState<SynthesizedAnswer | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (results.length === 0) {
      setAnswer(null);
      return;
    }

    const synthesize = async () => {
      setIsLoading(true);

      try {
        const response = await fetch('/api/search/synthesize-answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            results: results.slice(0, 20), // Limit to top 20
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to synthesize answer');
        }

        const data = await response.json();
        if (data.success && data.answer) {
          setAnswer(data.answer);
        } else {
          throw new Error(data.error || 'Failed to synthesize');
        }
      } catch (err: any) {
        console.error('[AnswerPanel] Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    synthesize();
  }, [query, results]);

  // Render source citation (e.g., "banquemondiale +2")
  const renderSourceCitation = (sources: Array<{ name: string; count: number; resultId: string }>) => {
    if (sources.length === 0) return null;

    // Group by name and sum counts
    const grouped = new Map<string, { count: number; resultId: string }>();
    sources.forEach(s => {
      const existing = grouped.get(s.name);
      if (existing) {
        existing.count += s.count;
      } else {
        grouped.set(s.name, { count: s.count, resultId: s.resultId });
      }
    });

    const sourceArray = Array.from(grouped.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3); // Show max 3 sources

    return (
      <span className="inline-flex items-center gap-1 ml-2">
        {sourceArray.map(([name, data], idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.preventDefault();
              if (onSourceClick) {
                onSourceClick(data.resultId);
              }
            }}
            className="text-xs text-[#E1463E] hover:text-[#E1463E]/80 hover:underline font-medium"
            title={`${name} (${data.count} citation${data.count > 1 ? 's' : ''})`}
          >
            {name}{data.count > 1 ? ` +${data.count}` : ''}
          </button>
        ))}
        {sourceArray.length < sources.length && (
          <span className="text-xs text-text-tertiary">
            +{sources.length - sourceArray.length}
          </span>
        )}
      </span>
    );
  };

  // Split content into sentences and map to sources
  const renderContentWithSources = (section: AnswerSection) => {
    const sentences = section.content.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    
    return sentences.map((sentence, idx) => {
      // Find matching source mapping
      const matchingMapping = section.sourceMappings.find(mapping => 
        sentence.toLowerCase().includes(mapping.text.toLowerCase().substring(0, 50))
      );

      if (matchingMapping && matchingMapping.sourceNames.length > 0) {
        const sources = matchingMapping.sourceNames.map(name => {
          const source = section.sources.find(s => s.name === name);
          return source || { name, count: 1, resultId: '' };
        });

        return (
          <span key={idx}>
            {sentence.trim()}
            {renderSourceCitation(sources)}
            {idx < sentences.length - 1 ? ' ' : ''}
          </span>
        );
      }

      return <span key={idx}>{sentence.trim()}{idx < sentences.length - 1 ? ' ' : ''}</span>;
    });
  };

  if (isLoading) {
    return (
      <div className="bg-background-glass-subtle border border-borders-subtle rounded-lg p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 text-[#E1463E] animate-spin" />
          <span className="text-text-secondary">Synthesizing answer...</span>
        </div>
      </div>
    );
  }

  if (!answer || answer.sections.length === 0) {
    return null;
  }

  return (
    <div className="bg-background-glass-subtle border border-borders-subtle rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-[#E1463E]" />
          <h2 className="text-lg font-semibold text-text-primary">Answer</h2>
        </div>
        {answer.totalSources > 0 && (
          <span className="text-sm text-text-secondary">
            {answer.totalSources} source{answer.totalSources > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Summary */}
      {answer.summary && (
        <div className="prose prose-invert max-w-none">
          <p className="text-base text-text-primary leading-relaxed">
            {answer.summary}
          </p>
        </div>
      )}

      {/* Sections */}
      {answer.sections.map((section) => (
        <div key={section.id} className="space-y-3">
          {section.title && (
            <h3 className="text-base font-semibold text-text-primary">
              {section.title}
            </h3>
          )}
          
          <div className="prose prose-invert max-w-none">
            <div className="text-sm text-text-primary leading-relaxed space-y-2">
              {renderContentWithSources(section)}
            </div>
          </div>

          {/* Section Sources */}
          {section.sources.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-borders-subtle">
              {section.sources.map((source) => (
                <a
                  key={source.id}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (onSourceClick) {
                      e.preventDefault();
                      onSourceClick(source.resultId);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-background-glass-medium hover:bg-background-glass-strong border border-borders-subtle rounded text-xs text-text-secondary hover:text-text-primary transition-colors"
                  title={source.name}
                >
                  <span>{source.name}</span>
                  {source.count > 1 && (
                    <span className="text-[#E1463E]">+{source.count}</span>
                  )}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Footer: All Sources */}
      {answer.sourceList.length > 0 && (
        <div className="pt-4 border-t border-borders-subtle">
          <p className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wide">
            All Sources
          </p>
          <div className="flex flex-wrap gap-2">
            {answer.sourceList.map((source) => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (onSourceClick) {
                    e.preventDefault();
                    onSourceClick(source.resultId);
                  }
                }}
                className="inline-flex items-center gap-1 px-2 py-1 bg-background-glass-medium hover:bg-background-glass-strong border border-borders-subtle rounded text-xs text-text-secondary hover:text-text-primary transition-colors"
                title={source.title}
              >
                <span>{source.name}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
