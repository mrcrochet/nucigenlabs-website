/**
 * Link Intelligence
 * 
 * Processes pasted URLs: scrapes with Firecrawl, extracts entities and facts,
 * inserts into knowledge graph
 * Falls back to Tavily search if Firecrawl fails or URL is not whitelisted
 */

import { scrapeOfficialDocument, isFirecrawlAvailable } from '../phase4/firecrawl-official-service';
import { extractEntities } from './entity-extractor';
import { extractRelationshipsFromText } from './relationship-extractor';
import { buildGraph, mergeGraphs } from './graph-builder';
import { searchTavily, TavilySearchOptions } from './tavily-unified-service';
import type { SearchResult, KnowledgeGraph } from './search-orchestrator';

export interface LinkIntelligenceResult {
  result: SearchResult;
  graph: KnowledgeGraph;
  entities: Array<{
    id: string;
    type: 'country' | 'company' | 'commodity' | 'organization' | 'person';
    name: string;
    confidence: number;
  }>;
  keyFacts: string[];
  summary: string;
  fallbackUsed?: boolean;
  errorType?: string;
}

export interface LinkIntelligenceError {
  error: string;
  errorType: 'whitelist' | 'network' | 'timeout' | 'unavailable' | 'unknown';
  fallbackUsed: boolean;
  partialData?: Partial<LinkIntelligenceResult>;
}

/**
 * Process a pasted URL
 * Tries Firecrawl first, falls back to Tavily if Firecrawl fails
 */
export async function processLink(
  url: string,
  existingGraph?: KnowledgeGraph,
  options?: {
    permissive?: boolean; // Bypass whitelist for user-pasted URLs
  }
): Promise<LinkIntelligenceResult> {
  const { permissive = true } = options || {};
  let fallbackUsed = false;
  let errorType: string | undefined;

  // Step 1: Try Firecrawl first
  if (isFirecrawlAvailable()) {
    try {
      const scraped = await scrapeOfficialDocument(url, {
        checkWhitelist: !permissive, // Bypass whitelist if permissive mode
      });

      if (scraped && scraped.content) {
        // Success with Firecrawl
        return await processScrapedContent(scraped, url, existingGraph);
      } else {
        // Firecrawl failed (likely whitelist issue)
        errorType = 'whitelist';
        console.log(`[LinkIntelligence] Firecrawl failed for ${url}, trying Tavily fallback...`);
      }
    } catch (error: any) {
      // Firecrawl error - determine error type
      if (error.message?.includes('whitelist') || error.message?.includes('not in whitelist')) {
        errorType = 'whitelist';
      } else if (error.message?.includes('timeout')) {
        errorType = 'timeout';
      } else if (error.message?.includes('rate limit')) {
        errorType = 'network';
      } else {
        errorType = 'unknown';
      }
      console.log(`[LinkIntelligence] Firecrawl error (${errorType}), trying Tavily fallback...`);
    }
  } else {
    errorType = 'unavailable';
    console.log(`[LinkIntelligence] Firecrawl not available, using Tavily fallback...`);
  }

  // Step 2: Fallback to Tavily
  fallbackUsed = true;
  try {
    return await fallbackToTavily(url, existingGraph);
  } catch (error: any) {
    // Even Tavily failed - return partial data if possible
    const partialResult = await extractBasicMetadata(url);
    throw {
      error: error.message || 'Failed to process URL with both Firecrawl and Tavily',
      errorType: errorType || 'unknown',
      fallbackUsed,
      partialData: partialResult,
    } as LinkIntelligenceError;
  }
}

/**
 * Process scraped content from Firecrawl
 */
async function processScrapedContent(
  scraped: any,
  url: string,
  existingGraph?: KnowledgeGraph
): Promise<LinkIntelligenceResult> {
  // Extract entities
  const entities = await extractEntities(scraped.content || '');

  // Create search result
  const result: SearchResult = {
    id: `link-${Date.now()}`,
    type: 'document',
    title: scraped.title || scraped.metadata?.title || 'Untitled Document',
    summary: scraped.content?.substring(0, 200) || '',
    url: url,
    source: scraped.domain || 'unknown',
    publishedAt: scraped.metadata?.publishedTime || new Date().toISOString(),
    relevanceScore: 0.8, // High score for user-provided links
    sourceScore: calculateSourceScore(scraped.domain || ''),
    entities,
    tags: entities.map(e => e.name),
    content: scraped.content,
  };

  // Extract relationships
  const relationships = await extractRelationshipsFromText(
    scraped.content || '',
    [result]
  );

  // Build graph
  let graph = await buildGraph([result], relationships);

  // Merge with existing graph if provided
  if (existingGraph) {
    graph = mergeGraphs(existingGraph, graph);
  }

  // Extract key facts
  const keyFacts = extractKeyFacts(scraped.content || '');

  return {
    result,
    graph,
    entities,
    keyFacts,
    summary: scraped.content?.substring(0, 500) || '',
    fallbackUsed: false,
  };
}

/**
 * Fallback to Tavily when Firecrawl fails
 */
async function fallbackToTavily(
  url: string,
  existingGraph?: KnowledgeGraph
): Promise<LinkIntelligenceResult> {
  console.log(`[LinkIntelligence] Using Tavily fallback for: ${url}`);

  // Extract domain and title from URL for search query
  const domain = extractDomain(url);
  const urlPath = new URL(url).pathname;
  
  // Build search query from URL components
  const searchQuery = `${domain} ${urlPath}`.replace(/[\/\-_]/g, ' ').trim();

  // Search Tavily for content related to this URL
  const tavilyOptions: TavilySearchOptions = {
    searchDepth: 'advanced',
    maxResults: 5,
    includeAnswer: false,
    includeRawContent: true,
    includeImages: false,
  };

  const tavilyResult = await searchTavily(searchQuery, 'news', tavilyOptions);

  // Find the article that matches our URL
  const matchingArticle = tavilyResult.articles.find(
    article => article.url === url || article.url.includes(domain)
  );

  // Use matching article or first result
  const article = matchingArticle || tavilyResult.articles[0];

  if (!article || !article.content) {
    throw new Error('No relevant content found via Tavily');
  }

  // Extract entities
  const entities = await extractEntities(article.content);

  // Create search result
  const result: SearchResult = {
    id: `link-${Date.now()}`,
    type: 'document',
    title: article.title || 'Untitled Document',
    summary: article.content.substring(0, 200) || '',
    url: url,
    source: extractDomain(url),
    publishedAt: article.publishedDate || new Date().toISOString(),
    relevanceScore: 0.7, // Slightly lower score for fallback
    sourceScore: calculateSourceScore(extractDomain(url)),
    entities,
    tags: entities.map(e => e.name),
    content: article.content,
  };

  // Extract relationships
  const relationships = await extractRelationshipsFromText(
    article.content,
    [result]
  );

  // Build graph
  let graph = await buildGraph([result], relationships);

  // Merge with existing graph if provided
  if (existingGraph) {
    graph = mergeGraphs(existingGraph, graph);
  }

  // Extract key facts
  const keyFacts = extractKeyFacts(article.content);

  return {
    result,
    graph,
    entities,
    keyFacts,
    summary: article.content.substring(0, 500) || '',
    fallbackUsed: true,
  };
}

/**
 * Extract basic metadata from URL (fallback when all else fails)
 */
async function extractBasicMetadata(url: string): Promise<Partial<LinkIntelligenceResult>> {
  const domain = extractDomain(url);
  const urlPath = new URL(url).pathname;
  
  // Try to extract title from URL path
  const pathParts = urlPath.split('/').filter(Boolean);
  const title = pathParts[pathParts.length - 1]
    ?.replace(/[-_]/g, ' ')
    .replace(/\.[^.]+$/, '') // Remove file extension
    || 'Document';

  return {
    result: {
      id: `link-${Date.now()}`,
      type: 'document',
      title: title,
      summary: `Content from ${domain}`,
      url: url,
      source: domain,
      publishedAt: new Date().toISOString(),
      relevanceScore: 0.5,
      sourceScore: calculateSourceScore(domain),
      entities: [],
      tags: [],
      content: undefined,
    } as SearchResult,
    graph: { nodes: [], links: [] },
    entities: [],
    keyFacts: [],
    summary: `Unable to extract full content from ${url}. Please try accessing the link directly.`,
    fallbackUsed: true,
  };
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

/**
 * Extract key facts from content
 */
function extractKeyFacts(content: string): string[] {
  // Simple extraction: split by sentences and take first 5-6
  const sentences = content
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20) // Filter very short sentences
    .slice(0, 6);

  return sentences;
}

/**
 * Calculate source score based on domain
 */
function calculateSourceScore(domain: string): number {
  const normalizedDomain = domain.toLowerCase();

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
    '.gov',
    '.edu',
  ];

  if (highQuality.some(hq => normalizedDomain.includes(hq))) {
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

  if (mediumQuality.some(mq => normalizedDomain.includes(mq))) {
    return 0.7;
  }

  return 0.5;
}
