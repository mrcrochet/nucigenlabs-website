/**
 * PHASE 4: Official Document Enricher Worker (CORRECTED)
 * 
 * Scrapes official documents from whitelisted domains using Firecrawl.
 * Firecrawl is NOT used for broad news scraping.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { apiGateway } from '../services/api-gateway';
import { maximizeApiUsage } from '../utils/api-optimizer';
import { scrapeOfficialDocument } from '../phase4/firecrawl-official-service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface EnrichmentResult {
  enriched: number;
  skipped: number;
  errors: number;
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
 * Check if URL is from whitelisted domain
 */
async function isUrlWhitelisted(url: string): Promise<boolean> {
  const domain = extractDomain(url);
  
  const { data, error } = await supabase
    .from('firecrawl_whitelist')
    .select('domain')
    .eq('domain', domain)
    .eq('enabled', true)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Enrich an event with official document if URL is whitelisted
 */
async function enrichEventWithOfficialDocument(
  eventId: string,
  nucigenEventId: string | null,
  url: string
): Promise<boolean> {
  try {
    // Check if document already exists
    const { data: existingDoc } = await supabase
      .from('official_documents')
      .select('id')
      .eq('url', url)
      .limit(1);

    if (existingDoc && existingDoc.length > 0) {
      console.log(`[OfficialDocEnricher] Document already exists for: ${url}`);
      return true;
    }

    // Check whitelist
    const isWhitelisted = await isUrlWhitelisted(url);
    if (!isWhitelisted) {
      console.log(`[OfficialDocEnricher] URL not whitelisted: ${url}`);
      return false;
    }

    // Scrape with Firecrawl
    const document = await scrapeOfficialDocument(url, { checkWhitelist: false }); // Already checked

    if (!document || !document.content) {
      console.warn(`[OfficialDocEnricher] No content scraped for ${url}`);
      return false;
    }

    // Insert into official_documents table
    const insertData: any = {
      url: url,
      title: document.title,
      content: document.content,
      markdown: document.markdown,
      domain: document.domain,
      source_type: document.source_type,
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

    if (insertError) {
      console.error(`[OfficialDocEnricher] Error inserting document:`, insertError.message);
      return false;
    }

    console.log(`[OfficialDocEnricher] Enriched with official document: ${url}`);
    return true;
  } catch (error: any) {
    console.error(`[OfficialDocEnricher] Error enriching ${url}:`, error.message);
    return false;
  }
}

/**
 * Enrich events with official documents from whitelisted URLs
 */
export async function enrichPendingOfficialDocuments(
  limit: number = 10
): Promise<EnrichmentResult> {
  if (!apiGateway.firecrawl.isAvailable()) {
    console.warn('[OfficialDocEnricher] Firecrawl not available. Skipping enrichment.');
    return { enriched: 0, skipped: 0, errors: 0 };
  }

  try {
    console.log('[OfficialDocEnricher] Fetching events with whitelisted URLs...');

    // Get events that:
    // 1. Have a URL
    // 2. URL is from whitelisted domain
    // 3. Don't have official document yet
    const { data: whitelistDomains } = await supabase
      .from('firecrawl_whitelist')
      .select('domain')
      .eq('enabled', true);

    if (!whitelistDomains || whitelistDomains.length === 0) {
      console.log('[OfficialDocEnricher] No domains in whitelist');
      return { enriched: 0, skipped: 0, errors: 0 };
    }

    const domains = whitelistDomains.map(d => d.domain);

    // Get events with URLs matching whitelist
    const { data: events, error: fetchError } = await supabase
      .from('events')
      .select('id, url')
      .not('url', 'is', null)
      .limit(limit * 5); // Get more to filter

    if (fetchError) {
      throw new Error(`Failed to fetch events: ${fetchError.message}`);
    }

    if (!events || events.length === 0) {
      console.log('[OfficialDocEnricher] No events with URLs');
      return { enriched: 0, skipped: 0, errors: 0 };
    }

    // Filter events with whitelisted URLs
    const eventsToEnrich: Array<{ eventId: string; url: string }> = [];
    for (const event of events) {
      if (!event.url) continue;

      const domain = extractDomain(event.url);
      if (domains.includes(domain)) {
        // Check if document already exists
        const { data: existingDoc } = await supabase
          .from('official_documents')
          .select('id')
          .eq('url', event.url)
          .limit(1);

        if (!existingDoc || existingDoc.length === 0) {
          eventsToEnrich.push({ eventId: event.id, url: event.url });
        }

        if (eventsToEnrich.length >= limit) {
          break;
        }
      }
    }

    if (eventsToEnrich.length === 0) {
      console.log('[OfficialDocEnricher] No events need official document enrichment');
      return { enriched: 0, skipped: 0, errors: 0 };
    }

    console.log(`[OfficialDocEnricher] Enriching ${eventsToEnrich.length} events...`);

    const result: EnrichmentResult = {
      enriched: 0,
      skipped: 0,
      errors: 0,
    };

    // Process in parallel using api-optimizer (respects rate limits automatically)
    const { results, errors } = await maximizeApiUsage(
      eventsToEnrich,
      async ({ eventId, url }) => {
        // Get nucigen_event_id if exists
        const { data: nucigenEvent } = await supabase
          .from('nucigen_events')
          .select('id')
          .eq('source_event_id', eventId)
          .maybeSingle();

        const success = await enrichEventWithOfficialDocument(
          eventId,
          nucigenEvent?.id || null,
          url
        );

        return success;
      },
      'firecrawl'
    );

    // Count results
    const successful = results.filter(r => r === true).length;
    const failed = results.filter(r => r === false).length;
    
    result.enriched = successful;
    result.errors = failed + errors.length;
    result.skipped = eventsToEnrich.length - successful - failed; // Events that were skipped during processing

    console.log(`[OfficialDocEnricher] Enrichment complete: ${result.enriched} enriched, ${result.skipped} skipped, ${result.errors} errors`);
    return result;
  } catch (error: any) {
    console.error('[OfficialDocEnricher] Fatal error:', error);
    throw error;
  }
}

/**
 * Main function for direct execution
 */
export async function runOfficialDocumentEnricher() {
  console.log('='.repeat(60));
  console.log('[OfficialDocEnricher] Starting official document enrichment...');
  console.log('='.repeat(60));

  const limit = process.env.OFFICIAL_DOC_ENRICHMENT_BATCH_SIZE
    ? parseInt(process.env.OFFICIAL_DOC_ENRICHMENT_BATCH_SIZE, 10)
    : 10;

  try {
    const result = await enrichPendingOfficialDocuments(limit);
    console.log('='.repeat(60));
    console.log('[OfficialDocEnricher] Summary:');
    console.log(`  - Enriched: ${result.enriched}`);
    console.log(`  - Skipped: ${result.skipped}`);
    console.log(`  - Errors: ${result.errors}`);
    console.log('='.repeat(60));
  } catch (error: any) {
    console.error('[OfficialDocEnricher] Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runOfficialDocumentEnricher();
}

