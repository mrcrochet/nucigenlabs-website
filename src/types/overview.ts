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
}

/** One company line for the side panel "Top 3 corporate impacts" */
export interface OverviewCorporateImpactSummary {
  name: string;
  impact_one_line: string;
  investigate_id: string | null;
}

export interface OverviewMapData {
  signals: OverviewSignal[];
  top_events: OverviewEventSummary[];
  top_impacts: OverviewCorporateImpactSummary[];
}
