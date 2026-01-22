/**
 * Insight Panel
 * 
 * Displays dynamic insights extracted from search results
 * Shows "What we see so far" with key information even before full results
 */

import { useMemo } from 'react';
import { Sparkles, TrendingUp, Users, AlertTriangle, FileText, Eye } from 'lucide-react';
import type { SearchResult, KnowledgeGraph } from '../../types/search';
import TopClaimsPanel from './TopClaimsPanel';

interface InsightPanelProps {
  results: SearchResult[];
  graph: KnowledgeGraph;
  buckets: any;
  onViewResults?: () => void;
  onGenerateImpactBrief?: () => void;
}

export default function InsightPanel({
  results,
  graph,
  buckets,
  onViewResults,
  onGenerateImpactBrief,
}: InsightPanelProps) {
  // Extract insights from results and graph
  const insights = useMemo(() => {
    if (results.length === 0 && graph.nodes.length === 0) {
      return null;
    }

    const extracted: {
      mainEvent?: string;
      keyActors: Array<{ name: string; type: string }>;
      exposure?: string;
      sectors: string[];
    } = {
      keyActors: [],
      sectors: [],
    };

    // Extract main event (most recent or highest relevance)
    if (results.length > 0) {
      const mainResult = results.sort((a, b) => {
        const dateA = new Date(a.publishedAt).getTime();
        const dateB = new Date(b.publishedAt).getTime();
        if (dateB - dateA !== 0) return dateB - dateA;
        return (b.relevanceScore || 0) - (a.relevanceScore || 0);
      })[0];

      extracted.mainEvent = mainResult.title || mainResult.summary?.substring(0, 100);
    }

    // Extract key actors from graph nodes
    const actorNodes = graph.nodes
      .filter((node: any) => ['country', 'company', 'organization', 'person'].includes(node.type))
      .slice(0, 5)
      .map((node: any) => ({
        name: node.label,
        type: node.type,
      }));

    extracted.keyActors = actorNodes;

    // Extract from results entities
    results.forEach((result) => {
      if (result.entities) {
        result.entities.forEach((entity) => {
          if (!extracted.keyActors.find((a) => a.name === entity.name)) {
            extracted.keyActors.push({
              name: entity.name,
              type: entity.type,
            });
          }
        });
      }
    });

    // Limit to top 5
    extracted.keyActors = extracted.keyActors.slice(0, 5);

    // Extract sectors from tags
    const sectorSet = new Set<string>();
    results.forEach((result) => {
      if (result.tags) {
        result.tags.forEach((tag) => {
          if (tag.length > 2 && tag.length < 30) {
            sectorSet.add(tag);
          }
        });
      }
    });
    extracted.sectors = Array.from(sectorSet).slice(0, 5);

    // Determine exposure/risk level
    if (results.length > 0) {
      const avgRelevance = results.reduce((sum, r) => sum + (r.relevanceScore || 0), 0) / results.length;
      if (avgRelevance > 0.7) {
        extracted.exposure = 'High relevance detected';
      } else if (avgRelevance > 0.5) {
        extracted.exposure = 'Moderate relevance';
      } else {
        extracted.exposure = 'Low to moderate relevance';
      }
    }

    return extracted;
  }, [results, graph]);

  // Empty state
  if (!insights || (results.length === 0 && graph.nodes.length === 0)) {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-background-glass-subtle border border-borders-subtle rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-[#E1463E]" />
            <h2 className="text-lg font-semibold text-text-primary">What we see so far</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Start exploring by searching for events, actors, or pasting a URL to analyze.
            </p>
            
            <div className="space-y-2">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Try searching for:</p>
              <div className="space-y-1">
                {['DRC cobalt sanctions', 'China supply chain risks', 'EU trade policy changes'].map((example, idx) => (
                  <button
                    key={idx}
                    className="block w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-glass-medium rounded-md transition-colors"
                    onClick={() => {
                      // This will be handled by parent
                      if (onViewResults) {
                        // Could trigger search, but for now just show placeholder
                      }
                    }}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-background-glass-subtle border border-borders-subtle rounded-lg p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-[#E1463E]" />
          <h2 className="text-lg font-semibold text-text-primary">What we see so far</h2>
        </div>

        {/* Main Event */}
        {insights.mainEvent && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-text-secondary" />
              <h3 className="text-sm font-medium text-text-primary">Main Event</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{insights.mainEvent}</p>
          </div>
        )}

        {/* Key Actors */}
        {insights.keyActors.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-text-secondary" />
              <h3 className="text-sm font-medium text-text-primary">Key Actors</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {insights.keyActors.map((actor, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-background-glass-medium border border-borders-subtle rounded text-xs text-text-secondary"
                >
                  {actor.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Exposure/Risk */}
        {insights.exposure && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-text-secondary" />
              <h3 className="text-sm font-medium text-text-primary">Potential Exposure</h3>
            </div>
            <p className="text-sm text-text-secondary">{insights.exposure}</p>
          </div>
        )}

        {/* Sectors */}
        {insights.sectors.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-text-secondary" />
              <h3 className="text-sm font-medium text-text-primary">Related Sectors</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {insights.sectors.map((sector, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-background-glass-medium border border-borders-subtle rounded text-xs text-text-secondary"
                >
                  {sector}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Top Claims / Risks / Uncertainties - PRIORITÉ PRODUIT #2 */}
        <TopClaimsPanel results={results} />

        {/* Actions */}
        <div className="pt-4 border-t border-borders-subtle space-y-2">
          {results.length > 0 && onViewResults && (
            <button
              onClick={onViewResults}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-background-glass-medium hover:bg-background-glass-strong border border-borders-subtle rounded-md text-sm font-medium text-text-primary transition-colors"
            >
              <Eye className="w-4 h-4" />
              View Full Results ({results.length})
            </button>
          )}
          {onGenerateImpactBrief && (
            <button
              onClick={onGenerateImpactBrief}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#E1463E]/20 hover:bg-[#E1463E]/30 border border-[#E1463E]/50 rounded-md text-sm font-medium text-[#E1463E] transition-colors"
            >
              <FileText className="w-4 h-4" />
              Generate Impact Brief
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
