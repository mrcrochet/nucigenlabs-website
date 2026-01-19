/**
 * Link Intelligence
 * 
 * Processes pasted URLs: scrapes with Firecrawl, extracts entities and facts,
 * inserts into knowledge graph
 */

import { scrapeOfficialDocument, isFirecrawlAvailable } from '../phase4/firecrawl-official-service';
import { extractEntities } from './entity-extractor';
import { extractRelationshipsFromText } from './relationship-extractor';
import { buildGraph, mergeGraphs } from './graph-builder';
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
}

/**
 * Process a pasted URL
 */
export async function processLink(
  url: string,
  existingGraph?: KnowledgeGraph
): Promise<LinkIntelligenceResult> {
  if (!isFirecrawlAvailable()) {
    throw new Error('Firecrawl is not available');
  }

  // Step 1: Scrape with Firecrawl
  const scraped = await scrapeOfficialDocument(url, {
    checkWhitelist: true,
  });

  if (!scraped) {
    throw new Error('Failed to scrape document');
  }

  // Step 2: Extract entities
  const entities = await extractEntities(scraped.content || '');

  // Step 3: Create search result
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

  // Step 4: Extract relationships
  const relationships = await extractRelationshipsFromText(
    scraped.content || '',
    [result]
  );

  // Step 5: Build graph
  let graph = await buildGraph([result], relationships);

  // Step 6: Merge with existing graph if provided
  if (existingGraph) {
    graph = mergeGraphs(existingGraph, graph);
  }

  // Step 7: Extract key facts (first 5-6 sentences)
  const keyFacts = extractKeyFacts(scraped.content || '');

  return {
    result,
    graph,
    entities,
    keyFacts,
    summary: scraped.content?.substring(0, 500) || '',
  };
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
