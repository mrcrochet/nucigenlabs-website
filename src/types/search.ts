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

export interface Scenario {
  id: string;
  title: string;
  description: string;
  relativeProbability: number; // 0-1, relative to other scenarios
  mechanisms: string[]; // Causal mechanisms at play
  invalidationConditions: string[]; // What would invalidate this scenario
  confidence: number; // 0-1, confidence in this scenario
  timeframe?: 'immediate' | 'short' | 'medium' | 'long';
  sources?: Array<{
    title: string;
    url: string;
    relevanceScore: number;
    snippet?: string;
  }>; // Web sources backing this scenario
}

export interface EvidenceSource {
  text: string; // Quote or evidence text
  url?: string; // Link to article/source
  title?: string; // Article title
  source?: string; // Source domain/name
  publishedAt?: string; // Publication date
  relevanceScore?: number; // 0-1 relevance score
  type: 'article' | 'historical_pattern'; // Type of evidence
  historicalContext?: string; // For historical patterns: when/where this happened before
}

export interface Claim {
  id: string;
  text: string;
  certainty: number; // 0-1
  actor: string;
  timeHorizon: 'immediate' | 'short' | 'medium' | 'long';
  type: 'prediction' | 'statement' | 'implication' | 'warning' | 'scenario_outlook';
  evidence: EvidenceSource[]; // Enhanced evidence with sources and historical patterns
  entities: string[];
  sectors?: string[];
  regions?: string[];
  // Scenario Outlook fields (for probabilistic outlook)
  scenarios?: Scenario[]; // Multiple plausible scenarios
  currentState?: string; // "What's happening now"
  mechanisms?: string[]; // Mechanisms in play
  crossScenarioInsights?: {
    keyDrivers?: string[]; // Key drivers across all scenarios
    commonFactors?: string[]; // Factors common to multiple scenarios
    criticalUncertainties?: string[]; // Critical uncertainties that affect multiple scenarios
    decisionPoints?: string[]; // Key decision points or inflection points
  };
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
  claims?: Claim[]; // Extracted actionable claims
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
  type: 'event' | 'article' | 'document' | 'country' | 'company' | 'commodity' | 'organization' | 'person';
  label: string;
  data: any;
  x?: number;
  y?: number;
  validFrom?: string;
  validTo?: string | null;
  confidence?: number;
  sourceCount?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'causes' | 'precedes' | 'related_to' | 'operates_in' | 'exposes_to' | 'impacts';
  strength: number;
  validFrom?: string;
  validTo?: string | null;
  confidence?: number;
  sourceCount?: number;
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
