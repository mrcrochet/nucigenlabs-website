/**
 * Collect Discover Items from EventRegistry
 * 
 * Usage: npm run discover:collect
 */

import { collectDiscoverItems } from '../workers/discover-collector.js';

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('DISCOVER COLLECTOR');
  console.log('='.repeat(60) + '\n');

  try {
    const result = await collectDiscoverItems(['all', 'tech', 'finance', 'geopolitics', 'energy', 'supply-chain']);
    
    console.log('\n' + '='.repeat(60));
    console.log('COLLECTION COMPLETE');
    console.log('='.repeat(60));
    console.log(`Collected: ${result.collected}`);
    console.log(`Inserted: ${result.inserted}`);
    console.log(`Skipped: ${result.skipped}`);
    console.log(`Filtered: ${result.filtered || 0}`);
    console.log(`Errors: ${result.errors}`);
    console.log('='.repeat(60) + '\n');
    
    if (result.errors > 0) {
      console.warn('⚠️  Some errors occurred during collection. Check logs above.');
      process.exit(1);
    }
    
    if (result.inserted === 0 && result.collected > 0) {
      console.warn('⚠️  No new items inserted. Items may already exist in database.');
    }
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
