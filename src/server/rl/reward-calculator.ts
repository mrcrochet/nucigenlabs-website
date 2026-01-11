/**
 * Reward Calculator
 * 
 * Calculates rewards for reinforcement learning based on user actions.
 * Rewards are used to train recommendation policies.
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
  console.warn('[RewardCalculator] Supabase not configured.');
}

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

export interface Reward {
  userId: string;
  eventId: string;
  reward: number; // 0-1, higher = better
  actionType: string;
  timestamp: Date;
  reasoning?: string;
}

// Reward weights for different actions
const REWARD_WEIGHTS: Record<string, number> = {
  click: 0.3,
  view: 0.4,
  read: 0.6,
  share: 0.9,
  bookmark: 0.8,
  feedback_positive: 1.0,
  alert_created: 0.7,
  deep_dive: 0.8,
  ignore: -0.3,
  feedback_negative: -0.8,
};

/**
 * Calculate reward for a user action
 */
export function calculateReward(actionType: string, timeSpentSeconds?: number, scrollDepth?: number): number {
  let reward = REWARD_WEIGHTS[actionType] || 0;

  // Boost reward for longer engagement
  if (timeSpentSeconds) {
    const timeBonus = Math.min(0.2, timeSpentSeconds / 300); // Max 5 minutes = 0.2 bonus
    reward += timeBonus;
  }

  // Boost reward for deeper scroll
  if (scrollDepth) {
    const scrollBonus = scrollDepth * 0.1; // Up to 0.1 bonus
    reward += scrollBonus;
  }

  // Normalize to 0-1
  return Math.min(1.0, Math.max(-1.0, reward));
}

/**
 * Calculate and store reward for a user action
 */
export async function calculateAndStoreReward(
  userId: string,
  eventId: string,
  actionType: string,
  timeSpentSeconds?: number,
  scrollDepth?: number
): Promise<Reward | null> {
  if (!supabase) {
    return null;
  }

  const reward = calculateReward(actionType, timeSpentSeconds, scrollDepth);

  try {
    // Update reward in user_actions table
    const { error } = await supabase
      .from('user_actions')
      .update({
        reward_score: reward,
        reward_calculated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .eq('action_type', actionType)
      .order('action_timestamp', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[RewardCalculator] Error storing reward:', error.message);
      return null;
    }

    return {
      userId,
      eventId,
      reward,
      actionType,
      timestamp: new Date(),
      reasoning: `Reward calculated from ${actionType} action`,
    };
  } catch (error: any) {
    console.error('[RewardCalculator] Error storing reward:', error.message);
    return null;
  }
}

/**
 * Get average reward for a user
 */
export async function getAverageReward(userId: string, days: number = 30): Promise<number> {
  if (!supabase) {
    return 0;
  }

  try {
    const { data, error } = await supabase
      .from('user_actions')
      .select('reward_score')
      .eq('user_id', userId)
      .not('reward_score', 'is', null)
      .gte('action_timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      throw new Error(`Failed to get rewards: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return 0.5; // Neutral reward if no data
    }

    const avgReward = data.reduce((sum, a) => sum + (a.reward_score || 0), 0) / data.length;
    return avgReward;
  } catch (error: any) {
    console.error('[RewardCalculator] Error getting average reward:', error.message);
    return 0;
  }
}

/**
 * Get reward distribution for analysis
 */
export async function getRewardDistribution(userId: string, days: number = 30): Promise<{
  positive: number;
  neutral: number;
  negative: number;
  average: number;
}> {
  if (!supabase) {
    return { positive: 0, neutral: 0, negative: 0, average: 0 };
  }

  try {
    const { data, error } = await supabase
      .from('user_actions')
      .select('reward_score')
      .eq('user_id', userId)
      .not('reward_score', 'is', null)
      .gte('action_timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (error || !data || data.length === 0) {
      return { positive: 0, neutral: 0, negative: 0, average: 0 };
    }

    const rewards = data.map(a => a.reward_score || 0);
    const positive = rewards.filter(r => r > 0.3).length;
    const neutral = rewards.filter(r => r >= -0.3 && r <= 0.3).length;
    const negative = rewards.filter(r => r < -0.3).length;
    const average = rewards.reduce((sum, r) => sum + r, 0) / rewards.length;

    return {
      positive,
      neutral,
      negative,
      average,
    };
  } catch (error: any) {
    console.error('[RewardCalculator] Error getting reward distribution:', error.message);
    return { positive: 0, neutral: 0, negative: 0, average: 0 };
  }
}
