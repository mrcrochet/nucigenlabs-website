/**
 * Overview KPI Service – Aggregate KPIs from nucigen_events
 * Used by GET /api/overview/kpis with dateRange (24h / 7d / 30d).
 */

import type { OverviewKpiData } from '../../types/overview';
import type { SupabaseClient } from '@supabase/supabase-js';

interface NucigenEventRow {
  id: string;
  region: string | null;
  sector: string | null;
  impact_score: number | null;
  confidence: number | null;
  created_at: string;
}

const SELECT_COLS = 'id, region, sector, impact_score, confidence, created_at';

const DATE_RANGE_HOURS: Record<string, number> = {
  '24h': 24,
  '7d': 7 * 24,
  '30d': 30 * 24,
};

function hoursToDateFrom(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function mostFrequent(values: (string | null)[]): string | null {
  const nonNull = values.filter((v): v is string => v != null && v.trim() !== '');
  if (nonNull.length === 0) return null;
  const counts = new Map<string, number>();
  for (const v of nonNull) {
    const key = v.trim().toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let maxKey: string | null = null;
  let maxCount = 0;
  for (const [key, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      maxKey = key;
    }
  }
  if (!maxKey) return null;
  const first = nonNull.find((v) => v.trim().toLowerCase() === maxKey);
  return first ?? maxKey;
}

/**
 * Compute Overview KPIs from nucigen_events for the given date range.
 */
export async function getOverviewKpis(
  supabase: SupabaseClient | null,
  dateRange: '24h' | '7d' | '30d' = '24h'
): Promise<OverviewKpiData> {
  const empty: OverviewKpiData = {
    total_events: 0,
    high_impact_events: 0,
    top_region: null,
    top_sector: null,
    avg_impact_score: 0,
    avg_confidence: 0,
  };

  if (!supabase) return empty;

  const hours = DATE_RANGE_HOURS[dateRange] ?? 24;
  const dateFrom = hoursToDateFrom(hours);

  const { data, error } = await supabase
    .from('nucigen_events')
    .select(SELECT_COLS)
    .gte('created_at', dateFrom)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[OverviewKpiService] nucigen_events query failed:', error.message);
    return empty;
  }

  const rows = (data || []) as NucigenEventRow[];
  const total_events = rows.length;
  const high_impact_events = rows.filter((r) => (r.impact_score ?? 0) >= 0.75).length;

  const impactScores = rows.map((r) => r.impact_score).filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
  const confidences = rows.map((r) => r.confidence).filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));

  const avg_impact_score =
    impactScores.length > 0 ? impactScores.reduce((a, b) => a + b, 0) / impactScores.length : 0;
  const avg_confidence =
    confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;

  const top_region = mostFrequent(rows.map((r) => r.region));
  const top_sector = mostFrequent(rows.map((r) => r.sector));

  return {
    total_events,
    high_impact_events,
    top_region,
    top_sector,
    avg_impact_score: Math.round(avg_impact_score * 100) / 100,
    avg_confidence: Math.round(avg_confidence * 100) / 100,
  };
}
