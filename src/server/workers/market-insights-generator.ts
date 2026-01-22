/**
 * Market Insights Generator Worker
 * 
 * Processes events and generates market intelligence insights.
 * This worker can be run:
 * - On-demand for specific events
 * - In batch for multiple events
 * - As part of the main pipeline
 * 
 * IMPORTANT: This is a curated feed - we control which events get market insights.
 * Users can only filter, not search.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateMarketInsightsForEvent } from '../services/market-intelligence';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials required');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface GenerationResult {
  eventId: string;
  success: boolean;
  insightsCount?: number;
  error?: string;
  metadata?: any;
}

/**
 * Generate market insights for a specific event
 */
export async function generateInsightsForEvent(
  eventId: string,
  options: { force_refresh?: boolean } = {}
): Promise<GenerationResult> {
  console.log(`[MarketInsightsGenerator] Generating insights for event: ${eventId}`);

  try {
    const result = await generateMarketInsightsForEvent(eventId, options);

    if (result.success && result.insights) {
      console.log(`[MarketInsightsGenerator] ✅ Generated ${result.insights.length} insights for event ${eventId}`);
      return {
        eventId,
        success: true,
        insightsCount: result.insights.length,
        metadata: result.metadata,
      };
    } else {
      console.error(`[MarketInsightsGenerator] ❌ Failed for event ${eventId}: ${result.error}`);
      return {
        eventId,
        success: false,
        error: result.error,
      };
    }
  } catch (error: any) {
    console.error(`[MarketInsightsGenerator] ❌ Error for event ${eventId}:`, error.message);
    return {
      eventId,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate insights for multiple events (batch processing)
 */
export async function generateInsightsBatch(
  eventIds: string[],
  options: {
    force_refresh?: boolean;
    concurrency?: number;
  } = {}
): Promise<GenerationResult[]> {
  const concurrency = options.concurrency || 3; // Process 3 events at a time
  const results: GenerationResult[] = [];

  console.log(`[MarketInsightsGenerator] Processing ${eventIds.length} events with concurrency ${concurrency}`);

  // Process in batches
  for (let i = 0; i < eventIds.length; i += concurrency) {
    const batch = eventIds.slice(i, i + concurrency);
    const batchPromises = batch.map(eventId =>
      generateInsightsForEvent(eventId, { force_refresh: options.force_refresh })
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    console.log(`[MarketInsightsGenerator] Processed batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(eventIds.length / concurrency)}`);
  }

  const successCount = results.filter(r => r.success).length;
  const totalInsights = results.reduce((sum, r) => sum + (r.insightsCount || 0), 0);

  console.log(`[MarketInsightsGenerator] ✅ Batch complete: ${successCount}/${eventIds.length} successful, ${totalInsights} total insights`);

  return results;
}

/**
 * Generate insights for recent high-impact events
 * This is the main function to call from the pipeline
 */
export async function generateInsightsForRecentEvents(
  options: {
    hours_back?: number;
    min_impact_score?: number;
    limit?: number;
    force_refresh?: boolean;
  } = {}
): Promise<GenerationResult[]> {
  const hoursBack = options.hours_back || 24;
  const minImpactScore = options.min_impact_score || 0.6;
  const limit = options.limit || 10;

  console.log(`[MarketInsightsGenerator] Finding recent high-impact events...`);

  try {
    // Find recent events with high impact scores
    const cutoffDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const { data: events, error } = await supabase
      .from('events')
      .select('id, headline, impact_score')
      .gte('published_at', cutoffDate.toISOString())
      .gte('impact_score', minImpactScore)
      .order('impact_score', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch events: ${error.message}`);
    }

    if (!events || events.length === 0) {
      console.log(`[MarketInsightsGenerator] No recent high-impact events found`);
      return [];
    }

    console.log(`[MarketInsightsGenerator] Found ${events.length} events to process`);

    // Filter out events that already have insights (unless force_refresh)
    const eventIds = events.map(e => e.id);

    if (!options.force_refresh) {
      // Check which events already have insights
      const { data: existingInsights } = await supabase
        .from('market_insights')
        .select('event_id')
        .in('event_id', eventIds)
        .is('ttl_expires_at', null)
        .or('ttl_expires_at.gt.' + new Date().toISOString());

      const existingEventIds = new Set(existingInsights?.map(i => i.event_id) || []);
      const newEventIds = eventIds.filter(id => !existingEventIds.has(id));

      if (newEventIds.length === 0) {
        console.log(`[MarketInsightsGenerator] All events already have insights`);
        return [];
      }

      console.log(`[MarketInsightsGenerator] ${newEventIds.length} events need insights (${existingEventIds.size} already have them)`);
      return generateInsightsBatch(newEventIds, { force_refresh: false });
    }

    return generateInsightsBatch(eventIds, { force_refresh: options.force_refresh });
  } catch (error: any) {
    console.error(`[MarketInsightsGenerator] Error finding events:`, error.message);
    return [];
  }
}

/**
 * Main function for standalone script execution
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log(`[MarketInsightsGenerator] Starting at ${new Date().toISOString()}`);

  try {
    if (command === 'event' && args[1]) {
      // Generate for specific event
      const eventId = args[1];
      const result = await generateInsightsForEvent(eventId, { force_refresh: args.includes('--force') });
      console.log('\n[MarketInsightsGenerator] Result:', result);
      process.exit(result.success ? 0 : 1);
    } else if (command === 'recent') {
      // Generate for recent events
      const hoursBack = args[1] ? parseInt(args[1]) : 24;
      const results = await generateInsightsForRecentEvents({
        hours_back: hoursBack,
        force_refresh: args.includes('--force'),
      });
      console.log('\n[MarketInsightsGenerator] Results:', results);
      const successCount = results.filter(r => r.success).length;
      process.exit(successCount === results.length ? 0 : 1);
    } else {
      console.log(`
Usage:
  npm run market:generate event <event_id> [--force]
  npm run market:generate recent [hours_back] [--force]

Examples:
  npm run market:generate event abc-123-def
  npm run market:generate recent 48
  npm run market:generate recent 24 --force
      `);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n[MarketInsightsGenerator] Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
