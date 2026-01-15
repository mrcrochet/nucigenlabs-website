/**
 * Discover Service - 100% Perplexity Powered
 * 
 * Inspired by Perplexity's Discover page
 * Uses Perplexity API to generate curated content:
 * - Trending topics
 * - News articles with analysis
 * - Insights and analysis
 * - All with citations and sources
 */

import { chatCompletions } from './perplexity-service.js';
import type { Event, Signal } from '../../types/intelligence.js';

export interface DiscoverItem {
  id: string;
  type: 'article' | 'topic' | 'insight' | 'trend';
  title: string;
  summary: string;
  thumbnail?: string;
  sources: Array<{
    name: string;
    url: string;
    date: string;
  }>;
  category: string;
  tags: string[];
  engagement: {
    views: number;
    saves: number;
    questions: number;
  };
  personalization_score?: number;
  metadata: {
    published_at: string;
    updated_at: string;
    relevance_score: number;
  };
  related_questions?: string[];
}

interface PaginationOptions {
  offset: number;
  limit: number;
}

/**
 * Generate Discover content using Perplexity
 * Similar to Perplexity's own Discover page
 */
export async function fetchDiscoverItems(
  category: string,
  options: PaginationOptions,
  userId?: string,
  searchQuery?: string
): Promise<DiscoverItem[]> {
  try {
    // If search query provided, use it directly
    if (searchQuery) {
      return await generateSearchResults(searchQuery, options);
    }

    // Map category to Perplexity query
    const categoryQueries: Record<string, string> = {
      all: 'geopolitics, finance, technology, energy, supply chain',
      tech: 'technology, AI, semiconductors, software',
      finance: 'finance, markets, banking, monetary policy',
      geopolitics: 'geopolitics, international relations, conflicts, diplomacy',
      energy: 'energy, oil, gas, renewables, commodities',
      'supply-chain': 'supply chain, logistics, manufacturing, trade',
    };

    const queryCategory = categoryQueries[category] || category;
    
    // Generate multiple types of content in parallel
    const [topicsResult, newsResult, insightsResult] = await Promise.allSettled([
      // 1. Trending Topics (like Perplexity Discover)
      generateTrendingTopics(queryCategory, options),
      
      // 2. News Articles with Analysis
      generateNewsWithAnalysis(queryCategory, options),
      
      // 3. Insights and Analysis
      generateInsights(queryCategory, options),
    ]);

    // Extract successful results
    const topics = topicsResult.status === 'fulfilled' ? topicsResult.value : [];
    const news = newsResult.status === 'fulfilled' ? newsResult.value : [];
    const insights = insightsResult.status === 'fulfilled' ? insightsResult.value : [];

    // Merge all items
    const allItems = [...topics, ...news, ...insights];

    // Remove duplicates based on title similarity
    const uniqueItems = removeDuplicates(allItems);

    // Sort by relevance and limit
    uniqueItems.sort((a, b) => (b.metadata.relevance_score || 0) - (a.metadata.relevance_score || 0));

    return uniqueItems.slice(0, options.limit);
  } catch (error: any) {
    console.error('[Discover] Error in fetchDiscoverItems:', error);
    return [];
  }
}

/**
 * Generate trending topics (like Perplexity Discover)
 */
async function generateTrendingTopics(
  category: string,
  options: PaginationOptions
): Promise<DiscoverItem[]> {
  try {
    const query = `What are the most important and trending developments in ${category} happening right now? Provide 5-7 key topics with brief summaries.`;

    const response = await chatCompletions({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: `You are a content curator for a financial intelligence platform. Generate trending topics in JSON format:
{
  "topics": [
    {
      "title": "Short, clear title",
      "summary": "2-3 sentence summary explaining why this matters",
      "tags": ["tag1", "tag2"],
      "relevance_score": 85
    }
  ]
}

Focus on developments that matter for decision-makers in finance, geopolitics, and supply chains.`,
        },
        {
          role: 'user',
          content: query,
        },
      ],
      return_citations: true,
      return_related_questions: true,
      return_images: true, // Enable image extraction
      search_recency_filter: 'week',
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '';
    const citations = response.choices[0]?.message?.citations || response.citations || [];
    const images = response.images || response.choices[0]?.message?.images || [];
    const relatedQuestions = 
      response.related_questions || 
      response.choices[0]?.message?.related_questions || 
      [];

    // Parse topics from response
    let topics: any[] = [];
    try {
      const jsonMatch = content.match(/\{[\s\S]*"topics"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        topics = parsed.topics || [];
      } else {
        // Fallback: extract topics from structured text
        const lines = content.split('\n').filter(l => l.trim() && l.match(/^[0-9]\.|^[-*]/));
        topics = lines.slice(0, 7).map((line, idx) => {
          const cleanLine = line.replace(/^[0-9]\.\s*|^[-*]\s*/, '').trim();
          const [title, ...summaryParts] = cleanLine.split(':');
          return {
            title: title?.trim() || `Topic ${idx + 1}`,
            summary: summaryParts.join(':').trim() || cleanLine,
            tags: extractTags(cleanLine),
            relevance_score: 75 + Math.random() * 15,
          };
        });
      }
    } catch (parseError) {
      console.warn('[Discover] Failed to parse topics JSON, using fallback');
      // Fallback parsing
      const sections = content.split(/\n\n+/);
      topics = sections.slice(0, 7).map((section, idx) => {
        const lines = section.split('\n').filter(l => l.trim());
        const title = lines[0]?.replace(/^[#*0-9.]+\s*/, '').trim() || `Topic ${idx + 1}`;
        const summary = lines.slice(1).join(' ').trim() || section.substring(0, 200);
        return {
          title,
          summary,
          tags: extractTags(section),
          relevance_score: 70 + Math.random() * 20,
        };
      });
    }

    return topics.slice(0, Math.ceil(options.limit / 3)).map((topic: any, idx: number) => ({
      id: `topic-${Date.now()}-${idx}`,
      type: 'topic' as const,
      title: topic.title || 'Untitled Topic',
      summary: topic.summary || '',
      thumbnail: images[idx] || images[0] || undefined, // Use first available image
      sources: citations.slice(0, 3).map((url: string, i: number) => ({
        name: extractDomainName(url) || `Source ${i + 1}`,
        url,
        date: new Date().toISOString(),
      })),
      category: mapCategory(category),
      tags: topic.tags || extractTags(topic.title + ' ' + topic.summary),
      engagement: {
        views: 0,
        saves: 0,
        questions: relatedQuestions.length || 0,
      },
      metadata: {
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        relevance_score: topic.relevance_score || 75,
      },
      related_questions: relatedQuestions.slice(0, 3),
    }));
  } catch (error: any) {
    console.error('[Discover] Error generating trending topics:', error.message);
    return [];
  }
}

/**
 * Generate news articles with analysis
 */
async function generateNewsWithAnalysis(
  category: string,
  options: PaginationOptions
): Promise<DiscoverItem[]> {
  try {
    const query = `Find the most important recent news articles about ${category}. For each article, provide: title, summary, and why it matters for decision-makers.`;

    const response = await chatCompletions({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: `You are a news curator. Find and summarize recent news articles. Return JSON:
{
  "articles": [
    {
      "title": "Article title",
      "summary": "2-3 sentence summary",
      "why_it_matters": "Why this matters for decision-makers",
      "tags": ["tag1", "tag2"]
    }
  ]
}`,
        },
        {
          role: 'user',
          content: query,
        },
      ],
      return_citations: true,
      return_related_questions: true,
      return_images: true, // Enable image extraction
      search_recency_filter: 'day',
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '';
    const citations = response.choices[0]?.message?.citations || response.citations || [];
    const images = response.images || response.choices[0]?.message?.images || [];
    const relatedQuestions = 
      response.related_questions || 
      response.choices[0]?.message?.related_questions || 
      [];

    // Parse articles
    let articles: any[] = [];
    try {
      const jsonMatch = content.match(/\{[\s\S]*"articles"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        articles = parsed.articles || [];
      }
    } catch {
      // Fallback: extract from text
      const sections = content.split(/\n\n+/);
      articles = sections.slice(0, 5).map((section) => {
        const lines = section.split('\n').filter(l => l.trim());
        return {
          title: lines[0]?.replace(/^[#*0-9.]+\s*/, '').trim() || 'News Article',
          summary: lines.slice(1).join(' ').trim() || section.substring(0, 200),
          why_it_matters: '',
          tags: extractTags(section),
        };
      });
    }

    return articles.slice(0, Math.ceil(options.limit / 3)).map((article: any, idx: number) => ({
      id: `news-${Date.now()}-${idx}`,
      type: 'article' as const,
      title: article.title || 'News Article',
      summary: article.summary || article.why_it_matters || '',
      thumbnail: images[idx] || images[0] || undefined, // Use first available image
      sources: citations.slice(0, 2).map((url: string, i: number) => ({
        name: extractDomainName(url) || `Source ${i + 1}`,
        url,
        date: new Date().toISOString(),
      })),
      category: mapCategory(category),
      tags: article.tags || extractTags(article.title + ' ' + article.summary),
      engagement: {
        views: 0,
        saves: 0,
        questions: 0,
      },
      metadata: {
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        relevance_score: 80 + Math.random() * 15,
      },
    }));
  } catch (error: any) {
    console.error('[Discover] Error generating news:', error.message);
    return [];
  }
}

/**
 * Generate insights and analysis
 */
async function generateInsights(
  category: string,
  options: PaginationOptions
): Promise<DiscoverItem[]> {
  try {
    const query = `Provide strategic insights and analysis about ${category}. Focus on implications, trends, and what decision-makers should watch.`;

    const response = await chatCompletions({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: `You are a strategic analyst. Provide insights in JSON format:
{
  "insights": [
    {
      "title": "Insight title",
      "summary": "Detailed analysis (3-4 sentences)",
      "implications": "What this means",
      "tags": ["tag1", "tag2"]
    }
  ]
}`,
        },
        {
          role: 'user',
          content: query,
        },
      ],
      return_citations: true,
      return_related_questions: true,
      return_images: true, // Enable image extraction
      search_recency_filter: 'week',
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '';
    const citations = response.choices[0]?.message?.citations || response.citations || [];
    const images = response.images || response.choices[0]?.message?.images || [];
    const relatedQuestions = 
      response.related_questions || 
      response.choices[0]?.message?.related_questions || 
      [];

    // Parse insights
    let insights: any[] = [];
    try {
      const jsonMatch = content.match(/\{[\s\S]*"insights"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        insights = parsed.insights || [];
      }
    } catch {
      // Fallback
      const sections = content.split(/\n\n+/);
      insights = sections.slice(0, 5).map((section) => {
        const lines = section.split('\n').filter(l => l.trim());
        return {
          title: lines[0]?.replace(/^[#*0-9.]+\s*/, '').trim() || 'Insight',
          summary: lines.slice(1).join(' ').trim() || section.substring(0, 300),
          implications: '',
          tags: extractTags(section),
        };
      });
    }

    return insights.slice(0, Math.ceil(options.limit / 3)).map((insight: any, idx: number) => ({
      id: `insight-${Date.now()}-${idx}`,
      type: 'insight' as const,
      title: insight.title || 'Strategic Insight',
      summary: insight.summary || insight.implications || '',
      thumbnail: images[idx] || images[0] || undefined, // Use first available image
      sources: citations.slice(0, 2).map((url: string, i: number) => ({
        name: extractDomainName(url) || `Source ${i + 1}`,
        url,
        date: new Date().toISOString(),
      })),
      category: mapCategory(category),
      tags: insight.tags || extractTags(insight.title + ' ' + insight.summary),
      engagement: {
        views: 0,
        saves: 0,
        questions: relatedQuestions.length || 0,
      },
      metadata: {
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        relevance_score: 85 + Math.random() * 10,
      },
      related_questions: relatedQuestions.slice(0, 3),
    }));
  } catch (error: any) {
    console.error('[Discover] Error generating insights:', error.message);
    return [];
  }
}

/**
 * Calculate personalization score
 */
export function calculatePersonalizationScore(
  item: DiscoverItem,
  userPreferences?: {
    preferred_sectors?: string[];
    preferred_regions?: string[];
    saved_items?: string[];
  }
): number {
  let score = item.metadata.relevance_score || 50;

  if (userPreferences) {
    if (userPreferences.preferred_sectors) {
      const sectorMatch = item.tags.some(tag => 
        userPreferences.preferred_sectors!.some(sector => 
          tag.toLowerCase().includes(sector.toLowerCase())
        )
      );
      if (sectorMatch) score += 20;
    }

    if (userPreferences.preferred_regions) {
      const regionMatch = item.category.toLowerCase().includes(
        userPreferences.preferred_regions[0]?.toLowerCase() || ''
      );
      if (regionMatch) score += 15;
    }

    if (userPreferences.saved_items && userPreferences.saved_items.length > 0) {
      score += 10;
    }
  }

  return Math.min(100, score);
}

/**
 * Helper: Map category to readable name
 */
function mapCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    all: 'General',
    tech: 'Technology',
    finance: 'Finance',
    geopolitics: 'Geopolitics',
    energy: 'Energy',
    'supply-chain': 'Supply Chain',
  };
  return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

/**
 * Helper: Extract tags from text
 */
function extractTags(text: string): string[] {
  if (!text) return [];
  
  const commonTags = [
    'geopolitics', 'finance', 'technology', 'energy', 'supply-chain',
    'trade', 'security', 'markets', 'economy', 'policy',
    'china', 'usa', 'europe', 'middle-east', 'asia',
    'oil', 'gas', 'commodities', 'crypto', 'stocks',
  ];
  
  const lowerText = text.toLowerCase();
  return commonTags.filter(tag => lowerText.includes(tag));
}

/**
 * Helper: Extract domain name from URL
 */
function extractDomainName(url: string): string {
  try {
    const urlObj = new URL(url);
    let domain = urlObj.hostname.replace('www.', '');
    // Extract site name (e.g., 'reuters.com' -> 'Reuters')
    const parts = domain.split('.');
    if (parts.length > 1) {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    return domain;
  } catch {
    return '';
  }
}

/**
 * Generate search results for a specific query
 */
async function generateSearchResults(
  query: string,
  options: PaginationOptions
): Promise<DiscoverItem[]> {
  try {
    const response = await chatCompletions({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: `You are a search engine for financial intelligence. Find and summarize relevant information about: "${query}". Return JSON format:
{
  "results": [
    {
      "title": "Clear, descriptive title",
      "summary": "2-3 sentence summary",
      "tags": ["tag1", "tag2"],
      "relevance_score": 85
    }
  ]
}

Focus on information relevant for decision-makers in finance, geopolitics, and supply chains.`,
        },
        {
          role: 'user',
          content: `Search for: ${query}`,
        },
      ],
      return_citations: true,
      return_related_questions: true,
      return_images: true, // Enable image extraction
      search_recency_filter: 'week',
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '';
    const citations = response.choices[0]?.message?.citations || response.citations || [];
    const images = response.images || response.choices[0]?.message?.images || [];
    const relatedQuestions = response.related_questions || [];

    let results: any[] = [];
    try {
      const jsonMatch = content.match(/\{[\s\S]*"results"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        results = parsed.results || [];
      }
    } catch {
      // Fallback: create result from content
      results = [{
        title: query,
        summary: content.substring(0, 300),
        tags: extractTags(content),
        relevance_score: 80,
      }];
    }

    return results.slice(0, options.limit).map((result: any, idx: number) => ({
      id: `search-${Date.now()}-${idx}`,
      type: 'topic' as const,
      title: result.title || query,
      summary: result.summary || '',
      thumbnail: images[idx] || images[0] || undefined, // Use first available image
      sources: citations.slice(0, 3).map((url: string, i: number) => ({
        name: extractDomainName(url) || `Source ${i + 1}`,
        url,
        date: new Date().toISOString(),
      })),
      category: 'Search Results',
      tags: result.tags || extractTags(result.title + ' ' + result.summary),
      engagement: {
        views: 0,
        saves: 0,
        questions: relatedQuestions.length || 0,
      },
      metadata: {
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        relevance_score: result.relevance_score || 80,
      },
      related_questions: relatedQuestions.slice(0, 3),
    }));
  } catch (error: any) {
    console.error('[Discover] Error generating search results:', error.message);
    return [];
  }
}

/**
 * Helper: Remove duplicates based on title similarity
 */
function removeDuplicates(items: DiscoverItem[]): DiscoverItem[] {
  const seen = new Set<string>();
  const unique: DiscoverItem[] = [];

  for (const item of items) {
    const normalizedTitle = item.title.toLowerCase().trim();
    if (!seen.has(normalizedTitle)) {
      seen.add(normalizedTitle);
      unique.push(item);
    }
  }

  return unique;
}
