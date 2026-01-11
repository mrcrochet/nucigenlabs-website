/**
 * Parameter Auto-Tuner
 * 
 * Automatically tunes system parameters based on metrics analysis.
 * Uses optimization history to learn from past changes.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getMetrics } from '../services/api-metrics';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[ParameterTuner] Supabase not configured.');
}

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

export interface ParameterConfig {
  componentName: string;
  parameterName: string;
  currentValue: any;
  parameterType: 'cache_ttl' | 'batch_size' | 'concurrency' | 'api_model' | 'api_temperature' | 'api_max_tokens' | 'query_max_results' | 'pipeline_interval' | 'other';
}

export interface OptimizationCandidate {
  componentName: string;
  parameterName: string;
  currentValue: any;
  proposedValue: any;
  expectedImprovement: number; // Percentage
  confidence: number; // 0-1
  reasoning: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface TuningResult {
  optimized: boolean;
  candidates: OptimizationCandidate[];
  applied: OptimizationCandidate[];
  errors: string[];
}

/**
 * Analyze metrics and identify optimization opportunities
 */
export async function identifyOptimizationOpportunities(
  componentName: string,
  hours: number = 24
): Promise<OptimizationCandidate[]> {
  if (!supabase) {
    return [];
  }

  const candidates: OptimizationCandidate[] = [];

  try {
    // Get metrics for the component
    const metrics = await getMetrics(hours);
    const componentMetrics = metrics.filter(m => m.featureName === componentName || m.apiEndpoint?.includes(componentName));

    if (componentMetrics.length === 0) {
      return [];
    }

    // Analyze cache hit rate
    const avgCacheHitRate = componentMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / componentMetrics.length;
    if (avgCacheHitRate < 0.5) {
      candidates.push({
        componentName,
        parameterName: 'cache_ttl_seconds',
        currentValue: await getCurrentParameterValue(componentName, 'cache_ttl_seconds'),
        proposedValue: null, // Will be calculated
        expectedImprovement: (0.7 - avgCacheHitRate) * 100, // Target 70% hit rate
        confidence: 0.7,
        reasoning: `Low cache hit rate (${(avgCacheHitRate * 100).toFixed(0)}%), consider increasing TTL`,
        riskLevel: 'low',
      });
    }

    // Analyze latency
    const avgLatency = componentMetrics.reduce((sum, m) => sum + m.avgLatencyMs, 0) / componentMetrics.length;
    if (avgLatency > 2000) {
      candidates.push({
        componentName,
        parameterName: 'batch_size',
        currentValue: await getCurrentParameterValue(componentName, 'batch_size'),
        proposedValue: null,
        expectedImprovement: 15, // Estimated latency reduction
        confidence: 0.6,
        reasoning: `High latency (${avgLatency.toFixed(0)}ms), consider adjusting batch size`,
        riskLevel: 'medium',
      });
    }

    // Analyze error rate
    const avgErrorRate = componentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / componentMetrics.length;
    if (avgErrorRate > 0.05) {
      candidates.push({
        componentName,
        parameterName: 'concurrency',
        currentValue: await getCurrentParameterValue(componentName, 'max_concurrency'),
        proposedValue: null,
        expectedImprovement: (avgErrorRate - 0.02) * 100, // Target 2% error rate
        confidence: 0.7,
        reasoning: `High error rate (${(avgErrorRate * 100).toFixed(0)}%), consider reducing concurrency`,
        riskLevel: 'high',
      });
    }

    // Calculate proposed values
    for (const candidate of candidates) {
      candidate.proposedValue = calculateProposedValue(candidate);
    }

    return candidates;
  } catch (error: any) {
    console.error('[ParameterTuner] Error identifying opportunities:', error.message);
    return [];
  }
}

/**
 * Get current parameter value from optimization history
 */
async function getCurrentParameterValue(componentName: string, parameterName: string): Promise<any> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc('get_current_parameter_value', {
      p_component_name: componentName,
      p_parameter_name: parameterName,
    });

    if (error) {
      console.error('[ParameterTuner] RPC error:', error.message);
      return null;
    }

    // Function returns JSONB, parse if it's a string
    if (!data) {
      return null;
    }

    // If data is a string, parse it; otherwise use as-is
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    }

    return data;
  } catch (error: any) {
    console.error('[ParameterTuner] Error getting current value:', error.message);
    return null;
  }
}

/**
 * Calculate proposed value for a parameter
 */
function calculateProposedValue(candidate: OptimizationCandidate): any {
  const { parameterName, currentValue } = candidate;

  if (currentValue === null || currentValue === undefined) {
    // Default values if not set
    switch (parameterName) {
      case 'cache_ttl_seconds':
        return 3600; // 1 hour
      case 'batch_size':
        return 10;
      case 'max_concurrency':
        return 5;
      default:
        return null;
    }
  }

  // Adjust based on parameter type
  switch (parameterName) {
    case 'cache_ttl_seconds':
      return Math.min(86400, currentValue * 1.5); // Increase by 50%, max 24h
    case 'batch_size':
      return Math.max(5, Math.min(50, currentValue * 0.8)); // Reduce by 20%
    case 'max_concurrency':
      return Math.max(1, Math.floor(currentValue * 0.7)); // Reduce by 30%
    default:
      return currentValue;
  }
}

/**
 * Apply parameter optimization
 */
export async function applyOptimization(
  candidate: OptimizationCandidate,
  testDurationHours: number = 24
): Promise<{ success: boolean; optimizationId?: string; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Record optimization attempt
    // Note: p_old_value and p_new_value should be JSONB, not strings
    const { data: optimizationId, error: recordError } = await supabase.rpc('record_optimization', {
      p_optimization_type: candidate.parameterName as any,
      p_component_name: candidate.componentName,
      p_parameter_name: candidate.parameterName,
      p_old_value: candidate.currentValue as any, // Pass as JSONB directly
      p_new_value: candidate.proposedValue as any, // Pass as JSONB directly
      p_change_reason: candidate.reasoning,
      p_optimization_method: 'ml_prediction',
      p_baseline_metrics: {} as any, // Pass as JSONB directly
    });

    if (recordError) {
      throw new Error(`Failed to record optimization: ${recordError.message}`);
    }

    if (!optimizationId) {
      throw new Error('No optimization ID returned');
    }

    // In production, would actually apply the parameter change
    // For now, just record it
    console.log(`[ParameterTuner] Recorded optimization: ${candidate.componentName}.${candidate.parameterName} = ${candidate.proposedValue}`);

    return {
      success: true,
      optimizationId: optimizationId as string,
    };
  } catch (error: any) {
    console.error('[ParameterTuner] Error applying optimization:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Finalize optimization (adopt or rollback)
 */
export async function finalizeOptimization(
  optimizationId: string,
  resultMetrics: any,
  improvementPercentage: number,
  primaryMetricName: string,
  secondaryImpacts: any,
  adopt: boolean
): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    const { error } = await supabase.rpc('finalize_optimization', {
      p_id: optimizationId,
      p_result_metrics: resultMetrics as any, // Pass as JSONB directly
      p_improvement_percentage: improvementPercentage,
      p_primary_metric_name: primaryMetricName,
      p_secondary_impacts: secondaryImpacts as any, // Pass as JSONB directly
      p_adopt: adopt,
    });

    if (error) {
      throw new Error(`Failed to finalize optimization: ${error.message}`);
    }

    return true;
  } catch (error: any) {
    console.error('[ParameterTuner] Error finalizing optimization:', error.message);
    return false;
  }
}

/**
 * Auto-tune parameters for a component
 */
export async function autoTuneComponent(
  componentName: string,
  hours: number = 24
): Promise<TuningResult> {
  const candidates = await identifyOptimizationOpportunities(componentName, hours);

  if (candidates.length === 0) {
    return {
      optimized: false,
      candidates: [],
      applied: [],
      errors: [],
    };
  }

  // Filter low-risk candidates
  const lowRiskCandidates = candidates.filter(c => c.riskLevel === 'low');
  const applied: OptimizationCandidate[] = [];
  const errors: string[] = [];

  // Apply low-risk optimizations
  for (const candidate of lowRiskCandidates) {
    const result = await applyOptimization(candidate);
    if (result.success) {
      applied.push(candidate);
    } else {
      errors.push(`${candidate.parameterName}: ${result.error}`);
    }
  }

  return {
    optimized: applied.length > 0,
    candidates,
    applied,
    errors,
  };
}

/**
 * Get optimization history for a component
 */
export async function getOptimizationHistory(
  componentName: string,
  limit: number = 50
): Promise<any[]> {
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc('get_optimization_history', {
      p_component_name: componentName,
      p_limit: limit,
    });

    if (error) {
      throw new Error(`Failed to get history: ${error.message}`);
    }

    return data || [];
  } catch (error: any) {
    console.error('[ParameterTuner] Error getting history:', error.message);
    return [];
  }
}
