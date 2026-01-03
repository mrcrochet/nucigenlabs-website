/**
 * Tavily Personalized Collector
 * 
 * Collects personalized events for each user based on their preferences
 * Uses Tavily's intelligent search with user-specific queries
 * This provides 10X better results by targeting exactly what users care about
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
  throw new Error('Missing TAVILY_API_KEY. Tavily is required for personalized collection.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const tavilyClient = tavily({ apiKey: tavilyApiKey });

interface UserPreferences {
  user_id: string;
  preferred_sectors: string[];
  preferred_regions: string[];
  preferred_event_types: string[];
  focus_areas: string[];
  min_impact_score?: number;
  min_confidence_score?: number;
}

interface TavilyArticle {
  title: string;
  url: string;
  content?: string;
  publishedDate?: string;
  score?: number;
  author?: string;
}

/**
 * Build personalized Tavily queries from user preferences
 * Creates intelligent, targeted queries that match user interests
 */
function buildPersonalizedQueries(preferences: UserPreferences): string[] {
  const queries: string[] = [];
  
  // Base query components
  const sectors = preferences.preferred_sectors || [];
  const regions = preferences.preferred_regions || [];
  const eventTypes = preferences.preferred_event_types || [];
  const focusAreas = preferences.focus_areas || [];
  
  // Query 1: Sector + Region combinations (high priority)
  if (sectors.length > 0 && regions.length > 0) {
    for (const sector of sectors.slice(0, 3)) { // Limit to top 3 sectors
      for (const region of regions.slice(0, 3)) { // Limit to top 3 regions
        queries.push(`${sector} ${region} recent developments policy changes 2025`);
      }
    }
  }
  
  // Query 2: Event types + Sectors
  if (eventTypes.length > 0 && sectors.length > 0) {
    for (const eventType of eventTypes.slice(0, 3)) {
      for (const sector of sectors.slice(0, 2)) {
        queries.push(`${eventType} events ${sector} industry impact 2025`);
      }
    }
  }
  
  // Query 3: Focus areas (custom tags - highest priority)
  if (focusAreas.length > 0) {
    for (const focusArea of focusAreas.slice(0, 5)) {
      queries.push(`${focusArea} recent news developments 2025`);
    }
  }
  
  // Query 4: Region-specific geopolitical events
  if (regions.length > 0) {
    for (const region of regions.slice(0, 3)) {
      queries.push(`${region} geopolitical economic policy changes 2025`);
    }
  }
  
  // Query 5: Sector-specific regulatory changes
  if (sectors.length > 0) {
    for (const sector of sectors.slice(0, 3)) {
      queries.push(`${sector} regulatory changes policy updates 2025`);
    }
  }
  
  // If no preferences, use generic queries
  if (queries.length === 0) {
    queries.push('recent geopolitical events economic impact 2025');
    queries.push('major business developments policy changes 2025');
  }
  
  // Limit total queries to avoid API overload
  return queries.slice(0, 15);
}

/**
 * Collect personalized events for a single user
 */
export async function collectPersonalizedEventsForUser(
  userId: string,
  preferences: UserPreferences
): Promise<{ inserted: number; skipped: number; errors: number }> {
  try {
    console.log(`[Personalized Collector] Collecting for user ${userId}...`);
    
    // Build personalized queries
    const queries = buildPersonalizedQueries(preferences);
    console.log(`[Personalized Collector] Generated ${queries.length} personalized queries`);
    
    let allArticles: TavilyArticle[] = [];
    
    // Search all queries in parallel (with rate limiting)
    const searchPromises = queries.map(async (query, index) => {
      try {
        // Add small delay to avoid rate limiting
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, index * 200)); // 200ms delay between queries
        }
        
        console.log(`[Personalized Collector] Searching: "${query.substring(0, 60)}..."`);
        
        const response = await tavilyClient.search(query, {
          searchDepth: 'advanced',
          maxResults: 8, // Top 8 most relevant results per query
          includeAnswer: false,
          includeRawContent: true,
          includeImages: false,
        });
        
        const articles: TavilyArticle[] = (response.results || [])
          .filter((result: any) => {
            // Filter by relevance score
            const score = result.score || 0;
            return score >= 0.5; // Only highly relevant articles
          })
          .filter((result: any) => {
            // Filter by date (last 7 days)
            if (result.publishedDate) {
              const publishedDate = new Date(result.publishedDate);
              const daysAgo = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
              return daysAgo <= 7;
            }
            return true;
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
        
        return articles;
      } catch (error: any) {
        console.error(`[Personalized Collector] Error searching "${query}":`, error.message);
        return [];
      }
    });
    
    const searchResults = await Promise.allSettled(searchPromises);
    allArticles = searchResults
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<TavilyArticle[]>).value)
      .flat();
    
    // Remove duplicates by URL
    const uniqueArticles = new Map<string, TavilyArticle>();
    for (const article of allArticles) {
      if (!uniqueArticles.has(article.url)) {
        uniqueArticles.set(article.url, article);
      }
    }
    
    console.log(`[Personalized Collector] Found ${uniqueArticles.size} unique relevant articles for user ${userId}`);
    
    let inserted = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const article of uniqueArticles.values()) {
      // Check if event already exists (deduplication)
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('source', `tavily:personalized:${userId}`)
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
      
      // Insert new event with personalized source tag
      const { error } = await supabase.from('events').insert({
        source: `tavily:personalized:${userId}`,
        source_id: article.url,
        title: article.title,
        description: article.content ? article.content.substring(0, 500) : null,
        content: article.content || null,
        published_at: publishedAt.toISOString(),
        url: article.url,
        author: article.author || null,
        raw_category: 'personalized',
        status: 'pending',
      } as any);
      
      if (error) {
        console.error(`[Personalized Collector] Error inserting event: ${error.message}`);
        errors++;
      } else {
        inserted++;
      }
    }
    
    console.log(`[Personalized Collector] User ${userId}: ${inserted} inserted, ${skipped} skipped, ${errors} errors`);
    return { inserted, skipped, errors };
  } catch (error) {
    console.error(`[Personalized Collector] Error collecting for user ${userId}:`, error);
    return { inserted: 0, skipped: 0, errors: 1 };
  }
}

/**
 * Collect personalized events for all users with preferences
 */
export async function collectPersonalizedEventsForAllUsers(): Promise<{
  usersProcessed: number;
  totalInserted: number;
  totalSkipped: number;
  totalErrors: number;
}> {
  try {
    console.log('[Personalized Collector] Starting personalized collection for all users...');
    
    // Fetch all users with preferences
    const { data: preferencesList, error } = await supabase
      .from('user_preferences')
      .select('user_id, preferred_sectors, preferred_regions, preferred_event_types, focus_areas, min_impact_score, min_confidence_score');
    
    if (error) {
      throw new Error(`Failed to fetch user preferences: ${error.message}`);
    }
    
    if (!preferencesList || preferencesList.length === 0) {
      console.log('[Personalized Collector] No users with preferences found.');
      return { usersProcessed: 0, totalInserted: 0, totalSkipped: 0, totalErrors: 0 };
    }
    
    console.log(`[Personalized Collector] Found ${preferencesList.length} users with preferences`);
    
    let totalInserted = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    
    // Process users sequentially to avoid rate limiting
    for (const prefs of preferencesList) {
      const result = await collectPersonalizedEventsForUser(prefs.user_id, prefs as UserPreferences);
      totalInserted += result.inserted;
      totalSkipped += result.skipped;
      totalErrors += result.errors;
      
      // Small delay between users
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`[Personalized Collector] Complete: ${preferencesList.length} users, ${totalInserted} inserted, ${totalSkipped} skipped, ${totalErrors} errors`);
    
    return {
      usersProcessed: preferencesList.length,
      totalInserted,
      totalSkipped,
      totalErrors,
    };
  } catch (error) {
    console.error('[Personalized Collector] Error:', error);
    return { usersProcessed: 0, totalInserted: 0, totalSkipped: 0, totalErrors: 1 };
  }
}

/**
 * Main function for personalized collection
 */
export async function runPersonalizedCollector() {
  console.log('='.repeat(60));
  console.log('TAVILY PERSONALIZED COLLECTOR');
  console.log('='.repeat(60));
  
  const result = await collectPersonalizedEventsForAllUsers();
  
  console.log('='.repeat(60));
  return result;
}

// Run if called directly
if (process.argv[1] && process.argv[1].includes('tavily-personalized-collector')) {
  runPersonalizedCollector()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

