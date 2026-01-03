/**
 * PHASE 4: Context Enricher Worker (CORRECTED)
 * 
 * Enriches nucigen_events with historical context using Tavily.
 * Tavily is NOT used to detect new events, only to enrich existing ones.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { enrichEventContext, isTavilyAvailable } from '../phase4/tavily-context-service';

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
 * Enrich a single event with context
 */
async function enrichEventWithContext(nucigenEventId: string): Promise<boolean> {
  try {
    // Check if context already exists
    const { data: existingContext } = await supabase
      .from('event_context')
      .select('id')
      .eq('nucigen_event_id', nucigenEventId)
      .limit(1);

    if (existingContext && existingContext.length > 0) {
      console.log(`[ContextEnricher] Event ${nucigenEventId} already has context`);
      return true; // Already enriched
    }

    // Get event data
    const { data: event, error: fetchError } = await supabase
      .from('nucigen_events')
      .select('id, summary, why_it_matters, sector, region, country, event_type, first_order_effect, second_order_effect')
      .eq('id', nucigenEventId)
      .single();

    if (fetchError || !event) {
      console.warn(`[ContextEnricher] Event ${nucigenEventId} not found`);
      return false;
    }

    // Enrich with Tavily
    const context = await enrichEventContext(event);

    if (!context) {
      console.warn(`[ContextEnricher] No context generated for event ${nucigenEventId}`);
      return false;
    }

    // Insert context into event_context table
    const { error: insertError } = await supabase
      .from('event_context')
      .insert({
        nucigen_event_id: nucigenEventId,
        historical_context: context.historical_context,
        similar_events: context.similar_events,
        background_explanation: context.background_explanation,
        validation_notes: context.validation_notes,
      });

    if (insertError) {
      console.error(`[ContextEnricher] Error inserting context for ${nucigenEventId}:`, insertError.message);
      return false;
    }

    console.log(`[ContextEnricher] Enriched event ${nucigenEventId} with context`);
    return true;
  } catch (error: any) {
    console.error(`[ContextEnricher] Error enriching event ${nucigenEventId}:`, error.message);
    return false;
  }
}

/**
 * Enrich nucigen_events that need context
 */
export async function enrichPendingEventsContext(
  limit: number = 10
): Promise<EnrichmentResult> {
  if (!isTavilyAvailable()) {
    console.warn('[ContextEnricher] Tavily not available. Skipping enrichment.');
    return { enriched: 0, skipped: 0, errors: 0 };
  }

  try {
    console.log('[ContextEnricher] Fetching events that need context enrichment...');

    // Get nucigen_events that:
    // 1. Don't have context yet
    // 2. Have a summary (required for Tavily)
    const { data: events, error: fetchError } = await supabase
      .from('nucigen_events')
      .select('id, summary')
      .not('summary', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit * 2); // Get more to filter out those with context

    if (fetchError) {
      throw new Error(`Failed to fetch events: ${fetchError.message}`);
    }

    if (!events || events.length === 0) {
      console.log('[ContextEnricher] No events need context enrichment');
      return { enriched: 0, skipped: 0, errors: 0 };
    }

    // Filter out events that already have context
    const eventsNeedingContext: string[] = [];
    for (const event of events) {
      const { data: context } = await supabase
        .from('event_context')
        .select('id')
        .eq('nucigen_event_id', event.id)
        .limit(1);

      if (!context || context.length === 0) {
        eventsNeedingContext.push(event.id);
      }

      if (eventsNeedingContext.length >= limit) {
        break;
      }
    }

    if (eventsNeedingContext.length === 0) {
      console.log('[ContextEnricher] All events already have context');
      return { enriched: 0, skipped: 0, errors: 0 };
    }

    console.log(`[ContextEnricher] Enriching ${eventsNeedingContext.length} events...`);

    const result: EnrichmentResult = {
      enriched: 0,
      skipped: 0,
      errors: 0,
    };

    // Process sequentially to respect rate limits
    for (const eventId of eventsNeedingContext) {
      const success = await enrichEventWithContext(eventId);

      if (success) {
        result.enriched++;
      } else {
        result.errors++;
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3 seconds
    }

    console.log(`[ContextEnricher] Enrichment complete: ${result.enriched} enriched, ${result.skipped} skipped, ${result.errors} errors`);
    return result;
  } catch (error: any) {
    console.error('[ContextEnricher] Fatal error:', error);
    throw error;
  }
}

/**
 * Main function for direct execution
 */
export async function runContextEnricher() {
  console.log('='.repeat(60));
  console.log('[ContextEnricher] Starting context enrichment...');
  console.log('='.repeat(60));

  const limit = process.env.CONTEXT_ENRICHMENT_BATCH_SIZE
    ? parseInt(process.env.CONTEXT_ENRICHMENT_BATCH_SIZE, 10)
    : 10;

  try {
    const result = await enrichPendingEventsContext(limit);
    console.log('='.repeat(60));
    console.log('[ContextEnricher] Summary:');
    console.log(`  - Enriched: ${result.enriched}`);
    console.log(`  - Skipped: ${result.skipped}`);
    console.log(`  - Errors: ${result.errors}`);
    console.log('='.repeat(60));
  } catch (error: any) {
    console.error('[ContextEnricher] Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runContextEnricher();
}

