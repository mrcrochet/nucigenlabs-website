/**
 * Evidence Enricher
 * 
 * Enriches claim evidence with:
 * 1. Real articles from search results (with URLs)
 * 2. Historical patterns that have repeated in history
 * 
 * Uses OpenAI to identify historical patterns and Tavily to find supporting articles
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { searchTavily, TavilySearchOptions } from './tavily-unified-service';
import { withCache, type CacheOptions } from './cache-service';
import type { EvidenceSource } from '../types/search';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  throw new Error('OPENAI_API_KEY is required for evidence enrichment');
}

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

/**
 * Enrich evidence with real articles and historical patterns
 */
export async function enrichEvidence(
  claimText: string,
  evidenceTexts: string[],
  searchResults: Array<{
    id: string;
    title: string;
    url: string;
    summary: string;
    content?: string;
    publishedAt: string;
    source: string;
    relevanceScore: number;
  }>,
  context?: {
    entities?: string[];
    sectors?: string[];
    regions?: string[];
  }
): Promise<EvidenceSource[]> {
  const enrichedEvidence: EvidenceSource[] = [];

  // Step 1: Link evidence texts to actual articles from search results
  for (const evidenceText of evidenceTexts) {
    // Find best matching article for this evidence
    const matchingArticle = findBestMatchingArticle(evidenceText, searchResults);
    
    if (matchingArticle) {
      enrichedEvidence.push({
        text: evidenceText,
        url: matchingArticle.url,
        title: matchingArticle.title,
        source: matchingArticle.source,
        publishedAt: matchingArticle.publishedAt,
        relevanceScore: matchingArticle.relevanceScore,
        type: 'article',
      });
    } else {
      // If no direct match, search for articles supporting this evidence
      const supportingArticles = await findSupportingArticles(evidenceText, context);
      if (supportingArticles.length > 0) {
        enrichedEvidence.push({
          text: evidenceText,
          url: supportingArticles[0].url,
          title: supportingArticles[0].title,
          source: supportingArticles[0].source,
          publishedAt: supportingArticles[0].publishedAt,
          relevanceScore: supportingArticles[0].relevanceScore,
          type: 'article',
        });
      } else {
        // Fallback: keep text evidence without link
        enrichedEvidence.push({
          text: evidenceText,
          type: 'article',
        });
      }
    }
  }

  // Step 2: Find historical patterns using OpenAI
  const historicalPatterns = await findHistoricalPatterns(claimText, context);
  enrichedEvidence.push(...historicalPatterns);

  return enrichedEvidence;
}

/**
 * Find best matching article for evidence text
 */
function findBestMatchingArticle(
  evidenceText: string,
  searchResults: Array<{
    id: string;
    title: string;
    url: string;
    summary: string;
    content?: string;
    publishedAt: string;
    source: string;
    relevanceScore: number;
  }>
): typeof searchResults[0] | null {
  // Simple text matching: find article that contains key terms from evidence
  const evidenceTerms = evidenceText
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .slice(0, 5);

  let bestMatch: typeof searchResults[0] | null = null;
  let bestScore = 0;

  for (const result of searchResults) {
    const searchableText = `${result.title} ${result.summary} ${result.content || ''}`.toLowerCase();
    
    // Count how many evidence terms appear in the article
    const matchCount = evidenceTerms.filter(term => searchableText.includes(term)).length;
    const score = matchCount / evidenceTerms.length;

    if (score > bestScore && score > 0.3) { // At least 30% match
      bestScore = score;
      bestMatch = result;
    }
  }

  return bestMatch;
}

/**
 * Search for articles supporting evidence text
 */
async function findSupportingArticles(
  evidenceText: string,
  context?: {
    entities?: string[];
    sectors?: string[];
    regions?: string[];
  }
): Promise<Array<{
  url: string;
  title: string;
  source: string;
  publishedAt: string;
  relevanceScore: number;
}>> {
  try {
    // Build search query from evidence + context
    const queryParts = [evidenceText];
    if (context?.entities && context.entities.length > 0) {
      queryParts.push(context.entities.slice(0, 2).join(' '));
    }

    const searchQuery = queryParts.join(' ');

    const tavilyOptions: TavilySearchOptions = {
      searchDepth: 'basic',
      maxResults: 3,
      includeAnswer: false,
      includeRawContent: false,
      includeImages: false,
      minScore: 0.5,
    };

    const tavilyResult = await searchTavily(searchQuery, 'news', tavilyOptions);

    return tavilyResult.articles.slice(0, 3).map(article => ({
      url: article.url || '',
      title: article.title || 'Untitled',
      source: new URL(article.url || '').hostname || 'unknown',
      publishedAt: article.publishedDate || new Date().toISOString(),
      relevanceScore: article.score || 0.5,
    }));
  } catch (error: any) {
    console.error('[EvidenceEnricher] Error finding supporting articles:', error.message);
    return [];
  }
}

/**
 * Find historical patterns that support the claim
 * Uses OpenAI to identify similar historical events/patterns
 */
async function findHistoricalPatterns(
  claimText: string,
  context?: {
    entities?: string[];
    sectors?: string[];
    regions?: string[];
  }
): Promise<EvidenceSource[]> {
  const cacheOptions: CacheOptions = {
    apiType: 'openai',
    endpoint: 'findHistoricalPatterns',
    ttlSeconds: 24 * 60 * 60, // 24 hours
  };

  return await withCache(
    cacheOptions,
    { claimText, context },
    async () => {
      const contextInfo = context
        ? `\n\nContext:\n${context.entities && context.entities.length > 0 ? `Entities: ${context.entities.join(', ')}` : ''}\n${context.sectors && context.sectors.length > 0 ? `Sectors: ${context.sectors.join(', ')}` : ''}\n${context.regions && context.regions.length > 0 ? `Regions: ${context.regions.join(', ')}` : ''}`
        : '';

      const prompt = `You are a historian and intelligence analyst. Analyze this claim and identify 2-3 historical patterns or events that are similar or relevant.

Claim: ${claimText}${contextInfo}

Identify historical patterns (events, crises, trends) that:
1. Share similar mechanisms or dynamics
2. Had similar outcomes or implications
3. Provide lessons or precedents

For each pattern, provide:
- A brief description (1-2 sentences)
- When/where it occurred (specific date/period and location if possible)
- Why it's relevant to this claim

Return JSON:
{
  "patterns": [
    {
      "description": "...",
      "historicalContext": "e.g., '2008 Financial Crisis, United States' or '1997 Asian Financial Crisis, Southeast Asia'",
      "relevance": "Why this pattern is relevant"
    }
  ]
}

Focus on well-documented historical events that provide meaningful context.`;

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o', // Use best model for historical analysis
          messages: [
            {
              role: 'system',
              content: 'You are an expert historian and intelligence analyst. Identify relevant historical patterns and precedents that inform current situations.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.4,
          max_tokens: 1500,
          response_format: { type: 'json_object' },
        });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) {
          return [];
        }

        const result = JSON.parse(responseText);
        const patterns = result.patterns || [];

        return patterns.map((pattern: any) => ({
          text: pattern.description || '',
          historicalContext: pattern.historicalContext || '',
          type: 'historical_pattern' as const,
          relevanceScore: 0.7, // Historical patterns have moderate relevance
        })) as EvidenceSource[];
      } catch (error: any) {
        console.error('[EvidenceEnricher] Error finding historical patterns:', error.message);
        return [];
      }
    }
  );
}
