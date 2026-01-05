/**
 * Live Search API Endpoint
 * 
 * Exécutable directement pour rechercher des événements réels
 * Usage: npx tsx src/server/services/live-search-api.ts "query"
 */

import { searchAndCreateLiveEvent } from './live-event-creator.js';

const query = process.argv[2];

if (!query) {
  console.error('Usage: npx tsx src/server/services/live-search-api.ts "your search query"');
  process.exit(1);
}

async function main() {
  try {
    console.log(`🔍 Searching for: "${query}"`);
    const result = await searchAndCreateLiveEvent(query);
    
    if (result) {
      console.log('\n✅ Event created successfully!');
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    } else {
      console.log('\n❌ No event created');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();


