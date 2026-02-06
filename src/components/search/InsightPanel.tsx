/**
 * Insight Panel
 * 
 * Displays dynamic insights extracted from search results
 * Shows "What we see so far" with key information even before full results
 */

import { useMemo } from 'react';
import { TrendingUp, Users, AlertTriangle, FileText } from 'lucide-react';
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

  // Empty state – Detective style
  if (!insights || (results.length === 0 && graph.nodes.length === 0)) {
    return (
      <div className="h-full flex flex-col">
        <div className="border border-gray-800 bg-gray-900/30 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-semibold text-gray-300">What we see so far</h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mb-4">
            Start by running a search or pasting a URL. Synthesis and key actors will appear here.
          </p>
          <div className="space-y-1">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Try</p>
            {['DRC cobalt sanctions', 'China supply chain risks', 'EU trade policy'].map((example, idx) => (
              <button
                key={idx}
                type="button"
                className="block w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border border-gray-800 bg-gray-900/30 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-semibold text-gray-300">What we see so far</h3>
        </div>

        <div className="space-y-4 text-xs">
          {insights.mainEvent && (
            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <FileText className="w-3 h-3" />
                <span className="uppercase tracking-wider font-medium">Main Event</span>
              </div>
              <p className="text-gray-400 leading-relaxed">{insights.mainEvent}</p>
            </div>
          )}

          {insights.keyActors.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Users className="w-3 h-3" />
                <span className="uppercase tracking-wider font-medium">Key Actors</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {insights.keyActors.map((actor, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-gray-800/50 border border-gray-700 text-gray-400"
                  >
                    {actor.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {insights.exposure && (
            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <AlertTriangle className="w-3 h-3" />
                <span className="uppercase tracking-wider font-medium">Potential Exposure</span>
              </div>
              <p className="text-gray-400">{insights.exposure}</p>
            </div>
          )}

          {insights.sectors.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <FileText className="w-3 h-3" />
                <span className="uppercase tracking-wider font-medium">Related Sectors</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {insights.sectors.map((sector, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-gray-800/50 border border-gray-700 text-gray-400"
                  >
                    {sector}
                  </span>
                ))}
              </div>
            </div>
          )}

          <TopClaimsPanel results={results} />

          <div className="pt-4 border-t border-gray-800 space-y-2">
            {results.length > 0 && onViewResults && (
              <button
                type="button"
                onClick={onViewResults}
                className="w-full px-4 py-2 border border-gray-800 hover:bg-gray-800 text-xs text-gray-400 transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-3 h-3" />
                View Full Results ({results.length})
              </button>
            )}
            {onGenerateImpactBrief && (
              <button
                type="button"
                onClick={onGenerateImpactBrief}
                className="w-full px-4 py-2 bg-red-900/20 border border-red-900/50 hover:bg-red-900/30 text-xs text-red-400 transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-3 h-3" />
                Generate Impact Brief
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
