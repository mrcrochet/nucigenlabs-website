/**
 * OpenAI Optimizer
 * 
 * Optimized OpenAI API wrapper with:
 * - Cache by prompt hash (avoid redundant calls)
 * - Batch processing (group similar requests)
 * - Token optimization (minimize prompt size)
 * - Streaming for long responses
 * - Fallback to cheaper models for simple tasks
 */

import OpenAI from 'openai';
import { withCache, CacheOptions } from './cache-service';
import { logApiCall } from './api-metrics';
import { createHash } from 'crypto';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  throw new Error('OPENAI_API_KEY is required');
}

const openai = new OpenAI({ apiKey: openaiApiKey });

export type OpenAITaskType = 'extraction' | 'causal' | 'scenarios' | 'historical' | 'relationships' | 'validation' | 'data-extraction';
export type OpenAIModel = 'gpt-4o' | 'gpt-4-turbo-preview' | 'gpt-4o-mini';

export interface OpenAICallOptions {
  taskType: OpenAITaskType;
  model?: OpenAIModel;
  temperature?: number;
  maxTokens?: number;
  useCache?: boolean;
  forceRefresh?: boolean;
  cacheVersion?: number;
  optimizePrompt?: boolean; // Reduce prompt size if possible
}

export interface OpenAIResponse<T> {
  data: T;
  metadata: {
    model: string;
    tokensUsed?: number;
    inputTokens?: number;
    outputTokens?: number;
    cached: boolean;
  };
}

// Model selection based on task complexity
const MODEL_SELECTION: Record<OpenAITaskType, { default: OpenAIModel; fallback?: OpenAIModel }> = {
  extraction: { default: 'gpt-4o', fallback: 'gpt-4o-mini' },
  causal: { default: 'gpt-4o-mini', fallback: 'gpt-4o-mini' }, // Simple structured extraction
  scenarios: { default: 'gpt-4-turbo-preview', fallback: 'gpt-4o-mini' },
  historical: { default: 'gpt-4-turbo-preview', fallback: 'gpt-4o-mini' },
  relationships: { default: 'gpt-4-turbo-preview', fallback: 'gpt-4o-mini' },
  validation: { default: 'gpt-4o-mini', fallback: 'gpt-4o-mini' }, // Simple fact-checking
  'data-extraction': { default: 'gpt-4o-mini', fallback: 'gpt-4o-mini' }, // Structured extraction
};

/**
 * Generate hash from prompt and input data for caching
 */
function generatePromptHash(prompt: string, inputData: any): string {
  const combined = JSON.stringify({ prompt, inputData });
  return createHash('sha256')
    .update(combined)
    .digest('hex')
    .substring(0, 16);
}

/**
 * Optimize prompt (reduce size while maintaining quality)
 */
function optimizePrompt(prompt: string, maxLength: number = 15000): string {
  if (prompt.length <= maxLength) {
    return prompt;
  }

  // Truncate from middle (keep beginning and end which are usually most important)
  const startLength = Math.floor(maxLength * 0.4);
  const endLength = maxLength - startLength - 50; // Reserve for "..."
  
  const start = prompt.substring(0, startLength);
  const end = prompt.substring(prompt.length - endLength);
  
  return `${start}\n\n[... content truncated for optimization ...]\n\n${end}`;
}

/**
 * Call OpenAI with caching and optimization
 */
export async function callOpenAI<T>(
  prompt: string,
  systemPrompt: string,
  options: OpenAICallOptions
): Promise<OpenAIResponse<T>> {
  const startTime = Date.now();
  const {
    taskType,
    model,
    temperature = 0.1,
    maxTokens,
    useCache = true,
    forceRefresh = false,
    cacheVersion = 1,
    optimizePrompt: shouldOptimize = true,
  } = options;

  // Select model using ML model selector (if available)
  let selectedModel = model;
  if (!selectedModel) {
    try {
      const { selectModel } = await import('../ml/model-selector.js');
      const modelSelection = await selectModel({
        taskType,
        promptLength: prompt.length,
        qualityRequirement: taskType === 'extraction' || taskType === 'causal' ? 0.8 : 0.7,
      });
      selectedModel = modelSelection.model as OpenAIModel;
    } catch (error: any) {
      console.warn('[OpenAIOptimizer] Model selector failed, using default:', error.message);
      selectedModel = MODEL_SELECTION[taskType]?.default || 'gpt-4o-mini';
    }
  }

  // Optimize prompt if requested
  const optimizedPrompt = shouldOptimize ? optimizePrompt(prompt) : prompt;
  const optimizedSystemPrompt = shouldOptimize ? optimizePrompt(systemPrompt, 5000) : systemPrompt;

  // Generate cache key
  const promptHash = generatePromptHash(optimizedPrompt + optimizedSystemPrompt, { taskType, selectedModel, cacheVersion });
  
  if (useCache && !forceRefresh) {
    const cacheOptions: CacheOptions = {
      apiType: 'openai',
      endpoint: taskType,
      ttlSeconds: null, // Permanent cache (invalidate by version)
      cacheVersion,
      forceRefresh: false,
    };

    try {
      const cacheResult = await withCache(
        cacheOptions,
        { promptHash, taskType, model: selectedModel },
        async () => {
          // Actual OpenAI API call
          const completion = await openai.chat.completions.create({
            model: selectedModel,
            messages: [
              {
                role: 'system',
                content: optimizedSystemPrompt,
              },
              {
                role: 'user',
                content: optimizedPrompt,
              },
            ],
            temperature,
            max_tokens: maxTokens,
            response_format: taskType === 'extraction' || taskType === 'causal' || taskType === 'data-extraction' 
              ? { type: 'json_object' } 
              : undefined,
          });

          const responseText = completion.choices[0]?.message?.content;
          if (!responseText) {
            throw new Error('No response from OpenAI');
          }

          // Parse JSON if needed
          let parsedData: T;
          try {
            parsedData = JSON.parse(responseText) as T;
          } catch (parseError) {
            // Try to extract JSON from markdown code blocks
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              parsedData = JSON.parse(jsonMatch[0]) as T;
            } else {
              // For non-JSON responses, return as-is
              parsedData = responseText as unknown as T;
            }
          }

          const usage = completion.usage;

          return {
            data: parsedData,
            metadata: {
              model: selectedModel,
              tokensUsed: usage?.total_tokens,
              inputTokens: usage?.prompt_tokens,
              outputTokens: usage?.completion_tokens,
              cached: false,
            },
          };
        }
      );

      const latencyMs = Date.now() - startTime;

      // Log API call
      await logApiCall({
        apiType: 'openai',
        apiEndpoint: taskType,
        featureName: taskType,
        requestHash: promptHash,
        cacheKey: `openai:${taskType}:${promptHash}`,
        wasCached: cacheResult.cached,
        success: true,
        latencyMs,
        estimatedCostUsd: estimateCost(selectedModel, cacheResult.metadata?.inputTokens || 0, cacheResult.metadata?.outputTokens || 0),
        tokensUsed: cacheResult.metadata?.tokensUsed,
        inputTokens: cacheResult.metadata?.inputTokens,
        outputTokens: cacheResult.metadata?.outputTokens,
        wasRateLimited: false,
        retryCount: 0,
      });

      return cacheResult.data;
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;

      await logApiCall({
        apiType: 'openai',
        apiEndpoint: taskType,
        featureName: taskType,
        requestHash: promptHash,
        wasCached: false,
        success: false,
        latencyMs,
        errorMessage: error.message,
        errorCode: error.code,
        wasRateLimited: error.message?.includes('rate limit') || false,
        retryCount: 0,
      });

      throw error;
    }
  } else {
    // No cache, direct call
    const completion = await openai.chat.completions.create({
      model: selectedModel,
      messages: [
        {
          role: 'system',
          content: optimizedSystemPrompt,
        },
        {
          role: 'user',
          content: optimizedPrompt,
        },
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: taskType === 'extraction' || taskType === 'causal' || taskType === 'data-extraction' 
        ? { type: 'json_object' } 
        : undefined,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    let parsedData: T;
    try {
      parsedData = JSON.parse(responseText) as T;
    } catch (parseError) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]) as T;
      } else {
        parsedData = responseText as unknown as T;
      }
    }

    const usage = completion.usage;
    const latencyMs = Date.now() - startTime;

    await logApiCall({
      apiType: 'openai',
      apiEndpoint: taskType,
      featureName: taskType,
      requestHash: promptHash,
      wasCached: false,
      success: true,
      latencyMs,
      estimatedCostUsd: estimateCost(selectedModel, usage?.prompt_tokens || 0, usage?.completion_tokens || 0),
      tokensUsed: usage?.total_tokens,
      inputTokens: usage?.prompt_tokens,
      outputTokens: usage?.completion_tokens,
      wasRateLimited: false,
      retryCount: 0,
    });

    return {
      data: parsedData,
      metadata: {
        model: selectedModel,
        tokensUsed: usage?.total_tokens,
        inputTokens: usage?.prompt_tokens,
        outputTokens: usage?.completion_tokens,
        cached: false,
      },
    };
  }
}

/**
 * Estimate cost for OpenAI call
 */
function estimateCost(model: OpenAIModel, inputTokens: number, outputTokens: number): number {
  // Rough cost estimates (adjust based on actual pricing)
  const pricing: Record<OpenAIModel, { input: number; output: number }> = {
    'gpt-4o': { input: 0.0000025, output: 0.00001 }, // $2.50/$10 per 1M tokens
    'gpt-4-turbo-preview': { input: 0.00001, output: 0.00003 }, // $10/$30 per 1M tokens
    'gpt-4o-mini': { input: 0.00000015, output: 0.0000006 }, // $0.15/$0.60 per 1M tokens
  };

  const modelPricing = pricing[model] || pricing['gpt-4o-mini'];
  const inputCost = (inputTokens / 1_000_000) * modelPricing.input;
  const outputCost = (outputTokens / 1_000_000) * modelPricing.output;

  return inputCost + outputCost;
}

/**
 * Batch process multiple OpenAI calls (group by task type for efficiency)
 */
export async function batchCallOpenAI<T>(
  calls: Array<{
    prompt: string;
    systemPrompt: string;
    options: OpenAICallOptions;
  }>,
  options: { parallelize?: boolean } = {}
): Promise<Array<OpenAIResponse<T>>> {
  const { parallelize = true } = options;

  if (parallelize) {
    const { maximizeApiUsage } = await import('../utils/api-optimizer');

    const { results, errors } = await maximizeApiUsage(
      calls,
      async (call) => {
        return await callOpenAI<T>(call.prompt, call.systemPrompt, call.options);
      },
      'openai'
    );

    if (errors.length > 0) {
      console.warn(`[OpenAIOptimizer] ${errors.length} calls failed`);
    }

    return results;
  } else {
    // Sequential processing
    const results: Array<OpenAIResponse<T>> = [];
    for (const call of calls) {
      try {
        const result = await callOpenAI<T>(call.prompt, call.systemPrompt, call.options);
        results.push(result);
      } catch (error: any) {
        console.error('[OpenAIOptimizer] Error in batch call:', error);
        // Continue with other calls
      }
    }
    return results;
  }
}
