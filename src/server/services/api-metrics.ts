/**
 * API Metrics Service
 * 
 * Tracks API usage, costs, performance, and cache efficiency for all APIs.
 * Enables monitoring and optimization of the API ecosystem.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export type ApiType = 'openai' | 'tavily' | 'firecrawl';
export type ApiEndpoint = string;
export type FeatureName = string;

export interface ApiCallLog {
  apiType: ApiType;
  apiEndpoint: ApiEndpoint;
  featureName?: FeatureName;
  requestHash?: string;
  cacheKey?: string;
  wasCached: boolean;
  success: boolean;
  latencyMs: number;
  errorMessage?: string;
  errorCode?: string;
  estimatedCostUsd?: number;
  tokensUsed?: number;
  inputTokens?: number;
  outputTokens?: number;
  wasRateLimited: boolean;
  retryCount: number;
  metadata?: any;
}

export interface ApiMetrics {
  apiType: ApiType;
  apiEndpoint: ApiEndpoint;
  featureName?: FeatureName;
  timeWindowStart: Date;
  timeWindowEnd: Date;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  cachedCalls: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  cacheHitRate: number;
  cacheMissRate: number;
  estimatedCostUsd: number;
  totalTokensUsed?: number;
  totalInputTokens?: number;
  totalOutputTokens?: number;
  rateLimitHits: number;
  retryCount: number;
  errorRate: number;
  errorTypes?: Record<string, number>;
}

/**
 * Cost estimation per API (rough estimates, should be adjusted based on actual pricing)
 */
const API_COST_ESTIMATES: Record<ApiType, {
  perCall?: number;
  perToken?: { input: number; output: number };
  perRequest?: number;
}> = {
  openai: {
    perToken: {
      input: 0.0000025, // $2.50 per 1M tokens for gpt-4o-mini
      output: 0.00001, // $10 per 1M tokens for gpt-4o-mini
    },
  },
  tavily: {
    perCall: 0.001, // Rough estimate: $0.001 per search
  },
  firecrawl: {
    perCall: 0.002, // Rough estimate: $0.002 per scrape
  },
};

/**
 * Estimate cost for an API call
 */
function estimateCost(
  apiType: ApiType,
  callLog: Partial<ApiCallLog>
): number {
  const costConfig = API_COST_ESTIMATES[apiType];

  if (costConfig.perToken && (callLog.tokensUsed || callLog.inputTokens || callLog.outputTokens)) {
    const inputTokens = callLog.inputTokens || 0;
    const outputTokens = callLog.outputTokens || 0;
    const inputCost = inputTokens * (costConfig.perToken.input || 0);
    const outputCost = outputTokens * (costConfig.perToken.output || 0);
    return inputCost + outputCost;
  }

  if (costConfig.perCall) {
    return costConfig.perCall;
  }

  return 0;
}

/**
 * Log an API call
 */
export async function logApiCall(callLog: ApiCallLog): Promise<void> {
  try {
    const estimatedCost = estimateCost(callLog.apiType, callLog);

    const logEntry = {
      api_type: callLog.apiType,
      api_endpoint: callLog.apiEndpoint,
      feature_name: callLog.featureName || null,
      request_hash: callLog.requestHash || null,
      cache_key: callLog.cacheKey || null,
      was_cached: callLog.wasCached,
      success: callLog.success,
      latency_ms: callLog.latencyMs,
      error_message: callLog.errorMessage || null,
      error_code: callLog.errorCode || null,
      estimated_cost_usd: estimatedCost,
      tokens_used: callLog.tokensUsed || null,
      input_tokens: callLog.inputTokens || null,
      output_tokens: callLog.outputTokens || null,
      was_rate_limited: callLog.wasRateLimited,
      retry_count: callLog.retryCount,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      metadata: callLog.metadata || null,
    };

    const { error } = await supabase
      .from('api_call_logs')
      .insert(logEntry);

    if (error) {
      console.error('[APIMetrics] Error logging API call:', error);
    }
  } catch (error: any) {
    console.error('[APIMetrics] Error logging API call:', error);
  }
}

/**
 * Calculate percentile from array of values
 */
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)] || 0;
}

/**
 * Aggregate metrics from call logs for a time window
 */
export async function aggregateMetrics(
  startTime: Date,
  endTime: Date,
  apiType?: ApiType,
  apiEndpoint?: ApiEndpoint,
  featureName?: FeatureName
): Promise<ApiMetrics[]> {
  try {
    const { data, error } = await supabase.rpc('aggregate_api_metrics', {
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
    });

    if (error) {
      console.error('[APIMetrics] Error aggregating metrics:', error);
      return [];
    }

    // Filter and format results
    let metrics = (data || []) as any[];

    if (apiType) {
      metrics = metrics.filter(m => m.api_type === apiType);
    }
    if (apiEndpoint) {
      metrics = metrics.filter(m => m.api_endpoint === apiEndpoint);
    }
    if (featureName) {
      metrics = metrics.filter(m => m.feature_name === featureName);
    }

    // Calculate percentiles if not already calculated
    for (const metric of metrics) {
      if (!metric.p50_latency_ms && metric.avg_latency_ms) {
        metric.p50_latency_ms = metric.avg_latency_ms;
        metric.p95_latency_ms = metric.avg_latency_ms * 1.5;
        metric.p99_latency_ms = metric.avg_latency_ms * 2;
      }
    }

    return metrics.map(m => ({
      apiType: m.api_type,
      apiEndpoint: m.api_endpoint,
      featureName: m.feature_name,
      timeWindowStart: new Date(m.time_window_start),
      timeWindowEnd: new Date(m.time_window_end),
      totalCalls: m.total_calls,
      successfulCalls: m.successful_calls,
      failedCalls: m.failed_calls,
      cachedCalls: m.cached_calls,
      avgLatencyMs: parseFloat(m.avg_latency_ms || 0),
      minLatencyMs: parseFloat(m.min_latency_ms || 0),
      maxLatencyMs: parseFloat(m.max_latency_ms || 0),
      p50LatencyMs: parseFloat(m.p50_latency_ms || m.avg_latency_ms || 0),
      p95LatencyMs: parseFloat(m.p95_latency_ms || m.avg_latency_ms * 1.5 || 0),
      p99LatencyMs: parseFloat(m.p99_latency_ms || m.avg_latency_ms * 2 || 0),
      cacheHitRate: parseFloat(m.cache_hit_rate || 0),
      cacheMissRate: parseFloat(m.cache_miss_rate || 0),
      estimatedCostUsd: parseFloat(m.estimated_cost_usd || 0),
      totalTokensUsed: m.total_tokens_used,
      totalInputTokens: m.total_input_tokens,
      totalOutputTokens: m.total_output_tokens,
      rateLimitHits: m.rate_limit_hits,
      retryCount: m.retry_count,
      errorRate: parseFloat(m.error_rate || 0),
    }));
  } catch (error: any) {
    console.error('[APIMetrics] Error aggregating metrics:', error);
    return [];
  }
}

/**
 * Get metrics for a specific time period
 */
export async function getMetrics(
  hours: number = 24,
  apiType?: ApiType,
  apiEndpoint?: ApiEndpoint,
  featureName?: FeatureName
): Promise<ApiMetrics[]> {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

  return await aggregateMetrics(startTime, endTime, apiType, apiEndpoint, featureName);
}

/**
 * Get summary statistics for all APIs
 */
export async function getSummaryStats(hours: number = 24): Promise<{
  totalCalls: number;
  totalCost: number;
  totalCacheHits: number;
  avgCacheHitRate: number;
  avgLatency: number;
  totalErrors: number;
  byApiType: Record<ApiType, {
    calls: number;
    cost: number;
    cacheHitRate: number;
    avgLatency: number;
    errors: number;
  }>;
}> {
  const metrics = await getMetrics(hours);

  const summary = {
    totalCalls: 0,
    totalCost: 0,
    totalCacheHits: 0,
    totalCacheCalls: 0,
    totalLatency: 0,
    totalErrors: 0,
    byApiType: {} as Record<ApiType, {
      calls: number;
      cost: number;
      cacheHits: number;
      cacheCalls: number;
      latency: number;
      errors: number;
    }>,
  };

  for (const metric of metrics) {
    summary.totalCalls += metric.totalCalls;
    summary.totalCost += metric.estimatedCostUsd;
    summary.totalCacheHits += metric.cachedCalls;
    summary.totalCacheCalls += metric.totalCalls;
    summary.totalLatency += metric.avgLatencyMs * metric.totalCalls;
    summary.totalErrors += metric.failedCalls;

    if (!summary.byApiType[metric.apiType]) {
      summary.byApiType[metric.apiType] = {
        calls: 0,
        cost: 0,
        cacheHits: 0,
        cacheCalls: 0,
        latency: 0,
        errors: 0,
      };
    }

    const apiTypeData = summary.byApiType[metric.apiType];
    apiTypeData.calls += metric.totalCalls;
    apiTypeData.cost += metric.estimatedCostUsd;
    apiTypeData.cacheHits += metric.cachedCalls;
    apiTypeData.cacheCalls += metric.totalCalls;
    apiTypeData.latency += metric.avgLatencyMs * metric.totalCalls;
    apiTypeData.errors += metric.failedCalls;
  }

  return {
    totalCalls: summary.totalCalls,
    totalCost: summary.totalCost,
    totalCacheHits: summary.totalCacheHits,
    avgCacheHitRate: summary.totalCacheCalls > 0 ? summary.totalCacheHits / summary.totalCacheCalls : 0,
    avgLatency: summary.totalCalls > 0 ? summary.totalLatency / summary.totalCalls : 0,
    totalErrors: summary.totalErrors,
    byApiType: Object.fromEntries(
      Object.entries(summary.byApiType).map(([apiType, data]) => [
        apiType,
        {
          calls: data.calls,
          cost: data.cost,
          cacheHitRate: data.cacheCalls > 0 ? data.cacheHits / data.cacheCalls : 0,
          avgLatency: data.calls > 0 ? data.latency / data.calls : 0,
          errors: data.errors,
        },
      ])
    ) as Record<ApiType, {
      calls: number;
      cost: number;
      cacheHitRate: number;
      avgLatency: number;
      errors: number;
    }>,
  };
}

/**
 * Clean old call logs (keep only last N days)
 */
export async function cleanupOldLogs(daysToKeep: number = 30): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('cleanup_old_api_call_logs', {
      days_to_keep: daysToKeep,
    });

    if (error) {
      console.error('[APIMetrics] Error cleaning old logs:', error);
      return 0;
    }

    return data || 0;
  } catch (error: any) {
    console.error('[APIMetrics] Error cleaning old logs:', error);
    return 0;
  }
}
