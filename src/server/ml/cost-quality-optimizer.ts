/**
 * Cost-Quality Optimizer
 * 
 * Optimizes API parameters (model, temperature, max_tokens) to balance cost and quality.
 * Uses ML to predict cost/quality trade-offs before making API calls.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getCacheEntry, setCacheEntry, CacheOptions } from '../services/cache-service';
import { getMetrics } from '../services/api-metrics';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[CostQualityOptimizer] Supabase not configured.');
}

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

export interface ApiConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  responseFormat?: 'json_object' | 'text';
}

export interface CostQualityPrediction {
  estimatedCost: number; // USD
  estimatedQuality: number; // 0-1
  estimatedLatency: number; // ms
  confidence: number; // 0-1
  recommendation: 'use' | 'optimize' | 'avoid';
  reasoning?: string;
}

export interface OptimizationResult {
  originalConfig: ApiConfig;
  optimizedConfig: ApiConfig;
  costSavings: number; // Percentage
  qualityImpact: number; // Percentage change (can be negative)
  latencyImpact: number; // Percentage change
  recommendation: 'adopt' | 'test' | 'reject';
}

// Model cost per 1K tokens (input/output)
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 0.0025, output: 0.01 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
};

// Task-specific model recommendations
const TASK_MODEL_MAP: Record<string, { recommended: string[]; fallback: string }> = {
  event_extraction: {
    recommended: ['gpt-4o', 'gpt-4o-mini'],
    fallback: 'gpt-4o-mini',
  },
  causal_chain: {
    recommended: ['gpt-4o', 'gpt-4-turbo'],
    fallback: 'gpt-4o',
  },
  scenario_prediction: {
    recommended: ['gpt-4o'],
    fallback: 'gpt-4o',
  },
  query_optimization: {
    recommended: ['gpt-4o-mini'],
    fallback: 'gpt-4o-mini',
  },
  data_extraction: {
    recommended: ['gpt-4o-mini'],
    fallback: 'gpt-4o-mini',
  },
};

/**
 * Predict cost and quality for an API configuration
 */
export async function predictCostQuality(
  taskType: string,
  promptLength: number,
  config: ApiConfig
): Promise<CostQualityPrediction> {
  // Check cache
  const cacheKey = `cost_quality:${taskType}:${config.model}:${config.temperature}:${promptLength}`;
  const cacheOptions: CacheOptions = {
    apiType: 'openai',
    endpoint: 'cost_quality',
  };
  const cached = await getCacheEntry<CostQualityPrediction>(cacheKey, cacheOptions);
  if (cached) {
    return cached.data;
  }

  // Estimate token counts (rough approximation: 1 token ≈ 4 characters)
  const inputTokens = Math.ceil(promptLength / 4);
  const outputTokens = config.maxTokens || Math.min(1000, inputTokens * 0.5);

  // Calculate cost
  const modelCost = MODEL_COSTS[config.model] || MODEL_COSTS['gpt-4o-mini'];
  const inputCost = (inputTokens / 1000) * modelCost.input;
  const outputCost = (outputTokens / 1000) * modelCost.output;
  const estimatedCost = inputCost + outputCost;

  // Predict quality (based on model and temperature)
  let estimatedQuality = 0.7; // Base quality
  if (config.model.includes('gpt-4o') && !config.model.includes('mini')) {
    estimatedQuality = 0.9; // GPT-4o is high quality
  } else if (config.model.includes('gpt-4')) {
    estimatedQuality = 0.85;
  } else if (config.model.includes('gpt-3.5')) {
    estimatedQuality = 0.75;
  }

  // Temperature impact (lower = more deterministic, higher = more creative)
  // For structured tasks, lower temperature is better
  if (taskType.includes('extraction') || taskType.includes('structured')) {
    if (config.temperature <= 0.1) {
      estimatedQuality += 0.1;
    } else if (config.temperature > 0.5) {
      estimatedQuality -= 0.1;
    }
  }

  // Estimate latency (based on model and tokens)
  let estimatedLatency = 1000; // Base latency (ms)
  if (config.model.includes('gpt-4o') && !config.model.includes('mini')) {
    estimatedLatency = 2000 + (outputTokens * 10); // Slower for GPT-4o
  } else if (config.model.includes('gpt-4o-mini')) {
    estimatedLatency = 500 + (outputTokens * 5); // Faster
  }

  // Determine recommendation
  let recommendation: 'use' | 'optimize' | 'avoid' = 'use';
  if (estimatedCost > 0.01 && estimatedQuality < 0.7) {
    recommendation = 'optimize';
  } else if (estimatedCost > 0.05) {
    recommendation = 'avoid';
  }

  const prediction: CostQualityPrediction = {
    estimatedCost,
    estimatedQuality: Math.min(1.0, Math.max(0.0, estimatedQuality)),
    estimatedLatency,
    confidence: 0.8,
    recommendation,
    reasoning: `Model: ${config.model}, Cost: $${estimatedCost.toFixed(4)}, Quality: ${(estimatedQuality * 100).toFixed(0)}%`,
  };

  // Cache prediction
  await setCacheEntry(cacheKey, prediction, null, {
    ...cacheOptions,
    ttlSeconds: 24 * 60 * 60, // 24h cache
  });

  return prediction;
}

/**
 * Optimize API configuration for a task
 */
export async function optimizeApiConfig(
  taskType: string,
  promptLength: number,
  qualityRequirement: number = 0.8, // Minimum quality (0-1)
  maxCost?: number // Maximum cost per call (USD)
): Promise<OptimizationResult> {
  const taskConfig = TASK_MODEL_MAP[taskType] || TASK_MODEL_MAP.event_extraction;

  // Start with recommended model
  const originalConfig: ApiConfig = {
    model: taskConfig.recommended[0],
    temperature: 0.1, // Low temperature for structured tasks
    maxTokens: 2000,
  };

  // Try different configurations
  const candidates: ApiConfig[] = [
    originalConfig,
    // Try cheaper model
    { ...originalConfig, model: taskConfig.fallback },
    // Try with lower max_tokens
    { ...originalConfig, maxTokens: 1000 },
    // Try with even lower max_tokens
    { ...originalConfig, model: taskConfig.fallback, maxTokens: 1000 },
  ];

  // Evaluate each candidate
  const evaluations = await Promise.all(
    candidates.map(async (config) => {
      const prediction = await predictCostQuality(taskType, promptLength, config);
      return { config, prediction };
    })
  );

  // Find best configuration (meets quality requirement, minimizes cost)
  let bestConfig = originalConfig;
  let bestEvaluation = evaluations[0];

  for (const eval_ of evaluations) {
    const { config, prediction } = eval_;

    // Must meet quality requirement
    if (prediction.estimatedQuality < qualityRequirement) {
      continue;
    }

    // Must meet cost constraint if specified
    if (maxCost && prediction.estimatedCost > maxCost) {
      continue;
    }

    // Prefer lower cost if quality is similar
    if (
      prediction.estimatedCost < bestEvaluation.prediction.estimatedCost &&
      Math.abs(prediction.estimatedQuality - bestEvaluation.prediction.estimatedQuality) < 0.1
    ) {
      bestConfig = config;
      bestEvaluation = eval_;
    }
  }

  // Calculate improvements
  const originalPrediction = evaluations[0].prediction;
  const optimizedPrediction = bestEvaluation.prediction;

  const costSavings = ((originalPrediction.estimatedCost - optimizedPrediction.estimatedCost) / originalPrediction.estimatedCost) * 100;
  const qualityImpact = ((optimizedPrediction.estimatedQuality - originalPrediction.estimatedQuality) / originalPrediction.estimatedQuality) * 100;
  const latencyImpact = ((optimizedPrediction.estimatedLatency - originalPrediction.estimatedLatency) / originalPrediction.estimatedLatency) * 100;

  // Determine recommendation
  let recommendation: 'adopt' | 'test' | 'reject' = 'test';
  if (costSavings > 20 && qualityImpact > -5) {
    recommendation = 'adopt';
  } else if (costSavings < 5 || qualityImpact < -10) {
    recommendation = 'reject';
  }

  return {
    originalConfig,
    optimizedConfig: bestConfig,
    costSavings,
    qualityImpact,
    latencyImpact,
    recommendation,
  };
}

/**
 * Get recommended model for a task based on historical performance
 */
export async function getRecommendedModel(taskType: string): Promise<string> {
  // Check historical metrics
  const metrics = await getMetrics(24, 'openai'); // Last 24 hours

  // Find best performing model for this task type
  const taskMetrics = metrics.filter(m => m.featureName === taskType);

  if (taskMetrics.length === 0) {
    // Fallback to default
    return TASK_MODEL_MAP[taskType]?.recommended[0] || 'gpt-4o-mini';
  }

  // Sort by quality/cost ratio
  const sorted = taskMetrics.sort((a, b) => {
    // Higher quality, lower cost = better
    const aRatio = a.avgLatencyMs > 0 ? 1 / a.avgLatencyMs : 0; // Simplified
    const bRatio = b.avgLatencyMs > 0 ? 1 / b.avgLatencyMs : 0;
    return bRatio - aRatio;
  });

  // Extract model from API endpoint or use default
  return sorted[0]?.apiEndpoint?.includes('gpt-4o') ? 'gpt-4o' : 'gpt-4o-mini';
}

/**
 * Record actual cost and quality after API call for learning
 */
export async function recordActualCostQuality(
  taskType: string,
  config: ApiConfig,
  actualCost: number,
  actualQuality: number, // Can be calculated from feedback or validation
  actualLatency: number
): Promise<boolean> {
  if (!supabase) return false;

  try {
    // Store for model training
    // This data would be used to improve cost/quality predictions
    const { error } = await supabase
      .from('ml_features')
      .upsert({
        entity_type: 'query', // Reuse query type for cost-quality data
        entity_id: `cost_quality:${taskType}:${config.model}`,
        all_features: {
          task_type: taskType,
          model: config.model,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          actual_cost: actualCost,
          actual_quality: actualQuality,
          actual_latency: actualLatency,
          timestamp: new Date().toISOString(),
        },
      }, {
        onConflict: 'entity_type,entity_id',
      });

    if (error) {
      console.error('[CostQualityOptimizer] Error recording metrics:', error.message);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('[CostQualityOptimizer] Error recording metrics:', error.message);
    return false;
  }
}
