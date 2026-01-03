/**
 * PHASE 6: Pipeline Validation Script
 * 
 * Validates the complete data pipeline from collection to display
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('  SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ValidationResult {
  step: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

const results: ValidationResult[] = [];

function addResult(step: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any) {
  results.push({ step, status, message, details });
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} [${step}] ${message}`);
  if (details) {
    console.log('   Details:', JSON.stringify(details, null, 2));
  }
}

async function validatePipeline() {
  console.log('🔍 Starting pipeline validation...\n');

  // 1. Check database tables exist
  console.log('📊 Step 1: Validating database tables...');
  const requiredTables = [
    'events',
    'nucigen_events',
    'nucigen_causal_chains',
    'users',
    'user_preferences',
    'alert_preferences',
    'user_alerts',
    'event_context',
    'official_documents',
  ];

  for (const table of requiredTables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      addResult('Database Tables', 'fail', `Table ${table} does not exist or is not accessible`, { error: error.message });
    } else {
      addResult('Database Tables', 'pass', `Table ${table} exists`);
    }
  }

  // 2. Check search_vector column exists
  console.log('\n🔍 Step 2: Validating full-text search setup...');
  // Check by trying to select search_vector
  const { data: searchTest, error: searchError } = await supabase
    .from('nucigen_events')
    .select('search_vector')
    .limit(1);

  if (searchError && (searchError.message.includes('search_vector') || searchError.message.includes('column'))) {
    addResult('Full-Text Search', 'fail', 'search_vector column does not exist', { error: searchError.message });
  } else {
    addResult('Full-Text Search', 'pass', 'search_vector column exists');
  }

  // 3. Check events have search_vector populated
  const { data: eventsWithVector, error: vectorError } = await supabase
    .from('nucigen_events')
    .select('id, search_vector')
    .limit(10);

  if (!vectorError && eventsWithVector) {
    const withVector = eventsWithVector.filter(e => e.search_vector).length;
    const total = eventsWithVector.length;
    if (total > 0) {
      const percentage = (withVector / total) * 100;
      if (percentage === 100) {
        addResult('Search Vector Population', 'pass', `All ${total} events have search_vector`);
      } else {
        addResult('Search Vector Population', 'warning', `${withVector}/${total} events have search_vector (${percentage.toFixed(1)}%)`);
      }
    } else {
      addResult('Search Vector Population', 'warning', 'No events found to validate');
    }
  }

  // 4. Check search function exists
  const { data: searchFunc, error: funcError } = await supabase
    .rpc('search_nucigen_events', {
      search_query: '',
      limit_count: 1,
      offset_count: 0,
    });

  if (funcError) {
    addResult('Search Function', 'fail', 'search_nucigen_events function does not exist or is not accessible', { error: funcError.message });
  } else {
    addResult('Search Function', 'pass', 'search_nucigen_events function exists and is callable');
  }

  // 5. Validate event structure
  console.log('\n📋 Step 3: Validating event structure...');
  const { data: events, error: eventsError } = await supabase
    .from('nucigen_events')
    .select('*')
    .limit(10);

  if (eventsError) {
    addResult('Event Structure', 'fail', 'Cannot fetch events', { error: eventsError.message });
  } else if (!events || events.length === 0) {
    addResult('Event Structure', 'warning', 'No events found in database');
  } else {
    const requiredFields = ['id', 'summary', 'why_it_matters', 'impact_score', 'confidence', 'created_at'];
    const sampleEvent = events[0];
    const missingFields = requiredFields.filter(field => !(field in sampleEvent));
    
    if (missingFields.length > 0) {
      addResult('Event Structure', 'fail', `Missing required fields: ${missingFields.join(', ')}`);
    } else {
      addResult('Event Structure', 'pass', `All required fields present (checked ${events.length} events)`);
    }

    // Validate score ranges
    const invalidScores = events.filter(e => {
      const impact = e.impact_score;
      const confidence = e.confidence;
      return (impact !== null && (impact < 0 || impact > 1)) ||
             (confidence !== null && (confidence < 0 || confidence > 1));
    });

    if (invalidScores.length > 0) {
      addResult('Score Ranges', 'fail', `${invalidScores.length} events have invalid scores (must be 0-1)`);
    } else {
      addResult('Score Ranges', 'pass', 'All scores are in valid range (0-1)');
    }
  }

  // 6. Validate causal chains
  console.log('\n🔗 Step 4: Validating causal chains...');
  const { data: chains, error: chainsError } = await supabase
    .from('nucigen_causal_chains')
    .select('*')
    .limit(10);

  if (chainsError) {
    addResult('Causal Chains', 'fail', 'Cannot fetch causal chains', { error: chainsError.message });
  } else if (!chains || chains.length === 0) {
    addResult('Causal Chains', 'warning', 'No causal chains found in database');
  } else {
    const requiredFields = ['id', 'nucigen_event_id', 'cause', 'first_order_effect', 'time_horizon', 'confidence'];
    const sampleChain = chains[0];
    const missingFields = requiredFields.filter(field => !(field in sampleChain));
    
    if (missingFields.length > 0) {
      addResult('Causal Chain Structure', 'fail', `Missing required fields: ${missingFields.join(', ')}`);
    } else {
      addResult('Causal Chain Structure', 'pass', `All required fields present (checked ${chains.length} chains)`);
    }

    // Validate time_horizon
    const validHorizons = ['hours', 'days', 'weeks'];
    const invalidHorizons = chains.filter(c => !validHorizons.includes(c.time_horizon));
    if (invalidHorizons.length > 0) {
      addResult('Time Horizon', 'fail', `${invalidHorizons.length} chains have invalid time_horizon`);
    } else {
      addResult('Time Horizon', 'pass', 'All time_horizons are valid');
    }
  }

  // 7. Check events have causal chains
  const { data: eventsWithChains, error: eventsChainsError } = await supabase
    .from('nucigen_events')
    .select(`
      id,
      nucigen_causal_chains (id)
    `)
    .limit(20);

  if (!eventsChainsError && eventsWithChains) {
    const withChains = eventsWithChains.filter(e => 
      e.nucigen_causal_chains && 
      Array.isArray(e.nucigen_causal_chains) && 
      e.nucigen_causal_chains.length > 0
    ).length;
    const total = eventsWithChains.length;
    
    if (total > 0) {
      const percentage = (withChains / total) * 100;
      if (percentage === 100) {
        addResult('Events with Chains', 'pass', `All ${total} events have causal chains`);
      } else {
        addResult('Events with Chains', 'warning', `${withChains}/${total} events have causal chains (${percentage.toFixed(1)}%)`);
      }
    }
  }

  // 8. Validate user preferences
  console.log('\n👤 Step 5: Validating user preferences...');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id')
    .limit(5);

  if (!usersError && users && users.length > 0) {
    const userIds = users.map(u => u.id);
    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('user_id')
      .in('user_id', userIds);

    if (!prefError && preferences) {
      const usersWithPrefs = preferences.length;
      const totalUsers = users.length;
      if (usersWithPrefs === totalUsers) {
        addResult('User Preferences', 'pass', `All ${totalUsers} users have preferences`);
      } else {
        addResult('User Preferences', 'warning', `${usersWithPrefs}/${totalUsers} users have preferences`);
      }
    }
  }

  // 9. Check alert preferences
  const { data: alertPrefs, error: alertPrefsError } = await supabase
    .from('alert_preferences')
    .select('user_id, notify_on_new_event')
    .limit(10);

  if (!alertPrefsError && alertPrefs) {
    const enabled = alertPrefs.filter(p => p.notify_on_new_event).length;
    addResult('Alert Preferences', 'pass', `${enabled} users have alerts enabled (out of ${alertPrefs.length})`);
  }

  // 10. Summary
  console.log('\n📊 Validation Summary:');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`📋 Total: ${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Validation FAILED - Please fix the errors above');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('\n⚠️  Validation PASSED with warnings - Review warnings above');
    process.exit(0);
  } else {
    console.log('\n✅ Validation PASSED - All checks successful');
    process.exit(0);
  }
}

// Run validation
validatePipeline().catch(error => {
  console.error('❌ Validation error:', error);
  process.exit(1);
});

