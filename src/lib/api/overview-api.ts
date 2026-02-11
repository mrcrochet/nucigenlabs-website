/**
 * Overview map API – Global Situation signals and side panel data
 */

import type { OverviewMapData } from '../../types/overview';
import { apiUrl } from '../api-base';

export interface OverviewMapParams {
  dateRange?: '24h' | '7d' | '30d';
  scopeMode?: 'global' | 'watchlist';
  q?: string;
  /** Filter by country names (e.g. ['France', 'United States']). Omit or empty = all countries. */
  countries?: string[];
  /** Clerk user ID; used when scopeMode is 'watchlist' to filter by watchlist entities */
  userId?: string;
  /** Filter by signal types (e.g. ['geopolitics', 'markets']). Omit or all 5 = no filter. */
  typesEnabled?: string[];
  /** Minimum importance threshold (0-100). Omit or 0 = no filter. */
  minImportance?: number;
}

const FALLBACK_DATA: OverviewMapData = {
  signals: [
    { id: '1', lat: -2.5, lon: 28.8, type: 'security', impact: 'regional', importance: 85, confidence: 82, occurred_at: new Date().toISOString(), label_short: 'DRC – North Kivu', subtitle_short: 'ADF activity escalation', impact_one_line: 'Gold supply risk', investigate_id: '/search' },
    { id: '2', lat: 25.2, lon: 55.3, type: 'supply-chains', impact: 'global', importance: 78, confidence: 76, occurred_at: new Date().toISOString(), label_short: 'UAE – Dubai', subtitle_short: 'Gold trade hub disruption', impact_one_line: 'Precious metals flow', investigate_id: '/search' },
    { id: '3', lat: 51.5, lon: -0.1, type: 'geopolitics', impact: 'global', importance: 90, confidence: 94, occurred_at: new Date().toISOString(), label_short: 'UK – London', subtitle_short: 'Sanctions policy update', impact_one_line: 'Financial compliance', investigate_id: '/search' },
    { id: '4', lat: 55.7, lon: 37.6, type: 'energy', impact: 'regional', importance: 72, confidence: 88, occurred_at: new Date().toISOString(), label_short: 'Russia – Moscow', subtitle_short: 'Energy export reconfiguration', impact_one_line: 'Gas supply routes', investigate_id: '/search' },
    { id: '5', lat: 39.9, lon: 116.4, type: 'supply-chains', impact: 'global', importance: 80, confidence: 79, occurred_at: new Date().toISOString(), label_short: 'China – Beijing', subtitle_short: 'Strategic minerals stockpiling', impact_one_line: 'Rare earth dominance', investigate_id: '/search' },
    { id: '6', lat: 40.7, lon: -74.0, type: 'markets', impact: 'global', importance: 88, confidence: 91, occurred_at: new Date().toISOString(), label_short: 'USA – New York', subtitle_short: 'Financial markets volatility', impact_one_line: 'Commodity futures', investigate_id: '/search' },
  ],
  top_events: [
    { id: '1', label_short: 'DRC – North Kivu', impact_one_line: 'Gold supply risk', investigate_id: '/search' },
    { id: '2', label_short: 'UAE – Dubai', impact_one_line: 'Precious metals flow', investigate_id: '/search' },
    { id: '3', label_short: 'UK – London', impact_one_line: 'Financial compliance', investigate_id: '/search' },
  ],
  top_impacts: [
    { name: 'Barrick Gold', impact_one_line: 'Production disruption', investigate_id: '/search' },
    { name: 'Gazprom', impact_one_line: 'Route reconfiguration', investigate_id: '/search' },
    { name: 'HSBC', impact_one_line: 'Compliance costs', investigate_id: '/search' },
  ],
};

export async function getOverviewMapData(params?: OverviewMapParams): Promise<OverviewMapData> {
  const searchParams = new URLSearchParams();
  if (params?.dateRange) searchParams.set('dateRange', params.dateRange);
  if (params?.scopeMode) searchParams.set('scopeMode', params.scopeMode);
  if (params?.q?.trim()) searchParams.set('q', params.q.trim());
  if (params?.countries?.length) searchParams.set('countries', params.countries.join(','));
  if (params?.userId) searchParams.set('userId', params.userId);
  if (params?.typesEnabled?.length) searchParams.set('typesEnabled', params.typesEnabled.join(','));
  if (params?.minImportance != null && params.minImportance > 0) searchParams.set('minImportance', String(params.minImportance));
  const query = searchParams.toString();
  const url = apiUrl('/api/overview/map') + (query ? `?${query}` : '');
  const res = await fetch(url);
  if (!res.ok) throw new Error('Overview map fetch failed');
  const json = await res.json();
  if (!json.success || !json.data) throw new Error('Invalid overview map response');
  return json.data as OverviewMapData;
}

/** Fallback data when API fails (caller can use for degraded UX) */
export { FALLBACK_DATA };

/** Situation brief (Perplexity) for Overview — by country or global */
export interface OverviewSituationParams {
  country?: string | null;
}

export interface OverviewSituationData {
  summary: string;
  country: string | null;
}

/** Feed config stored per user in Supabase */
export interface OverviewFeedConfig {
  types_enabled?: string[] | null;
  min_importance?: number | null;
}

export async function getOverviewFeedConfig(userId: string): Promise<OverviewFeedConfig | null> {
  const url = apiUrl(`/api/overview/feed-config?userId=${encodeURIComponent(userId)}`);
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  return json.success && json.data ? (json.data as OverviewFeedConfig) : null;
}

export async function saveOverviewFeedConfig(userId: string, config: OverviewFeedConfig): Promise<void> {
  await fetch(apiUrl('/api/overview/feed-config'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...config }),
  });
}

export async function getOverviewSituation(
  params?: OverviewSituationParams
): Promise<OverviewSituationData> {
  const searchParams = new URLSearchParams();
  if (params?.country?.trim()) searchParams.set('country', params.country.trim());
  const query = searchParams.toString();
  const url = apiUrl('/api/overview/situation') + (query ? `?${query}` : '');
  const res = await fetch(url);
  if (!res.ok) throw new Error('Overview situation fetch failed');
  const json = await res.json();
  if (!json.success || json.data == null) throw new Error('Invalid overview situation response');
  return json.data as OverviewSituationData;
}
