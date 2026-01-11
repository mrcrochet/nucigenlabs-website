/**
 * Results Analyzer
 * 
 * Analyzes A/B test results with statistical significance testing.
 * Determines winners and auto-promotes best variants.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { calculateExperimentResults } from './experiment-manager';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[ResultsAnalyzer] Supabase not configured.');
}

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

export interface StatisticalTest {
  variantA: string;
  variantB: string;
  metric: string;
  pValue: number; // Statistical significance (lower = more significant)
  confidence: number; // 1 - pValue
  isSignificant: boolean; // pValue < 0.05
  improvement: number; // Percentage improvement
  winner: string | null;
}

export interface AnalysisResult {
  experimentId: string;
  tests: StatisticalTest[];
  overallWinner: string | null;
  confidence: number;
  recommendation: 'promote' | 'continue' | 'reject';
  reasoning: string;
}

/**
 * Analyze experiment results with statistical testing
 */
export async function analyzeExperimentResults(experimentId: string): Promise<AnalysisResult | null> {
  if (!supabase) {
    return null;
  }

  try {
    // Get experiment results
    const results = await calculateExperimentResults(experimentId);
    if (!results) {
      return null;
    }

    const control = results.control;
    const variant = results.variant;

    if (!control || !variant) {
      return null;
    }

    // Perform statistical tests
    const tests: StatisticalTest[] = [];

    // T-test for success rate
    if (control.avg_success_rate !== undefined && variant.avg_success_rate !== undefined) {
      const test = performTTest(
        'control',
        'variant',
        'success_rate',
        control.avg_success_rate,
        control.sample_size,
        variant.avg_success_rate,
        variant.sample_size
      );
      tests.push(test);
    }

    // Determine overall winner
    const significantTests = tests.filter(t => t.isSignificant);
    const winnerTests = significantTests.filter(t => t.winner === 'variant');
    const loserTests = significantTests.filter(t => t.winner === 'control');

    let overallWinner: string | null = null;
    let confidence = 0;
    let recommendation: 'promote' | 'continue' | 'reject' = 'continue';
    let reasoning = '';

    if (winnerTests.length > loserTests.length && winnerTests.length >= tests.length * 0.5) {
      overallWinner = 'variant';
      confidence = Math.min(0.95, winnerTests.reduce((sum, t) => sum + t.confidence, 0) / winnerTests.length);
      recommendation = confidence > 0.9 ? 'promote' : 'continue';
      reasoning = `Variant shows ${((results.improvement || 0) * 100).toFixed(1)}% improvement with ${(confidence * 100).toFixed(0)}% confidence`;
    } else if (loserTests.length > winnerTests.length) {
      overallWinner = 'control';
      confidence = Math.min(0.95, loserTests.reduce((sum, t) => sum + t.confidence, 0) / loserTests.length);
      recommendation = 'reject';
      reasoning = 'Control performs better, variant should be rejected';
    } else {
      reasoning = 'No clear winner, continue testing';
    }

    return {
      experimentId,
      tests,
      overallWinner,
      confidence,
      recommendation,
      reasoning,
    };
  } catch (error: any) {
    console.error('[ResultsAnalyzer] Error analyzing results:', error.message);
    return null;
  }
}

/**
 * Perform t-test for statistical significance
 */
function performTTest(
  variantA: string,
  variantB: string,
  metric: string,
  meanA: number,
  nA: number,
  meanB: number,
  nB: number
): StatisticalTest {
  // Simplified t-test calculation
  // In production, would use proper statistical library

  const diff = meanB - meanA;
  const improvement = meanA > 0 ? (diff / meanA) * 100 : 0;

  // Calculate standard error
  const seA = Math.sqrt(meanA * (1 - meanA) / nA);
  const seB = Math.sqrt(meanB * (1 - meanB) / nB);
  const seDiff = Math.sqrt(seA * seA + seB * seB);

  // Calculate t-statistic
  const tStat = seDiff > 0 ? diff / seDiff : 0;

  // Approximate p-value (simplified - would use proper t-distribution)
  const pValue = Math.max(0, Math.min(1, 2 * (1 - normalCDF(Math.abs(tStat)))));

  const isSignificant = pValue < 0.05;
  const confidence = 1 - pValue;
  const winner = isSignificant ? (diff > 0 ? variantB : variantA) : null;

  return {
    variantA,
    variantB,
    metric,
    pValue,
    confidence,
    isSignificant,
    improvement,
    winner,
  };
}

/**
 * Normal CDF approximation (for p-value calculation)
 */
function normalCDF(x: number): number {
  // Approximation of standard normal CDF
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

/**
 * Error function approximation
 */
function erf(x: number): number {
  // Approximation of error function
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

/**
 * Auto-promote winning variant if statistically significant
 */
export async function autoPromoteWinner(experimentId: string): Promise<{ promoted: boolean; variant?: string; error?: string }> {
  const analysis = await analyzeExperimentResults(experimentId);

  if (!analysis) {
    return { promoted: false, error: 'Could not analyze results' };
  }

  if (analysis.recommendation === 'promote' && analysis.overallWinner && analysis.overallWinner !== 'control') {
    // In production, would apply the winning variant configuration
    console.log(`[ResultsAnalyzer] Auto-promoting variant: ${analysis.overallWinner}`);
    return {
      promoted: true,
      variant: analysis.overallWinner,
    };
  }

  return { promoted: false };
}
