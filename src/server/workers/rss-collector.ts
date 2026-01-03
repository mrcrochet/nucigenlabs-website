/**
 * RSS Feed Collector
 * 
 * Collects articles from RSS feeds and inserts them into the events table
 * Works alongside NewsAPI to increase event volume
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

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * RSS Feed Sources
 * Curated list of reliable RSS feeds for geopolitical, economic, and business intelligence
 */
const RSS_FEEDS = [
  // Geopolitical & International
  { url: 'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best', name: 'Reuters', category: 'general' },
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World', category: 'general' },
  { url: 'https://www.theguardian.com/world/rss', name: 'Guardian World', category: 'general' },
  { url: 'https://feeds.npr.org/1001/rss.xml', name: 'NPR World', category: 'general' },
  
  // Business & Finance
  { url: 'https://www.theguardian.com/business/rss', name: 'Guardian Business', category: 'business' },
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', name: 'BBC Business', category: 'business' },
  { url: 'https://feeds.npr.org/1006/rss.xml', name: 'NPR Business', category: 'business' },
  
  // Technology
  { url: 'https://www.theguardian.com/technology/rss', name: 'Guardian Tech', category: 'technology' },
  { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', name: 'BBC Tech', category: 'technology' },
  { url: 'https://feeds.npr.org/1019/rss.xml', name: 'NPR Tech', category: 'technology' },
  
  // Energy & Commodities
  { url: 'https://feeds.bbci.co.uk/news/science-environment/rss.xml', name: 'BBC Environment', category: 'business' },
];

interface RSSItem {
  title: string;
  description?: string;
  content?: string;
  link: string;
  pubDate?: string;
  author?: string;
  guid?: string;
}

/**
 * Parse RSS feed XML
 * Simple RSS parser (handles basic RSS 2.0 format)
 */
function parseRSSFeed(xmlText: string): RSSItem[] {
  const items: RSSItem[] = [];
  
  try {
    // Extract items using regex (simple approach)
    // For production, consider using a proper XML parser like 'fast-xml-parser'
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    const matches = xmlText.matchAll(itemRegex);
    
    for (const match of matches) {
      const itemXml = match[1];
      
      const titleMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const descriptionMatch = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
      const linkMatch = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
      const pubDateMatch = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
      const authorMatch = itemXml.match(/<author[^>]*>([\s\S]*?)<\/author>/i) || 
                         itemXml.match(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i);
      const guidMatch = itemXml.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
      
      if (titleMatch && linkMatch) {
        const title = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
        const link = linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
        const description = descriptionMatch ? descriptionMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : undefined;
        const pubDate = pubDateMatch ? pubDateMatch[1].trim() : undefined;
        const author = authorMatch ? authorMatch[1].trim() : undefined;
        const guid = guidMatch ? guidMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : undefined;
        
        // Clean HTML tags from description
        const cleanDescription = description ? description.replace(/<[^>]*>/g, '').trim() : undefined;
        
        items.push({
          title,
          description: cleanDescription,
          link,
          pubDate,
          author,
          guid: guid || link,
        });
      }
    }
  } catch (error) {
    console.error('[RSS] Error parsing RSS feed:', error);
  }
  
  return items;
}

/**
 * Fetch and parse a single RSS feed
 */
async function fetchRSSFeed(feedUrl: string): Promise<RSSItem[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NucigenLabs/1.0; +https://nucigenlabs.com)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[RSS] Failed to fetch ${feedUrl}: ${response.status} ${response.statusText}`);
      return [];
    }

    const xmlText = await response.text();
    const items = parseRSSFeed(xmlText);
    
    if (items.length === 0) {
      console.warn(`[RSS] No items parsed from ${feedUrl}`);
    }
    
    return items;
  } catch (error: any) {
    // Don't log full error stack for network errors (too verbose)
    if (error.name === 'AbortError') {
      console.warn(`[RSS] Timeout fetching ${feedUrl}`);
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
      console.warn(`[RSS] Network error for ${feedUrl}: ${error.code}`);
    } else {
      console.warn(`[RSS] Error fetching ${feedUrl}: ${error.message || error}`);
    }
    return [];
  }
}

/**
 * Collect events from RSS feeds
 */
export async function collectRSSEvents(): Promise<{ inserted: number; skipped: number; errors: number }> {
  try {
    console.log('[RSS Collector] Starting RSS feed collection...');
    
    let allItems: Array<RSSItem & { source: string; category: string }> = [];
    
    // Fetch all RSS feeds in parallel (with error handling per feed)
    const feedPromises = RSS_FEEDS.map(async (feed) => {
      try {
        const items = await fetchRSSFeed(feed.url);
        if (items.length > 0) {
          console.log(`[RSS Collector] ${feed.name}: ${items.length} items`);
        }
        return items.map(item => ({
          ...item,
          source: feed.name,
          category: feed.category,
        }));
      } catch (error) {
        console.warn(`[RSS Collector] Error processing ${feed.name}:`, error);
        return [];
      }
    });
    
    const feedResults = await Promise.allSettled(feedPromises);
    
    let successfulFeeds = 0;
    let failedFeeds = 0;
    
    allItems = feedResults
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          const items = result.value;
          if (items.length > 0) {
            successfulFeeds++;
          }
          return items;
        } else {
          failedFeeds++;
          console.warn(`[RSS Collector] Feed "${RSS_FEEDS[index].name}" failed: ${result.reason}`);
          return [];
        }
      })
      .flat();
    
    console.log(`[RSS Collector] Found ${allItems.length} items from ${successfulFeeds} successful feeds (${failedFeeds} failed)`);
    
    let inserted = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const item of allItems) {
      // Skip if missing required fields
      if (!item.title || !item.link) {
        skipped++;
        continue;
      }
      
      // Check if event already exists (deduplication)
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('source', `rss:${item.source.toLowerCase()}`)
        .eq('source_id', item.guid || item.link)
        .maybeSingle();
      
      if (existing) {
        skipped++;
        // Item already exists, skip silently (normal after first collection)
        continue;
      }
      
      // Parse publication date
      let publishedAt: Date;
      if (item.pubDate) {
        publishedAt = new Date(item.pubDate);
        // If date is invalid, use current date
        if (isNaN(publishedAt.getTime())) {
          publishedAt = new Date();
        }
      } else {
        publishedAt = new Date();
      }
      
      // Insert new event
      const { error } = await supabase.from('events').insert({
        source: `rss:${item.source.toLowerCase()}`,
        source_id: item.guid || item.link,
        title: item.title,
        description: item.description || null,
        content: item.description || null, // RSS feeds usually don't have full content
        published_at: publishedAt.toISOString(),
        url: item.link,
        author: item.author || null,
        raw_category: item.category,
        status: 'pending',
      } as any); // Type assertion to handle null/undefined conversion
      
      if (error) {
        console.error(`[RSS Collector] Error inserting event: ${error.message}`);
        errors++;
      } else {
        inserted++;
      }
    }
    
    console.log(`[RSS Collector] Collection complete: ${inserted} inserted, ${skipped} skipped (already exist), ${errors} errors`);
    
    if (inserted === 0 && skipped > 0) {
      console.log(`[RSS Collector] Note: All items already exist in database. This is normal after the first collection.`);
    }
    
    return { inserted, skipped, errors };
  } catch (error) {
    console.error('[RSS Collector] Error collecting RSS feeds:', error);
    return { inserted: 0, skipped: 0, errors: 1 };
  }
}

/**
 * Main function for RSS collection
 */
export async function runRSSCollector() {
  console.log('='.repeat(60));
  console.log('RSS FEED COLLECTOR');
  console.log('='.repeat(60));
  
  const result = await collectRSSEvents();
  
  console.log('='.repeat(60));
  return result;
}

// Run if called directly
if (process.argv[1] && process.argv[1].includes('rss-collector')) {
  runRSSCollector()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

