/**
 * Discover Collector Worker
 * 
 * Ingestion EventRegistry → events table (with discover_* columns)
 * 
 * Strategy:
 * - events remains the single source of truth
 * - Discover = projection/state of events with discover_* columns
 * - Scoring interne (sans LLM) pour trier
 * - Pas d'enrichissement Perplexity ici (fait par discover-enricher.ts)
 * 
 * Categories:
 * - all: geopolitics, finance, technology, energy, supply chain
 * - tech: technology, AI, semiconductors, software
 * - finance: finance, markets, banking, monetary policy
 * - geopolitics: geopolitics, international relations, conflicts, diplomacy
 * - energy: energy, oil, gas, renewables, commodities
 * - supply-chain: supply chain, logistics, manufacturing, trade
 */

import { searchArticles, searchEvents, getTrendingConcepts, type Article, type Event as EventRegistryEvent, type TrendingConcept } from '../services/eventregistry-service.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables (same pattern as other workers)
dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config({ path: join(__dirname, '../../../../.env') });
dotenv.config();

// Use service_role key for workers (bypasses RLS)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[Discover Collector] Missing Supabase config:');
  console.error('  SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
}

console.log(`[Discover Collector] Supabase configured: ${supabaseUrl.substring(0, 30)}... (service_role key: ${supabaseServiceKey.substring(0, 20)}...)`);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DiscoverItemRaw {
  // Core event fields
  source: string;
  source_id: string;
  title: string;
  description: string;
  content: string;
  published_at: string;
  url?: string;
  author?: string;
  language: string;
  raw_category?: string;
  raw_tags?: string[];
  status: 'pending' | 'processing' | 'processed' | 'error';
  
  // Discover-specific fields
  discover_type: 'article' | 'event' | 'trend';
  discover_category: string;
  discover_tags: string[];
  discover_thumbnail?: string;
  discover_sources: Array<{ name: string; url: string; date: string }>;
  discover_concepts?: Array<{ uri: string; label: string; score: number }>;
  discover_location?: { label: string; country?: string };
  discover_sentiment?: 'positive' | 'negative' | 'neutral';
  discover_article_count?: number;
  
  // Scoring (calculated internally, no LLM)
  discover_score: number;
  discover_tier: 'critical' | 'strategic' | 'background';
  discover_consensus: 'high' | 'fragmented' | 'disputed';
}

/**
 * Map category to EventRegistry keywords
 */
function mapCategoryToKeywords(category: string): string[] {
  const mapping: Record<string, string[]> = {
    all: ['geopolitics', 'finance', 'technology', 'energy', 'supply chain'],
    tech: ['technology', 'AI', 'semiconductors', 'software'],
    finance: ['finance', 'markets', 'banking', 'monetary policy'],
    geopolitics: ['geopolitics', 'international relations', 'conflicts', 'diplomacy'],
    energy: ['energy', 'oil', 'gas', 'renewables', 'commodities'],
    'supply-chain': ['supply chain', 'logistics', 'manufacturing', 'trade'],
  };
  
  return mapping[category] || [category];
}

/**
 * Calculate relevance score (internal, no LLM)
 * 
 * Scoring factors:
 * - Article count (for events): up to 30 points
 * - Concepts score: up to 30 points
 * - Recency: up to 20 points (exponential decay)
 * - Sentiment: 10 points (if positive/negative)
 * - Source quality: implicit (via article count)
 */
function calculateRelevanceScore(item: {
  articleCount?: number;
  concepts?: Array<{ score: number }>;
  date: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}): number {
  let score = 50; // Base score
  
  // 1. Article count (for events) - diminishing returns
  if (item.articleCount) {
    score += Math.min(30, Math.log(item.articleCount + 1) * 5);
  }
  
  // 2. Concepts score (average of concept scores)
  if (item.concepts && item.concepts.length > 0) {
    const avgConceptScore = item.concepts.reduce((sum, c) => sum + (c.score || 0), 0) / item.concepts.length;
    score += Math.min(30, avgConceptScore * 0.3);
  }
  
  // 3. Recency (exponential decay: 20 points for now, 0 after 48h)
  const hoursSince = (Date.now() - new Date(item.date).getTime()) / (1000 * 60 * 60);
  score += Math.max(0, 20 * Math.exp(-hoursSince / 24));
  
  // 4. Sentiment (extreme = more important)
  if (item.sentiment === 'positive' || item.sentiment === 'negative') {
    score += 10;
  }
  
  return Math.min(100, Math.round(score));
}

/**
 * Determine tier based on score
 */
function determineTier(score: number): 'critical' | 'strategic' | 'background' {
  if (score > 90) return 'critical';
  if (score >= 70) return 'strategic';
  return 'background';
}

/**
 * Determine consensus based on source count
 */
function determineConsensus(articleCount: number): 'high' | 'fragmented' | 'disputed' {
  if (articleCount >= 40) return 'high';
  if (articleCount >= 10) return 'fragmented';
  return 'disputed';
}

/**
 * Normalize EventRegistry article to Discover item
 */
function normalizeArticle(article: Article, category: string): DiscoverItemRaw | null {
  if (!article.title || !article.date) {
    return null;
  }
  
  const concepts = article.concepts || [];
  const score = calculateRelevanceScore({
    concepts,
    date: article.date,
    sentiment: article.sentiment?.polarity,
  });
  
  return {
    source: 'eventregistry',
    source_id: article.uri || article.url,
    title: article.title,
    description: article.body?.substring(0, 500) || '',
    content: article.body || '',
    published_at: article.dateTimePub || article.date,
    url: article.url,
    author: article.source?.title,
    language: article.lang || 'en',
    raw_category: category,
    raw_tags: [],
    status: 'pending',
    
    discover_type: 'article',
    discover_category: category,
    discover_tags: concepts.slice(0, 5).map(c => c.label),
    discover_thumbnail: article.images?.[0]?.url,
    discover_sources: [{
      name: article.source?.title || 'Unknown',
      url: article.url,
      date: article.date,
    }],
    discover_concepts: concepts.map(c => ({
      uri: c.uri,
      label: c.label,
      score: c.score || 0,
    })),
    discover_location: article.location ? {
      label: article.location.label,
    } : undefined,
    discover_sentiment: article.sentiment?.polarity,
    
    discover_score: score,
    discover_tier: determineTier(score),
    discover_consensus: determineConsensus(1), // Single article = disputed
  };
}

/**
 * Normalize EventRegistry event to Discover item
 */
function normalizeEvent(event: EventRegistryEvent, category: string): DiscoverItemRaw | null {
  if (!event.title || !event.date) {
    return null;
  }
  
  const concepts = event.concepts || [];
  const articleCount = event.articleCount || 0;
  const score = calculateRelevanceScore({
    articleCount,
    concepts,
    date: event.date,
  });
  
  // Extract sources from articles
  const sources = event.articles?.slice(0, 10).map(article => ({
    name: article.source?.title || 'Unknown',
    url: article.url,
    date: article.date,
  })) || [];
  
  return {
    source: 'eventregistry',
    source_id: event.uri,
    title: event.title,
    description: event.summary || '',
    content: event.summary || '',
    published_at: event.dateTimePub || event.date,
    url: undefined, // Events don't have a single URL
    author: undefined,
    language: event.lang || 'en',
    raw_category: category,
    raw_tags: [],
    status: 'pending',
    
    discover_type: 'event',
    discover_category: category,
    discover_tags: concepts.slice(0, 5).map(c => c.label),
    discover_thumbnail: event.articles?.[0]?.images?.[0]?.url,
    discover_sources: sources,
    discover_concepts: concepts.map(c => ({
      uri: c.uri,
      label: c.label,
      score: c.score || 0,
    })),
    discover_location: event.location ? {
      label: event.location.label,
    } : undefined,
    discover_sentiment: undefined, // Events don't have sentiment directly
    discover_article_count: articleCount,
    
    discover_score: score,
    discover_tier: determineTier(score),
    discover_consensus: determineConsensus(articleCount),
  };
}

/**
 * Normalize EventRegistry trending concept to Discover item
 */
function normalizeTrend(concept: TrendingConcept, category: string): DiscoverItemRaw | null {
  if (!concept.label) {
    return null;
  }
  
  const score = calculateRelevanceScore({
    concepts: [{ score: concept.score || 0 }],
    date: new Date().toISOString(), // Trends are current
  });
  
  return {
    source: 'eventregistry',
    source_id: concept.uri,
    title: `Trending: ${concept.label}`,
    description: `Trending concept with ${concept.mentionsCount || 0} mentions`,
    content: `Trending concept: ${concept.label}`,
    published_at: new Date().toISOString(),
    url: undefined,
    author: undefined,
    language: 'en',
    raw_category: category,
    raw_tags: [],
    status: 'pending',
    
    discover_type: 'trend',
    discover_category: category,
    discover_tags: [concept.label],
    discover_thumbnail: undefined,
    discover_sources: [],
    discover_concepts: [{
      uri: concept.uri,
      label: concept.label,
      score: concept.score || 0,
    }],
    discover_location: undefined,
    discover_sentiment: undefined,
    discover_article_count: concept.mentionsCount || 0,
    
    discover_score: score,
    discover_tier: determineTier(score),
    discover_consensus: determineConsensus(concept.mentionsCount || 0),
  };
}

/**
 * Deduplicate items by title + date
 */
function deduplicateItems(items: DiscoverItemRaw[]): DiscoverItemRaw[] {
  const seen = new Map<string, DiscoverItemRaw>();
  
  for (const item of items) {
    const key = `${item.title.toLowerCase()}_${item.published_at.substring(0, 10)}`;
    const existing = seen.get(key);
    
    // Keep the one with higher score
    if (!existing || item.discover_score > existing.discover_score) {
      seen.set(key, item);
    }
  }
  
  return Array.from(seen.values());
}

/**
 * Collect Discover items from EventRegistry
 */
export async function collectDiscoverItems(
  categories: string[] = ['all']
): Promise<{ collected: number; inserted: number; skipped: number; errors: number }> {
  console.log(`[Discover Collector] Starting collection for categories: ${categories.join(', ')}`);
  
  const allItems: DiscoverItemRaw[] = [];
  let errors = 0;
  
  try {
    for (const category of categories) {
      const keywords = mapCategoryToKeywords(category);
      // EventRegistry doesn't support OR syntax - make separate queries for each keyword
      // Add date range (last 7 days) to get recent articles
      const dateEnd = new Date().toISOString().split('T')[0]; // Today
      const dateStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days ago
      
      console.log(`[Discover Collector] Collecting ${category} (keywords: ${keywords.join(', ')})...`);
      
      try {
        // 1. Articles - query each keyword separately and aggregate
        const allArticles: Article[] = [];
        const articlesPerKeyword = Math.ceil(30 / keywords.length); // Distribute articles across keywords
        
        for (const keyword of keywords) {
          try {
            console.log(`[Discover Collector] Searching articles with keyword: "${keyword}" (${dateStart} to ${dateEnd})`);
            const articlesResponse = await searchArticles({
              keywords: keyword,
              articlesCount: articlesPerKeyword,
              sortBy: 'date',
              sortByAsc: false,
              lang: 'eng',
              dateStart,
              dateEnd,
            });
            
            const articles = articlesResponse.articles?.results || [];
            console.log(`[Discover Collector] Found ${articles.length} articles for "${keyword}"`);
            allArticles.push(...articles);
          } catch (keywordError: any) {
            console.warn(`[Discover Collector] Error searching articles for keyword "${keyword}":`, keywordError.message);
            // Continue with other keywords
          }
        }
        
        console.log(`[Discover Collector] Total articles found for ${category}: ${allArticles.length}`);
        
        for (const article of allArticles) {
          const normalized = normalizeArticle(article, category);
          if (normalized) {
            allItems.push(normalized);
          }
        }
        
        // 2. Events - query each keyword separately and aggregate
        const allEvents: EventRegistryEvent[] = [];
        const eventsPerKeyword = Math.ceil(15 / keywords.length); // Distribute events across keywords
        
        for (const keyword of keywords) {
          try {
            console.log(`[Discover Collector] Searching events with keyword: "${keyword}" (${dateStart} to ${dateEnd})`);
            const eventsResponse = await searchEvents({
              keywords: keyword,
              eventsCount: eventsPerKeyword,
              sortBy: 'date',
              sortByAsc: false,
              lang: 'eng',
              dateStart,
              dateEnd,
            });
            
            const events = eventsResponse.events?.results || [];
            console.log(`[Discover Collector] Found ${events.length} events for "${keyword}"`);
            allEvents.push(...events);
          } catch (keywordError: any) {
            console.warn(`[Discover Collector] Error searching events for keyword "${keyword}":`, keywordError.message);
            // Continue with other keywords
          }
        }
        
        console.log(`[Discover Collector] Total events found for ${category}: ${allEvents.length}`);
        
        for (const event of allEvents) {
          const normalized = normalizeEvent(event, category);
          if (normalized) {
            allItems.push(normalized);
          }
        }
        
        // 3. Trends (10 per category, only for 'all')
        if (category === 'all') {
          const trendsResponse = await getTrendingConcepts({
            source: 'news',
            count: 10,
            lang: 'eng',
          });
          
          const trends = trendsResponse.trendingConcepts?.results || [];
          console.log(`[Discover Collector] Found ${trends.length} trends`);
          
          for (const trend of trends) {
            const normalized = normalizeTrend(trend, category);
            if (normalized) {
              allItems.push(normalized);
            }
          }
        }
      } catch (error: any) {
        console.error(`[Discover Collector] Error collecting ${category}:`, error.message);
        errors++;
        // Continue with other categories
      }
    }
    
    // Deduplicate
    const uniqueItems = deduplicateItems(allItems);
    console.log(`[Discover Collector] Collected ${allItems.length} items, ${uniqueItems.length} unique after deduplication`);
    
    // Insert into events table
    let inserted = 0;
    let skipped = 0;
    
    for (const item of uniqueItems) {
      // Check if already exists (by source + source_id)
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('source', item.source)
        .eq('source_id', item.source_id)
        .maybeSingle();
      
      if (existing) {
        // Update existing event with Discover fields
        const { error: updateError } = await supabase
          .from('events')
          .update({
            discover_score: item.discover_score,
            discover_tier: item.discover_tier,
            discover_consensus: item.discover_consensus,
            discover_type: item.discover_type,
            discover_category: item.discover_category,
            discover_tags: item.discover_tags,
            discover_thumbnail: item.discover_thumbnail,
            discover_sources: item.discover_sources,
            discover_concepts: item.discover_concepts,
            discover_location: item.discover_location,
            discover_sentiment: item.discover_sentiment,
            discover_article_count: item.discover_article_count,
            // Don't update why_it_matters if it already exists (preserve Perplexity enrichment)
          } as any)
          .eq('id', existing.id);
        
        if (updateError) {
          console.error(`[Discover Collector] Error updating event: ${updateError.message}`);
          errors++;
        } else {
          skipped++; // Counted as skipped (already existed)
        }
      } else {
        // Insert new event
        const { data: insertedData, error: insertError } = await supabase
          .from('events')
          .insert({
            source: item.source,
            source_id: item.source_id,
            title: item.title,
            description: item.description,
            content: item.content,
            published_at: item.published_at,
            url: item.url,
            author: item.author,
            language: item.language,
            raw_category: item.raw_category,
            raw_tags: item.raw_tags,
            status: item.status,
            
            // Discover fields
            discover_score: item.discover_score,
            discover_tier: item.discover_tier,
            discover_consensus: item.discover_consensus,
            discover_type: item.discover_type,
            discover_category: item.discover_category,
            discover_tags: item.discover_tags,
            discover_thumbnail: item.discover_thumbnail,
            discover_sources: item.discover_sources,
            discover_concepts: item.discover_concepts,
            discover_location: item.discover_location,
            discover_sentiment: item.discover_sentiment,
            discover_article_count: item.discover_article_count,
          } as any);
        
        if (insertError) {
          console.error(`[Discover Collector] Error inserting event: ${insertError.message}`);
          console.error(`[Discover Collector] Error details:`, {
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint,
          });
          errors++;
        } else {
          inserted++;
        }
      }
    }
    
    console.log(`[Discover Collector] Collection complete: ${inserted} inserted, ${skipped} updated, ${errors} errors`);
    
    return {
      collected: uniqueItems.length,
      inserted,
      skipped,
      errors,
    };
  } catch (error: any) {
    console.error('[Discover Collector] Fatal error:', error);
    return {
      collected: allItems.length,
      inserted: 0,
      skipped: 0,
      errors: errors + 1,
    };
  }
}
