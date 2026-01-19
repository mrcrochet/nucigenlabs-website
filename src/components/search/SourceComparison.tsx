/**
 * Source Comparison View
 * 
 * Compare multiple sources reporting on the same topic
 * Highlights differences, consensus, and contradictions
 */

import { useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { SearchResult } from '../../types/search';

interface SourceComparisonProps {
  results: SearchResult[];
  onClose?: () => void;
}

interface ComparisonMetrics {
  consensus: number; // 0-1
  contradictions: number;
  uniqueClaims: string[];
  commonClaims: string[];
  sourceCount: number;
}

function calculateConsensus(results: SearchResult[]): ComparisonMetrics {
  // Extract key claims from summaries
  const claims = results.map(r => {
    const sentences = r.summary.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 3); // Top 3 sentences per result
  });

  // Find common claims (simplified - in production, use NLP)
  const allClaims = claims.flat();
  const claimCounts = new Map<string, number>();
  allClaims.forEach(claim => {
    const normalized = claim.toLowerCase().trim();
    claimCounts.set(normalized, (claimCounts.get(normalized) || 0) + 1);
  });

  const commonClaims = Array.from(claimCounts.entries())
    .filter(([_, count]) => count >= 2)
    .map(([claim, _]) => claim);

  const uniqueClaims = Array.from(claimCounts.entries())
    .filter(([_, count]) => count === 1)
    .map(([claim, _]) => claim);

  // Calculate consensus (simplified)
  const consensus = commonClaims.length / Math.max(allClaims.length, 1);
  const contradictions = Math.max(0, results.length - commonClaims.length - 1);

  return {
    consensus: Math.min(1, consensus),
    contradictions,
    uniqueClaims: uniqueClaims.slice(0, 5),
    commonClaims: commonClaims.slice(0, 5),
    sourceCount: results.length,
  };
}

export default function SourceComparison({ results, onClose }: SourceComparisonProps) {
  const [selectedResults, setSelectedResults] = useState<Set<string>>(
    new Set(results.slice(0, 3).map(r => r.id))
  );

  const filteredResults = results.filter(r => selectedResults.has(r.id));
  const metrics = calculateConsensus(filteredResults);

  const toggleResult = (resultId: string) => {
    const newSelected = new Set(selectedResults);
    if (newSelected.has(resultId)) {
      newSelected.delete(resultId);
    } else {
      newSelected.add(resultId);
    }
    setSelectedResults(newSelected);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background-overlay/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-4 sm:inset-8 bg-background-elevated border border-borders-subtle rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-borders-subtle">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Source Comparison</h2>
            <p className="text-sm text-text-tertiary mt-1">
              Compare {results.length} sources reporting on this topic
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-background-glass-subtle rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          )}
        </div>

        {/* Metrics Bar */}
        <div className="p-4 bg-background-glass-subtle border-b border-borders-subtle">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <div>
                <div className="text-xs text-text-tertiary">Consensus</div>
                <div className="text-sm font-semibold text-text-primary">
                  {(metrics.consensus * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <div>
                <div className="text-xs text-text-tertiary">Contradictions</div>
                <div className="text-sm font-semibold text-text-primary">
                  {metrics.contradictions}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <div>
                <div className="text-xs text-text-tertiary">Unique Claims</div>
                <div className="text-sm font-semibold text-text-primary">
                  {metrics.uniqueClaims.length}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <div>
                <div className="text-xs text-text-tertiary">Sources</div>
                <div className="text-sm font-semibold text-text-primary">
                  {selectedResults.size} selected
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Source Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Select Sources to Compare</h3>
            <div className="flex flex-wrap gap-2">
              {results.map((result) => {
                const isSelected = selectedResults.has(result.id);
                return (
                  <button
                    key={result.id}
                    onClick={() => toggleResult(result.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-primary/20 text-primary border border-primary/50'
                        : 'bg-background-glass-subtle text-text-secondary hover:text-text-primary border border-borders-subtle'
                    }`}
                  >
                    {result.source}
                    {isSelected && <CheckCircle className="w-3 h-3 inline ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Common Claims */}
          {metrics.commonClaims.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Common Claims (Consensus)
              </h3>
              <div className="space-y-2">
                {metrics.commonClaims.map((claim, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-text-primary"
                  >
                    {claim}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unique Claims */}
          {metrics.uniqueClaims.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                Unique Claims (Requires Verification)
              </h3>
              <div className="space-y-2">
                {metrics.uniqueClaims.map((claim, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-text-primary"
                  >
                    {claim}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source Details */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">Source Details</h3>
            <div className="space-y-4">
              {filteredResults.map((result) => (
                <div
                  key={result.id}
                  className="p-4 bg-background-glass-subtle border border-borders-subtle rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary">{result.source}</h4>
                      <p className="text-xs text-text-tertiary">
                        {new Date(result.publishedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View Source
                    </a>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{result.summary}</p>
                  {result.relevanceScore > 0 && (
                    <div className="mt-2 text-xs text-text-tertiary">
                      Relevance: {(result.relevanceScore * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
