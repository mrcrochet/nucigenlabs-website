/**
 * Pressure Score — Deterministic Scoring Module
 *
 * Pure functions, zero LLM dependency.
 * Computes probability, magnitude, and confidence from LLM-extracted features.
 */

import type { PressureFeatures, PressureScores } from '../../types/intelligence';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function computePressureScores(features: PressureFeatures): PressureScores {
  const timeDecay = Math.exp(-features.time_horizon_days / 45);

  const probability = clamp(
    0.15
    + 0.45 * features.evidence_strength
    + 0.25 * features.novelty
    + 0.15 * (features.impact_order === 1 ? 1 : 0),
    0,
    1,
  );

  const magnitude = Math.round(
    100 * clamp(
      0.35 * probability + 0.35 * timeDecay + 0.30 * features.novelty,
      0,
      1,
    ),
  );

  const confidence = clamp(
    0.30
    + 0.55 * features.evidence_strength
    + 0.15 * (features.citations.length >= 3 ? 1 : 0),
    0,
    1,
  );

  return {
    probability_estimate: Math.round(probability * 100) / 100,
    magnitude_estimate: magnitude,
    confidence_score: Math.round(confidence * 100) / 100,
  };
}
