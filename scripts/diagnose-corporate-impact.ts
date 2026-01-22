/**
 * Diagnostic script for Corporate Impact
 * 
 * Checks:
 * 1. Database connection
 * 2. Signals in database
 * 3. Events available for processing
 * 4. API server status
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });
dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
  console.log('🔍 Diagnosing Corporate Impact system...\n');

  // 1. Check database connection
  console.log('1️⃣ Checking database connection...');
  try {
    const { data, error } = await supabase.from('market_signals').select('id').limit(1);
    if (error) {
      console.error('   ❌ Database connection failed:', error.message);
      return;
    }
    console.log('   ✅ Database connection OK\n');
  } catch (error: any) {
    console.error('   ❌ Database connection error:', error.message);
    return;
  }

  // 2. Check signals in database
  console.log('2️⃣ Checking signals in database...');
  try {
    const { data: signals, error, count } = await supabase
      .from('market_signals')
      .select('id, type, company_name, is_active, generated_at', { count: 'exact' })
      .order('generated_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('   ❌ Error fetching signals:', error.message);
    } else {
      const activeSignals = signals?.filter(s => s.is_active) || [];
      const opportunities = activeSignals.filter(s => s.type === 'opportunity').length;
      const risks = activeSignals.filter(s => s.type === 'risk').length;

      console.log(`   📊 Total signals: ${count || 0}`);
      console.log(`   ✅ Active signals: ${activeSignals.length}`);
      console.log(`   📈 Opportunities: ${opportunities}`);
      console.log(`   📉 Risks: ${risks}`);

      if (activeSignals.length > 0) {
        console.log('\n   Recent signals:');
        activeSignals.slice(0, 5).forEach((s: any) => {
          console.log(`      - ${s.company_name} (${s.type}) - ${new Date(s.generated_at).toLocaleDateString()}`);
        });
      } else {
        console.log('   ⚠️  No active signals found');
      }
    }
    console.log();
  } catch (error: any) {
    console.error('   ❌ Error:', error.message);
  }

  // 3. Check events available for processing
  console.log('3️⃣ Checking events available for processing...');
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: events, error, count } = await supabase
      .from('events')
      .select('id, title, discover_tier, discover_category, published_at', { count: 'exact' })
      .or('discover_tier.eq.critical,discover_tier.eq.strategic')
      .in('discover_category', ['geopolitics', 'finance', 'energy', 'supply-chain'])
      .gte('published_at', sevenDaysAgo)
      .order('published_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('   ❌ Error fetching events:', error.message);
    } else {
      console.log(`   📰 Relevant events (last 7 days): ${count || 0}`);
      
      if (events && events.length > 0) {
        // Check which events already have signals
        const eventIds = events.map(e => e.id);
        const { data: existingSignals } = await supabase
          .from('market_signals')
          .select('event_id')
          .in('event_id', eventIds)
          .eq('is_active', true);

        const eventsWithSignals = new Set(existingSignals?.map((s: any) => s.event_id) || []);
        const eventsWithoutSignals = events.filter(e => !eventsWithSignals.has(e.id));

        console.log(`   ✅ Events with signals: ${eventsWithSignals.size}`);
        console.log(`   ⚠️  Events without signals: ${eventsWithoutSignals.length}`);

        if (eventsWithoutSignals.length > 0) {
          console.log('\n   Events ready for processing:');
          eventsWithoutSignals.slice(0, 5).forEach((e: any) => {
            console.log(`      - ${e.title} (${e.discover_category})`);
          });
        }
      } else {
        console.log('   ⚠️  No relevant events found in the last 7 days');
      }
    }
    console.log();
  } catch (error: any) {
    console.error('   ❌ Error:', error.message);
  }

  // 4. Check API server
  console.log('4️⃣ Checking API server status...');
  try {
    const response = await fetch('http://localhost:3001/health');
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ API server is running');
      console.log(`   📍 Health check: ${data.status}`);
    } else {
      console.log('   ⚠️  API server responded with error:', response.status);
    }
  } catch (error: any) {
    console.log('   ❌ API server is not running');
    console.log('   💡 Start it with: npm run api:server');
  }
  console.log();

  // Summary
  console.log('📋 Summary:');
  console.log('   To fix issues:');
  console.log('   1. Start API server: npm run api:server');
  console.log('   2. Generate signals: npm run trigger:corporate-impact');
  console.log('   3. Check the page: http://localhost:5173/corporate-impact');
}

diagnose().catch(console.error);
