/**
 * Corporate Impact Types
 *
 * - EventImpactAnalysis: event-level causal analysis (Corporate Impact Engine output)
 * - MarketSignal: company-level signals (companies impacted, opportunity/risk)
 */

// ========== Corporate Impact Engine (event-level analysis) ==========

export type EventImpactDirection = 'Positive' | 'Negative' | 'Mixed';
export type EventImpactIntensity = 'Low' | 'Medium' | 'High' | 'Critical';
export type EventTimeHorizon = 'Immediate' | 'Short-term' | 'Medium-term' | 'Long-term';
export type EventImpactConfidence = 'High' | 'Medium' | 'Low';
export type EventScope = 'Local' | 'Regional' | 'Global';

export interface AffectedSector {
  sector: string;
  rationale: string;
}

export interface ExposureChannel {
  channel: string;
  explanation: string;
}

export interface ImpactAssessment {
  direction: EventImpactDirection;
  intensity: EventImpactIntensity;
  time_horizon: EventTimeHorizon;
}

/** Strict JSON output from Corporate Impact Engine prompt */
export interface CorporateImpactEngineOutput {
  event_type: string;
  event_scope: EventScope;
  affected_sectors: AffectedSector[];
  causal_chain: string[];
  exposure_channels: ExposureChannel[];
  impact_assessment: ImpactAssessment;
  confidence_level: EventImpactConfidence;
  confidence_rationale: string;
}

/** Row from event_impact_analyses table (with optional computed impact_score) */
export interface EventImpactAnalysis {
  id: string;
  event_id: string;
  event_type: string;
  event_scope: EventScope;
  affected_sectors: AffectedSector[];
  causal_chain: string[];
  exposure_channels: ExposureChannel[];
  impact_assessment: ImpactAssessment;
  confidence_level: EventImpactConfidence;
  confidence_rationale: string | null;
  impact_score: number | null;
  model_used?: string | null;
  created_at: string;
  updated_at: string;
}

// ========== Market signals (company-level) ==========

export interface MarketSignal {
  id: string;
  type: 'opportunity' | 'risk';
  company: {
    name: string;
    ticker: string | null;
    sector: string | null;
    market_cap: string | null;
    current_price: string | null;
    exchange: string | null;
  };
  prediction: {
    direction: 'up' | 'down';
    magnitude: string;
    timeframe: string;
    confidence: string;
    target_price: string | null;
  };
  catalyst_event: {
    title: string;
    event_id: string | null;
    tier: string | null;
    category: string | null; // 'geopolitics', 'finance', 'energy', 'supply-chain'
    published: string;
  };
  reasoning: {
    summary: string;
    key_factors: string[];
    risks: string[];
  };
  market_data: {
    volume_change?: string;
    institutional_interest?: string;
    analyst_coverage?: string;
    short_interest?: string;
  };
  sources: Array<string | {
    type: 'perplexity' | 'market_analysis' | 'comtrade' | 'other';
    title?: string;
    url?: string;
    description?: string;
  }>;
  trade_impact?: {
    trade_impact_score: number;
    impact_type: 'Trade Disruption' | 'Trade Reallocation' | 'Supply Chain Risk' | 'Trade Opportunity';
    direction: 'Positive' | 'Negative' | 'Mixed';
    confidence: number;
    trade_evidence: Array<{
      metric: string;
      value: string;
      period_before: string;
      period_after: string;
    }>;
    explanation?: string;
  };
}

export interface MarketSignalFilters {
  type?: 'all' | 'opportunity' | 'risk';
  sector?: string;
  category?: string; // 'all', 'geopolitics', 'finance', 'energy', 'supply-chain'
  search?: string; // Search by company name
  limit?: number;
  offset?: number;
}

export interface MarketSignalStats {
  total_signals: number;
  opportunities: number;
  risks: number;
  avg_confidence: string;
}

export interface CorporateImpactResponse {
  success: boolean;
  data?: {
    signals: MarketSignal[];
    total: number;
    stats?: MarketSignalStats;
    available_sectors?: string[];
    available_categories?: string[];
  };
  error?: string;
}
