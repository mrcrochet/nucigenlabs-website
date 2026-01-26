/**
 * Signal Posture Utility
 * 
 * Determines the recommended posture (ACT/PREPARE/MONITOR/IGNORE) for a signal
 * based on impact score, confidence score, and time horizon.
 * 
 * This transforms signals into actionable stances, not just predictions.
 */

import type { Signal } from '../types/intelligence';
import type { MarketSignal } from '../types/corporate-impact';

export type SignalPosture = 'ACT' | 'PREPARE' | 'MONITOR' | 'IGNORE';

export interface PostureDetails {
  posture: SignalPosture;
  reason: string;
  roleContext?: string; // For role-based context (portfolio, supply chain, etc.)
}

/**
 * Determine posture for a general Signal
 */
export function getSignalPosture(signal: Signal): PostureDetails {
  const { impact_score, confidence_score, time_horizon } = signal;

  // High impact + High confidence + Immediate/Short horizon = ACT
  if (impact_score >= 75 && confidence_score >= 75 && (time_horizon === 'immediate' || time_horizon === 'short')) {
    return {
      posture: 'ACT',
      reason: 'High-impact signal with strong confidence requires immediate attention',
      roleContext: getRoleContext(signal, 'ACT'),
    };
  }

  // High impact + Medium confidence OR Medium impact + High confidence = PREPARE
  if (
    (impact_score >= 75 && confidence_score >= 60) ||
    (impact_score >= 60 && confidence_score >= 75) ||
    (impact_score >= 70 && time_horizon === 'medium')
  ) {
    return {
      posture: 'PREPARE',
      reason: 'Significant exposure detected. Prepare response strategies.',
      roleContext: getRoleContext(signal, 'PREPARE'),
    };
  }

  // Medium impact + Medium confidence OR Any signal with long horizon = MONITOR
  if (
    (impact_score >= 50 && confidence_score >= 50) ||
    time_horizon === 'long' ||
    (impact_score >= 40 && confidence_score >= 60)
  ) {
    return {
      posture: 'MONITOR',
      reason: 'Emerging pattern detected. Monitor for threshold changes.',
      roleContext: getRoleContext(signal, 'MONITOR'),
    };
  }

  // Low impact OR Low confidence = IGNORE (but still tracked)
  return {
    posture: 'IGNORE',
    reason: 'Below actionable thresholds. System continues monitoring.',
    roleContext: getRoleContext(signal, 'IGNORE'),
  };
}

/**
 * Determine posture for a MarketSignal (Corporate Impact)
 */
export function getMarketSignalPosture(signal: MarketSignal): PostureDetails {
  const confidencePercent = getConfidencePercent(signal.prediction.confidence);
  const isHighImpact = signal.type === 'risk' && signal.trade_impact?.direction === 'Negative';
  const isOpportunity = signal.type === 'opportunity';

  // High confidence risk with negative trade impact = ACT
  if (isHighImpact && confidencePercent >= 75 && signal.trade_impact?.trade_impact_score && signal.trade_impact.trade_impact_score >= 70) {
    return {
      posture: 'ACT',
      reason: 'High-impact corporate exposure requires immediate review',
      roleContext: 'For supply chain risk management',
    };
  }

  // Opportunity with high confidence = PREPARE
  if (isOpportunity && confidencePercent >= 70) {
    return {
      posture: 'PREPARE',
      reason: 'Positive scenario with strong confidence. Prepare positioning.',
      roleContext: 'For capital allocation',
    };
  }

  // Medium confidence risk = PREPARE
  if (isHighImpact && confidencePercent >= 60) {
    return {
      posture: 'PREPARE',
      reason: 'Corporate exposure detected. Prepare mitigation strategies.',
      roleContext: 'For portfolio exposure',
    };
  }

  // Any signal with medium confidence = MONITOR
  if (confidencePercent >= 50) {
    return {
      posture: 'MONITOR',
      reason: 'Corporate signal detected. Monitor for developments.',
      roleContext: 'For policy monitoring',
    };
  }

  return {
    posture: 'IGNORE',
    reason: 'Below actionable thresholds',
    roleContext: undefined,
  };
}

/**
 * Get confidence percentage from confidence string
 */
function getConfidencePercent(confidence: string): number {
  const map: Record<string, number> = {
    high: 85,
    'medium-high': 72,
    medium: 60,
    'medium-low': 45,
    low: 30,
  };
  return map[confidence.toLowerCase()] || 60;
}

/**
 * Get role-based context for posture
 */
function getRoleContext(signal: Signal, posture: SignalPosture): string | undefined {
  // Determine context based on signal scope and type
  if (signal.scope === 'sectorial' || signal.scope === 'asset') {
    if (posture === 'ACT') return 'For portfolio exposure';
    if (posture === 'PREPARE') return 'For capital allocation';
    return 'For policy monitoring';
  }

  if (signal.scope === 'regional' || signal.scope === 'global') {
    if (posture === 'ACT') return 'For supply chain risk management';
    if (posture === 'PREPARE') return 'For operational readiness';
    return 'For strategic planning';
  }

  return undefined;
}

/**
 * Get posture badge color
 */
export function getPostureBadgeColor(posture: SignalPosture): string {
  switch (posture) {
    case 'ACT':
      return 'bg-[#E1463E]/20 text-[#E1463E] border-[#E1463E]/30';
    case 'PREPARE':
      return 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30';
    case 'MONITOR':
      return 'bg-blue-400/20 text-blue-400 border-blue-400/30';
    case 'IGNORE':
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}

/**
 * Get posture icon
 */
export function getPostureIcon(posture: SignalPosture) {
  // Icons will be imported in components
  return posture;
}
