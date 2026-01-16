/**
 * Check Discover Setup
 * 
 * Verifies that:
 * 1. Migration has been applied (discover_* columns exist)
 * 2. Data exists in events table with discover_* columns
 * 3. Provides instructions if something is missing
 */

import { supabase } from '../../lib/supabase.js';

async function checkDiscoverSetup() {
  console.log('\n' + '='.repeat(60));
  console.log('DISCOVER SETUP CHECK');
  console.log('='.repeat(60) + '\n');

  // Check 1: Verify events table exists
  console.log('1. Checking if events table exists...');
  const { data: tableCheck, error: tableError } = await supabase
    .from('events')
    .select('id')
    .limit(1);

  if (tableError) {
    console.error('❌ Events table error:', tableError.message);
    console.error('\n   → The events table might not exist. Check your database setup.');
    return;
  }
  console.log('✅ Events table exists\n');

  // Check 2: Verify discover_* columns exist
  console.log('2. Checking if discover_* columns exist...');
  const { data: columnCheck, error: columnError } = await supabase
    .from('events')
    .select('discover_score, discover_type, discover_category')
    .limit(1);

  if (columnError) {
    const errorMsg = columnError.message || '';
    if (errorMsg.includes('discover_') || errorMsg.includes('column') || errorMsg.includes('does not exist')) {
      console.error('❌ Discover columns not found!');
      console.error('\n   → Migration not applied. Please run:');
      console.error('   → supabase/migrations/20260110000000_add_discover_columns_to_events.sql');
      console.error('\n   → Or apply via Supabase dashboard:');
      console.error('   → SQL Editor → New Query → Paste migration SQL → Run');
      return;
    }
    console.error('❌ Error checking columns:', columnError.message);
    return;
  }
  console.log('✅ Discover columns exist\n');

  // Check 3: Count events with discover data
  console.log('3. Checking for events with Discover data...');
  const { count, error: countError } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .not('discover_score', 'is', null)
    .not('discover_type', 'is', null);

  if (countError) {
    console.error('❌ Error counting events:', countError.message);
    return;
  }

  if (count === 0) {
    console.warn('⚠️  No events found with Discover data.');
    console.warn('\n   → To populate data, run the discover-collector:');
    console.warn('   → npm run pipeline (or manually call collectDiscoverItems)');
    console.warn('\n   → Or run:');
    console.warn('   → import { collectDiscoverItems } from "./workers/discover-collector.js";');
    console.warn('   → await collectDiscoverItems(["all"]);');
    return;
  }

  console.log(`✅ Found ${count} events with Discover data\n`);

  // Check 4: Sample data
  console.log('4. Sample Discover items:');
  const { data: sample, error: sampleError } = await supabase
    .from('events')
    .select('id, title, discover_type, discover_category, discover_score, discover_tier')
    .not('discover_score', 'is', null)
    .order('discover_score', { ascending: false })
    .limit(5);

  if (sampleError) {
    console.error('❌ Error fetching sample:', sampleError.message);
    return;
  }

  if (sample && sample.length > 0) {
    sample.forEach((item, idx) => {
      console.log(`   ${idx + 1}. [${item.discover_type}] ${item.title?.substring(0, 50)}...`);
      console.log(`      Category: ${item.discover_category}, Score: ${item.discover_score}, Tier: ${item.discover_tier}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Discover setup is complete!');
  console.log('='.repeat(60) + '\n');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkDiscoverSetup()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { checkDiscoverSetup };
