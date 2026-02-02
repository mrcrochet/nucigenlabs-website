/**
 * Investigation Graph Engine — single source of truth for Flow / Timeline / Map views.
 * See CONCEPTION_INVESTIGATION_ENGINE.md
 *
 * One investigation = one graph state. Views are projections of this state.
 */

export type InvestigationNodeType = 'event' | 'actor' | 'resource' | 'decision' | 'impact';

export type InvestigationEdgeRelation =
  | 'causes'
  | 'influences'
  | 'funds'
  | 'restricts'
  | 'triggers';

/**
 * Path lifecycle status.
 * - active: hypothesis supported by evidence.
 * - weak: hypothesis not confirmed (insufficient or conflicting evidence).
 * - dead: hypothesis invalidated (contradicted by solid facts). Never deleted.
 */
export type InvestigationPathStatus = 'active' | 'weak' | 'dead';

/** Node: fact / event / actor in the graph */
export interface InvestigationGraphNode {
  id: string;
  type: InvestigationNodeType;
  label: string;
  date?: string | null;
  confidence: number;
  sources: string[];
}

/** Edge: causal or influence relation between two nodes */
export interface InvestigationGraphEdge {
  from: string;
  to: string;
  relation: InvestigationEdgeRelation;
  strength: number;
  confidence: number;
}

/**
 * Path: computed investigative lead (ordered nodes, status).
 * Convention: confidence is 0..100 (display/UI). Internal scoring uses 0..1.
 */
export interface InvestigationGraphPath {
  id: string;
  nodes: string[];
  status: InvestigationPathStatus;
  /** 0..100 (display). Do not use 0..1 in graph/UI. */
  confidence: number;
  /** Optional label for UX (e.g. "Sanctions-driven supply shock"). Not computed in v1. */
  hypothesis_label?: string;
}

/** Full investigation graph — single state fed to all three views */
export interface InvestigationGraph {
  nodes: InvestigationGraphNode[];
  edges: InvestigationGraphEdge[];
  paths: InvestigationGraphPath[];
}
