/**
 * Polymarket Collector Worker
 *
 * Fetches active prediction markets from Polymarket Gamma API
 * and upserts them into polymarket_markets table.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  fetchAllRelevantEvents,
  flattenMarkets,
  type PolymarketEvent,
  type PolymarketMarket,
} from '../services/polymarket-service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Collect and upsert Polymarket markets
 */
export async function collectPolymarketMarkets(): Promise<{
  collected: number;
  upserted: number;
  errors: number;
}> {
  console.log('[Polymarket Collector] Starting collection...');

  const events = await fetchAllRelevantEvents();
  console.log(`[Polymarket Collector] Fetched ${events.length} events`);

  // Build market rows with event context
  const rows: Array<Record<string, any>> = [];

  for (const event of events) {
    const tagLabels = event.tags.map(t => t.label);

    for (const market of event.markets) {
      if (!market.question || !market.conditionId) continue;
      if (market.closed) continue;

      const yesPrice = market.outcomePrices[0] ?? null;
      const noPrice = market.outcomePrices[1] ?? null;

      rows.push({
        condition_id: market.conditionId,
        question: market.question,
        slug: market.slug,
        outcome_yes_price: yesPrice,
        outcome_no_price: noPrice,
        volume: market.volume,
        liquidity: market.liquidity,
        category: tagLabels[0] || null,
        end_date: market.endDate || null,
        url: `https://polymarket.com/event/${event.slug}`,
        tags: tagLabels,
        event_id: event.id,
        event_title: event.title,
        last_fetched_at: new Date().toISOString(),
      });
    }
  }

  console.log(`[Polymarket Collector] ${rows.length} active markets to upsert`);

  let upserted = 0;
  let errors = 0;

  // Upsert in batches of 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);

    const { error } = await supabase
      .from('polymarket_markets')
      .upsert(batch, {
        onConflict: 'condition_id',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error(`[Polymarket Collector] Batch error:`, error.message);
      errors += batch.length;
    } else {
      upserted += batch.length;
    }
  }

  console.log(`[Polymarket Collector] Done: ${upserted} upserted, ${errors} errors`);
  return { collected: rows.length, upserted, errors };
}

/**
 * Run if called directly
 */
export async function runPolymarketCollector() {
  console.log('='.repeat(60));
  console.log('POLYMARKET COLLECTOR');
  console.log('='.repeat(60));

  const result = await collectPolymarketMarkets();

  console.log('='.repeat(60));
  return result;
}

if (process.argv[1] && process.argv[1].includes('polymarket-collector')) {
  runPolymarketCollector()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
