/**
 * PHASE 3A: Event Processor Worker
 * 
 * Automatically processes pending events:
 * 1. Phase 1: Extract structured event (nucigen_events)
 * 2. Phase 2B: Generate causal chain (nucigen_causal_chains)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { extractNucigenEvent } from '../phase1/event-extractor';
import { extractCausalChain } from '../phase2b/causal-extractor';
import { maximizeApiUsage } from '../utils/api-optimizer';

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

interface ProcessingResult {
  processed: number;
  phase1Success: number;
  phase1Errors: number;
  phase2bSuccess: number;
  phase2bErrors: number;
  skipped: number;
}

/**
 * Process a single pending event through Phase 1 and Phase 2B
 */
async function processEvent(eventId: string): Promise<{ phase1Success: boolean; phase2bSuccess: boolean; error?: string }> {
  let phase1Success = false;
  let phase2bSuccess = false;
  let error: string | undefined;

  try {
    // Mark as processing
    await supabase
      .from('events')
      .update({ status: 'processing' })
      .eq('id', eventId);

    // Phase 1: Extract structured event
    console.log(`[Processor] Phase 1: Extracting event ${eventId}...`);
    const nucigenEvent = await extractNucigenEvent(eventId);

    if (!nucigenEvent) {
      throw new Error('Phase 1 extraction returned null');
    }

    // Get the inserted event ID from database
    const { data: insertedEvent } = await supabase
      .from('nucigen_events')
      .select('id')
      .eq('source_event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!insertedEvent) {
      throw new Error('Failed to find inserted nucigen_event');
    }

    phase1Success = true;
    console.log(`[Processor] Phase 1: Success for event ${eventId}, created nucigen_event ${insertedEvent.id}`);

    // Phase 2B: Generate causal chain
    console.log(`[Processor] Phase 2B: Generating causal chain for event ${insertedEvent.id}...`);
    const causalChain = await extractCausalChain(insertedEvent.id);

    if (!causalChain) {
      // Causal chain already exists, which is fine
      console.log(`[Processor] Phase 2B: Causal chain already exists for event ${insertedEvent.id}`);
      phase2bSuccess = true;
    } else {
      phase2bSuccess = true;
      console.log(`[Processor] Phase 2B: Success for event ${insertedEvent.id}, created causal chain`);
    }

    // Mark event as processed
    await supabase
      .from('events')
      .update({ status: 'processed' })
      .eq('id', eventId);

    return { phase1Success, phase2bSuccess };
  } catch (err: any) {
    error = err.message || 'Unknown error';
    console.error(`[Processor] Error processing event ${eventId}:`, error);

    // Mark event as error
    const errorMessage = error || 'Unknown error';
    await supabase
      .from('events')
      .update({ 
        status: 'error',
        processing_error: typeof errorMessage === 'string' ? errorMessage.substring(0, 500) : String(errorMessage).substring(0, 500) // Limit error message length
      })
      .eq('id', eventId);

    return { phase1Success, phase2bSuccess, error };
  }
}

/**
 * Process all pending events (with limit to avoid overload)
 */
export async function processPendingEvents(limit: number = 10): Promise<ProcessingResult> {
  try {
    console.log('[Processor] Fetching pending events...');

    // Get pending events (limit to avoid overload)
    const { data: events, error: fetchError } = await supabase
      .from('events')
      .select('id, title')
      .eq('status', 'pending')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch events: ${fetchError.message}`);
    }

    if (!events || events.length === 0) {
      console.log('[Processor] No pending events to process');
      return {
        processed: 0,
        phase1Success: 0,
        phase1Errors: 0,
        phase2bSuccess: 0,
        phase2bErrors: 0,
        skipped: 0,
      };
    }

    console.log(`[Processor] Processing ${events.length} events with parallel optimization...`);

    const result: ProcessingResult = {
      processed: events.length,
      phase1Success: 0,
      phase1Errors: 0,
      phase2bSuccess: 0,
      phase2bErrors: 0,
      skipped: 0,
    };

    // Process events in parallel with intelligent rate limiting
    const { results: processResults, errors } = await maximizeApiUsage(
      events,
      async (event) => {
        return await processEvent(event.id);
      },
      'openai',
      (completed, total) => {
        if (completed % 10 === 0 || completed === total) {
          console.log(`[Processor] Progress: ${completed}/${total} events processed`);
        }
      }
    );

    // Count successes and errors
    for (const processResult of processResults) {
      if (processResult.phase1Success) {
        result.phase1Success++;
      } else {
        result.phase1Errors++;
      }

      if (processResult.phase2bSuccess) {
        result.phase2bSuccess++;
      } else if (processResult.phase1Success) {
        // Phase 2B failed but Phase 1 succeeded
        result.phase2bErrors++;
      }
    }

    // Log errors if any
    if (errors.length > 0) {
      console.warn(`[Processor] ${errors.length} events failed after retries`);
      result.phase1Errors += errors.length;
    }

    console.log(`[Processor] Processing complete:`);
    console.log(`  - Phase 1: ${result.phase1Success} success, ${result.phase1Errors} errors`);
    console.log(`  - Phase 2B: ${result.phase2bSuccess} success, ${result.phase2bErrors} errors`);

    return result;
  } catch (error: any) {
    console.error('[Processor] Fatal error:', error);
    throw error;
  }
}

/**
 * Main function for event processing
 */
export async function runEventProcessor(limit?: number) {
  console.log('='.repeat(60));
  console.log('EVENT PROCESSOR WORKER');
  console.log('='.repeat(60));
  
  const result = await processPendingEvents(limit);
  
  console.log('='.repeat(60));
  return result;
}

// Run if called directly (check if this file is the main module)
if (process.argv[1] && process.argv[1].includes('event-processor')) {
  const limit = process.argv[2] ? parseInt(process.argv[2], 10) : 10;
  runEventProcessor(limit)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

