/**
 * Recommendation Policy (Reinforcement Learning)
 * 
 * Optimizes recommendation policy using Q-learning or Policy Gradient.
 * Learns from user actions to improve recommendations over time.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getAverageReward, getRewardDistribution } from './reward-calculator';
import { getUserBehaviorPattern } from './user-behavior-learner';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[RecommendationPolicy] Supabase not configured.');
}

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

export interface RecommendationState {
  userId: string;
  userPreferences: any;
  behaviorPattern: any;
  context: {
    timeOfDay: string;
    dayOfWeek: string;
    recentEvents: string[];
  };
}

export interface RecommendationAction {
  eventIds: string[];
  order: 'relevance' | 'recency' | 'impact' | 'mixed';
  limit: number;
}

export interface PolicyEvaluation {
  state: RecommendationState;
  action: RecommendationAction;
  expectedReward: number;
  confidence: number;
}

/**
 * Q-Learning based recommendation policy
 * (Simplified implementation - full RL would require more sophisticated state-action space)
 */
export async function selectRecommendationAction(
  state: RecommendationState,
  algorithm: 'q_learning' | 'policy_gradient' = 'q_learning'
): Promise<RecommendationAction> {
  // Get user behavior pattern
  const behaviorPattern = await getUserBehaviorPattern(state.userId);

  // Get average reward to understand user satisfaction
  const avgReward = await getAverageReward(state.userId);

  // Select action based on policy
  if (algorithm === 'q_learning') {
    return selectActionQLearning(state, behaviorPattern, avgReward);
  } else {
    return selectActionPolicyGradient(state, behaviorPattern, avgReward);
  }
}

/**
 * Q-Learning action selection
 */
function selectActionQLearning(
  state: RecommendationState,
  behaviorPattern: any,
  avgReward: number
): RecommendationAction {
  // Simplified Q-learning: select action with highest expected reward
  // In production, would use actual Q-table or neural network

  // Determine order strategy based on user behavior
  let order: 'relevance' | 'recency' | 'impact' | 'mixed' = 'mixed';

  if (behaviorPattern) {
    if (behaviorPattern.engagementScore > 0.7) {
      // High engagement: prioritize relevance
      order = 'relevance';
    } else if (behaviorPattern.clickRate > 0.5) {
      // High click rate: mix relevance and recency
      order = 'mixed';
    } else {
      // Low engagement: try recency to catch attention
      order = 'recency';
    }
  }

  // Determine limit based on engagement
  const limit = avgReward > 0.6 ? 20 : 10; // More recommendations for engaged users

  return {
    eventIds: [], // Will be filled by recommendation engine
    order,
    limit,
  };
}

/**
 * Policy Gradient action selection
 */
function selectActionPolicyGradient(
  state: RecommendationState,
  behaviorPattern: any,
  avgReward: number
): RecommendationAction {
  // Simplified policy gradient: sample from policy distribution
  // In production, would use neural network policy

  // Similar to Q-learning but with probabilistic selection
  const strategies = ['relevance', 'recency', 'impact', 'mixed'];
  const weights = [0.4, 0.2, 0.2, 0.2]; // Favor relevance

  // Adjust weights based on behavior
  if (behaviorPattern?.engagementScore > 0.7) {
    weights[0] = 0.6; // More weight on relevance
  }

  // Sample from distribution
  const random = Math.random();
  let cumulative = 0;
  let selectedOrder: 'relevance' | 'recency' | 'impact' | 'mixed' = 'mixed';

  for (let i = 0; i < strategies.length; i++) {
    cumulative += weights[i];
    if (random <= cumulative) {
      selectedOrder = strategies[i] as any;
      break;
    }
  }

  return {
    eventIds: [],
    order: selectedOrder,
    limit: avgReward > 0.6 ? 20 : 10,
  };
}

/**
 * Evaluate policy performance
 */
export async function evaluatePolicy(userId: string): Promise<{
  averageReward: number;
  rewardDistribution: any;
  recommendation: 'improve' | 'maintain' | 'explore';
}> {
  const avgReward = await getAverageReward(userId);
  const distribution = await getRewardDistribution(userId);

  let recommendation: 'improve' | 'maintain' | 'explore' = 'maintain';

  if (avgReward < 0.4) {
    recommendation = 'improve';
  } else if (avgReward > 0.7 && distribution.positive > distribution.negative * 2) {
    recommendation = 'maintain';
  } else {
    recommendation = 'explore';
  }

  return {
    averageReward: avgReward,
    rewardDistribution: distribution,
    recommendation,
  };
}

/**
 * Update policy based on rewards (simplified - full RL would update Q-table or neural network)
 */
export async function updatePolicy(
  userId: string,
  state: RecommendationState,
  action: RecommendationAction,
  reward: number
): Promise<boolean> {
  // In production, this would update the Q-table or neural network weights
  // For now, just log the experience for future training

  if (!supabase) {
    return false;
  }

  try {
    // Store experience for offline training
    const { error } = await supabase
      .from('ml_features')
      .upsert({
        entity_type: 'query', // Reuse for RL experiences
        entity_id: `rl_experience:${userId}:${Date.now()}`,
        all_features: {
          user_id: userId,
          state: state,
          action: action,
          reward: reward,
          timestamp: new Date().toISOString(),
        },
      }, {
        onConflict: 'entity_type,entity_id',
      });

    if (error) {
      console.error('[RecommendationPolicy] Error storing experience:', error.message);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('[RecommendationPolicy] Error updating policy:', error.message);
    return false;
  }
}
