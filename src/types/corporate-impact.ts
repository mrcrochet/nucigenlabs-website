/**
 * Corporate Impact Types
 * 
 * Types for the Corporate Impact feature that identifies companies
 * likely to be impacted by geopolitical/regulatory events
 */

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
  sources: string[];
}

export interface MarketSignalFilters {
  type?: 'all' | 'opportunity' | 'risk';
  sector?: string;
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
  };
  error?: string;
}
