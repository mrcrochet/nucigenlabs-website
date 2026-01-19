/**
 * Search Orchestrator
 * 
 * Orchestrates search across Tavily and Firecrawl based on mode:
 * - Fast: Tavily only (rapid, cheap)
 * - Standard: Tavily + light enrichment (entity extraction)
 * - Deep: Tavily + Firecrawl on top results (auto if score > threshold)
 */

import { searchTavily, TavilySearchResult, TavilySearchOptions } from './tavily-unified-service';
import { scrapeOfficialDocument, isFirecrawlAvailable } from '../phase4/firecrawl-official-service';
import { extractEntities } from './entity-extractor';
import { extractRelationshipsFromText, type Relationship } from './relationship-extractor';
import { buildGraph } from './graph-builder';

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
  entities: Array<{
    id: string;
    type: 'country' | 'company' | 'commodity' | 'organization' | 'person';
    name: string;
    confidence: number;
  }>;
  tags: string[];
  content?: string;
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
  nodes: Array<{
    id: string;
    type: 'event' | 'country' | 'company' | 'commodity' | 'organization' | 'person';
    label: string;
    data: any;
  }>;
  links: Array<{
    source: string;
    target: string;
    type: 'causes' | 'precedes' | 'related_to' | 'operates_in' | 'exposes_to' | 'impacts';
    strength: number;
  }>;
}

export interface SearchResponse {
  results: SearchResult[];
  buckets: SearchBuckets;
  graph: KnowledgeGraph;
  meta: {
    fromCache: boolean;
    latencyMs: number;
    mode: SearchMode;
    totalResults: number;
  };
}

/**
 * Main search function
 */
export async function search(
  query: string,
  mode: SearchMode = 'standard',
  filters: SearchFilters = {}
): Promise<SearchResponse> {
  const startTime = Date.now();

  // Step 1: Search with Tavily
  const tavilyOptions: TavilySearchOptions = {
    searchDepth: mode === 'deep' ? 'advanced' : 'basic',
    maxResults: mode === 'deep' ? 50 : mode === 'standard' ? 30 : 20,
    includeAnswer: false,
    includeRawContent: true,
    includeImages: false,
  };

  // Apply time filter
  if (filters.timeRange) {
    const days = filters.timeRange === '24h' ? 1 : filters.timeRange === '7d' ? 7 : 30;
    tavilyOptions.days = days;
  }

  const tavilyResult = await searchTavily(query, 'news', tavilyOptions);

  // Step 2: Convert Tavily results to SearchResult format
  let results: SearchResult[] = tavilyResult.articles.map((article, index) => ({
    id: `search-${Date.now()}-${index}`,
    type: 'article' as const,
    title: article.title || '',
    summary: article.content?.substring(0, 200) || '',
    url: article.url || '',
    source: extractDomain(article.url || ''),
    publishedAt: article.publishedDate || new Date().toISOString(),
    relevanceScore: article.score || 0.5,
    sourceScore: calculateSourceScore(article.url || ''),
    entities: [],
    tags: [],
    content: article.content,
  }));

  // Step 3: Apply filters
  results = applyFilters(results, filters);

  // Step 4: Extract entities (for standard and deep modes)
  if (mode !== 'fast') {
    const allText = results.map(r => `${r.title} ${r.summary} ${r.content || ''}`).join('\n\n');
    const entities = await extractEntities(allText);

    // Attach entities to results
    results = results.map(result => {
      const resultText = `${result.title} ${result.summary} ${result.content || ''}`.toLowerCase();
      const resultEntities = entities.filter(e => 
        resultText.includes(e.name.toLowerCase())
      );
      return {
        ...result,
        entities: resultEntities,
        tags: resultEntities.map(e => e.name),
      };
    });
  }

  // Step 5: Firecrawl enrichment (for deep mode or high-scoring results)
  if (mode === 'deep' || (mode === 'standard' && results.some(r => r.relevanceScore > 0.8))) {
    const topResults = results
      .filter(r => r.relevanceScore > 0.8)
      .slice(0, 3);

    for (const result of topResults) {
      if (isFirecrawlAvailable() && result.url) {
        try {
          const scraped = await scrapeOfficialDocument(result.url, {
            checkWhitelist: true,
          });

          if (scraped) {
            result.content = scraped.content || result.content;
            result.summary = scraped.content?.substring(0, 200) || result.summary;

            // Extract more entities from enriched content
            if (mode !== 'fast') {
              const enrichedEntities = await extractEntities(scraped.content || '');
              result.entities = [...result.entities, ...enrichedEntities];
            }
          }
        } catch (error: any) {
          console.error(`[SearchOrchestrator] Error enriching ${result.url}:`, error.message);
        }
      }
    }
  }

  // Step 6: Extract relationships (for standard and deep modes)
  let relationships: Relationship[] = [];

  if (mode !== 'fast') {
    const allText = results.map(r => `${r.title} ${r.summary} ${r.content || ''}`).join('\n\n');
    relationships = await extractRelationshipsFromText(allText, results);
  }

  // Step 7: Build buckets
  const buckets = buildBuckets(results);

  // Step 8: Build knowledge graph
  const graph = await buildGraph(results, relationships);

  const latencyMs = Date.now() - startTime;

  return {
    results,
    buckets,
    graph,
    meta: {
      fromCache: tavilyResult.cached,
      latencyMs,
      mode,
      totalResults: results.length,
    },
  };
}

/**
 * Enrich a specific result with Firecrawl
 */
export async function enrichResult(
  resultId: string,
  results: SearchResult[]
): Promise<{ enrichedResult: SearchResult; updatedGraph: KnowledgeGraph }> {
  const result = results.find(r => r.id === resultId);
  if (!result || !result.url) {
    throw new Error('Result not found or has no URL');
  }

  if (!isFirecrawlAvailable()) {
    throw new Error('Firecrawl is not available');
  }

  // Scrape with Firecrawl
  const scraped = await scrapeOfficialDocument(result.url, {
    checkWhitelist: true,
  });

  if (!scraped) {
    throw new Error('Failed to scrape document');
  }

  // Extract entities from enriched content
  const entities = await extractEntities(scraped.content || '');
  
  // Extract relationships
  const relationships = await extractRelationshipsFromText(
    scraped.content || '',
    [result]
  );

  // Update result
  const enrichedResult: SearchResult = {
    ...result,
    content: scraped.content || result.content,
    summary: scraped.content?.substring(0, 200) || result.summary,
    entities: [...result.entities, ...entities],
    tags: [...result.tags, ...entities.map(e => e.name)],
  };

  // Build updated graph
  const updatedGraph = await buildGraph([enrichedResult], relationships);

  return {
    enrichedResult,
    updatedGraph,
  };
}

/**
 * Helper: Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

/**
 * Helper: Calculate source score based on domain
 */
function calculateSourceScore(url: string): number {
  const domain = extractDomain(url).toLowerCase();
  
  // High-quality sources
  const highQuality = [
    'reuters.com',
    'bloomberg.com',
    'ft.com',
    'wsj.com',
    'economist.com',
    'bbc.com',
    'ap.org',
    'gov.uk',
    'gov',
    'edu',
  ];

  if (highQuality.some(hq => domain.includes(hq))) {
    return 0.9;
  }

  // Medium-quality sources
  const mediumQuality = [
    'cnn.com',
    'nytimes.com',
    'theguardian.com',
    'forbes.com',
    'businessinsider.com',
  ];

  if (mediumQuality.some(mq => domain.includes(mq))) {
    return 0.7;
  }

  return 0.5;
}

/**
 * Helper: Apply filters to results
 */
function applyFilters(results: SearchResult[], filters: SearchFilters): SearchResult[] {
  let filtered = [...results];

  // Filter by confidence
  if (filters.minConfidence !== undefined) {
    filtered = filtered.filter(r => r.relevanceScore >= filters.minConfidence!);
  }

  // Filter by domains (include)
  if (filters.domainsInclude && filters.domainsInclude.length > 0) {
    filtered = filtered.filter(r => {
      const domain = extractDomain(r.url);
      return filters.domainsInclude!.some(inc => domain.includes(inc));
    });
  }

  // Filter by domains (exclude)
  if (filters.domainsExclude && filters.domainsExclude.length > 0) {
    filtered = filtered.filter(r => {
      const domain = extractDomain(r.url);
      return !filters.domainsExclude!.some(exc => domain.includes(exc));
    });
  }

  // Dedupe
  if (filters.dedupe) {
    const seen = new Set<string>();
    filtered = filtered.filter(r => {
      const key = r.url.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  return filtered;
}

/**
 * Helper: Build buckets from results
 */
function buildBuckets(results: SearchResult[]): SearchBuckets {
  const events: SearchResult[] = results.filter(r => r.type === 'event');
  
  // Actors: companies and organizations
  const actorMap = new Map<string, {
    id: string;
    name: string;
    type: 'company' | 'organization' | 'person';
    mentions: number;
    relevanceScore: number;
  }>();

  // Assets: commodities
  const assetMap = new Map<string, {
    id: string;
    name: string;
    type: 'commodity' | 'asset';
    mentions: number;
    relevanceScore: number;
  }>();

  // Sources
  const sourceMap = new Map<string, {
    id: string;
    name: string;
    url: string;
    domain: string;
    articleCount: number;
    sourceScore: number;
  }>();

  for (const result of results) {
    // Process entities
    for (const entity of result.entities) {
      if (entity.type === 'company' || entity.type === 'organization' || entity.type === 'person') {
        const existing = actorMap.get(entity.id) || {
          id: entity.id,
          name: entity.name,
          type: entity.type as 'company' | 'organization' | 'person',
          mentions: 0,
          relevanceScore: 0,
        };
        existing.mentions++;
        existing.relevanceScore = Math.max(existing.relevanceScore, entity.confidence);
        actorMap.set(entity.id, existing);
      } else if (entity.type === 'commodity') {
        const existing = assetMap.get(entity.id) || {
          id: entity.id,
          name: entity.name,
          type: 'commodity' as const,
          mentions: 0,
          relevanceScore: 0,
        };
        existing.mentions++;
        existing.relevanceScore = Math.max(existing.relevanceScore, entity.confidence);
        assetMap.set(entity.id, existing);
      }
    }

    // Process sources
    const domain = extractDomain(result.url);
    const existing = sourceMap.get(domain) || {
      id: domain,
      name: result.source,
      url: result.url,
      domain,
      articleCount: 0,
      sourceScore: result.sourceScore,
    };
    existing.articleCount++;
    sourceMap.set(domain, existing);
  }

  return {
    events,
    actors: Array.from(actorMap.values()),
    assets: Array.from(assetMap.values()),
    sources: Array.from(sourceMap.values()),
  };
}
