/**
 * PHASE 3C: Alerts Generator Worker
 * 
 * Generates alerts for users when new events match their preferences
 * Should be run after event processing
 */

import { generateAlertsForPendingEvents } from '../phase3c/alerts-service';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

/**
 * Generate alerts for all pending events
 */
export async function runAlertsGenerator(limit: number = 100, debug: boolean = false) {
  console.log('='.repeat(60));
  console.log('ALERTS GENERATOR WORKER');
  console.log('='.repeat(60));
  console.log(`Generating alerts for up to ${limit} events...\n`);

  try {
    const result = await generateAlertsForPendingEvents(limit, debug);
    
    console.log('\nAlerts generation complete:');
    console.log(`  Processed: ${result.processed} events`);
    console.log(`  Generated: ${result.generated} alerts`);
    console.log(`  Skipped: ${result.skipped} (already exists or no match)`);
    
    if (result.generated === 0 && result.processed > 0) {
      console.log('\n⚠️  No alerts generated. Possible reasons:');
      console.log('  - No users have alert preferences configured');
      console.log('  - Events don\'t meet user thresholds (impact_score, confidence)');
      console.log('  - Notification preferences are disabled');
      console.log('  - Run with DEBUG=true for detailed logs');
    }
    
    console.log('='.repeat(60));
    
    return result;
  } catch (error: any) {
    console.error('Error generating alerts:', error);
    throw error;
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].includes('alerts-generator')) {
  const limit = process.argv[2] ? parseInt(process.argv[2], 10) : 100;
  const debug = process.env.DEBUG === 'true' || process.argv.includes('--debug');
  runAlertsGenerator(limit, debug)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

