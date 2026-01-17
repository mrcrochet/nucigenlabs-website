/**
 * Engagement Service
 * 
 * Tracks user engagement with Discover items (views, saves, clicks, shares, read time)
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
  console.warn('[Engagement Service] Supabase not configured');
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export type EngagementType = 'view' | 'save' | 'click' | 'share' | 'read_time';

export interface EngagementMetadata {
  read_time?: number; // in seconds
  share_platform?: 'twitter' | 'linkedin' | 'email' | 'copy';
  [key: string]: any;
}

/**
 * Track user engagement with a Discover item
 */
export async function trackEngagement(
  userId: string,
  eventId: string,
  engagementType: EngagementType,
  metadata?: EngagementMetadata
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    console.warn('[Engagement Service] Supabase not configured, skipping tracking');
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { error } = await supabase
      .from('user_engagement')
      .insert({
        user_id: userId,
        event_id: eventId,
        engagement_type: engagementType,
        metadata: metadata || {},
      });

    if (error) {
      // Ignore duplicate errors (unique constraint)
      if (error.code === '23505') {
        console.log('[Engagement Service] Duplicate engagement tracked (ignored)');
        return { success: true };
      }
      
      console.error('[Engagement Service] Error tracking engagement:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Engagement Service] Exception tracking engagement:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get engagement stats for an event
 */
export async function getEventEngagementStats(eventId: string): Promise<{
  total_views: number;
  total_saves: number;
  total_clicks: number;
  total_shares: number;
  unique_users: number;
} | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.rpc('get_event_engagement_stats', {
      event_uuid: eventId,
    });

    if (error) {
      console.error('[Engagement Service] Error getting stats:', error);
      return null;
    }

    return data?.[0] || {
      total_views: 0,
      total_saves: 0,
      total_clicks: 0,
      total_shares: 0,
      unique_users: 0,
    };
  } catch (error: any) {
    console.error('[Engagement Service] Exception getting stats:', error);
    return null;
  }
}

/**
 * Get user engagement summary
 */
export async function getUserEngagementSummary(
  userId: string,
  days: number = 30
): Promise<{
  total_views: number;
  total_saves: number;
  total_clicks: number;
  total_shares: number;
  avg_read_time: number;
} | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.rpc('get_user_engagement_summary', {
      user_uuid: userId,
      days,
    });

    if (error) {
      console.error('[Engagement Service] Error getting user summary:', error);
      return null;
    }

    return data?.[0] || {
      total_views: 0,
      total_saves: 0,
      total_clicks: 0,
      total_shares: 0,
      avg_read_time: 0,
    };
  } catch (error: any) {
    console.error('[Engagement Service] Exception getting user summary:', error);
    return null;
  }
}
