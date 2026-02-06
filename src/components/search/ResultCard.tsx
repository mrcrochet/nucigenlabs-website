/**
 * Result Card (Evidence card) – analyst-grade, Detective-aligned
 * Source-first, relevance/credibility scoring, minimal serious tone.
 */

import { ExternalLink, Search, AlertCircle } from 'lucide-react';
import CollectionsMenu from './CollectionsMenu';
import SourceCredibility, { CredibilityBadge } from './SourceCredibility';
import SentimentAnalysis from './SentimentAnalysis';
import type { SearchResult } from '../../types/search';

interface ResultCardProps {
  result: SearchResult;
  onClick: () => void;
  onExploreDeeper: () => void;
}

// Extract domain from URL
function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

// Get source name from domain
function getSourceName(domain: string, fallback: string): string {
  // Extract readable name from domain
  const parts = domain.split('.');
  if (parts.length >= 2) {
    const name = parts[parts.length - 2]; // e.g., "banquemondiale" from "banquemondiale.org"
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  return fallback || domain;
}

// Credibility score 0–100 from result
function getCredibilityScore(result: SearchResult): number {
  const domain = getDomain(result.url);
  const known: Record<string, number> = {
    'reuters.com': 95,
    'ap.org': 95,
    'bbc.com': 90,
    'ft.com': 92,
    'wsj.com': 90,
    'economist.com': 88,
  };
  if (known[domain]) return known[domain];
  return Math.min(100, Math.round((result.sourceScore || 0.5) * 100));
}

export default function ResultCard({ result, onClick, onExploreDeeper }: ResultCardProps) {
  const domain = getDomain(result.url);
  const sourceName = getSourceName(domain, result.source);
  const initials = sourceName.substring(0, 2).toUpperCase();
  const relevancePct = Math.round((result.relevanceScore || 0) * 100);
  const credibilityPct = getCredibilityScore(result);
  const hasLowCredibility = credibilityPct < 50;

  return (
    <div
      className="border border-gray-800 bg-gray-900/30 hover:border-gray-700 transition-all cursor-pointer p-5 min-w-0"
      onClick={onClick}
    >
      <div className="space-y-3 min-w-0">
        {/* Source Header – Detective style */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 flex-shrink-0 bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-300">{sourceName}</div>
              <div className="text-xs text-gray-600 truncate">{domain}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <CollectionsMenu result={result} />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                window.open(result.url, '_blank');
              }}
              className="p-1.5 hover:bg-gray-800 border border-gray-800 transition-colors text-gray-500 hover:text-gray-400"
              title="Open source"
              aria-label="Open source"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onExploreDeeper();
              }}
              className="p-1.5 hover:bg-gray-800 border border-gray-800 transition-colors text-gray-500 hover:text-red-400"
              title="Explore deeper"
              aria-label="Explore deeper"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-gray-200 mb-3 leading-snug break-words line-clamp-2">
          {result.title}
        </h3>

        {/* Summary */}
        <p className="text-sm text-gray-400 leading-relaxed mb-4 break-words line-clamp-3">
          {result.summary}
        </p>

        {/* Tags */}
        {result.tags && result.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {result.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-800/50 border border-gray-700 text-xs text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <SentimentAnalysis result={result} />

        {/* Metadata – Detective style */}
        <div className="flex items-center gap-4 text-xs pt-4 border-t border-gray-800 flex-wrap">
          <span className="text-gray-500">
            {new Date(result.publishedAt).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
          {relevancePct > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full shrink-0" aria-hidden />
              <span className="text-gray-400">{relevancePct}% relevant</span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" aria-hidden />
            <span className="text-amber-400">{credibilityPct}% credible</span>
          </span>
          {hasLowCredibility && <CredibilityBadge result={result} />}
        </div>
      </div>
    </div>
  );
}
