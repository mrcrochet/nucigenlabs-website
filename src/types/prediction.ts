/**
 * Prediction Engine Types
 * 
 * Strict types for the Prediction Engine / Scenario Outlook system
 * All predictions must be grounded in real sources (articles, historical patterns)
 */

export interface EvidenceItem {
  type: 'article' | 'historical_pattern';
  title: string;
  publisher?: string; // For articles
  date?: string; // ISO date
  date_range?: string; // For historical patterns (e.g., "2014-2015")
  url: string; // Required: must be a real, accessible URL
  why_relevant: string; // 1 sentence explanation
  snippet?: string; // Optional: relevant snippet from source
}

export interface Outlook {
  id: string; // e.g., "O1", "O2"
  title: string; // Scenario name
  probability: number; // 0-1, will be normalized to sum to 1.0
  time_horizon: '1-2 weeks' | '1-3 months' | '6-12 months' | '1-2 years' | '2+ years';
  mechanism: string; // Short explanation of causal chain (2-4 sentences)
  supporting_evidence: EvidenceItem[]; // 2-6 items, all must have URLs
  counter_evidence?: EvidenceItem[]; // Optional: evidence that contradicts this scenario
  watch_indicators: string[]; // 2-5 indicators to watch
  confidence: 'high' | 'medium' | 'low';
}

export interface ProbabilityCheck {
  sum: number; // Should be 1.0 after normalization
  method: 'normalize' | 'manual';
  original_sum?: number; // Sum before normalization
}

export interface EventPrediction {
  event_id: string; // Canonical event ID
  generated_at: string; // ISO date
  ttl_expires_at: string; // ISO date (6h/12h based on tier)
  assumptions: string[]; // Key assumptions made in the analysis
  
  outlooks: Outlook[]; // 3-9 scenarios
  
  probability_check: ProbabilityCheck;
  
  // Metadata
  tier?: 'fast' | 'standard' | 'deep';
  evidence_count?: number;
  historical_patterns_count?: number;
  confidence_score?: number;
}

export interface PredictionRequest {
  event_id: string;
  tier?: 'fast' | 'standard' | 'deep';
  force_refresh?: boolean; // Force regeneration even if cached
}

export interface PredictionResponse {
  success: boolean;
  prediction?: EventPrediction;
  from_cache?: boolean;
  error?: string;
  metadata?: {
    cache_hit: boolean;
    generation_time_ms: number;
    api_calls_count: number;
    estimated_cost_usd: number;
  };
}
