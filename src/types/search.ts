/**
 * Types for Advanced Search feature
 */

export type SearchMode = 'fast' | 'standard' | 'deep';

export interface SearchFilters {
  timeRange?: '24h' | '7d' | '30d' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  regions?: string[];
  eventTypes?: string[];
  sectors?: string[];
  sourceTypes?: string[];
  domainsInclude?: string[];
  domainsExclude?: string[];
  minConfidence?: number;
  dedupe?: boolean;
  language?: string;
}

export interface SearchResult {
  id: string;
  type: 'event' | 'article' | 'document';
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  relevanceScore: number;
  sourceScore: number;
  entities: Entity[];
  tags: string[];
  content?: string;
}

export interface Entity {
  id: string;
  type: 'country' | 'company' | 'commodity' | 'organization' | 'person';
  name: string;
  confidence: number;
  context?: string;
}

export interface SearchBuckets {
  events: SearchResult[];
  actors: Array<{
    id: string;
    name: string;
    type: 'company' | 'organization' | 'person';
    mentions: number;
    relevanceScore: number;
  }>;
  assets: Array<{
    id: string;
    name: string;
    type: 'commodity' | 'asset';
    mentions: number;
    relevanceScore: number;
  }>;
  sources: Array<{
    id: string;
    name: string;
    url: string;
    domain: string;
    articleCount: number;
    sourceScore: number;
  }>;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphNode {
  id: string;
  type: 'event' | 'country' | 'company' | 'commodity' | 'organization' | 'person';
  label: string;
  data: any;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'causes' | 'precedes' | 'related_to' | 'operates_in' | 'exposes_to' | 'impacts';
  strength: number;
}

export interface SearchState {
  query: string;
  mode: SearchMode;
  filters: SearchFilters;
  results: SearchResult[];
  buckets: SearchBuckets;
  graph: KnowledgeGraph;
  selectedResultId: string | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  meta: { fromCache: boolean; latencyMs: number };
}
