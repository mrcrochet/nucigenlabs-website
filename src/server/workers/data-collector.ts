/**
 * PHASE 3A: Data Collector Worker
 * 
 * Collects news articles from:
 * 1. Tavily (primary) - Intelligent, curated, high-signal
 * 2. RSS Feeds (complementary) - Trusted sources
 * 3. NewsAPI (disabled by default - manual/emergency fallback only)
 * 
 * NewsAPI is disabled due to cost-effectiveness concerns.
 * Use ENABLE_NEWSAPI=true to enable it manually.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { collectRSSEvents } from './rss-collector';
import { collectTavilyEvents } from './tavily-news-collector';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const newsApiKey = process.env.NEWS_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface NewsArticle {
  title: string;
  description: string | null;
  content: string | null;
  url: string;
  publishedAt: string;
  author?: string | null;
  source: {
    name: string;
  };
}

/**
 * Collect events from NewsAPI
 * DISABLED BY DEFAULT - Only runs if ENABLE_NEWSAPI=true
 * NewsAPI is not cost-effective for Nucigen's use case.
 */
export async function collectNewsEvents(): Promise<{ inserted: number; skipped: number; errors: number }> {
  // Check if NewsAPI is explicitly enabled
  const enableNewsAPI = process.env.ENABLE_NEWSAPI === 'true';
  
  if (!enableNewsAPI) {
    console.log('[Collector] NewsAPI disabled by default (cost-effectiveness). Set ENABLE_NEWSAPI=true to enable.');
    return { inserted: 0, skipped: 0, errors: 0 };
  }
  
  if (!newsApiKey) {
    console.warn('[Collector] NEWS_API_KEY not set, skipping NewsAPI collection');
    return { inserted: 0, skipped: 0, errors: 0 };
  }
  
  console.log('[Collector] ⚠️  NewsAPI enabled (manual override). This is not recommended for regular use.');

  try {
    console.log('[Collector] Starting news collection...');

    // Fetch top headlines from multiple categories
    const categories = ['business', 'technology', 'general'];
    let allArticles: NewsArticle[] = [];

    for (const category of categories) {
      try {
        const response = await fetch(
          `https://newsapi.org/v2/top-headlines?category=${category}&language=en&pageSize=50&apiKey=${newsApiKey}`
        );

        if (!response.ok) {
          console.error(`[Collector] NewsAPI error for ${category}: ${response.statusText}`);
          continue;
        }

        const data = await response.json();
        if (data.articles) {
          allArticles = allArticles.concat(data.articles);
        }
      } catch (error) {
        console.error(`[Collector] Error fetching ${category}:`, error);
        continue;
      }
    }

    console.log(`[Collector] Found ${allArticles.length} articles total`);

    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const article of allArticles) {
      // Skip if missing required fields
      if (!article.title || !article.url || !article.publishedAt) {
        skipped++;
        continue;
      }

      // Check if event already exists (deduplication)
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('source', 'newsapi')
        .eq('source_id', article.url)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      // Insert new event
      const { error } = await supabase.from('events').insert({
        source: 'newsapi',
        source_id: article.url,
        title: article.title,
        description: article.description || null,
        content: article.content || null,
        published_at: new Date(article.publishedAt).toISOString(),
        url: article.url,
        author: article.author || article.source?.name || null,
        raw_category: 'news',
        status: 'pending',
      });

      if (error) {
        console.error(`[Collector] Error inserting event: ${error.message}`);
        errors++;
      } else {
        inserted++;
      }
    }

    console.log(`[Collector] Collection complete: ${inserted} inserted, ${skipped} skipped, ${errors} errors`);
    return { inserted, skipped, errors };
  } catch (error) {
    console.error('[Collector] Error collecting news:', error);
    return { inserted: 0, skipped: 0, errors: 1 };
  }
}

/**
 * Main function for data collection
 * 
 * Architecture:
 * 1. Tavily (primary) - Intelligent, curated, high-signal
 * 2. RSS Feeds (complementary) - Trusted sources
 * 3. NewsAPI (disabled by default - manual/emergency only)
 */
export async function runDataCollector() {
  console.log('='.repeat(60));
  console.log('DATA COLLECTOR WORKER');
  console.log('='.repeat(60));
  console.log('Architecture: Tavily (primary) + RSS (complementary)');
  console.log('NewsAPI: Disabled by default (set ENABLE_NEWSAPI=true to enable)');
  console.log('='.repeat(60));
  
  // Collect from Tavily (primary source - quality over quantity)
  let tavilyResult = { inserted: 0, skipped: 0, errors: 0 };
  try {
    console.log('\n[Collector] Primary source: Tavily (intelligent search)...');
    tavilyResult = await collectTavilyEvents();
  } catch (error: any) {
    console.error('[Collector] ❌ Tavily collection failed:', error.message);
    console.error('[Collector] ⚠️  This is critical - Tavily is the primary source.');
    console.error('[Collector] Check TAVILY_API_KEY and Tavily service status.');
    // Don't fall back to NewsAPI automatically - user must explicitly enable it
  }
  
  // Collect from RSS feeds (complementary - always runs)
  console.log('\n[Collector] Complementary source: RSS feeds...');
  const rssResult = await collectRSSEvents();
  
  // Collect from NewsAPI (only if explicitly enabled)
  const newsResult = await collectNewsEvents();
  
  // Combine results
  const totalResult = {
    inserted: tavilyResult.inserted + newsResult.inserted + rssResult.inserted,
    skipped: tavilyResult.skipped + newsResult.skipped + rssResult.skipped,
    errors: tavilyResult.errors + newsResult.errors + rssResult.errors,
  };
  
  console.log('\n' + '='.repeat(60));
  console.log('TOTAL COLLECTION RESULTS:');
  console.log(`  Tavily (primary): ${tavilyResult.inserted} inserted, ${tavilyResult.skipped} skipped, ${tavilyResult.errors} errors`);
  console.log(`  RSS (complementary): ${rssResult.inserted} inserted, ${rssResult.skipped} skipped, ${rssResult.errors} errors`);
  if (newsResult.inserted > 0 || newsResult.skipped > 0) {
    console.log(`  NewsAPI (manual): ${newsResult.inserted} inserted, ${newsResult.skipped} skipped, ${newsResult.errors} errors`);
  }
  console.log(`  TOTAL: ${totalResult.inserted} inserted, ${totalResult.skipped} skipped, ${totalResult.errors} errors`);
  console.log('='.repeat(60));
  
  return totalResult;
}

// Run if called directly (check if this file is the main module)
if (process.argv[1] && process.argv[1].includes('data-collector')) {
  runDataCollector()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

