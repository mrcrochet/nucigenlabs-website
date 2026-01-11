/**
 * Experiment Manager
 * 
 * Manages A/B tests and experiments for continuous optimization.
 * Handles experiment creation, variant assignment, and result tracking.
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
  console.warn('[ExperimentManager] Supabase not configured.');
}

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

export interface ExperimentConfig {
  experimentName: string;
  experimentType: 'prompt_variant' | 'model_variant' | 'parameter_variant' | 'algorithm_variant' | 'ui_variant' | 'recommendation_variant';
  description?: string;
  hypothesis: string;
  successMetric: string;
  secondaryMetrics?: string[];
  variants: Array<{ name: string; config: any }>;
  trafficAllocation?: number; // 0-1, percentage of traffic
  variantAllocation?: Record<string, number>; // How traffic is split
  targetSampleSize?: number;
}

export interface Experiment {
  id: string;
  experimentName: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  startedAt?: Date;
  endedAt?: Date;
  variants: any[];
  results?: any;
}

/**
 * Create a new experiment
 */
export async function createExperiment(config: ExperimentConfig): Promise<{ success: boolean; experimentId?: string; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('experiments')
      .insert({
        experiment_name: config.experimentName,
        experiment_type: config.experimentType,
        description: config.description,
        hypothesis: config.hypothesis,
        success_metric: config.successMetric,
        secondary_metrics: config.secondaryMetrics || [],
        variants: config.variants,
        traffic_allocation: config.trafficAllocation || 1.0,
        variant_allocation: config.variantAllocation || {},
        target_sample_size: config.targetSampleSize,
        status: 'draft',
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create experiment: ${error.message}`);
    }

    return {
      success: true,
      experimentId: data.id,
    };
  } catch (error: any) {
    console.error('[ExperimentManager] Error creating experiment:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Start an experiment
 */
export async function startExperiment(experimentId: string): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('experiments')
      .update({
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .eq('id', experimentId);

    if (error) {
      throw new Error(`Failed to start experiment: ${error.message}`);
    }

    return true;
  } catch (error: any) {
    console.error('[ExperimentManager] Error starting experiment:', error.message);
    return false;
  }
}

/**
 * Get variant for an entity (user, event, query)
 */
export async function getVariant(
  experimentName: string,
  entityType: 'user' | 'event' | 'query',
  entityId: string
): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.rpc('get_experiment_variant', {
      p_experiment_name: experimentName,
      p_entity_type: entityType,
      p_entity_id: entityId,
    });

    if (error) {
      console.warn(`[ExperimentManager] Error getting variant: ${error.message}`);
      return null;
    }

    return data;
  } catch (error: any) {
    console.error('[ExperimentManager] Error getting variant:', error.message);
    return null;
  }
}

/**
 * Record experiment metric
 */
export async function recordExperimentMetric(
  experimentId: string,
  variantName: string,
  metricName: string,
  value: number,
  timeWindowStart: Date,
  timeWindowEnd: Date
): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    const { error } = await supabase.rpc('record_experiment_metric', {
      p_experiment_id: experimentId,
      p_variant_name: variantName,
      p_metric_name: metricName,
      p_value: value,
      p_time_window_start: timeWindowStart.toISOString(),
      p_time_window_end: timeWindowEnd.toISOString(),
    });

    if (error) {
      console.error('[ExperimentManager] Error recording metric:', error.message);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('[ExperimentManager] Error recording metric:', error.message);
    return false;
  }
}

/**
 * Calculate experiment results
 */
export async function calculateExperimentResults(experimentId: string): Promise<any> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.rpc('calculate_experiment_results', {
      p_experiment_id: experimentId,
    });

    if (error) {
      throw new Error(`Failed to calculate results: ${error.message}`);
    }

    return data;
  } catch (error: any) {
    console.error('[ExperimentManager] Error calculating results:', error.message);
    return null;
  }
}

/**
 * Get active experiments
 */
export async function getActiveExperiments(): Promise<Experiment[]> {
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('experiments')
      .select('*')
      .eq('status', 'active');

    if (error) {
      throw new Error(`Failed to get experiments: ${error.message}`);
    }

    return (data || []).map(exp => ({
      id: exp.id,
      experimentName: exp.experiment_name,
      status: exp.status,
      startedAt: exp.started_at ? new Date(exp.started_at) : undefined,
      endedAt: exp.ended_at ? new Date(exp.ended_at) : undefined,
      variants: exp.variants || [],
      results: exp.results,
    }));
  } catch (error: any) {
    console.error('[ExperimentManager] Error getting experiments:', error.message);
    return [];
  }
}

/**
 * Complete an experiment
 */
export async function completeExperiment(
  experimentId: string,
  winnerVariant?: string,
  improvementPercentage?: number
): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    const results = await calculateExperimentResults(experimentId);

    const { error } = await supabase
      .from('experiments')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        results: results,
        winner_variant: winnerVariant,
        improvement_percentage: improvementPercentage,
      })
      .eq('id', experimentId);

    if (error) {
      throw new Error(`Failed to complete experiment: ${error.message}`);
    }

    return true;
  } catch (error: any) {
    console.error('[ExperimentManager] Error completing experiment:', error.message);
    return false;
  }
}
