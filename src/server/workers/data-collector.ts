/**
 * PHASE 3A: Data Collector Worker
 * 
 * Automatically collects news articles from NewsAPI
 * Inserts them into the events table with status 'pending'
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
 */
export async function collectNewsEvents(): Promise<{ inserted: number; skipped: number; errors: number }> {
  if (!newsApiKey) {
    console.warn('NEWS_API_KEY not set, skipping news collection');
    return { inserted: 0, skipped: 0, errors: 0 };
  }

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
 */
export async function runDataCollector() {
  console.log('='.repeat(60));
  console.log('DATA COLLECTOR WORKER');
  console.log('='.repeat(60));
  
  const result = await collectNewsEvents();
  
  console.log('='.repeat(60));
  return result;
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

