/**
 * PHASE 7: Recommendation Engine
 * 
 * Generates proactive recommendations for users based on events and their preferences
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface UserPreferences {
  preferred_sectors?: string[];
  preferred_regions?: string[];
  preferred_event_types?: string[];
  focus_areas?: string[];
  min_impact_score?: number;
  min_confidence_score?: number;
}

interface Event {
  id: string;
  summary: string;
  event_type: string;
  sector: string | null;
  region: string | null;
  impact_score: number | null;
  confidence: number | null;
}

interface Recommendation {
  event_id: string;
  recommendation_type: 'monitor' | 'prepare' | 'act' | 'investigate' | 'mitigate' | 'capitalize';
  action: string;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  deadline?: string;
  urgency_score: number;
  impact_potential: number;
}

/**
 * Generate recommendations for a user based on an event
 */
export function generateRecommendations(
  event: Event,
  userPreferences: UserPreferences,
  scenarios: any[] = [],
  historicalComparisons: any[] = []
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Check if event matches user preferences
  const matchesSector = !userPreferences.preferred_sectors || 
    userPreferences.preferred_sectors.length === 0 ||
    (event.sector && userPreferences.preferred_sectors.includes(event.sector));
  
  const matchesRegion = !userPreferences.preferred_regions || 
    userPreferences.preferred_regions.length === 0 ||
    (event.region && userPreferences.preferred_regions.includes(event.region));
  
  const matchesEventType = !userPreferences.preferred_event_types || 
    userPreferences.preferred_event_types.length === 0 ||
    userPreferences.preferred_event_types.includes(event.event_type);

  const matchesThresholds = 
    (!userPreferences.min_impact_score || (event.impact_score || 0) >= userPreferences.min_impact_score) &&
    (!userPreferences.min_confidence_score || (event.confidence || 0) >= userPreferences.min_confidence_score);

  if (!matchesSector && !matchesRegion && !matchesEventType) {
    return []; // Event doesn't match user preferences
  }

  if (!matchesThresholds) {
    return []; // Event doesn't meet thresholds
  }

  // Calculate urgency and impact
  const impactScore = event.impact_score || 0;
  const confidenceScore = event.confidence || 0;
  const urgencyScore = impactScore * confidenceScore;
  const impactPotential = impactScore;

  // Determine priority
  let priority: 'high' | 'medium' | 'low' = 'medium';
  if (urgencyScore >= 0.7) priority = 'high';
  else if (urgencyScore < 0.4) priority = 'low';

  // Generate recommendations based on event type and impact
  if (impactScore >= 0.8) {
    // High impact - recommend action
    recommendations.push({
      event_id: event.id,
      recommendation_type: 'act',
      action: `Take immediate action to address the impact of: ${event.summary.substring(0, 100)}`,
      priority: 'high',
      reasoning: `This event has high impact (${(impactScore * 100).toFixed(0)}%) and requires immediate attention.`,
      urgency_score: urgencyScore,
      impact_potential: impactPotential,
    });
  } else if (impactScore >= 0.6) {
    // Medium-high impact - recommend preparation
    recommendations.push({
      event_id: event.id,
      recommendation_type: 'prepare',
      action: `Prepare for potential impacts from: ${event.summary.substring(0, 100)}`,
      priority: priority,
      reasoning: `This event has significant impact potential. Early preparation can mitigate risks.`,
      urgency_score: urgencyScore,
      impact_potential: impactPotential,
    });
  } else {
    // Lower impact - recommend monitoring
    recommendations.push({
      event_id: event.id,
      recommendation_type: 'monitor',
      action: `Monitor developments related to: ${event.summary.substring(0, 100)}`,
      priority: 'medium',
      reasoning: `This event may have evolving impacts. Regular monitoring is recommended.`,
      urgency_score: urgencyScore,
      impact_potential: impactPotential,
    });
  }

  // Add scenario-based recommendations
  if (scenarios.length > 0) {
    const pessimisticScenarios = scenarios.filter(s => s.scenario_type === 'pessimistic' && s.probability > 0.3);
    if (pessimisticScenarios.length > 0) {
      recommendations.push({
        event_id: event.id,
        recommendation_type: 'mitigate',
        action: `Develop mitigation strategies for pessimistic scenarios`,
        priority: 'high',
        reasoning: `Pessimistic scenarios have ${(pessimisticScenarios[0].probability * 100).toFixed(0)}% probability. Risk mitigation is critical.`,
        urgency_score: urgencyScore * 0.8,
        impact_potential: impactPotential,
      });
    }

    const optimisticScenarios = scenarios.filter(s => s.scenario_type === 'optimistic' && s.probability > 0.3);
    if (optimisticScenarios.length > 0) {
      recommendations.push({
        event_id: event.id,
        recommendation_type: 'capitalize',
        action: `Identify opportunities from optimistic scenarios`,
        priority: 'medium',
        reasoning: `Optimistic scenarios present opportunities. Early positioning can maximize benefits.`,
        urgency_score: urgencyScore * 0.6,
        impact_potential: impactPotential,
      });
    }
  }

  // Add historical comparison-based recommendations
  if (historicalComparisons.length > 0) {
    const topComparison = historicalComparisons[0];
    if (topComparison.lessons_learned) {
      recommendations.push({
        event_id: event.id,
        recommendation_type: 'investigate',
        action: `Review historical precedent: ${topComparison.lessons_learned.substring(0, 100)}`,
        priority: 'medium',
        reasoning: `A similar historical event provides valuable lessons. Investigation recommended.`,
        urgency_score: urgencyScore * 0.7,
        impact_potential: impactPotential,
      });
    }
  }

  return recommendations;
}

/**
 * Process recommendations for a user
 */
export async function processUserRecommendations(userId: string): Promise<number> {
  try {
    // Get user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!preferences) {
      console.log(`No preferences found for user ${userId}`);
      return 0;
    }

    // Get recent high-impact events
    const { data: events, error: eventsError } = await supabase
      .from('nucigen_events')
      .select('*')
      .gte('impact_score', preferences.min_impact_score || 0.5)
      .gte('confidence', preferences.min_confidence_score || 0.6)
      .order('created_at', { ascending: false })
      .limit(20);

    if (eventsError) {
      throw new Error(`Failed to fetch events: ${eventsError.message}`);
    }

    if (!events || events.length === 0) {
      console.log(`No matching events found for user ${userId}`);
      return 0;
    }

    let totalCreated = 0;

    for (const event of events) {
      // Get scenarios for this event
      const { data: scenarios } = await supabase
        .from('scenario_predictions')
        .select('*')
        .eq('nucigen_event_id', event.id)
        .limit(5);

      // Get historical comparisons
      const { data: historicalComparisons } = await supabase
        .from('historical_comparisons')
        .select('*')
        .eq('current_event_id', event.id)
        .order('similarity_score', { ascending: false })
        .limit(3);

      // Generate recommendations
      const recommendations = generateRecommendations(
        event as Event,
        preferences as UserPreferences,
        scenarios || [],
        historicalComparisons || []
      );

      if (recommendations.length === 0) continue;

      // Insert recommendations
      const recommendationsToInsert = recommendations.map(rec => ({
        user_id: userId,
        event_id: rec.event_id,
        recommendation_type: rec.recommendation_type,
        action: rec.action,
        priority: rec.priority,
        reasoning: rec.reasoning,
        deadline: rec.deadline ? new Date(rec.deadline).toISOString() : null,
        urgency_score: rec.urgency_score,
        impact_potential: rec.impact_potential,
        status: 'pending',
      }));

      const { error: insertError } = await supabase
        .from('recommendations')
        .upsert(recommendationsToInsert, {
          onConflict: 'user_id,event_id,recommendation_type',
        });

      if (insertError) {
        console.error(`Failed to insert recommendations for event ${event.id}:`, insertError);
        continue;
      }

      totalCreated += recommendations.length;
    }

    console.log(`✅ Generated ${totalCreated} recommendations for user ${userId}`);
    return totalCreated;
  } catch (error: any) {
    console.error(`❌ Error processing recommendations for ${userId}:`, error);
    throw error;
  }
}

/**
 * Process recommendations for all users
 */
export async function processAllRecommendations(): Promise<{ processed: number; created: number; errors: string[] }> {
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(100); // Process up to 100 users

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    if (!users || users.length === 0) {
      console.log('No users found');
      return { processed: 0, created: 0, errors: [] };
    }

    let totalCreated = 0;
    const errors: string[] = [];

    for (const user of users) {
      try {
        const count = await processUserRecommendations(user.id);
        totalCreated += count;
      } catch (error: any) {
        errors.push(`User ${user.id}: ${error.message}`);
      }
    }

    console.log(`✅ Processed ${users.length} users, created ${totalCreated} recommendations`);
    return {
      processed: users.length,
      created: totalCreated,
      errors,
    };
  } catch (error: any) {
    console.error('❌ Error processing all recommendations:', error);
    throw error;
  }
}

// Direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const userId = process.argv[2];
  
  if (userId) {
    processUserRecommendations(userId)
      .then(count => {
        console.log(`✅ Generated ${count} recommendations`);
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
      });
  } else {
    processAllRecommendations()
      .then(result => {
        console.log(`✅ Processed ${result.processed} users, created ${result.created} recommendations`);
        if (result.errors.length > 0) {
          console.error('Errors:', result.errors);
        }
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
      });
  }
}

