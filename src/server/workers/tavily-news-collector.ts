/**
 * Tavily News Collector
 * 
 * Uses Tavily's intelligent search to collect relevant, recent events
 * Replaces/improves NewsAPI by filtering for quality and relevance
 */

import { createClient } from '@supabase/supabase-js';
import { tavily } from '@tavily/core';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const tavilyApiKey = process.env.TAVILY_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

if (!tavilyApiKey) {
  throw new Error('Missing TAVILY_API_KEY. Tavily is required for quality news collection.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const tavilyClient = tavily({ apiKey: tavilyApiKey });

/**
 * Tavily Search Queries
 * Intelligent queries focused on geopolitical, economic, and regulatory events
 */
const TAVILY_QUERIES = [
  // Geopolitical & International
  {
    query: 'recent geopolitical events economic impact 2025',
    category: 'general',
    tags: ['geopolitical', 'international'],
  },
  {
    query: 'international trade policy changes sanctions tariffs',
    category: 'business',
    tags: ['trade', 'policy', 'sanctions'],
  },
  {
    query: 'regulatory changes financial markets banking',
    category: 'business',
    tags: ['regulation', 'finance', 'banking'],
  },
  
  // Business & Finance
  {
    query: 'major business developments mergers acquisitions 2025',
    category: 'business',
    tags: ['mergers', 'acquisitions', 'corporate'],
  },
  {
    query: 'central bank policy changes interest rates monetary policy',
    category: 'business',
    tags: ['central-bank', 'monetary-policy', 'interest-rates'],
  },
  {
    query: 'commodity market disruptions supply chain energy',
    category: 'business',
    tags: ['commodities', 'supply-chain', 'energy'],
  },
  
  // Technology & Regulation
  {
    query: 'technology regulation policy changes AI cybersecurity',
    category: 'technology',
    tags: ['tech-regulation', 'AI', 'cybersecurity'],
  },
  {
    query: 'cybersecurity incidents data breaches critical infrastructure',
    category: 'technology',
    tags: ['cybersecurity', 'data-breach', 'infrastructure'],
  },
  
  // Sector-Specific
  {
    query: 'energy sector policy changes oil gas renewable energy',
    category: 'business',
    tags: ['energy', 'oil', 'renewable'],
  },
  {
    query: 'environmental policy climate change carbon emissions',
    category: 'general',
    tags: ['environment', 'climate', 'policy'],
  },
];

interface TavilyArticle {
  title: string;
  url: string;
  content?: string;
  publishedDate?: string;
  score?: number;
  author?: string;
}

/**
 * Collect events from Tavily
 */
export async function collectTavilyEvents(): Promise<{ inserted: number; skipped: number; errors: number }> {
  try {
    console.log('[Tavily Collector] Starting intelligent news collection...');
    
    let allArticles: TavilyArticle[] = [];
    
    // Search all queries in parallel
    const searchPromises = TAVILY_QUERIES.map(async (queryConfig) => {
      try {
        console.log(`[Tavily Collector] Searching: "${queryConfig.query}"`);
        
        const response = await tavilyClient.search(queryConfig.query, {
          searchDepth: 'advanced',
          maxResults: 10, // Top 10 most relevant results
          includeAnswer: false, // We only need articles, not AI answers
          includeRawContent: true, // Get full article content
          includeImages: false,
        });
        
        const articles: TavilyArticle[] = (response.results || [])
          .filter((result: any) => {
            // Filter by relevance score (if available)
            const score = result.score || 0;
            return score >= 0.5; // Only highly relevant articles
          })
          .filter((result: any) => {
            // Filter by date (only recent articles, last 7 days)
            if (result.publishedDate) {
              const publishedDate = new Date(result.publishedDate);
              const daysAgo = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
              return daysAgo <= 7; // Only articles from last 7 days
            }
            return true; // If no date, include it (but prefer dated articles)
          })
          .map((result: any) => ({
            title: result.title || '',
            url: result.url || '',
            content: result.content || result.rawContent || '',
            publishedDate: result.publishedDate || new Date().toISOString(),
            score: result.score || 0.5,
            author: result.author || null,
          }))
          .filter((article: TavilyArticle) => article.title && article.url);
        
        console.log(`[Tavily Collector] Found ${articles.length} relevant articles for "${queryConfig.query}"`);
        
        return articles.map(article => ({
          ...article,
          category: queryConfig.category,
          tags: queryConfig.tags,
        }));
      } catch (error: any) {
        console.error(`[Tavily Collector] Error searching "${queryConfig.query}":`, error.message);
        return [];
      }
    });
    
    const searchResults = await Promise.allSettled(searchPromises);
    allArticles = searchResults
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<Array<TavilyArticle & { category: string; tags: string[] }>>).value)
      .flat();
    
    // Remove duplicates by URL
    const uniqueArticles = new Map<string, TavilyArticle & { category: string; tags: string[] }>();
    for (const article of allArticles) {
      if (!uniqueArticles.has(article.url)) {
        uniqueArticles.set(article.url, article);
      }
    }
    
    console.log(`[Tavily Collector] Found ${uniqueArticles.size} unique relevant articles from ${TAVILY_QUERIES.length} queries`);
    
    let inserted = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const article of uniqueArticles.values()) {
      // Skip if missing required fields
      if (!article.title || !article.url) {
        skipped++;
        continue;
      }
      
      // Check if event already exists (deduplication)
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('source', 'tavily')
        .eq('source_id', article.url)
        .maybeSingle();
      
      if (existing) {
        skipped++;
        continue;
      }
      
      // Parse publication date
      let publishedAt: Date;
      if (article.publishedDate) {
        publishedAt = new Date(article.publishedDate);
        if (isNaN(publishedAt.getTime())) {
          publishedAt = new Date();
        }
      } else {
        publishedAt = new Date();
      }
      
      // Insert new event
      const { error } = await supabase.from('events').insert({
        source: 'tavily',
        source_id: article.url,
        title: article.title,
        description: article.content ? article.content.substring(0, 500) : null,
        content: article.content || null,
        published_at: publishedAt.toISOString(),
        url: article.url,
        author: article.author || null,
        raw_category: article.category,
        status: 'pending',
      } as any);
      
      if (error) {
        console.error(`[Tavily Collector] Error inserting event: ${error.message}`);
        errors++;
      } else {
        inserted++;
      }
    }
    
    console.log(`[Tavily Collector] Collection complete: ${inserted} inserted, ${skipped} skipped (already exist), ${errors} errors`);
    
    if (inserted === 0 && skipped > 0) {
      console.log(`[Tavily Collector] Note: All articles already exist in database. This is normal after the first collection.`);
    }
    
    return { inserted, skipped, errors };
  } catch (error) {
    console.error('[Tavily Collector] Error collecting news:', error);
    return { inserted: 0, skipped: 0, errors: 1 };
  }
}

/**
 * Main function for Tavily collection
 */
export async function runTavilyCollector() {
  console.log('='.repeat(60));
  console.log('TAVILY NEWS COLLECTOR');
  console.log('='.repeat(60));
  
  const result = await collectTavilyEvents();
  
  console.log('='.repeat(60));
  return result;
}

// Run if called directly
if (process.argv[1] && process.argv[1].includes('tavily-news-collector')) {
  runTavilyCollector()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

