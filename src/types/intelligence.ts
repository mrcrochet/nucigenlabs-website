/**
 * UI CONTRACT GLOBAL - Nucigen Intelligence Types
 * 
 * Based on Palantir / Dataminr / Bloomberg architecture
 * Each page consumes ONLY one type of intelligence object
 */

// ============================================
// BASE INTELLIGENCE OBJECT
// ============================================

export type IntelligenceType = 
  | 'event' 
  | 'signal' 
  | 'recommendation' 
  | 'alert' 
  | 'analysis' 
  | 'metric';

export type IntelligenceScope = 
  | 'global' 
  | 'regional' 
  | 'sectorial' 
  | 'asset' 
  | 'actor';

export type TimeHorizon = 
  | 'immediate' 
  | 'short' 
  | 'medium' 
  | 'long';

export interface IntelligenceObject {
  id: string;
  type: IntelligenceType;
  scope: IntelligenceScope;
  confidence: number; // 0-100
  impact: number; // 0-100
  horizon: TimeHorizon;
  source_count: number;
  last_updated: string; // ISO-8601
}

// ============================================
// 1. SIGNAL (Intelligence Page)
// ============================================

export interface Signal extends IntelligenceObject {
  type: 'signal';
  title: string;
  summary: string; // max 2 sentences
  impact_score: number; // 0-100
  confidence_score: number; // 0-100
  time_horizon: TimeHorizon;
  related_event_ids: string[];
  why_it_matters: string; // one sentence explaining why this signal matters NOW
}

// ============================================
// 2. EVENT (Events Page - Source of Truth)
// ============================================

export interface Event extends IntelligenceObject {
  type: 'event';
  event_id: string;
  headline: string;
  description: string;
  date: string; // ISO-8601
  location: string | null;
  actors: string[];
  sectors: string[];
  sources: Array<{
    name: string;
    url: string;
  }>;
  // Optional: structured fields from nucigen_events
  event_type?: string;
  event_subtype?: string | null;
  region?: string | null;
  country?: string | null;
  why_it_matters?: string;
  first_order_effect?: string | null;
  second_order_effect?: string | null;
  impact_score?: number | null;
  confidence?: number | null;
}

// ============================================
// 3. RECOMMENDATION (Recommendations Page)
// ============================================

export interface Recommendation extends IntelligenceObject {
  type: 'recommendation';
  action: string; // concrete action proposed
  rationale: string; // clear reasoning
  supporting_signal_ids: string[];
  risk_level: 'low' | 'medium' | 'high';
  confidence_score: number; // 0-100
  related_event_ids?: string[];
}

// ============================================
// 4. ALERT (Alerts Page)
// ============================================

export interface Alert extends IntelligenceObject {
  type: 'alert';
  title: string;
  trigger_reason: string; // why the alert was triggered
  threshold_exceeded: string; // which threshold was crossed
  severity: 'moderate' | 'high' | 'critical';
  related_signal_ids: string[];
  related_event_ids?: string[];
}

// ============================================
// 5. ANALYSIS (Research Page)
// ============================================

export interface Analysis extends IntelligenceObject {
  type: 'analysis';
  title: string;
  executive_summary: string;
  key_trends: string[];
  implications: string[];
  time_horizon: 'medium' | 'long';
  referenced_event_ids: string[];
  referenced_signal_ids?: string[];
  // Optional: long-form content
  full_analysis?: string;
  pdf_url?: string;
}

// ============================================
// 6. METRIC (Quality Page)
// ============================================

export interface Metric extends IntelligenceObject {
  type: 'metric';
  coverage_score: number; // 0-100
  latency_ms: number;
  error_rate: number; // 0-1
  validation_notes: string;
  // Optional: detailed metrics
  events_processed?: number;
  signals_generated?: number;
  recommendations_active?: number;
  alerts_triggered?: number;
  data_sources_active?: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface SignalsResponse {
  signals: Signal[];
  total: number;
  page: number;
  limit: number;
}

export interface EventsResponse {
  events: Event[];
  total: number;
  page: number;
  limit: number;
}

export interface RecommendationsResponse {
  recommendations: Recommendation[];
  total: number;
  page: number;
  limit: number;
}

export interface AlertsResponse {
  alerts: Alert[];
  total: number;
  unread_count: number;
}

export interface AnalysisResponse {
  analyses: Analysis[];
  total: number;
  page: number;
  limit: number;
}

export interface MetricsResponse {
  metrics: Metric;
  timestamp: string;
}
