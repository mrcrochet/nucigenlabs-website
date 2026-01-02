/**
 * PHASE 3C: Initialize Alert Preferences
 * 
 * Script to create default alert preferences for existing users
 * who don't have preferences yet
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Create default alert preferences for users who don't have them
 */
async function initAlertPreferences() {
  console.log('='.repeat(60));
  console.log('INITIALIZE ALERT PREFERENCES');
  console.log('='.repeat(60));
  console.log('Creating default alert preferences for existing users...\n');

  try {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, sector');

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    if (!users || users.length === 0) {
      console.log('No users found in database.');
      return { created: 0, skipped: 0 };
    }

    console.log(`Found ${users.length} users\n`);

    // Get existing preferences
    const { data: existingPrefs, error: prefsError } = await supabase
      .from('alert_preferences')
      .select('user_id');

    if (prefsError) {
      throw new Error(`Failed to fetch existing preferences: ${prefsError.message}`);
    }

    const existingUserIds = new Set((existingPrefs || []).map(p => p.user_id));

    let created = 0;
    let skipped = 0;

    for (const user of users) {
      if (existingUserIds.has(user.id)) {
        skipped++;
        continue;
      }

      // Create default preferences
      const { error: insertError } = await supabase
        .from('alert_preferences')
        .insert({
          user_id: user.id,
          enabled: true,
          min_impact_score: 0.5, // Default: medium impact
          min_confidence: 0.6, // Default: medium confidence
          sectors: user.sector ? [user.sector] : [],
          regions: [],
          event_types: [],
          notify_on_new_event: true,
          notify_on_high_impact: true,
          notify_on_sector_match: true,
          notify_on_region_match: true,
          notification_frequency: 'realtime',
        });

      if (insertError) {
        console.error(`Failed to create preferences for user ${user.id}:`, insertError.message);
        skipped++;
      } else {
        created++;
        console.log(`✓ Created preferences for user ${user.id}${user.sector ? ` (sector: ${user.sector})` : ''}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Initialization complete:');
    console.log(`  Created: ${created} preferences`);
    console.log(`  Skipped: ${skipped} (already exist)`);
    console.log('='.repeat(60));

    return { created, skipped };
  } catch (error: any) {
    console.error('Error initializing alert preferences:', error);
    throw error;
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].includes('init-alert-preferences')) {
  initAlertPreferences()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { initAlertPreferences };

