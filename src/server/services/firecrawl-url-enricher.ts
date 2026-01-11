/**
 * Firecrawl URL Enricher
 * 
 * Automatically detects URLs in events and enriches them with Firecrawl scraping
 * if they are from whitelisted domains. Extracts metadata and full content.
 */

import { createClient } from '@supabase/supabase-js';
import { scrapeOfficialDocument, isFirecrawlAvailable } from '../phase4/firecrawl-official-service';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface EnrichedUrl {
  url: string;
  domain: string;
  source_type: string;
  title?: string;
  content: string;
  markdown?: string;
  metadata?: any;
  scraped_at: string;
}

export interface UrlEnrichmentResult {
  enriched: number;
  skipped: number;
  errors: number;
  enrichedUrls: EnrichedUrl[];
}

/**
 * Extract URLs from text content (events, summaries, etc.)
 */
export function extractUrls(text: string): string[] {
  if (!text) return [];
  
  const urlRegex = /https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w\/_.])*)?(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?/gi;
  const urls = text.match(urlRegex) || [];
  
  // Deduplicate and filter
  const uniqueUrls = [...new Set(urls)].filter(url => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });
  
  return uniqueUrls;
}

/**
 * Check if a domain is whitelisted for Firecrawl scraping
 */
async function isDomainWhitelisted(domain: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('firecrawl_whitelist')
      .select('domain, enabled')
      .eq('domain', domain)
      .eq('enabled', true)
      .maybeSingle();

    if (error) {
      console.error('[FirecrawlURLEnricher] Error checking whitelist:', error);
      return false;
    }

    return data !== null;
  } catch (error: any) {
    console.error('[FirecrawlURLEnricher] Error checking whitelist:', error);
    return false;
  }
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    const match = url.match(/https?:\/\/(?:www\.)?([^\/]+)/);
    return match ? match[1] : '';
  }
}

/**
 * Check if URL has already been scraped
 */
async function isUrlAlreadyScraped(url: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('official_documents')
      .select('id')
      .eq('url', url)
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('[FirecrawlURLEnricher] Error checking existing document:', error);
      return false;
    }

    return data !== null;
  } catch (error: any) {
    console.error('[FirecrawlURLEnricher] Error checking existing document:', error);
    return false;
  }
}

/**
 * Enrich a single URL with Firecrawl
 */
export async function enrichUrl(url: string): Promise<EnrichedUrl | null> {
  if (!isFirecrawlAvailable()) {
    console.warn('[FirecrawlURLEnricher] Firecrawl not available');
    return null;
  }

  const domain = extractDomain(url);
  
  // Check if domain is whitelisted
  const isWhitelisted = await isDomainWhitelisted(domain);
  if (!isWhitelisted) {
    return null;
  }

  // Check if already scraped
  const alreadyScraped = await isUrlAlreadyScraped(url);
  if (alreadyScraped) {
    // Return existing document
    const { data } = await supabase
      .from('official_documents')
      .select('*')
      .eq('url', url)
      .maybeSingle();

    if (data) {
      return {
        url: data.url,
        domain: data.domain,
        source_type: data.source_type,
        title: data.title,
        content: data.content,
        markdown: data.markdown,
        metadata: data.metadata,
        scraped_at: data.scraped_at,
      };
    }
  }

  // Scrape with Firecrawl
  const document = await scrapeOfficialDocument(url, { checkWhitelist: false }); // Already checked

  if (!document || !document.content) {
    return null;
  }

  // Get source type
  const { data: whitelistEntry } = await supabase
    .from('firecrawl_whitelist')
    .select('source_type')
    .eq('domain', domain)
    .eq('enabled', true)
    .maybeSingle();

  const sourceType = whitelistEntry?.source_type || 'institution';

  return {
    url,
    domain,
    source_type: sourceType,
    title: document.title,
    content: document.content,
    markdown: document.markdown,
    metadata: document.metadata,
    scraped_at: new Date().toISOString(),
  };
}

/**
 * Enrich all URLs found in an event's content
 */
export async function enrichEventUrls(
  eventId: string,
  nucigenEventId: string | null = null
): Promise<UrlEnrichmentResult> {
  if (!isFirecrawlAvailable()) {
    return {
      enriched: 0,
      skipped: 0,
      errors: 0,
      enrichedUrls: [],
    };
  }

  try {
    // Get event data
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, url, title, description, content')
      .eq('id', eventId)
      .maybeSingle();

    if (eventError || !event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    // Extract URLs from event content
    const urlsToCheck: string[] = [];
    
    // Add main URL if present
    if (event.url) {
      urlsToCheck.push(event.url);
    }
    
    // Extract URLs from text fields
    const textFields = [
      event.title,
      event.description,
      event.content,
    ].filter(Boolean).join(' ');

    const extractedUrls = extractUrls(textFields);
    urlsToCheck.push(...extractedUrls);

    // Deduplicate URLs
    const uniqueUrls = [...new Set(urlsToCheck)];

    if (uniqueUrls.length === 0) {
      return {
        enriched: 0,
        skipped: 0,
        errors: 0,
        enrichedUrls: [],
      };
    }

    // Check which URLs are whitelisted
    const whitelistedUrls: string[] = [];
    for (const url of uniqueUrls) {
      const domain = extractDomain(url);
      const isWhitelisted = await isDomainWhitelisted(domain);
      if (isWhitelisted && !(await isUrlAlreadyScraped(url))) {
        whitelistedUrls.push(url);
      }
    }

    if (whitelistedUrls.length === 0) {
      return {
        enriched: 0,
        skipped: uniqueUrls.length - whitelistedUrls.length,
        errors: 0,
        enrichedUrls: [],
      };
    }

    // Enrich URLs in parallel (limited concurrency will be handled by ecosystem)
    const enrichmentPromises = whitelistedUrls.map(url => enrichUrl(url));
    const results = await Promise.allSettled(enrichmentPromises);

    const enrichedUrls: EnrichedUrl[] = [];
    let enriched = 0;
    let errors = 0;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const url = whitelistedUrls[i];

      if (result.status === 'fulfilled' && result.value) {
        enrichedUrls.push(result.value);

        // Save to official_documents table
        const insertData: any = {
          url: result.value.url,
          title: result.value.title,
          content: result.value.content,
          markdown: result.value.markdown,
          domain: result.value.domain,
          source_type: result.value.source_type,
          metadata: result.value.metadata,
        };

        if (eventId) {
          insertData.event_id = eventId;
        }
        if (nucigenEventId) {
          insertData.nucigen_event_id = nucigenEventId;
        }

        const { error: insertError } = await supabase
          .from('official_documents')
          .insert(insertData);

        if (!insertError) {
          enriched++;
        } else {
          console.error(`[FirecrawlURLEnricher] Error saving document for ${url}:`, insertError);
          errors++;
        }
      } else {
        console.error(`[FirecrawlURLEnricher] Error enriching ${url}:`, result.status === 'rejected' ? result.reason : 'Unknown error');
        errors++;
      }
    }

    return {
      enriched,
      skipped: uniqueUrls.length - whitelistedUrls.length + (whitelistedUrls.length - enriched - errors),
      errors,
      enrichedUrls,
    };
  } catch (error: any) {
    console.error('[FirecrawlURLEnricher] Error enriching event URLs:', error);
    return {
      enriched: 0,
      skipped: 0,
      errors: 1,
      enrichedUrls: [],
    };
  }
}

/**
 * Batch enrich URLs from multiple events
 */
export async function batchEnrichEventUrls(
  eventIds: string[],
  limit: number = 50
): Promise<UrlEnrichmentResult> {
  const results: UrlEnrichmentResult = {
    enriched: 0,
    skipped: 0,
    errors: 0,
    enrichedUrls: [],
  };

  const eventsToProcess = eventIds.slice(0, limit);

  for (const eventId of eventsToProcess) {
    // Get nucigen_event_id if exists
    const { data: nucigenEvent } = await supabase
      .from('nucigen_events')
      .select('id')
      .eq('source_event_id', eventId)
      .maybeSingle();

    const eventResult = await enrichEventUrls(eventId, nucigenEvent?.id || null);
    
    results.enriched += eventResult.enriched;
    results.skipped += eventResult.skipped;
    results.errors += eventResult.errors;
    results.enrichedUrls.push(...eventResult.enrichedUrls);
  }

  return results;
}
