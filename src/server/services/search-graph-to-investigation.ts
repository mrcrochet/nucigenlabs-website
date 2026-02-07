/**
 * Convert Search KnowledgeGraph (entity-extractor + relationship-extractor + graph-builder)
 * into InvestigationGraph (nodes, edges) for the Detective / Enquêtes cockpit.
 * Same tech as Search; output format for Investigation views and path algorithm.
 */

import type { KnowledgeGraph } from './search-orchestrator.js';
import type {
  InvestigationGraph,
  InvestigationGraphNode,
  InvestigationGraphEdge,
  InvestigationNodeType,
  InvestigationEdgeRelation,
} from '../../types/investigation-graph.js';
import { buildPaths } from '../../lib/investigation/path-algorithm.js';
import { randomUUID } from 'crypto';

const SEARCH_NODE_TYPE_TO_INVESTIGATION: Record<string, InvestigationNodeType> = {
  event: 'event',
  country: 'actor',
  company: 'actor',
  commodity: 'resource',
  organization: 'actor',
  person: 'actor',
};

/** Map to relations allowed in DB: causes, influences, restricts, supports, weakens */
const SEARCH_LINK_TYPE_TO_RELATION: Record<string, InvestigationEdgeRelation> = {
  causes: 'causes',
  precedes: 'influences',
  related_to: 'influences',
  operates_in: 'influences',
  exposes_to: 'influences',
  impacts: 'influences',
};

/**
 * Convert Search KnowledgeGraph to InvestigationGraph (nodes + edges).
 * Node ids are generated as UUIDs for DB compatibility. Paths are computed via path-algorithm.
 */
export function convertSearchGraphToInvestigation(kg: KnowledgeGraph): InvestigationGraph {
  const idMap = new Map<string, string>(); // oldId -> new UUID
  const nodes: InvestigationGraphNode[] = kg.nodes.map((n) => {
    const newId = randomUUID();
    idMap.set(n.id, newId);
    const invType = SEARCH_NODE_TYPE_TO_INVESTIGATION[n.type] ?? 'actor';
    const confidence = Math.round((n.confidence ?? 0.5) * 100);
    const label = (typeof n.label === 'string' ? n.label : (n.data?.title ?? n.data?.entity?.name) ?? '') || n.id;
    const date = n.data?.publishedAt ?? n.data?.entity?.context ?? undefined;
    return {
      id: newId,
      type: invType,
      label: label.slice(0, 300),
      date: date ? (typeof date === 'string' ? date : undefined) : undefined,
      confidence: Math.min(100, Math.max(0, confidence)),
      sources: [],
    };
  });

  const edges: InvestigationGraphEdge[] = [];
  for (const link of kg.links) {
    const fromId = idMap.get(link.source);
    const toId = idMap.get(link.target);
    if (!fromId || !toId) continue;
    const relation = SEARCH_LINK_TYPE_TO_RELATION[link.type] ?? 'influences';
    const confidence = Math.round((link.confidence ?? link.strength ?? 0.5) * 100);
    edges.push({
      from: fromId,
      to: toId,
      relation,
      strength: link.strength ?? 0.5,
      confidence: Math.min(100, Math.max(0, confidence)),
    });
  }

  const graphWithoutPaths: InvestigationGraph = { nodes, edges, paths: [] };
  const paths = buildPaths(graphWithoutPaths);
  return { nodes, edges, paths };
}
