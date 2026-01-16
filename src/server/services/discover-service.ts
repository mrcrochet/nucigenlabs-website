/**
 * Discover Service - Database Read-Only
 * 
 * Strategy:
 * - events table is the single source of truth
 * - Discover = projection/state of events with discover_* columns
 * - No Perplexity calls in user request flow (batch enrichment only)
 * - Read-only: fetches from events table with discover_* columns
 * 
 * Data flow:
 * 1. discover-collector.ts: EventRegistry → events (with discover_* columns)
 * 2. discover-enricher.ts: Batch Perplexity enrichment → events.discover_why_it_matters
 * 3. discover-service.ts: Read from events → return DiscoverItem[]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config({ path: join(__dirname, '../../../../.env') });
dotenv.config();

// Use service_role key for server-side reads (bypasses RLS)
// This ensures we can read all discover data regardless of RLS policies
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Fallback to anon key if service_role not available (for client-side compatibility)
const supabaseKey = supabaseServiceKey || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Discover Service] Supabase not configured. Using placeholder client.');
}

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

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
 * Fetch Discover items from events table (READ-ONLY)
 * 
 * No Perplexity calls here - all enrichment is done by batch jobs
 */
export async function fetchDiscoverItems(
  category: string,
  options: PaginationOptions,
  userId?: string,
  searchQuery?: string,
  timeRange?: string,
  sortBy?: string
): Promise<DiscoverItem[]> {
  try {
    // Build query: select events with discover_* columns
    let query = supabase
      .from('events')
      .select('*');
    
    // Filter by discover columns (will fail if migration not applied)
    query = query.not('discover_score', 'is', null);
    query = query.not('discover_type', 'is', null);
    
    // Category filter
    if (category && category !== 'all') {
      query = query.eq('discover_category', category);
    }
    
    // Search query
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }
    
    // Time range filter
    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      let dateStart: Date;
      
      switch (timeRange) {
        case 'now':
          dateStart = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48h
          break;
        case '24h':
          dateStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          dateStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dateStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'structural':
          // Structural = older than 30 days but high score
          query = query.lt('published_at', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString());
          query = query.gte('discover_score', 70);
          break;
        default:
          dateStart = new Date(0); // All time
      }
      
      if (timeRange !== 'structural') {
        query = query.gte('published_at', dateStart.toISOString());
      }
    }
    
    // Sort
    if (sortBy === 'recent') {
      query = query.order('published_at', { ascending: false });
    } else if (sortBy === 'trending') {
      // Trending = high score + recent
      query = query.order('discover_score', { ascending: false });
      query = query.order('published_at', { ascending: false });
    } else {
      // Default: relevance (by score)
      query = query.order('discover_score', { ascending: false });
    }
    
    // Pagination
    query = query.range(options.offset, options.offset + options.limit - 1);
    
    const { data: events, error } = await query;
    
    if (error) {
      // Check if error is due to missing columns
      const errorMessage = error.message || '';
      const errorCode = error.code || '';
      
      if (errorMessage.includes('discover_') || errorMessage.includes('column') || errorCode === '42703' || errorMessage.includes('does not exist')) {
        const helpfulMessage = 'Discover columns not found. Please apply migration: supabase/migrations/20260110000000_add_discover_columns_to_events.sql';
        console.warn(`[Discover] ${helpfulMessage}`);
        throw new Error(helpfulMessage);
      }
      
      console.error('[Discover] DB error:', error);
      console.error('[Discover] Error details:', { message: error.message, code: error.code, details: error.details, hint: error.hint });
      throw new Error(`Database query error: ${error.message || 'Unknown error'}`);
    }
    
    if (!events || events.length === 0) {
      console.log('[Discover] No events found with Discover data.');
      console.log('[Discover] Debug info:', {
        category,
        timeRange,
        sortBy,
        offset: options.offset,
        limit: options.limit,
        searchQuery: searchQuery || 'none',
      });
      // Try a simple query to see if any discover data exists at all
      const { count } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .not('discover_score', 'is', null);
      console.log('[Discover] Total events with discover_score:', count);
      return [];
    }
    
    // Map events to DiscoverItem format
    return events.map(event => mapEventToDiscoverItem(event));
  } catch (error: any) {
    console.error('[Discover] Error in fetchDiscoverItems:', error);
    console.error('[Discover] Error stack:', error.stack);
    throw error; // Re-throw to let API handler catch it
  }
}

/**
 * Map event from DB to DiscoverItem
 */
function mapEventToDiscoverItem(event: any): DiscoverItem {
  // Map discover_type to DiscoverItem type
  let type: 'article' | 'topic' | 'insight' | 'trend' = 'article';
  if (event.discover_type === 'event') {
    type = 'topic'; // Events become topics in Discover
  } else if (event.discover_type === 'trend') {
    type = 'trend';
  } else {
    type = 'article';
  }
  
  // Map discover_sources to sources array
  const sources = (event.discover_sources || []).map((s: any) => ({
    name: s.name || 'Unknown',
    url: s.url || '',
    date: s.date || event.published_at,
  }));
  
  return {
    id: event.id,
    type,
    title: event.title,
    summary: event.description || event.content?.substring(0, 300) || '',
    thumbnail: event.discover_thumbnail,
    sources,
    category: event.discover_category || 'all',
    tags: event.discover_tags || [],
    engagement: {
      views: 0,
      saves: 0,
      questions: 0,
    },
    metadata: {
      published_at: event.published_at,
      updated_at: event.discover_enriched_at || event.published_at,
      relevance_score: event.discover_score || 50,
    },
    // Tier-based styling
    tier: event.discover_tier || 'strategic',
    // Consensus indicator
    consensus: event.discover_consensus || 'fragmented',
    // Why it matters (from Perplexity batch enrichment)
    impact: event.discover_why_it_matters || undefined,
  };
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
      model: 'sonar', // OPTIMIZED: Use 'sonar' instead of 'sonar-pro' (3-5x cheaper)
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
      return_images: false, // OPTIMIZED: Disabled to reduce costs
      search_recency_filter: 'week',
      max_tokens: 800, // OPTIMIZED: Reduced from 2000 to 800 (sufficient for 5-7 items)
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
      sources: citations.map((url: string, i: number) => ({
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
      model: 'sonar', // OPTIMIZED: Use 'sonar' instead of 'sonar-pro'
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
      return_images: false, // OPTIMIZED: Disabled to reduce costs
      search_recency_filter: 'day',
      max_tokens: 800, // OPTIMIZED: Reduced from 2000 to 800
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
      sources: citations.map((url: string, i: number) => ({
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
      model: 'sonar', // OPTIMIZED: Use 'sonar' instead of 'sonar-pro'
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
      return_images: false, // OPTIMIZED: Disabled to reduce costs
      search_recency_filter: 'week',
      max_tokens: 800, // OPTIMIZED: Reduced from 2000 to 800
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
      sources: citations.map((url: string, i: number) => ({
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
      model: 'sonar', // OPTIMIZED: Use 'sonar' instead of 'sonar-pro'
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
      return_images: false, // OPTIMIZED: Disabled to reduce costs
      search_recency_filter: 'week',
      max_tokens: 1000, // OPTIMIZED: Reduced from 2000 to 1000 (search needs more tokens)
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
      sources: citations.map((url: string, i: number) => ({
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
 * Determine tier based on relevance and source count
 */
function determineTier(item: Partial<DiscoverItem>): 'critical' | 'strategic' | 'background' {
  const relevance = item.metadata?.relevance_score || 0;
  const sourceCount = item.sources?.length || 0;
  
  if (relevance >= 90 && sourceCount >= 30) return 'critical';
  if (relevance >= 70 || sourceCount >= 10) return 'strategic';
  return 'background';
}

/**
 * Determine consensus based on source count
 */
function determineConsensus(sourceCount: number): 'high' | 'fragmented' | 'disputed' {
  if (sourceCount >= 40) return 'high';
  if (sourceCount >= 15) return 'fragmented';
  return 'disputed';
}

/**
 * Generate impact statement (1 line max) using Perplexity
 */
async function generateImpact(title: string, summary: string, category: string): Promise<string | undefined> {
  try {
    const { chatCompletions } = await import('./perplexity-service.js');
    
    const response = await chatCompletions({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are a financial intelligence analyst. Generate a single-line impact statement (max 80 characters) explaining why this development matters for decision-makers. Be specific and actionable. No jargon.',
        },
        {
          role: 'user',
          content: `Title: ${title}\nSummary: ${summary}\nCategory: ${category}\n\nGenerate a one-line impact statement.`,
        },
      ],
      max_tokens: 100,
      return_citations: false,
    });

    const impact = response.choices[0]?.message?.content?.trim();
    if (impact && impact.length <= 100) {
      return impact;
    }
    return undefined;
  } catch (error) {
    console.warn('[Discover] Failed to generate impact:', error);
    return undefined;
  }
}

/**
 * Enrich item with elite features (tier, impact, consensus)
 * OPTIMIZED: Only generate impact for top items to reduce API calls
 */
async function enrichItem(item: DiscoverItem, generateImpactForThis: boolean = false): Promise<DiscoverItem> {
  const tier = determineTier(item);
  const consensus = determineConsensus(item.sources.length);
  
  // OPTIMIZED: Only generate impact for top items (first 3)
  const impactPromise = generateImpactForThis 
    ? generateImpact(item.title, item.summary, item.category)
    : Promise.resolve(undefined);
  
  return {
    ...item,
    tier,
    consensus,
    impact: await impactPromise,
  };
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
