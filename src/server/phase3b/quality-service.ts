/**
 * PHASE 3B: Quality Service
 * 
 * Service for managing quality metrics, validations, and feedback
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================
// Event Validation
// ============================================

export interface EventValidationInput {
  nucigen_event_id: string;
  status: 'approved' | 'rejected' | 'needs_revision';
  reviewer_id?: string;
  reviewer_email?: string;
  reviewer_notes?: string;
  accuracy_score?: number;
  relevance_score?: number;
  completeness_score?: number;
  issues?: string[];
}

export async function createEventValidation(input: EventValidationInput) {
  const { data, error } = await supabase
    .from('event_validations')
    .insert({
      nucigen_event_id: input.nucigen_event_id,
      status: input.status,
      reviewer_id: input.reviewer_id || null,
      reviewer_email: input.reviewer_email || null,
      reviewer_notes: input.reviewer_notes || null,
      accuracy_score: input.accuracy_score || null,
      relevance_score: input.relevance_score || null,
      completeness_score: input.completeness_score || null,
      issues: input.issues || [],
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create event validation: ${error.message}`);
  }

  return data;
}

export async function getEventValidations(nucigen_event_id: string) {
  const { data, error } = await supabase
    .from('event_validations')
    .select('*')
    .eq('nucigen_event_id', nucigen_event_id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch event validations: ${error.message}`);
  }

  return data || [];
}

// ============================================
// Causal Chain Validation
// ============================================

export interface CausalChainValidationInput {
  causal_chain_id: string;
  status: 'approved' | 'rejected' | 'needs_revision';
  reviewer_id?: string;
  reviewer_email?: string;
  reviewer_notes?: string;
  logical_coherence_score?: number;
  causality_strength_score?: number;
  time_horizon_accuracy_score?: number;
  issues?: string[];
}

export async function createCausalChainValidation(input: CausalChainValidationInput) {
  const { data, error } = await supabase
    .from('causal_chain_validations')
    .insert({
      causal_chain_id: input.causal_chain_id,
      status: input.status,
      reviewer_id: input.reviewer_id || null,
      reviewer_email: input.reviewer_email || null,
      reviewer_notes: input.reviewer_notes || null,
      logical_coherence_score: input.logical_coherence_score || null,
      causality_strength_score: input.causality_strength_score || null,
      time_horizon_accuracy_score: input.time_horizon_accuracy_score || null,
      issues: input.issues || [],
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create causal chain validation: ${error.message}`);
  }

  return data;
}

export async function getCausalChainValidations(causal_chain_id: string) {
  const { data, error } = await supabase
    .from('causal_chain_validations')
    .select('*')
    .eq('causal_chain_id', causal_chain_id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch causal chain validations: ${error.message}`);
  }

  return data || [];
}

// ============================================
// Prompt Feedback
// ============================================

export interface PromptFeedbackInput {
  phase: 'phase1' | 'phase2b';
  prompt_version?: string;
  event_id?: string;
  nucigen_event_id?: string;
  causal_chain_id?: string;
  feedback_type: 'missing_field' | 'incorrect_field' | 'poor_quality' | 'hallucination' | 'other';
  feedback_text: string;
  suggested_improvement?: string;
  reviewer_id?: string;
  reviewer_email?: string;
}

export async function createPromptFeedback(input: PromptFeedbackInput) {
  const { data, error } = await supabase
    .from('prompt_feedback')
    .insert({
      phase: input.phase,
      prompt_version: input.prompt_version || null,
      event_id: input.event_id || null,
      nucigen_event_id: input.nucigen_event_id || null,
      causal_chain_id: input.causal_chain_id || null,
      feedback_type: input.feedback_type,
      feedback_text: input.feedback_text,
      suggested_improvement: input.suggested_improvement || null,
      reviewer_id: input.reviewer_id || null,
      reviewer_email: input.reviewer_email || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create prompt feedback: ${error.message}`);
  }

  return data;
}

export async function getPromptFeedback(phase?: 'phase1' | 'phase2b', limit: number = 50) {
  let query = supabase
    .from('prompt_feedback')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (phase) {
    query = query.eq('phase', phase);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch prompt feedback: ${error.message}`);
  }

  return data || [];
}

// ============================================
// Quality Metrics
// ============================================

export interface QualityMetrics {
  metric_date: string;
  metric_type: 'daily' | 'weekly' | 'monthly';
  phase1_total_events: number;
  phase1_approved_count: number;
  phase1_rejected_count: number;
  phase1_needs_revision_count: number;
  phase1_avg_accuracy: number | null;
  phase1_avg_relevance: number | null;
  phase1_avg_completeness: number | null;
  phase2b_total_chains: number;
  phase2b_approved_count: number;
  phase2b_rejected_count: number;
  phase2b_needs_revision_count: number;
  phase2b_avg_logical_coherence: number | null;
  phase2b_avg_causality_strength: number | null;
  phase2b_avg_time_horizon_accuracy: number | null;
  overall_quality_score: number | null;
}

/**
 * Calculate and store quality metrics for a given date
 */
export async function calculateQualityMetrics(date: Date = new Date()): Promise<QualityMetrics> {
  const dateStr = date.toISOString().split('T')[0];

  // Phase 1 metrics
  const { data: phase1Validations } = await supabase
    .from('event_validations')
    .select('status, accuracy_score, relevance_score, completeness_score')
    .gte('created_at', `${dateStr}T00:00:00Z`)
    .lt('created_at', `${dateStr}T23:59:59Z`);

  const phase1Total = phase1Validations?.length || 0;
  const phase1Approved = phase1Validations?.filter(v => v.status === 'approved').length || 0;
  const phase1Rejected = phase1Validations?.filter(v => v.status === 'rejected').length || 0;
  const phase1NeedsRevision = phase1Validations?.filter(v => v.status === 'needs_revision').length || 0;

  const phase1AccuracyScores = phase1Validations?.map(v => v.accuracy_score).filter(s => s !== null) || [];
  const phase1RelevanceScores = phase1Validations?.map(v => v.relevance_score).filter(s => s !== null) || [];
  const phase1CompletenessScores = phase1Validations?.map(v => v.completeness_score).filter(s => s !== null) || [];

  const phase1AvgAccuracy = phase1AccuracyScores.length > 0
    ? phase1AccuracyScores.reduce((a, b) => a + b, 0) / phase1AccuracyScores.length
    : null;
  const phase1AvgRelevance = phase1RelevanceScores.length > 0
    ? phase1RelevanceScores.reduce((a, b) => a + b, 0) / phase1RelevanceScores.length
    : null;
  const phase1AvgCompleteness = phase1CompletenessScores.length > 0
    ? phase1CompletenessScores.reduce((a, b) => a + b, 0) / phase1CompletenessScores.length
    : null;

  // Phase 2B metrics
  const { data: phase2bValidations } = await supabase
    .from('causal_chain_validations')
    .select('status, logical_coherence_score, causality_strength_score, time_horizon_accuracy_score')
    .gte('created_at', `${dateStr}T00:00:00Z`)
    .lt('created_at', `${dateStr}T23:59:59Z`);

  const phase2bTotal = phase2bValidations?.length || 0;
  const phase2bApproved = phase2bValidations?.filter(v => v.status === 'approved').length || 0;
  const phase2bRejected = phase2bValidations?.filter(v => v.status === 'rejected').length || 0;
  const phase2bNeedsRevision = phase2bValidations?.filter(v => v.status === 'needs_revision').length || 0;

  const phase2bCoherenceScores = phase2bValidations?.map(v => v.logical_coherence_score).filter(s => s !== null) || [];
  const phase2bStrengthScores = phase2bValidations?.map(v => v.causality_strength_score).filter(s => s !== null) || [];
  const phase2bTimeHorizonScores = phase2bValidations?.map(v => v.time_horizon_accuracy_score).filter(s => s !== null) || [];

  const phase2bAvgCoherence = phase2bCoherenceScores.length > 0
    ? phase2bCoherenceScores.reduce((a, b) => a + b, 0) / phase2bCoherenceScores.length
    : null;
  const phase2bAvgStrength = phase2bStrengthScores.length > 0
    ? phase2bStrengthScores.reduce((a, b) => a + b, 0) / phase2bStrengthScores.length
    : null;
  const phase2bAvgTimeHorizon = phase2bTimeHorizonScores.length > 0
    ? phase2bTimeHorizonScores.reduce((a, b) => a + b, 0) / phase2bTimeHorizonScores.length
    : null;

  // Overall quality score (weighted average)
  const scores: number[] = [];
  if (phase1AvgAccuracy !== null) scores.push(phase1AvgAccuracy);
  if (phase1AvgRelevance !== null) scores.push(phase1AvgRelevance);
  if (phase1AvgCompleteness !== null) scores.push(phase1AvgCompleteness);
  if (phase2bAvgCoherence !== null) scores.push(phase2bAvgCoherence);
  if (phase2bAvgStrength !== null) scores.push(phase2bAvgStrength);
  if (phase2bAvgTimeHorizon !== null) scores.push(phase2bAvgTimeHorizon);

  const overallQualityScore = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : null;

  const metrics: QualityMetrics = {
    metric_date: dateStr,
    metric_type: 'daily',
    phase1_total_events: phase1Total,
    phase1_approved_count: phase1Approved,
    phase1_rejected_count: phase1Rejected,
    phase1_needs_revision_count: phase1NeedsRevision,
    phase1_avg_accuracy: phase1AvgAccuracy,
    phase1_avg_relevance: phase1AvgRelevance,
    phase1_avg_completeness: phase1AvgCompleteness,
    phase2b_total_chains: phase2bTotal,
    phase2b_approved_count: phase2bApproved,
    phase2b_rejected_count: phase2bRejected,
    phase2b_needs_revision_count: phase2bNeedsRevision,
    phase2b_avg_logical_coherence: phase2bAvgCoherence,
    phase2b_avg_causality_strength: phase2bAvgStrength,
    phase2b_avg_time_horizon_accuracy: phase2bAvgTimeHorizon,
    overall_quality_score: overallQualityScore,
  };

  // Upsert metrics
  const { error } = await supabase
    .from('quality_metrics')
    .upsert(metrics, {
      onConflict: 'metric_date,metric_type',
    });

  if (error) {
    throw new Error(`Failed to save quality metrics: ${error.message}`);
  }

  return metrics;
}

/**
 * Get quality metrics for a date range
 */
export async function getQualityMetrics(
  startDate: Date,
  endDate: Date,
  metricType: 'daily' | 'weekly' | 'monthly' = 'daily'
) {
  const { data, error } = await supabase
    .from('quality_metrics')
    .select('*')
    .eq('metric_type', metricType)
    .gte('metric_date', startDate.toISOString().split('T')[0])
    .lte('metric_date', endDate.toISOString().split('T')[0])
    .order('metric_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch quality metrics: ${error.message}`);
  }

  return data || [];
}

