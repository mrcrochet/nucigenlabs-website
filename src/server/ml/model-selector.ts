/**
 * Model Selector
 * 
 * Intelligently selects the best OpenAI model for each task based on:
 * - Task requirements (quality, latency, cost)
 * - Historical performance
 * - Cost-quality optimization
 */

import { getRecommendedModel, predictCostQuality, ApiConfig } from './cost-quality-optimizer';

export interface TaskRequirements {
  taskType: string;
  qualityRequirement?: number; // Minimum quality (0-1)
  maxLatency?: number; // Maximum latency (ms)
  maxCost?: number; // Maximum cost per call (USD)
  promptLength: number;
  expectedOutputLength?: number; // Expected output length (characters)
}

export interface ModelSelection {
  model: string;
  temperature: number;
  maxTokens: number;
  responseFormat?: 'json_object' | 'text';
  reasoning: string;
  confidence: number; // Confidence in selection (0-1)
}

/**
 * Select the best model for a task
 */
export async function selectModel(requirements: TaskRequirements): Promise<ModelSelection> {
  const {
    taskType,
    qualityRequirement = 0.8,
    maxLatency,
    maxCost,
    promptLength,
    expectedOutputLength = 1000,
  } = requirements;

  // Get recommended model from cost-quality optimizer
  const recommendedModel = await getRecommendedModel(taskType);

  // Start with recommended configuration
  let config: ApiConfig = {
    model: recommendedModel,
    temperature: 0.1, // Low temperature for structured tasks
    maxTokens: Math.ceil(expectedOutputLength / 4), // Convert to tokens (rough)
  };

  // Adjust based on requirements
  if (taskType.includes('extraction') || taskType.includes('structured')) {
    config.responseFormat = 'json_object';
  }

  // Check if configuration meets requirements
  const prediction = await predictCostQuality(taskType, promptLength, config);

  // If doesn't meet requirements, try alternatives
  if (
    (qualityRequirement && prediction.estimatedQuality < qualityRequirement) ||
    (maxLatency && prediction.estimatedLatency > maxLatency) ||
    (maxCost && prediction.estimatedCost > maxCost)
  ) {
    // Try GPT-4o if quality is too low
    if (qualityRequirement && prediction.estimatedQuality < qualityRequirement) {
      if (config.model !== 'gpt-4o') {
        config.model = 'gpt-4o';
        const newPrediction = await predictCostQuality(taskType, promptLength, config);
        if (newPrediction.estimatedQuality >= qualityRequirement) {
          return {
            ...config,
            reasoning: `Upgraded to GPT-4o to meet quality requirement (${(newPrediction.estimatedQuality * 100).toFixed(0)}%)`,
            confidence: 0.9,
          };
        }
      }
    }

    // Try GPT-4o-mini if latency/cost is too high
    if ((maxLatency && prediction.estimatedLatency > maxLatency) || (maxCost && prediction.estimatedCost > maxCost)) {
      if (config.model !== 'gpt-4o-mini') {
        config.model = 'gpt-4o-mini';
        const newPrediction = await predictCostQuality(taskType, promptLength, config);
        if (
          (!maxLatency || newPrediction.estimatedLatency <= maxLatency) &&
          (!maxCost || newPrediction.estimatedCost <= maxCost) &&
          (!qualityRequirement || newPrediction.estimatedQuality >= qualityRequirement * 0.9) // Allow 10% quality drop
        ) {
          return {
            ...config,
            reasoning: `Switched to GPT-4o-mini for better latency/cost (${newPrediction.estimatedLatency}ms, $${newPrediction.estimatedCost.toFixed(4)})`,
            confidence: 0.85,
          };
        }
      }
    }
  }

  // Return selected configuration
  return {
    ...config,
    reasoning: `Selected ${config.model} based on task requirements and historical performance`,
    confidence: 0.8,
  };
}

/**
 * Select model for batch processing (optimize for cost)
 */
export async function selectModelForBatch(
  taskType: string,
  promptLength: number,
  batchSize: number
): Promise<ModelSelection> {
  // For batch processing, prioritize cost efficiency
  return await selectModel({
    taskType,
    qualityRequirement: 0.75, // Slightly lower quality acceptable for batch
    maxCost: 0.01, // Lower cost per call
    promptLength,
  });
}

/**
 * Select model for real-time processing (optimize for latency)
 */
export async function selectModelForRealtime(
  taskType: string,
  promptLength: number
): Promise<ModelSelection> {
  // For real-time, prioritize latency
  return await selectModel({
    taskType,
    qualityRequirement: 0.8,
    maxLatency: 2000, // 2 seconds max
    promptLength,
  });
}

/**
 * Select model for high-quality tasks (optimize for quality)
 */
export async function selectModelForHighQuality(
  taskType: string,
  promptLength: number
): Promise<ModelSelection> {
  // For high-quality tasks, prioritize quality
  return await selectModel({
    taskType,
    qualityRequirement: 0.9,
    promptLength,
  });
}
