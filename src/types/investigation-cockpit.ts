/**
 * Enquête / Investigation Cockpit — data model (product definition).
 * Enquête is a COGNITIVE COCKPIT: graph + timeline + optional map + multiple hypotheses.
 * NOT a chat. Chat (if any) is not central.
 */

import type { InvestigationGraph } from './investigation-graph';

export type InvestigationStatus = 'active' | 'archived';

export type PathStatus = 'active' | 'weak' | 'dead';

export type CockpitNodeType =
  | 'event'
  | 'actor'
  | 'country'
  | 'company'
  | 'resource'
  | 'decision'
  | 'organization'
  | 'person';

export type CockpitEdgeType =
  | 'causes'
  | 'exploits'
  | 'supplies'
  | 'enables'
  | 'reacts_to'
  | 'precedes'
  | 'related_to';

export type EvidenceConfidence = 'low' | 'medium' | 'high';

/** Reference to a node (e.g. in a path's key elements) */
export interface NodeRef {
  id: string;
  type: CockpitNodeType;
  label: string;
}

/** Evidence item: text, source, confidence */
export interface Evidence {
  text: string;
  source: string;
  confidence: EvidenceConfidence;
}

/** Node in the graph */
export interface CockpitNode {
  id: string;
  type: CockpitNodeType;
  label: string;
  date?: string | null;
  confidence: number; // 0–100
}

/** Edge in the graph */
export interface CockpitEdge {
  from: string;
  to: string;
  type: CockpitEdgeType;
  confidence: number; // 0–100
}

/** Path (Hypothesis) */
export interface CockpitPath {
  id: string;
  hypothesis: string;
  status: PathStatus;
  confidence: number; // 0–100
  nodesCount: number;
  edgesCount: number;
  lastUpdate: string; // ISO or relative label
  keyNodes: NodeRef[];
  evidence: Evidence[];
  contradictions?: string[];
}

/** Top-level Investigation for the cockpit */
export interface CockpitInvestigation {
  id: string;
  query: string;
  status: InvestigationStatus;
  startedAt: string;
  totalSources: number;
  paths: CockpitPath[];
  graph: {
    nodes: CockpitNode[];
    edges: CockpitEdge[];
  };
}

/**
 * Map InvestigationGraph + metadata to CockpitInvestigation.
 * Use when you need the full cockpit data model (e.g. export or future API).
 */
export function toCockpitInvestigation(
  id: string,
  query: string,
  startedAt: string,
  totalSources: number,
  graph: InvestigationGraph
): CockpitInvestigation {
  const nodeTypeMap: Record<string, CockpitNodeType> = {
    event: 'event',
    actor: 'actor',
    resource: 'resource',
    decision: 'decision',
    impact: 'event',
    country: 'country',
    company: 'company',
    organization: 'organization',
    person: 'person',
  };
  const edgeTypeMap: Record<string, CockpitEdgeType> = {
    causes: 'causes',
    influences: 'related_to',
    funds: 'enables',
    restricts: 'reacts_to',
    supports: 'enables',
    weakens: 'reacts_to',
    triggers: 'precedes',
    exploits: 'exploits',
    supplies: 'supplies',
    enables: 'enables',
    reacts_to: 'reacts_to',
    precedes: 'precedes',
    related_to: 'related_to',
  };

  const nodes: CockpitNode[] = graph.nodes.map((n) => ({
    id: n.id,
    type: nodeTypeMap[n.type] ?? 'actor',
    label: n.label,
    date: n.date ?? undefined,
    confidence: typeof n.confidence === 'number' ? Math.round(n.confidence) : 50,
  }));

  const edges: CockpitEdge[] = graph.edges.map((e) => ({
    from: e.from,
    to: e.to,
    type: edgeTypeMap[e.relation] ?? 'related_to',
    confidence: typeof e.confidence === 'number' ? Math.round(e.confidence) : 50,
  }));

  const pathNodeSet = (path: { nodes: string[] }) => new Set(path.nodes);
  const paths: CockpitPath[] = graph.paths.map((p) => {
    const set = pathNodeSet(p);
    const edgesInPath = graph.edges.filter((e) => set.has(e.from) && set.has(e.to));
    const keyNodes: NodeRef[] = p.nodes
      .map((nodeId) => graph.nodes.find((n) => n.id === nodeId))
      .filter(Boolean)
      .map((n) => ({
        id: n!.id,
        type: (nodeTypeMap[n!.type] ?? 'actor') as CockpitNodeType,
        label: n!.label,
      }));
    const evidence: Evidence[] = p.nodes.flatMap((nodeId) => {
      const full = graph.nodes.find((n) => n.id === nodeId);
      return (full?.sources ?? []).map((source) => ({
        text: '',
        source,
        confidence: 'medium' as EvidenceConfidence,
      }));
    });
    const pathWithExtras = p as { hypothesis_label?: string; contradictions?: string[]; lastUpdate?: string };
    return {
      id: p.id,
      hypothesis: pathWithExtras.hypothesis_label ?? p.id,
      status: p.status as PathStatus,
      confidence: typeof p.confidence === 'number' ? Math.round(p.confidence) : 0,
      nodesCount: p.nodes.length,
      edgesCount: edgesInPath.length,
      lastUpdate: pathWithExtras.lastUpdate ?? '—',
      keyNodes,
      evidence,
      contradictions: pathWithExtras.contradictions,
    };
  });

  return {
    id,
    query,
    status: 'active',
    startedAt,
    totalSources,
    paths,
    graph: { nodes, edges },
  };
}
