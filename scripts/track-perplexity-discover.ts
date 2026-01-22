/**
 * Standalone script to track Perplexity Discover
 * Can be run manually or via cron job
 * 
 * Usage:
 *   npm run track:perplexity
 *   npm run track:perplexity:dev (watch mode)
 */

import { trackPerplexityDiscover } from '../src/server/workers/perplexity-discover-tracker';

async function main() {
  console.log(`[Perplexity Tracker Script] Starting at ${new Date().toISOString()}`);
  
  try {
    const result = await trackPerplexityDiscover();
    
    console.log('\n[Perplexity Tracker Script] Results:');
    console.log(`  - Scraped: ${result.scraped}`);
    console.log(`  - Topics found: ${result.topicsFound}`);
    console.log(`  - Inserted: ${result.inserted}`);
    console.log(`  - Skipped: ${result.skipped}`);
    console.log(`  - Errors: ${result.errors}`);
    
    if (result.errors > 0) {
      console.warn('\n[Perplexity Tracker Script] Some errors occurred during tracking');
      process.exit(1);
    } else {
      console.log('\n[Perplexity Tracker Script] Tracking completed successfully');
      process.exit(0);
    }
  } catch (error: any) {
    console.error('\n[Perplexity Tracker Script] Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
