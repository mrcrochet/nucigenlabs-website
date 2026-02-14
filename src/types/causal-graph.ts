/**
 * Causal Knowledge Graph types
 * Used by causal-graph-generator.ts and scenario-dashboard-mapper.ts
 */

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  confidence_score: number;
  source_count: number;
  historical_precedent: boolean;
  // Type-specific optional fields
  event_type?: string;
  severity?: string;
  entity_type?: string;
  mechanism_type?: string;
  impact_type?: string;
  signal_type?: string;
}

export interface CausalEdge {
  id: string;
  source: string;
  target: string;
  relation_type: string;
  confidence_score: number;
  source_count: number;
  historical_precedent: boolean;
  explanation: string;
  strength: number;
}

export interface CausalKnowledgeGraph {
  nodes: GraphNode[];
  edges: CausalEdge[];
  metadata: {
    generated_at: string;
    query?: string;
    depth: number;
    total_nodes: number;
    total_edges: number;
    confidence_avg: number;
  };
}

export interface GraphGenerationOptions {
  depth?: number;
  min_confidence?: number;
  include_historical_precedents?: boolean;
  query?: string;
}

// Subtypes (used in graph generator prompts)
export type EventNode = GraphNode & { type: 'event' };
export type MechanismNode = GraphNode & { type: 'mechanism' };
export type EntityNode = GraphNode & { type: 'entity' };
export type ImpactNode = GraphNode & { type: 'impact' };
export type SignalNode = GraphNode & { type: 'signal' };
