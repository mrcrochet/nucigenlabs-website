/**
 * Overview KPI API – Fetch KPIs for Overview page (source: nucigen_events)
 */

import type { OverviewKpiData } from '../../types/overview';
import { apiUrl } from '../api-base';

export interface OverviewKpiParams {
  dateRange?: '24h' | '7d' | '30d';
}

export async function getOverviewKpis(params?: OverviewKpiParams): Promise<OverviewKpiData> {
  const searchParams = new URLSearchParams();
  if (params?.dateRange) searchParams.set('dateRange', params.dateRange);
  const query = searchParams.toString();
  const url = apiUrl('/api/overview/kpis') + (query ? `?${query}` : '');
  const res = await fetch(url);
  if (!res.ok) throw new Error('Overview KPIs fetch failed');
  const json = await res.json();
  if (!json.success || json.data == null) throw new Error('Invalid overview KPIs response');
  return json.data as OverviewKpiData;
}
