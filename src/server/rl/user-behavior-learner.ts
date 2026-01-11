/**
 * User Behavior Learner
 * 
 * Tracks and learns from user behavior (clicks, reads, shares) for reinforcement learning.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[UserBehaviorLearner] Supabase not configured.');
}

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

export interface UserAction {
  userId: string;
  eventId: string;
  actionType: 'click' | 'view' | 'read' | 'share' | 'bookmark' | 'ignore' | 'feedback_positive' | 'feedback_negative';
  timestamp: Date;
  metadata?: any;
}

export interface BehaviorPattern {
  userId: string;
  preferredSectors: string[];
  preferredRegions: string[];
  preferredEventTypes: string[];
  avgTimeSpent: number;
  engagementScore: number;
  clickRate: number;
  shareRate: number;
}

/**
 * Record user action
 */
export async function recordUserAction(action: UserAction): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('user_actions')
      .insert({
        user_id: action.userId,
        event_id: action.eventId,
        action_type: action.actionType,
        action_timestamp: action.timestamp.toISOString(),
        metadata: action.metadata || {},
      });

    if (error) {
      console.error('[UserBehaviorLearner] Error recording action:', error.message);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('[UserBehaviorLearner] Error recording action:', error.message);
    return false;
  }
}

/**
 * Get user behavior pattern
 */
export async function getUserBehaviorPattern(userId: string, days: number = 30): Promise<BehaviorPattern | null> {
  if (!supabase) {
    return null;
  }

  try {
    // Get user actions
    const { data: actions, error } = await supabase
      .from('user_actions')
      .select('*')
      .eq('user_id', userId)
      .gte('action_timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      throw new Error(`Failed to get actions: ${error.message}`);
    }

    if (!actions || actions.length === 0) {
      return null;
    }

    // Get events for these actions
    const eventIds = [...new Set(actions.map(a => a.event_id).filter(Boolean))];
    const { data: events } = await supabase
      .from('nucigen_events')
      .select('sector, region, event_type')
      .in('id', eventIds);

    // Calculate patterns
    const sectors = new Map<string, number>();
    const regions = new Map<string, number>();
    const eventTypes = new Map<string, number>();

    events?.forEach(event => {
      if (event.sector) sectors.set(event.sector, (sectors.get(event.sector) || 0) + 1);
      if (event.region) regions.set(event.region, (regions.get(event.region) || 0) + 1);
      if (event.event_type) eventTypes.set(event.event_type, (eventTypes.get(event.event_type) || 0) + 1);
    });

    const clicks = actions.filter(a => a.action_type === 'click').length;
    const reads = actions.filter(a => a.action_type === 'read').length;
    const shares = actions.filter(a => a.action_type === 'share').length;
    const totalTimeSpent = actions
      .filter(a => a.time_spent_seconds)
      .reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0);

    const engagementScore = calculateEngagementScore(actions);

    return {
      userId,
      preferredSectors: Array.from(sectors.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([sector]) => sector),
      preferredRegions: Array.from(regions.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([region]) => region),
      preferredEventTypes: Array.from(eventTypes.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([type]) => type),
      avgTimeSpent: reads > 0 ? totalTimeSpent / reads : 0,
      engagementScore,
      clickRate: actions.length > 0 ? clicks / actions.length : 0,
      shareRate: actions.length > 0 ? shares / actions.length : 0,
    };
  } catch (error: any) {
    console.error('[UserBehaviorLearner] Error getting behavior pattern:', error.message);
    return null;
  }
}

/**
 * Calculate engagement score from actions
 */
function calculateEngagementScore(actions: any[]): number {
  let score = 0;

  for (const action of actions) {
    switch (action.action_type) {
      case 'click':
        score += 1.0;
        break;
      case 'view':
        score += 1.5;
        break;
      case 'read':
        score += 2.0;
        break;
      case 'share':
        score += 3.0;
        break;
      case 'bookmark':
        score += 2.5;
        break;
      case 'feedback_positive':
        score += 3.0;
        break;
      case 'ignore':
        score -= 0.5;
        break;
      case 'feedback_negative':
        score -= 1.0;
        break;
    }
  }

  // Normalize to 0-1
  return Math.min(1.0, Math.max(0.0, score / (actions.length * 3)));
}

/**
 * Get user action history for RL training
 */
export async function getUserActionHistory(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc('aggregate_user_actions_for_rl', {
      p_user_id: userId,
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString(),
    });

    if (error) {
      throw new Error(`Failed to get action history: ${error.message}`);
    }

    return data || [];
  } catch (error: any) {
    console.error('[UserBehaviorLearner] Error getting action history:', error.message);
    return [];
  }
}
