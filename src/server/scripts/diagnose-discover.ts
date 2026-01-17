/**
 * Diagnostic script for Discover page issues
 * 
 * Run with: npx tsx src/server/scripts/diagnose-discover.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config({ path: join(__dirname, '../../../../.env') });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase not configured!');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
  console.log('\n🔍 Diagnosing Discover page issues...\n');

  // 1. Check if events table exists
  console.log('1️⃣  Checking events table...');
  try {
    const { data, error } = await supabase
      .from('events')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('   ❌ Error accessing events table:', error.message);
      return;
    }
    console.log('   ✅ Events table exists');
  } catch (err: any) {
    console.error('   ❌ Events table does not exist or is not accessible:', err.message);
    return;
  }

  // 2. Check if discover_* columns exist
  console.log('\n2️⃣  Checking discover_* columns...');
  const discoverColumns = [
    'discover_score',
    'discover_type',
    'discover_category',
    'discover_tier',
    'discover_consensus',
    'discover_tags',
    'discover_thumbnail',
    'discover_sources',
    'discover_concepts',
    'discover_location',
    'discover_sentiment',
    'discover_article_count',
    'discover_why_it_matters',
    'discover_enriched_at',
  ];

  for (const column of discoverColumns) {
    try {
      const { error } = await supabase
        .from('events')
        .select(column)
        .limit(1);
      
      if (error) {
        if (error.message.includes('column') || error.message.includes('does not exist') || error.code === '42703') {
          console.log(`   ❌ Column ${column} does NOT exist`);
        } else {
          console.log(`   ⚠️  Column ${column} check failed:`, error.message);
        }
      } else {
        console.log(`   ✅ Column ${column} exists`);
      }
    } catch (err: any) {
      console.log(`   ❌ Column ${column} check error:`, err.message);
    }
  }

  // 3. Check if there are events with discover_score
  console.log('\n3️⃣  Checking for events with discover_score...');
  try {
    const { data, error, count } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .not('discover_score', 'is', null);
    
    if (error) {
      if (error.message.includes('column') || error.message.includes('does not exist') || error.code === '42703') {
        console.log('   ❌ discover_score column does not exist');
        console.log('   💡 Solution: Apply migration: supabase/migrations/20260110000000_add_discover_columns_to_events.sql');
      } else {
        console.error('   ❌ Error checking discover_score:', error.message);
      }
    } else {
      console.log(`   ✅ Found ${count || 0} events with discover_score`);
      if (count === 0) {
        console.log('   💡 Solution: Run data collection: npm run discover:collect');
      }
    }
  } catch (err: any) {
    console.error('   ❌ Error:', err.message);
  }

  // 4. Check total events count
  console.log('\n4️⃣  Checking total events count...');
  try {
    const { count, error } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('   ❌ Error:', error.message);
    } else {
      console.log(`   ✅ Total events in database: ${count || 0}`);
    }
  } catch (err: any) {
    console.error('   ❌ Error:', err.message);
  }

  // 5. Test a sample query
  console.log('\n5️⃣  Testing sample query...');
  try {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, discover_score, discover_type')
      .not('discover_score', 'is', null)
      .not('discover_type', 'is', null)
      .order('discover_score', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('   ❌ Query error:', error.message);
      console.error('   Error code:', error.code);
      console.error('   Error details:', error.details);
      console.error('   Error hint:', error.hint);
    } else {
      console.log(`   ✅ Query successful, found ${data?.length || 0} items`);
      if (data && data.length > 0) {
        console.log('   Sample items:');
        data.forEach((item, idx) => {
          console.log(`      ${idx + 1}. ${item.title?.substring(0, 50) || 'No title'} (score: ${item.discover_score}, type: ${item.discover_type})`);
        });
      }
    }
  } catch (err: any) {
    console.error('   ❌ Query failed:', err.message);
  }

  console.log('\n✅ Diagnosis complete!\n');
}

diagnose().catch(console.error);
