/**
 * Query Optimizer
 * 
 * ML-based optimization of Tavily queries to improve result quality.
 * Learns from past query results and user engagement to suggest better queries.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { extractQueryFeatures, QueryFeatures, saveFeaturesToStore, getFeaturesFromStore } from './feature-extractor';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[QueryOptimizer] Supabase not configured. Query optimization will be limited.');
}

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

export interface QueryOptimizationResult {
  originalQuery: string;
  optimizedQuery: string;
  qualityScore: number; // Predicted quality (0-1)
  confidence: number; // Confidence in optimization (0-1)
  improvements: string[]; // What was improved
  reasoning?: string;
}

export interface QueryQualityMetrics {
  query: string;
  resultCount: number;
  avgRelevanceScore: number; // Average relevance of results
  userEngagementRate: number; // How many results users engaged with
  diversityScore: number; // How diverse the results are
  recencyScore: number; // How recent the results are
}

/**
 * Optimize a query using ML model or heuristics
 */
export async function optimizeQuery(
  originalQuery: string,
  context?: {
    userSectors?: string[];
    userRegions?: string[];
    userEventTypes?: string[];
  }
): Promise<QueryOptimizationResult> {
  // Extract features from query
  const queryFeatures = extractQueryFeatures(originalQuery);

  // Try to get cached optimization
  const cached = await getFeaturesFromStore('query', originalQuery);
  if (cached && cached.optimizedQuery) {
    return {
      originalQuery,
      optimizedQuery: cached.optimizedQuery,
      qualityScore: cached.qualityScore || 0.7,
      confidence: 0.8,
      improvements: cached.improvements || [],
      reasoning: 'Cached optimization',
    };
  }

  // Try ML model
  const model = await getActiveQueryOptimizerModel();
  if (model) {
    try {
      const optimization = optimizeWithModel(model, originalQuery, queryFeatures, context);
      // Cache result
      await saveFeaturesToStore('query', originalQuery, {
        ...queryFeatures,
        optimizedQuery: optimization.optimizedQuery,
        qualityScore: optimization.qualityScore,
        improvements: optimization.improvements,
      });
      return optimization;
    } catch (error: any) {
      console.warn('[QueryOptimizer] ML optimization failed, using heuristics:', error.message);
    }
  }

  // Fallback: Heuristic optimization
  return optimizeWithHeuristics(originalQuery, queryFeatures, context);
}

/**
 * Get active query optimizer model
 */
async function getActiveQueryOptimizerModel(): Promise<any | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc('get_active_ml_model', {
      p_model_name: 'query_optimizer',
    });

    if (error) {
      console.error('[QueryOptimizer] RPC error:', error.message);
      return null;
    }

    // RPC returns TABLE, so data is an array
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return null;
    }

    // Return first row if array, or data directly if single object
    return Array.isArray(data) ? data[0] : data;
  } catch (error: any) {
    console.error('[QueryOptimizer] Error fetching model:', error.message);
    return null;
  }
}

/**
 * Optimize query using ML model
 */
function optimizeWithModel(
  model: any,
  originalQuery: string,
  features: QueryFeatures,
  context?: any
): QueryOptimizationResult {
  let optimizedQuery = originalQuery;
  const improvements: string[] = [];

  // Add context-based improvements
  if (context) {
    if (context.userSectors && context.userSectors.length > 0 && !features.query_has_sector) {
      optimizedQuery += ` ${context.userSectors[0]} industry`;
      improvements.push('Added sector context');
    }

    if (context.userRegions && context.userRegions.length > 0 && !features.query_has_region) {
      optimizedQuery += ` ${context.userRegions[0]}`;
      improvements.push('Added region context');
    }

    if (context.userEventTypes && context.userEventTypes.length > 0 && !features.query_has_event_type) {
      optimizedQuery += ` ${context.userEventTypes[0]} events`;
      improvements.push('Added event type context');
    }
  }

  // Add temporal indicator if missing
  if (!features.query_has_temporal_indicator) {
    optimizedQuery += ' recent 2025';
    improvements.push('Added temporal context');
  }

  // Remove redundant words and improve structure
  optimizedQuery = cleanQuery(optimizedQuery);

  // Predict quality score (placeholder - would use actual ML model)
  const qualityScore = predictQueryQuality(optimizedQuery, features);

  return {
    originalQuery,
    optimizedQuery,
    qualityScore,
    confidence: 0.8,
    improvements,
    reasoning: `ML model optimization (v${model.version})`,
  };
}

/**
 * Optimize query using heuristics
 */
function optimizeWithHeuristics(
  originalQuery: string,
  features: QueryFeatures,
  context?: any
): QueryOptimizationResult {
  let optimizedQuery = originalQuery;
  const improvements: string[] = [];

  // Add missing context
  if (context) {
    if (context.userSectors && !features.query_has_sector) {
      optimizedQuery += ` ${context.userSectors[0]}`;
      improvements.push('Added sector');
    }

    if (context.userRegions && !features.query_has_region) {
      optimizedQuery += ` ${context.userRegions[0]}`;
      improvements.push('Added region');
    }
  }

  // Add temporal indicator
  if (!features.query_has_temporal_indicator) {
    optimizedQuery += ' recent';
    improvements.push('Added temporal indicator');
  }

  // Clean and optimize
  optimizedQuery = cleanQuery(optimizedQuery);

  const qualityScore = predictQueryQuality(optimizedQuery, features);

  return {
    originalQuery,
    optimizedQuery,
    qualityScore,
    confidence: 0.6,
    improvements,
    reasoning: 'Heuristic optimization',
  };
}

/**
 * Clean and optimize query string
 */
function cleanQuery(query: string): string {
  // Remove extra spaces
  let cleaned = query.replace(/\s+/g, ' ').trim();

  // Remove common stop words that don't help search
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with'];
  const words = cleaned.split(' ');
  const filtered = words.filter(word => !stopWords.includes(word.toLowerCase()));
  cleaned = filtered.join(' ');

  return cleaned;
}

/**
 * Predict query quality (placeholder - would use ML model)
 */
function predictQueryQuality(query: string, features: QueryFeatures): number {
  let score = 0.5; // Base score

  // Query length (optimal: 5-15 words)
  const wordCount = query.split(/\s+/).length;
  if (wordCount >= 5 && wordCount <= 15) {
    score += 0.2;
  } else if (wordCount < 3) {
    score -= 0.2; // Too short
  } else if (wordCount > 20) {
    score -= 0.1; // Too long
  }

  // Has sector or region
  if (features.query_has_sector || features.query_has_region) {
    score += 0.15;
  }

  // Has temporal indicator
  if (features.query_has_temporal_indicator) {
    score += 0.1;
  }

  // Has event type
  if (features.query_has_event_type) {
    score += 0.1;
  }

  return Math.min(1.0, Math.max(0.0, score));
}

/**
 * Record query quality metrics for learning
 */
export async function recordQueryQuality(
  query: string,
  metrics: QueryQualityMetrics
): Promise<boolean> {
  if (!supabase) return false;

  try {
    // Store metrics for future model training
    // This would be used to train the query optimizer model
    const { error } = await supabase
      .from('ml_features')
      .upsert({
        entity_type: 'query',
        entity_id: query,
        all_features: {
          ...metrics,
          query_features: extractQueryFeatures(query),
        },
      }, {
        onConflict: 'entity_type,entity_id',
      });

    if (error) {
      console.error('[QueryOptimizer] Error recording metrics:', error.message);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('[QueryOptimizer] Error recording metrics:', error.message);
    return false;
  }
}

/**
 * Batch optimize multiple queries
 */
export async function batchOptimizeQueries(
  queries: string[],
  context?: any
): Promise<Map<string, QueryOptimizationResult>> {
  const results = new Map<string, QueryOptimizationResult>();

  // Process in batches
  const batchSize = 10;
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (query) => {
        const optimization = await optimizeQuery(query, context);
        return { query, optimization };
      })
    );

    batchResults.forEach(({ query, optimization }) => {
      results.set(query, optimization);
    });
  }

  return results;
}

/**
 * Train query optimizer model (placeholder)
 */
export async function trainQueryOptimizerModel(): Promise<{ success: boolean; modelVersion?: number; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    console.log('[QueryOptimizer] Starting model training...');

    // Fetch training data: queries with quality metrics
    const { data: trainingData, error } = await supabase
      .from('ml_features')
      .select('*')
      .eq('entity_type', 'query')
      .not('all_features->>avgRelevanceScore', 'is', null)
      .limit(5000);

    if (error) {
      throw new Error(`Failed to fetch training data: ${error.message}`);
    }

    if (!trainingData || trainingData.length < 100) {
      return { success: false, error: 'Insufficient training data (need at least 100 samples)' };
    }

    console.log(`[QueryOptimizer] Fetched ${trainingData.length} training samples`);

    // Get next version
    const { data: existingModel } = await supabase
      .from('ml_models')
      .select('version')
      .eq('model_name', 'query_optimizer')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const newVersion = (existingModel?.version || 0) + 1;

    // Save model (placeholder)
    const { error: insertError } = await supabase
      .from('ml_models')
      .insert({
        model_name: 'query_optimizer',
        model_type: 'regression',
        algorithm: 'gradient_boosting',
        version: newVersion,
        model_data: {
          type: 'gradient_boosting',
          n_estimators: 100,
        },
        feature_names: [
          'query_length',
          'query_keyword_count',
          'query_has_sector',
          'query_has_region',
          'query_has_temporal_indicator',
          'query_has_event_type',
        ],
        training_samples_count: trainingData.length,
        is_active: false,
        is_production: false,
        description: `Query optimizer v${newVersion} - Placeholder for ML training`,
      });

    if (insertError) {
      throw new Error(`Failed to save model: ${insertError.message}`);
    }

    console.log(`[QueryOptimizer] Model training complete (v${newVersion}) - Placeholder`);

    return {
      success: true,
      modelVersion: newVersion,
    };
  } catch (error: any) {
    console.error('[QueryOptimizer] Training error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
