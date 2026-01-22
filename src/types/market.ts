/**
 * Market Intelligence Types
 */

export interface MarketInsight {
  id: string;
  event_id: string;
  company: {
    name: string;
    ticker: string;
    exchange: string;
    sector: string;
  };
  direction: 'up' | 'down';
  probability?: number; // Only visible for paid plans
  time_horizon: 'short' | 'medium' | 'long';
  thesis: string;
  confidence?: 'low' | 'medium' | 'high';
  supporting_evidence?: Array<{
    type: 'news' | 'historical_pattern';
    description: string;
    source: string;
    url: string;
  }>;
  event?: {
    id: string;
    headline: string;
    published_at: string;
  };
}

export interface MarketFilters {
  direction?: 'up' | 'down';
  sector?: string;
  time_horizon?: 'short' | 'medium' | 'long';
  min_probability?: number;
  max_probability?: number;
}

export interface MarketFeatureFlags {
  canAccessMarket: boolean;
  maxMarketCardsPerDay: number;
  canViewConfidence: boolean;
  canViewFullThesis: boolean;
  canViewSupportingEvidence: boolean;
  canViewHistoricalPatterns: boolean;
  canViewRelatedEvents: boolean;
  canExport: boolean;
}
