/**
 * Script to manually trigger Corporate Impact signal generation
 * 
 * Usage:
 *   npm run trigger:corporate-impact
 *   npm run trigger:corporate-impact -- --limit 10
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });
dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config();

async function triggerCorporateImpact() {
  try {
    const limit = process.argv.includes('--limit')
      ? parseInt(process.argv[process.argv.indexOf('--limit') + 1], 10)
      : 20;

    console.log(`\n🚀 Triggering Corporate Impact signal generation...`);
    console.log(`   Processing up to ${limit} events\n`);

    const { processCorporateImpactSignals } = await import('../src/server/workers/corporate-impact-worker.js');
    const result = await processCorporateImpactSignals(limit);

    console.log(`\n✅ Generation complete:`);
    console.log(`   Events processed: ${result.eventsProcessed}`);
    console.log(`   Signals generated: ${result.signalsGenerated}`);
    console.log(`   Errors: ${result.errors}\n`);

    if (result.signalsGenerated > 0) {
      console.log(`🎉 Successfully generated ${result.signalsGenerated} Corporate Impact signals!`);
      console.log(`   Check http://localhost:5173/corporate-impact to see them.\n`);
    } else {
      console.log(`ℹ️  No signals generated. This could mean:`);
      console.log(`   - No relevant events found (need: critical/strategic tier, geopolitics/finance/energy/supply-chain category)`);
      console.log(`   - Events are too old (only processing events from last 7 days)`);
      console.log(`   - Signals already exist for these events\n`);
    }

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

triggerCorporateImpact();
