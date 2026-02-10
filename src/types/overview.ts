/**
 * Overview page – Global Situation map contract (V1)
 *
 * Map-specific payload for the Overview. Not a replacement for Signal/Event;
 * this is the view model for the map and side panel.
 *
 * Sémantique produit (wording / UI):
 * - importance = gravité du signal (drives point size)
 * - impact = étendue géographique (local / regional / global, drives halo)
 *
 * Définition officielle d'un signal : voir constants/overview-signals.ts
 * Un signal = déséquilibre observable à impact global/régional. Pas une news, alerte ou hypothèse.
 */

export type OverviewSignalType =
  | 'geopolitics'
  | 'supply-chains'
  | 'markets'
  | 'energy'
  | 'security';

export type OverviewSignalImpact = 'local' | 'regional' | 'global';

export interface OverviewSignal {
  id: string;
  lat: number;
  lon: number;
  type: OverviewSignalType;
  impact: OverviewSignalImpact;
  importance: number; // 0–100, drives point size
  confidence: number; // 0–100
  occurred_at: string; // ISO-8601
  label_short: string;
  subtitle_short: string;
  impact_one_line: string;
  investigate_id: string | null;
}

/** One event line for the side panel "Top 3 events" */
export interface OverviewEventSummary {
  id: string;
  label_short: string;
  impact_one_line: string;
  investigate_id: string | null;
  /** When set, used for color bar and icon (layer type) */
  type?: OverviewSignalType;
}

/** One company line for the side panel "Top 3 corporate impacts" */
export interface OverviewCorporateImpactSummary {
  name: string;
  impact_one_line: string;
  investigate_id: string | null;
}

export interface OverviewMapStats {
  total_queried: number;
  geo_matched: number;
  geo_missed: number;
  filtered_out: number;
  final_count: number;
  effective_date_range: string;
}

export interface OverviewMapData {
  signals: OverviewSignal[];
  top_events: OverviewEventSummary[];
  top_impacts: OverviewCorporateImpactSummary[];
  is_demo?: boolean;
  stats?: OverviewMapStats;
}

/** KPIs for Overview page (source: nucigen_events, filtered by dateRange) */
export interface OverviewKpiData {
  total_events: number;
  high_impact_events: number;
  top_region: string | null;
  top_sector: string | null;
  avg_impact_score: number;
  avg_confidence: number;
}
