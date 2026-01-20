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
import { calculateImpactScore, type ImpactScore } from './impact-scorer';
import { resolveCanonicalEvents } from './canonical-event-resolver';
import { extractClaimsFromResults, type Claim } from './claims-extractor';
import { getSearchMemory, updateSearchMemory, getRelevantEntitiesFromMemory, getRelevantRelationshipsFromMemory } from './search-memory';

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
  impactScore?: number; // Impact score (0-1) for pre-Firecrawl filtering
  impactFactors?: ImpactScore['factors']; // Impact scoring factors
  entities: Array<{
    id: string;
    type: 'country' | 'company' | 'commodity' | 'organization' | 'person';
    name: string;
    confidence: number;
  }>;
  tags: string[];
  content?: string;
  mergedCount?: number; // Number of results merged into this canonical event
  claims?: Claim[]; // Extracted actionable claims
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
    validFrom?: string; // ISO timestamp (when this node became valid)
    validTo?: string; // ISO timestamp (when this node became invalid, null = still valid)
    confidence?: number; // 0-1 (confidence in this node)
    sourceCount?: number; // How many sources support this node
  }>;
  links: Array<{
    source: string;
    target: string;
    type: 'causes' | 'precedes' | 'related_to' | 'operates_in' | 'exposes_to' | 'impacts';
    strength: number;
    validFrom?: string; // ISO timestamp (when this link became valid)
    validTo?: string; // ISO timestamp (when this link became invalid, null = still valid)
    confidence?: number; // 0-1 (confidence in this link)
    sourceCount?: number; // How many sources support this link
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
  filters: SearchFilters = {},
  userId?: string | null // User ID for memory system
): Promise<SearchResponse> {
  const startTime = Date.now();
  
  // Load search memory if user is provided
  const memory = userId ? await getSearchMemory(userId) : null;
  
  // Get relevant entities/relationships from memory for context
  const relevantEntities = userId ? await getRelevantEntitiesFromMemory(userId, query, 20) : [];
  const relevantRelationships = userId ? await getRelevantRelationshipsFromMemory(userId, undefined, 50) : [];
  
  if (memory && (relevantEntities.length > 0 || relevantRelationships.length > 0)) {
    console.log(`[SearchOrchestrator] Using search memory: ${relevantEntities.length} entities, ${relevantRelationships.length} relationships`);
  }

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

  // Step 3.5: Canonical Event Resolution (MVP - fuzzy match title+date, OpenAI only if ambiguous)
  if (mode !== 'fast' && results.length > 1) {
    console.log(`[SearchOrchestrator] Resolving canonical events from ${results.length} results...`);
    const canonicalMap = await resolveCanonicalEvents(results);
    
    // Replace results with canonical events
    results = Array.from(canonicalMap.values()).map(canonical => ({
      ...canonical.representativeResult,
      id: canonical.canonicalId, // Use stable canonical ID
      mergedCount: canonical.mergedFrom.length, // Track how many were merged
    }));
    
    console.log(`[SearchOrchestrator] Canonical resolution complete: ${results.length} unique events`);
  }

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

  // Step 4.5: Impact Scoring BEFORE Firecrawl (NEW - reduces Firecrawl costs by 60-70%)
  if (mode !== 'fast') {
    console.log(`[SearchOrchestrator] Calculating impact scores for ${results.length} results...`);
    
    // Calculate impact scores in parallel (batch for efficiency)
    const impactScorePromises = results.map(r => 
      calculateImpactScore(r.title, r.summary, r.content, r.entities)
        .catch(error => {
          console.error(`[SearchOrchestrator] Error calculating impact score for ${r.id}:`, error.message);
          return null;
        })
    );
    
    const impactScores = await Promise.all(impactScorePromises);
    
    // Attach impact scores to results
    results = results.map((r, idx) => {
      const impact = impactScores[idx];
      if (impact) {
        return {
          ...r,
          impactScore: impact.score,
          impactFactors: impact.factors,
        };
      }
      return r;
    });
    
    console.log(`[SearchOrchestrator] Impact scores calculated. High-impact results (>0.7): ${results.filter(r => (r.impactScore || 0) > 0.7).length}`);
  }

  // Step 5: Firecrawl enrichment (NOW using impactScore instead of relevanceScore)
  // Only enrich high-impact results (impactScore > 0.7) to reduce costs
  const highImpactThreshold = 0.7;
  const shouldEnrich = mode === 'deep' || (mode === 'standard' && results.some(r => (r.impactScore || r.relevanceScore) > highImpactThreshold));
  
  if (shouldEnrich) {
    // Filter by impact score (preferred) or fallback to relevance score
    const topResults = results
      .filter(r => {
        const score = r.impactScore ?? r.relevanceScore;
        return score > highImpactThreshold;
      })
      .sort((a, b) => {
        // Sort by impact score first, then relevance
        const scoreA = a.impactScore ?? a.relevanceScore;
        const scoreB = b.impactScore ?? b.relevanceScore;
        return scoreB - scoreA;
      })
      .slice(0, 5); // Limit to top 5 high-impact results (was 3)

    console.log(`[SearchOrchestrator] Enriching ${topResults.length} high-impact results with Firecrawl...`);

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

  // Step 6: Extract claims (for standard and deep modes)
  // Claims are actionable predictions/statements/implications that inform decisions
  if (mode !== 'fast') {
    console.log(`[SearchOrchestrator] Extracting claims from ${results.length} results...`);
    const allClaims = await extractClaimsFromResults(results, 5); // Max 5 claims per result
    
    // Attach claims to relevant results
    const claimsByResult = new Map<string, Claim[]>();
    for (const claim of allClaims) {
      // Find results that mention entities from the claim
      for (const result of results) {
        const resultEntities = result.entities.map(e => e.name.toLowerCase());
        const claimEntities = claim.entities.map(e => e.toLowerCase());
        
        // If claim entities overlap with result entities, attach claim
        if (claimEntities.some(e => resultEntities.includes(e))) {
          if (!claimsByResult.has(result.id)) {
            claimsByResult.set(result.id, []);
          }
          claimsByResult.get(result.id)!.push(claim);
        }
      }
    }
    
    // Attach claims to results
    results = results.map(result => ({
      ...result,
      claims: claimsByResult.get(result.id) || [],
    }));
    
    console.log(`[SearchOrchestrator] Extracted ${allClaims.length} total claims`);
  }

  // Step 7: Extract relationships (for standard and deep modes)
  let relationships: Relationship[] = [];

  if (mode !== 'fast') {
    const allText = results.map(r => `${r.title} ${r.summary} ${r.content || ''}`).join('\n\n');
    relationships = await extractRelationshipsFromText(allText, results);
  }

  // Step 8: Build buckets
  const buckets = buildBuckets(results);

  // Step 9: Build knowledge graph
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
