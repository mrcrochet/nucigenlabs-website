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

/** Empty data returned when no real events are available */
const EMPTY_DATA: OverviewMapData = {
  signals: [],
  top_events: [],
  top_impacts: [],
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

/** Empty data when API fails — no more fake signals */
export { EMPTY_DATA as FALLBACK_DATA };

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
