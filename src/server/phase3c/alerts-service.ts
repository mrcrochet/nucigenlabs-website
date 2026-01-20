/**
 * PHASE 3C: Alerts Service
 * 
 * Service for managing user alerts and matching events with user preferences
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { sendAlertEmail } from '../services/email-service.js';

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

// ============================================
// Alert Preferences
// ============================================

export interface AlertPreferences {
  id?: string;
  user_id: string;
  enabled: boolean;
  min_impact_score?: number;
  min_confidence?: number;
  sectors?: string[];
  regions?: string[];
  event_types?: string[];
  notify_on_new_event?: boolean;
  notify_on_high_impact?: boolean;
  notify_on_sector_match?: boolean;
  notify_on_region_match?: boolean;
  notification_frequency?: 'realtime' | 'hourly' | 'daily' | 'weekly';
}

export async function getAlertPreferences(userId: string): Promise<AlertPreferences | null> {
  const { data, error } = await supabase
    .from('alert_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch alert preferences: ${error.message}`);
  }

  return data;
}

export async function updateAlertPreferences(userId: string, preferences: Partial<AlertPreferences>) {
  const { data, error } = await supabase
    .from('alert_preferences')
    .upsert({
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update alert preferences: ${error.message}`);
  }

  return data;
}

// ============================================
// User Alerts
// ============================================

export interface UserAlert {
  id: string;
  user_id: string;
  nucigen_event_id: string;
  alert_type: 'new_event' | 'high_impact' | 'sector_match' | 'region_match' | 'custom';
  priority: 'low' | 'normal' | 'high' | 'critical';
  match_reasons: string[];
  status: 'unread' | 'read' | 'dismissed' | 'saved';
  read_at?: string;
  dismissed_at?: string;
  created_at: string;
}

export async function getUserAlerts(
  userId: string,
  options: {
    status?: 'unread' | 'read' | 'dismissed' | 'saved';
    limit?: number;
    offset?: number;
  } = {}
) {
  let query = supabase
    .from('user_alerts')
    .select(`
      *,
      nucigen_events (
        id,
        summary,
        event_type,
        sector,
        region,
        impact_score,
        confidence,
        created_at
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch user alerts: ${error.message}`);
  }

  return data || [];
}

export async function markAlertAsRead(alertId: string, userId: string) {
  const { data, error } = await supabase
    .from('user_alerts')
    .update({
      status: 'read',
      read_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to mark alert as read: ${error.message}`);
  }

  return data;
}

export async function dismissAlert(alertId: string, userId: string) {
  const { data, error } = await supabase
    .from('user_alerts')
    .update({
      status: 'dismissed',
      dismissed_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to dismiss alert: ${error.message}`);
  }

  return data;
}

export async function getUnreadAlertCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('user_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'unread');

  if (error) {
    throw new Error(`Failed to count unread alerts: ${error.message}`);
  }

  return count || 0;
}

// ============================================
// Alert Matching & Generation
// ============================================

interface MatchResult {
  shouldAlert: boolean;
  alertType: 'new_event' | 'high_impact' | 'sector_match' | 'region_match' | 'custom';
  priority: 'low' | 'normal' | 'high' | 'critical';
  reasons: string[];
}

/**
 * Check if an event matches user's alert preferences
 */
function matchEventToPreferences(
  event: any,
  preferences: AlertPreferences
): MatchResult {
  if (!preferences.enabled) {
    return { shouldAlert: false, alertType: 'new_event', priority: 'normal', reasons: [] };
  }

  const reasons: string[] = [];
  let alertType: MatchResult['alertType'] = 'new_event';
  let priority: MatchResult['priority'] = 'normal';

  // Check impact score
  if (preferences.min_impact_score !== null && preferences.min_impact_score !== undefined) {
    if (event.impact_score >= preferences.min_impact_score) {
      reasons.push(`Impact score ${(event.impact_score * 100).toFixed(0)}% meets threshold`);
      if (event.impact_score >= 0.8) {
        alertType = 'high_impact';
        priority = 'high';
      }
    } else {
      return { shouldAlert: false, alertType: 'new_event', priority: 'normal', reasons: [] };
    }
  }

  // Check confidence
  if (preferences.min_confidence !== null && preferences.min_confidence !== undefined) {
    if (event.confidence < preferences.min_confidence) {
      return { shouldAlert: false, alertType: 'new_event', priority: 'normal', reasons: [] };
    }
  }

  // Check sector match
  if (preferences.sectors && preferences.sectors.length > 0 && event.sector) {
    if (preferences.sectors.includes(event.sector)) {
      reasons.push(`Matches your sector: ${event.sector}`);
      alertType = 'sector_match';
      priority = 'high';
    }
  }

  // Check region match
  if (preferences.regions && preferences.regions.length > 0 && event.region) {
    if (preferences.regions.includes(event.region)) {
      reasons.push(`Matches your region: ${event.region}`);
      alertType = 'region_match';
      if (priority !== 'high') priority = 'high';
    }
  }

  // Check event type match
  if (preferences.event_types && preferences.event_types.length > 0 && event.event_type) {
    if (preferences.event_types.includes(event.event_type)) {
      reasons.push(`Matches your event type: ${event.event_type}`);
    }
  }

  // Determine if should alert based on notification settings
  // If event passes thresholds, alert if any notification type is enabled
  let shouldAlert = false;
  
  // If event passed all thresholds, check notification preferences
  if (preferences.notify_on_new_event) {
    shouldAlert = true; // Always alert if notify_on_new_event is enabled and thresholds are met
  }
  if (preferences.notify_on_high_impact && alertType === 'high_impact') {
    shouldAlert = true;
  }
  if (preferences.notify_on_sector_match && alertType === 'sector_match') {
    shouldAlert = true;
  }
  if (preferences.notify_on_region_match && alertType === 'region_match') {
    shouldAlert = true;
  }

  // Critical priority for very high impact
  if (event.impact_score >= 0.9) {
    priority = 'critical';
  }

  return {
    shouldAlert,
    alertType,
    priority,
    reasons: reasons.length > 0 ? reasons : ['New event matches your preferences'],
  };
}

/**
 * Generate alerts for a new event for all users
 */
export async function generateAlertsForEvent(nucigenEventId: string, debug: boolean = false) {
  try {
    // Get the event
    const { data: event, error: eventError } = await supabase
      .from('nucigen_events')
      .select('*')
      .eq('id', nucigenEventId)
      .single();

    if (eventError || !event) {
      throw new Error(`Event not found: ${nucigenEventId}`);
    }

    if (debug) {
      console.log(`\n[Debug] Processing event: ${event.summary?.substring(0, 60)}...`);
      console.log(`  Impact: ${event.impact_score}, Confidence: ${event.confidence}, Sector: ${event.sector}, Region: ${event.region}`);
    }

    // Get all users with alert preferences
    const { data: preferences, error: prefsError } = await supabase
      .from('alert_preferences')
      .select('*')
      .eq('enabled', true);

    if (prefsError) {
      throw new Error(`Failed to fetch alert preferences: ${prefsError.message}`);
    }

    if (!preferences || preferences.length === 0) {
      if (debug) console.log(`[Debug] No users with enabled alert preferences found`);
      return { generated: 0, skipped: 0 };
    }

    if (debug) console.log(`[Debug] Found ${preferences.length} users with enabled preferences`);

    let generated = 0;
    let skipped = 0;
    let noMatchCount = 0;

    // Check each user's preferences
    for (const pref of preferences) {
      const match = matchEventToPreferences(event, pref);

      if (debug) {
        console.log(`  User ${pref.user_id}: shouldAlert=${match.shouldAlert}, type=${match.alertType}, reasons=${match.reasons.length}`);
      }

      if (match.shouldAlert) {
        // Check if alert already exists
        const { data: existing } = await supabase
          .from('user_alerts')
          .select('id')
          .eq('user_id', pref.user_id)
          .eq('nucigen_event_id', nucigenEventId)
          .maybeSingle();

        if (!existing) {
          // Create alert
          const { error: insertError } = await supabase
            .from('user_alerts')
            .insert({
              user_id: pref.user_id,
              nucigen_event_id: nucigenEventId,
              alert_type: match.alertType,
              priority: match.priority,
              match_reasons: match.reasons,
              status: 'unread',
            });

          if (insertError) {
            console.error(`Failed to create alert for user ${pref.user_id}:`, insertError);
            skipped++;
          } else {
            generated++;
            if (debug) console.log(`    ✓ Alert created`);
          }
        } else {
          skipped++;
          if (debug) console.log(`    - Alert already exists`);
        }
      } else {
        noMatchCount++;
        if (debug && match.reasons.length === 0) {
          console.log(`    - No match (thresholds not met or notifications disabled)`);
        }
      }
    }

    if (debug) {
      console.log(`  Result: ${generated} generated, ${skipped} skipped, ${noMatchCount} no match`);
    }

    return { generated, skipped };
  } catch (error: any) {
    console.error('Error generating alerts:', error);
    throw error;
  }
}

/**
 * Generate alerts for all pending events (batch processing)
 */
export async function generateAlertsForPendingEvents(limit: number = 100, debug: boolean = false) {
  try {
    // Get events that don't have alerts yet (simplified: get recent events)
    const { data: events, error: eventsError } = await supabase
      .from('nucigen_events')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (eventsError) {
      throw new Error(`Failed to fetch events: ${eventsError.message}`);
    }

    if (!events || events.length === 0) {
      if (debug) console.log('[Debug] No events found');
      return { processed: 0, generated: 0 };
    }

    if (debug) {
      console.log(`[Debug] Processing ${events.length} events...`);
    }

    let totalGenerated = 0;
    let totalSkipped = 0;

    for (const event of events) {
      const result = await generateAlertsForEvent(event.id, debug);
      totalGenerated += result.generated;
      totalSkipped += result.skipped;
    }

    return {
      processed: events.length,
      generated: totalGenerated,
      skipped: totalSkipped,
    };
  } catch (error: any) {
    console.error('Error generating alerts for pending events:', error);
    throw error;
  }
}

