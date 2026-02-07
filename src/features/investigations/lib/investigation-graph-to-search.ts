/**
 * Adapter: InvestigationGraph → Search KnowledgeGraph (D3 force-directed).
 * Enquêtes utilise la même chaîne que Search (Tavily → extractEntities → extractRelationships → buildGraph) ;
 * le graphe est persisté en InvestigationGraph puis reconverti ici pour le même composant KnowledgeGraph.
 * Réponse = graphe issu de la requête envoyée par l'utilisateur (hypothèse / message).
 */

import type {
  InvestigationGraph,
  InvestigationGraphNode,
  InvestigationGraphEdge,
} from '../../../types/investigation-graph';
import type { KnowledgeGraph, GraphNode, GraphLink } from '../../../types/search';

type SearchNodeType = GraphNode['type'];
type SearchLinkType = GraphLink['type'];

const NODE_TYPE_MAP: Record<InvestigationGraphNode['type'], SearchNodeType> = {
  event: 'event',
  actor: 'person',
  resource: 'commodity',
  decision: 'event',
  impact: 'event',
};

const EDGE_TYPE_MAP: Record<InvestigationGraphEdge['relation'], SearchLinkType> = {
  causes: 'causes',
  influences: 'related_to',
  funds: 'related_to',
  restricts: 'related_to',
  supports: 'related_to',
  weakens: 'related_to',
  triggers: 'precedes',
};

export function investigationGraphToSearchKnowledgeGraph(inv: InvestigationGraph): KnowledgeGraph {
  const nodes: GraphNode[] = inv.nodes.map((n) => ({
    id: n.id,
    type: NODE_TYPE_MAP[n.type],
    label: n.label,
    data: { date: n.date, sources: n.sources },
    confidence: n.confidence / 100,
    sourceCount: n.sources?.length ?? 0,
    validFrom: n.date ?? undefined,
  }));

  const links: GraphLink[] = inv.edges.map((e) => ({
    source: e.from,
    target: e.to,
    type: EDGE_TYPE_MAP[e.relation],
    strength: e.strength,
    confidence: e.confidence / 100,
  }));

  return { nodes, links };
}
