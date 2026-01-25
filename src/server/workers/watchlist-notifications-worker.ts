/**
 * Watchlist Notifications Worker
 * 
 * Monitors watchlist entities and generates notifications when changes are detected
 * Runs periodically to check for new signals/events/scenarios related to watchlist items
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config({ path: join(__dirname, '../../../../.env') });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[Watchlist Notifications] Missing Supabase config');
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface WatchlistItem {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  notify_on_signal: boolean;
  notify_on_event: boolean;
  notify_on_scenario: boolean;
}

/**
 * Get all active watchlist items
 */
async function getActiveWatchlists(): Promise<WatchlistItem[]> {
  try {
    const { data, error } = await supabase
      .from('watchlists')
      .select('*')
      .or('notify_on_signal.eq.true,notify_on_event.eq.true,notify_on_scenario.eq.true');

    if (error) {
      console.error('[Watchlist Notifications] Error fetching watchlists:', error);
      return [];
    }

    return (data || []) as WatchlistItem[];
  } catch (error: any) {
    console.error('[Watchlist Notifications] Error:', error);
    return [];
  }
}

/**
 * Check for new signals related to a watchlist item
 */
async function checkSignalsForEntity(
  item: WatchlistItem,
  hoursBack: number = 24
): Promise<any[]> {
  if (!item.notify_on_signal) return [];

  try {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    // Search for signals mentioning the entity
    const { data, error } = await supabase
      .from('market_signals')
      .select('*')
      .or(`title.ilike.%${item.entity_name}%,summary.ilike.%${item.entity_name}%,reasoning_summary.ilike.%${item.entity_name}%`)
      .gte('created_at', since)
      .eq('is_active', true)
      .limit(5);

    if (error) {
      console.error(`[Watchlist Notifications] Error checking signals for ${item.entity_name}:`, error);
      return [];
    }

    return data || [];
  } catch (error: any) {
    console.error(`[Watchlist Notifications] Error:`, error);
    return [];
  }
}

/**
 * Check for new events related to a watchlist item
 */
async function checkEventsForEntity(
  item: WatchlistItem,
  hoursBack: number = 24
): Promise<any[]> {
  if (!item.notify_on_event) return [];

  try {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    // Search for events related to the entity
    let query = supabase
      .from('nucigen_events')
      .select('*')
      .gte('created_at', since);

    if (item.entity_type === 'company') {
      query = query.or(`summary.ilike.%${item.entity_name}%,title.ilike.%${item.entity_name}%`);
    } else if (item.entity_type === 'country' || item.entity_type === 'sector') {
      query = query.or(`country.ilike.%${item.entity_name}%,sector.ilike.%${item.entity_name}%,region.ilike.%${item.entity_name}%`);
    } else {
      query = query.or(`summary.ilike.%${item.entity_name}%,title.ilike.%${item.entity_name}%`);
    }

    const { data, error } = await query.limit(5);

    if (error) {
      console.error(`[Watchlist Notifications] Error checking events for ${item.entity_name}:`, error);
      return [];
    }

    return data || [];
  } catch (error: any) {
    console.error(`[Watchlist Notifications] Error:`, error);
    return [];
  }
}

/**
 * Check if notification already exists
 */
async function notificationExists(
  userId: string,
  watchlistItemId: string,
  notificationType: string,
  relatedId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('watchlist_notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('watchlist_item_id', watchlistItemId)
      .eq('notification_type', notificationType)
      .or(`related_signal_id.eq.${relatedId},related_event_id.eq.${relatedId},related_scenario_id.eq.${relatedId}`)
      .limit(1);

    if (error) {
      return false;
    }

    return (data || []).length > 0;
  } catch {
    return false;
  }
}

/**
 * Create notification for a watchlist item
 */
async function createNotification(
  item: WatchlistItem,
  notificationType: 'signal' | 'event' | 'scenario',
  title: string,
  message: string,
  relatedSignalId?: string,
  relatedEventId?: string,
  relatedScenarioId?: string
): Promise<boolean> {
  try {
    // Check if notification already exists
    const relatedId = relatedSignalId || relatedEventId || relatedScenarioId || '';
    if (relatedId && await notificationExists(item.user_id, item.id, notificationType, relatedId)) {
      return false; // Already notified
    }

    const { error } = await supabase.from('watchlist_notifications').insert({
      user_id: item.user_id,
      watchlist_item_id: item.id,
      notification_type: notificationType,
      title,
      message,
      related_signal_id: relatedSignalId,
      related_event_id: relatedEventId,
      related_scenario_id: relatedScenarioId,
      read: false,
    } as any);

    if (error) {
      console.error(`[Watchlist Notifications] Error creating notification:`, error);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error(`[Watchlist Notifications] Error:`, error);
    return false;
  }
}

/**
 * Process watchlist item and generate notifications
 */
async function processWatchlistItem(item: WatchlistItem, hoursBack: number = 24): Promise<number> {
  let notificationsCreated = 0;

  try {
    // Check for new signals
    const signals = await checkSignalsForEntity(item, hoursBack);
    for (const signal of signals) {
      const created = await createNotification(
        item,
        'signal',
        `New signal for ${item.entity_name}`,
        signal.title || signal.summary || `A new signal has been detected related to ${item.entity_name}`,
        signal.id
      );
      if (created) notificationsCreated++;
    }

    // Check for new events
    const events = await checkEventsForEntity(item, hoursBack);
    for (const event of events) {
      const created = await createNotification(
        item,
        'event',
        `New event for ${item.entity_name}`,
        event.title || event.summary || `A new event has been detected related to ${item.entity_name}`,
        undefined,
        event.id
      );
      if (created) notificationsCreated++;
    }
  } catch (error: any) {
    console.error(`[Watchlist Notifications] Error processing item ${item.id}:`, error);
  }

  return notificationsCreated;
}

/**
 * Main worker function - processes all watchlists and generates notifications
 */
export async function processWatchlistNotifications(hoursBack: number = 24): Promise<{
  watchlistsProcessed: number;
  notificationsCreated: number;
  errors: number;
}> {
  console.log('[Watchlist Notifications] Starting notification generation...');

  let watchlistsProcessed = 0;
  let notificationsCreated = 0;
  let errors = 0;

  try {
    // Get all active watchlists
    const watchlists = await getActiveWatchlists();
    console.log(`[Watchlist Notifications] Found ${watchlists.length} active watchlists`);

    // Process each watchlist
    for (const item of watchlists) {
      try {
        const count = await processWatchlistItem(item, hoursBack);
        if (count > 0) {
          watchlistsProcessed++;
          notificationsCreated += count;
        }
      } catch (error: any) {
        console.error(`[Watchlist Notifications] Error processing watchlist ${item.id}:`, error.message);
        errors++;
      }
    }

    console.log(
      `[Watchlist Notifications] Complete: ${watchlistsProcessed} watchlists processed, ${notificationsCreated} notifications created, ${errors} errors`
    );

    return {
      watchlistsProcessed,
      notificationsCreated,
      errors,
    };
  } catch (error: any) {
    console.error('[Watchlist Notifications] Fatal error:', error.message);
    return {
      watchlistsProcessed: 0,
      notificationsCreated: 0,
      errors: 1,
    };
  }
}

// Export for use in pipeline
if (import.meta.url === `file://${process.argv[1]}`) {
  const hoursBack = parseInt(process.argv[2]) || 24;
  processWatchlistNotifications(hoursBack)
    .then((result) => {
      console.log('Result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
