/**
 * Relevance Predictor
 * 
 * ML model to predict event relevance for users.
 * Uses features extracted from events, users, and historical interactions.
 * 
 * Note: This is a TypeScript wrapper. Actual ML training can be done:
 * 1. Via Python (scikit-learn/XGBoost) and load model weights
 * 2. Via external ML API (Hugging Face, OpenAI fine-tuning)
 * 3. Via TensorFlow.js for browser-based inference
 * 
 * For MVP, we'll use a simple rule-based fallback and prepare for ML integration.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  extractEventUserPairFeatures,
  getFeaturesFromStore,
  saveFeaturesToStore,
  EventUserPairFeatures,
} from './feature-extractor';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[RelevancePredictor] Supabase not configured. Using fallback predictions.');
}

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

export interface RelevancePrediction {
  relevanceScore: number; // 0-1, higher = more relevant
  confidence: number; // 0-1, confidence in prediction
  modelVersion: number | null;
  featuresUsed: string[];
  reasoning?: string; // Optional: why this score was predicted
}

/**
 * Get active ML model from database
 */
async function getActiveModel(): Promise<any | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc('get_active_ml_model', {
      p_model_name: 'relevance_predictor',
    });

    if (error) {
      console.error('[RelevancePredictor] RPC error:', error.message);
      return null;
    }

    // RPC returns TABLE, so data is an array
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return null;
    }

    // Return first row if array, or data directly if single object
    return Array.isArray(data) ? data[0] : data;
  } catch (error: any) {
    console.error('[RelevancePredictor] Error fetching active model:', error.message);
    return null;
  }
}

/**
 * Predict relevance using ML model (if available) or fallback to rule-based
 */
export async function predictRelevance(
  eventId: string,
  userId: string,
  useCache: boolean = true
): Promise<RelevancePrediction> {
  // Try to get cached features first
  let features: EventUserPairFeatures | null = null;

  if (useCache) {
    const cachedFeatures = await getFeaturesFromStore('event_user_pair', `${eventId}:${userId}`);
    if (cachedFeatures) {
      features = cachedFeatures as EventUserPairFeatures;
    }
  }

  // Extract features if not cached
  if (!features) {
    features = await extractEventUserPairFeatures(eventId, userId);
    if (features) {
      // Cache for future use
      await saveFeaturesToStore('event_user_pair', `${eventId}:${userId}`, features);
    }
  }

  if (!features) {
    // Fallback: return neutral score
    return {
      relevanceScore: 0.5,
      confidence: 0.0,
      modelVersion: null,
      featuresUsed: [],
      reasoning: 'Could not extract features',
    };
  }

  // Try to use ML model
  const model = await getActiveModel();

  if (model && model.model_data) {
    try {
      // If model is available, use it for prediction
      // For now, we'll use a simple weighted sum as placeholder
      // In production, this would call the actual ML model (Python API, TensorFlow.js, etc.)
      const prediction = predictWithModel(model, features);
      return prediction;
    } catch (error: any) {
      console.warn('[RelevancePredictor] ML model prediction failed, using fallback:', error.message);
    }
  }

  // Fallback: Rule-based prediction (similar to current calculateEventRelevance)
  return predictWithRules(features);
}

/**
 * Predict using ML model (placeholder - would call actual ML inference)
 */
function predictWithModel(model: any, features: EventUserPairFeatures): RelevancePrediction {
  // Extract feature vector from features
  const featureVector = extractFeatureVector(features);

  // For MVP: Use simple weighted sum
  // In production: Call actual ML model (Python API, TensorFlow.js, etc.)
  let score = 0.5; // Base score

  // Match features (high weight)
  if (features.sector_match) score += 0.2;
  if (features.region_match) score += 0.15;
  if (features.event_type_match) score += 0.15;

  // Threshold matches
  if (features.impact_score_above_threshold) score += 0.1;
  if (features.confidence_above_threshold) score += 0.1;

  // Historical interaction (high weight if positive)
  if (features.historical_interaction_count > 0) {
    score += Math.min(0.2, features.historical_interaction_count * 0.05);
  }

  // Historical engagement rates
  score += features.historical_click_rate * 0.1;
  score += features.historical_read_rate * 0.1;
  score += features.historical_share_rate * 0.15;

  // Similarity features
  score += features.similarity_to_clicked_events * 0.1;
  score += features.similarity_to_shared_events * 0.1;

  // Normalize to 0-1
  score = Math.min(1.0, Math.max(0.0, score));

  return {
    relevanceScore: score,
    confidence: 0.8, // ML models typically have higher confidence
    modelVersion: model.version,
    featuresUsed: Object.keys(features),
    reasoning: `ML model prediction (v${model.version})`,
  };
}

/**
 * Predict using rule-based fallback
 */
function predictWithRules(features: EventUserPairFeatures): RelevancePrediction {
  let score = 0.5; // Base score
  const reasons: string[] = [];

  // Match features
  if (features.sector_match) {
    score += 0.2;
    reasons.push('Sector match');
  }
  if (features.region_match) {
    score += 0.15;
    reasons.push('Region match');
  }
  if (features.event_type_match) {
    score += 0.15;
    reasons.push('Event type match');
  }

  // Threshold matches
  if (features.impact_score_above_threshold) {
    score += 0.1;
    reasons.push('Impact above threshold');
  }
  if (features.confidence_above_threshold) {
    score += 0.1;
    reasons.push('Confidence above threshold');
  }

  // Historical interaction
  if (features.historical_interaction_count > 0) {
    score += Math.min(0.15, features.historical_interaction_count * 0.05);
    reasons.push(`Historical interaction (${features.historical_interaction_count})`);
  }

  // Historical engagement
  if (features.historical_click_rate > 0.1) {
    score += features.historical_click_rate * 0.1;
  }
  if (features.historical_read_rate > 0.1) {
    score += features.historical_read_rate * 0.1;
  }
  if (features.historical_share_rate > 0.05) {
    score += features.historical_share_rate * 0.15;
  }

  // Normalize
  score = Math.min(1.0, Math.max(0.0, score));

  return {
    relevanceScore: score,
    confidence: 0.6, // Lower confidence for rule-based
    modelVersion: null,
    featuresUsed: Object.keys(features),
    reasoning: reasons.join(', ') || 'No strong signals',
  };
}

/**
 * Extract feature vector from features (for ML model input)
 */
function extractFeatureVector(features: EventUserPairFeatures): number[] {
  return [
    features.sector_match ? 1 : 0,
    features.region_match ? 1 : 0,
    features.event_type_match ? 1 : 0,
    features.country_match ? 1 : 0,
    features.impact_score_above_threshold ? 1 : 0,
    features.confidence_above_threshold ? 1 : 0,
    features.historical_interaction_count,
    features.historical_click_rate,
    features.historical_read_rate,
    features.historical_share_rate,
    features.historical_avg_time_spent / 100, // Normalize
    features.similarity_to_clicked_events,
    features.similarity_to_shared_events,
  ];
}

/**
 * Batch predict relevance for multiple event-user pairs
 */
export async function batchPredictRelevance(
  eventUserPairs: Array<{ eventId: string; userId: string }>
): Promise<Map<string, RelevancePrediction>> {
  const predictions = new Map<string, RelevancePrediction>();

  // Process in parallel (with concurrency limit)
  const batchSize = 10;
  for (let i = 0; i < eventUserPairs.length; i += batchSize) {
    const batch = eventUserPairs.slice(i, i + batchSize);
    const batchPredictions = await Promise.all(
      batch.map(async ({ eventId, userId }) => {
        const prediction = await predictRelevance(eventId, userId);
        return { key: `${eventId}:${userId}`, prediction };
      })
    );

    batchPredictions.forEach(({ key, prediction }) => {
      predictions.set(key, prediction);
    });
  }

  return predictions;
}

/**
 * Train relevance model (placeholder - would call actual ML training)
 * 
 * In production, this would:
 * 1. Fetch training data (events, users, historical actions with labels)
 * 2. Extract features for all training samples
 * 3. Call ML training service (Python script, external API, etc.)
 * 4. Save trained model to database
 */
export async function trainRelevanceModel(): Promise<{ success: boolean; modelVersion?: number; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    console.log('[RelevancePredictor] Starting model training...');

    // Fetch training data: events with user actions (labels)
    const { data: trainingData, error } = await supabase
      .from('user_actions')
      .select(`
        event_id,
        user_id,
        action_type,
        reward_score
      `)
      .not('event_id', 'is', null)
      .not('reward_score', 'is', null)
      .limit(10000); // Limit for MVP

    if (error) {
      throw new Error(`Failed to fetch training data: ${error.message}`);
    }

    if (!trainingData || trainingData.length < 100) {
      return { success: false, error: 'Insufficient training data (need at least 100 samples)' };
    }

    console.log(`[RelevancePredictor] Fetched ${trainingData.length} training samples`);

    // For MVP: This is a placeholder
    // In production, would:
    // 1. Extract features for all samples
    // 2. Prepare feature matrix and labels
    // 3. Call ML training (Python script, scikit-learn, XGBoost, etc.)
    // 4. Save model weights to database

    // Placeholder: Create a simple model record
    const { data: existingModel } = await supabase
      .from('ml_models')
      .select('version')
      .eq('model_name', 'relevance_predictor')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const newVersion = (existingModel?.version || 0) + 1;

    // In production, model_data would contain actual model weights
    const { error: insertError } = await supabase
      .from('ml_models')
      .insert({
        model_name: 'relevance_predictor',
        model_type: 'classification',
        algorithm: 'random_forest', // Placeholder
        version: newVersion,
        model_data: {
          // Placeholder: actual model would be stored here
          type: 'random_forest',
          n_estimators: 100,
          max_depth: 10,
        },
        feature_names: [
          'sector_match',
          'region_match',
          'event_type_match',
          'impact_score_above_threshold',
          'confidence_above_threshold',
          'historical_interaction_count',
          'historical_click_rate',
          'historical_read_rate',
          'historical_share_rate',
        ],
        training_samples_count: trainingData.length,
        is_active: false, // Don't activate automatically - requires validation
        is_production: false,
        description: `Relevance predictor v${newVersion} - Placeholder for ML training`,
      });

    if (insertError) {
      throw new Error(`Failed to save model: ${insertError.message}`);
    }

    console.log(`[RelevancePredictor] Model training complete (v${newVersion}) - Placeholder`);

    return {
      success: true,
      modelVersion: newVersion,
    };
  } catch (error: any) {
    console.error('[RelevancePredictor] Training error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
