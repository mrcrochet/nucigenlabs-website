/**
 * Intelligence API Layer
 * 
 * Each endpoint returns ONLY one type of intelligence object
 * Strictly following the UI contract
 */

import type {
  SignalsResponse,
  EventsResponse,
  RecommendationsResponse,
  AlertsResponse,
  AnalysisResponse,
  MetricsResponse,
  Signal,
  Event,
  Recommendation,
  Alert,
  Analysis,
} from '../../types/intelligence';

// ============================================
// API BASE URL
// ============================================

const API_BASE = import.meta.env.DEV
  ? 'http://localhost:3001'
  : '/api';

// ============================================
// 1. SIGNALS API (Intelligence Page)
// ============================================

export interface SignalsQueryParams {
  scope?: 'global' | 'regional' | 'sectorial' | 'asset' | 'actor';
  horizon?: 'immediate' | 'short' | 'medium' | 'long';
  min_impact?: number; // 0-100
  min_confidence?: number; // 0-100
  page?: number;
  limit?: number;
}

export async function getSignals(
  params: SignalsQueryParams = {},
  userId?: string
): Promise<SignalsResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.scope) queryParams.append('scope', params.scope);
  if (params.horizon) queryParams.append('horizon', params.horizon);
  if (params.min_impact !== undefined) queryParams.append('min_impact', params.min_impact.toString());
  if (params.min_confidence !== undefined) queryParams.append('min_confidence', params.min_confidence.toString());
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (userId) queryParams.append('user_id', userId);

  const response = await fetch(`${API_BASE}/signals?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch signals: ${response.statusText}`);
  }

  return response.json();
}

// ============================================
// 2. EVENTS API (Events Page - Source of Truth)
// ============================================

export interface EventsQueryParams {
  region?: string;
  sector?: string;
  actor?: string;
  date_from?: string; // ISO-8601
  date_to?: string; // ISO-8601
  page?: number;
  limit?: number;
  search?: string;
}

export async function getEvents(
  params: EventsQueryParams = {},
  userId?: string
): Promise<EventsResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.region) queryParams.append('region', params.region);
  if (params.sector) queryParams.append('sector', params.sector);
  if (params.actor) queryParams.append('actor', params.actor);
  if (params.date_from) queryParams.append('date_from', params.date_from);
  if (params.date_to) queryParams.append('date_to', params.date_to);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (userId) queryParams.append('user_id', userId);

  const response = await fetch(`${API_BASE}/events?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.statusText}`);
  }

  return response.json();
}

export async function getEventById(eventId: string): Promise<Event> {
  const response = await fetch(`${API_BASE}/events/${eventId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch event: ${response.statusText}`);
  }

  return response.json();
}

// ============================================
// 3. RECOMMENDATIONS API (Recommendations Page)
// ============================================

export interface RecommendationsQueryParams {
  risk_level?: 'low' | 'medium' | 'high';
  min_confidence?: number; // 0-100
  page?: number;
  limit?: number;
}

export async function getRecommendations(
  params: RecommendationsQueryParams = {},
  userId?: string
): Promise<RecommendationsResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.risk_level) queryParams.append('risk_level', params.risk_level);
  if (params.min_confidence !== undefined) queryParams.append('min_confidence', params.min_confidence.toString());
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (userId) queryParams.append('user_id', userId);

  const response = await fetch(`${API_BASE}/recommendations?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
  }

  return response.json();
}

export async function acceptRecommendation(recommendationId: string, userId?: string): Promise<void> {
  const response = await fetch(`${API_BASE}/recommendations/${recommendationId}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to accept recommendation: ${response.statusText}`);
  }
}

export async function dismissRecommendation(recommendationId: string, userId?: string): Promise<void> {
  const response = await fetch(`${API_BASE}/recommendations/${recommendationId}/dismiss`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to dismiss recommendation: ${response.statusText}`);
  }
}

// ============================================
// 4. ALERTS API (Alerts Page)
// ============================================

export interface AlertsQueryParams {
  severity?: 'moderate' | 'high' | 'critical';
  unread_only?: boolean;
}

export async function getAlerts(
  params: AlertsQueryParams = {},
  userId?: string
): Promise<AlertsResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.severity) queryParams.append('severity', params.severity);
  if (params.unread_only) queryParams.append('unread_only', 'true');
  if (userId) queryParams.append('user_id', userId);

  const response = await fetch(`${API_BASE}/alerts?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch alerts: ${response.statusText}`);
  }

  return response.json();
}

export async function markAlertAsRead(alertId: string, userId?: string): Promise<void> {
  const response = await fetch(`${API_BASE}/alerts/${alertId}/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to mark alert as read: ${response.statusText}`);
  }
}

// ============================================
// 5. ANALYSIS API (Research Page)
// ============================================

export interface AnalysisQueryParams {
  time_horizon?: 'medium' | 'long';
  topic?: string;
  page?: number;
  limit?: number;
}

export async function getAnalysis(
  params: AnalysisQueryParams = {},
  userId?: string
): Promise<AnalysisResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.time_horizon) queryParams.append('time_horizon', params.time_horizon);
  if (params.topic) queryParams.append('topic', params.topic);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (userId) queryParams.append('user_id', userId);

  const response = await fetch(`${API_BASE}/analysis?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch analysis: ${response.statusText}`);
  }

  return response.json();
}

export async function getAnalysisById(analysisId: string): Promise<Analysis> {
  const response = await fetch(`${API_BASE}/analysis/${analysisId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch analysis: ${response.statusText}`);
  }

  return response.json();
}

// ============================================
// 6. METRICS API (Quality Page)
// ============================================

export async function getMetrics(): Promise<MetricsResponse> {
  const response = await fetch(`${API_BASE}/metrics`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch metrics: ${response.statusText}`);
  }

  return response.json();
}
