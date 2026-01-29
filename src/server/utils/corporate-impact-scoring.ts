/**
 * Corporate Impact Engine — scoring (0–100)
 *
 * Maps intensity + confidence from the engine output to a numeric impact_score
 * for sorting and filtering in event_impact_analyses.
 */

import type { EventImpactIntensity, EventImpactConfidence } from '../../types/corporate-impact';

const INTENSITY_SCORE: Record<EventImpactIntensity, number> = {
  Low: 25,
  Medium: 50,
  High: 75,
  Critical: 100,
};

const CONFIDENCE_SCORE: Record<EventImpactConfidence, number> = {
  High: 90,
  Medium: 60,
  Low: 30,
};

/**
 * Compute impact_score 0–100 from intensity and confidence.
 * Formula: intensity_score * (confidence_score / 100), rounded.
 */
export function computeEventImpactScore(
  intensity: EventImpactIntensity,
  confidence: EventImpactConfidence
): number {
  const i = INTENSITY_SCORE[intensity] ?? 50;
  const c = CONFIDENCE_SCORE[confidence] ?? 50;
  return Math.round((i * c) / 100);
}
