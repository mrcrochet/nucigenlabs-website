/**
 * Tavily News Collector
 * 
 * Uses Tavily's intelligent search to collect relevant, recent events
 * Replaces/improves NewsAPI by filtering for quality and relevance
 */

import { createClient } from '@supabase/supabase-js';
import { apiGateway } from '../services/api-gateway';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    
    // Search all queries using unified Tavily service (with deduplication and caching)
    const queries = TAVILY_QUERIES.map(q => ({
      query: q.query,
      type: 'news' as const,
      options: {
        maxResults: 50,
        days: 7,
        minScore: 0.5,
      },
    }));

    // Create a map to match results back to query configs
    const queryConfigMap = new Map(TAVILY_QUERIES.map((q, idx) => [q.query, { ...q, index: idx }]));

    const searchResults = await apiGateway.tavily.batchSearch(queries);
    
    // Process results and add category/tags
    for (const result of searchResults) {
      const queryConfig = queryConfigMap.get(result.query);
      if (queryConfig) {
        const articlesWithMeta = result.articles.map(article => ({
          ...article,
          category: queryConfig.category,
          tags: queryConfig.tags,
        }));
        
        allArticles.push(...articlesWithMeta);
      }
    }
    
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

