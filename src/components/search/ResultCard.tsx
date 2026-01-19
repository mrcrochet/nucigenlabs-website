/**
 * Result Card - Perplexity Style
 * 
 * Displays a single search result with source icon, URL, and snippet
 */

import { ExternalLink, Search, Globe } from 'lucide-react';
import CollectionsMenu from './CollectionsMenu';
import SourceCredibility, { CredibilityBadge } from './SourceCredibility';
import SentimentAnalysis, { SentimentBadge } from './SentimentAnalysis';
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

// Get favicon URL
function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
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

export default function ResultCard({ result, onClick, onExploreDeeper }: ResultCardProps) {
  const domain = getDomain(result.url);
  const sourceName = getSourceName(domain, result.source);
  const faviconUrl = getFaviconUrl(domain);

  return (
    <div
      className="bg-background-glass-subtle border border-borders-subtle rounded-lg p-4 hover:border-borders-medium transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Source Header - Perplexity Style */}
        <div className="flex items-center gap-2">
          {/* Favicon */}
          <div className="flex-shrink-0 w-5 h-5 rounded overflow-hidden bg-background-glass-medium flex items-center justify-center">
            <img
              src={faviconUrl}
              alt={sourceName}
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback to globe icon if favicon fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('.fallback-icon')) {
                  const icon = document.createElement('div');
                  icon.className = 'fallback-icon';
                  icon.innerHTML = '<svg class="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>';
                  parent.appendChild(icon);
                }
              }}
            />
          </div>
          
          {/* Source Name and URL */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-secondary">{sourceName}</span>
              <span className="text-xs text-text-tertiary truncate">{domain}</span>
            </div>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-text-tertiary hover:text-primary truncate block max-w-full"
              title={result.url}
            >
              {result.url.length > 60 ? result.url.substring(0, 60) + '...' : result.url}
            </a>
          </div>
        </div>

        {/* Title - Bold and prominent */}
        <div className="flex items-start gap-2">
          <h3 className="text-base font-semibold text-text-primary line-clamp-2 leading-snug group-hover:text-primary transition-colors flex-1">
            {result.title}
          </h3>
          <CredibilityBadge result={result} />
        </div>

        {/* Snippet - Perplexity style */}
        <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
          {result.summary}
        </p>

        {/* Sentiment Analysis */}
        <SentimentAnalysis result={result} />

        {/* Meta Info */}
        <div className="flex items-center justify-between pt-2 border-t border-borders-subtle">
          <div className="flex items-center gap-4 text-xs text-text-tertiary flex-wrap">
            <span>{new Date(result.publishedAt).toLocaleDateString('fr-FR', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}</span>
            {result.relevanceScore > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                {(result.relevanceScore * 100).toFixed(0)}% relevant
              </span>
            )}
            <SourceCredibility result={result} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <CollectionsMenu result={result} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(result.url, '_blank');
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-background-glass-medium hover:bg-background-glass-strong rounded text-xs text-text-secondary hover:text-text-primary transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExploreDeeper();
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#E1463E]/20 hover:bg-[#E1463E]/30 border border-[#E1463E]/50 rounded text-xs text-[#E1463E] hover:text-[#E1463E] transition-colors"
              title="Explore deeper"
            >
              <Search className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
