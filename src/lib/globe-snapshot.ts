/**
 * Globe — phrase d'orientation et top signals.
 * Une phrase max, pas de résumé journalistique.
 */

import type { GlobeCategory } from '../constants/globe-semantics';
import { GLOBE_CATEGORIES } from '../constants/globe-semantics';
import { eventImportance } from '../constants/globe-semantics';
import type { Event } from '../types/intelligence';
import { eventToGeoPoint } from './geo-coordinates';
import { eventToGlobeCategory } from '../constants/globe-semantics';

const REGION_LABELS: Record<string, string> = {
  'Eastern Europe': 'Eastern Europe',
  'Western Europe': 'Western Europe',
  'Europe': 'Europe',
  'Middle East': 'Middle East',
  'Moyen-Orient': 'Middle East',
  'East Africa': 'East Africa',
  'West Africa': 'West Africa',
  'Africa': 'Africa',
  'Afrique': 'Africa',
  'Asia': 'Asia',
  'Southeast Asia': 'Southeast Asia',
  'Asia-Pacific': 'Asia-Pacific',
  'North America': 'North America',
  'South America': 'South America',
  'Latin America': 'Latin America',
};

function normalizeRegion(r: string): string {
  const t = r.trim();
  return REGION_LABELS[t] || t;
}

/**
 * One sentence: where and what (orientation, not explanation).
 */
export function buildGlobalSnapshot(events: Event[]): string {
  const points = events
    .map((e) => ({ event: e, geo: eventToGeoPoint(e) }))
    .filter((p) => p.geo != null) as { event: Event; geo: { lat: number; lon: number; label?: string } }[];

  if (points.length === 0) {
    return 'No geolocated events in this period.';
  }

  const categories = new Map<GlobeCategory, number>();
  const regions = new Map<string, number>();

  for (const { event } of points) {
    const cat = eventToGlobeCategory(event);
    categories.set(cat, (categories.get(cat) ?? 0) + 1);
    const r = event.region || event.country || 'Global';
    const label = normalizeRegion(r);
    regions.set(label, (regions.get(label) ?? 0) + 1);
  }

  const topCats = [...categories.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([c]) => GLOBE_CATEGORIES[c].shortLabel);
  const topRegions = [...regions.entries()]
    .filter(([k]) => k !== 'Global')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  if (topCats.length === 0 && topRegions.length === 0) {
    return `${points.length} event${points.length !== 1 ? 's' : ''} in this period.`;
  }
  if (topCats.length === 0) {
    return `Activity concentrated in ${topRegions.join(', ')}.`;
  }
  if (topRegions.length === 0) {
    return `${topCats.join(' and ')} dominate the last period.`;
  }
  return `${topCats.join(' and ')} pressures are concentrated in ${topRegions.join(', ')}.`;
}

export interface TopSignalItem {
  id: string;
  label: string;
  location: string;
  category: string;
  categoryId: GlobeCategory;
  lat: number;
  lon: number;
  investigateHref: string;
}

/**
 * Top 3–5 signals for "where to dig", clickable → Search.
 */
export function buildTopSignals(events: Event[], maxItems: number = 5): TopSignalItem[] {
  const withGeo = events
    .map((e) => ({ event: e, geo: eventToGeoPoint(e) }))
    .filter((p) => p.geo != null) as { event: Event; geo: { lat: number; lon: number; label?: string } }[];

  const byImportance = [...withGeo]
    .sort((a, b) => eventImportance(b.event) - eventImportance(a.event))
    .slice(0, maxItems * 2);

  const seen = new Set<string>();
  const out: TopSignalItem[] = [];
  for (const { event, geo } of byImportance) {
    const location = event.country || event.region || event.location || 'Global';
    const cat = eventToGlobeCategory(event);
    const shortLabel = event.headline?.slice(0, 40)?.trim() || GLOBE_CATEGORIES[cat].shortLabel;
    const key = `${location}-${shortLabel}`;
    if (seen.has(key) || out.length >= maxItems) continue;
    seen.add(key);
    const q = encodeURIComponent([location, shortLabel].join(' '));
    out.push({
      id: event.id,
      label: shortLabel + (event.headline && event.headline.length > 40 ? '…' : ''),
      location,
      category: GLOBE_CATEGORIES[cat].shortLabel,
      categoryId: cat,
      lat: geo.lat,
      lon: geo.lon,
      investigateHref: `/search?q=${q}`,
    });
  }
  return out;
}

export type DynamicsTrend = 'up' | 'stable' | 'down';

export interface DynamicsItem {
  category: string;
  categoryId: GlobeCategory;
  trend: DynamicsTrend;
}

/**
 * Dynamics indicator: share of events per category → trend (no previous period: use share as proxy).
 * ↑ = dominant (>25%), → = present (10–25%), ↓ = low (<10%).
 */
export function buildDynamics(events: Event[]): DynamicsItem[] {
  const withGeo = events.filter((e) => eventToGeoPoint(e) != null);
  const total = withGeo.length || 1;
  const counts = new Map<GlobeCategory, number>();
  for (const e of withGeo) {
    const c = eventToGlobeCategory(e);
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const items: DynamicsItem[] = [];
  for (const [cat, count] of counts.entries()) {
    const share = count / total;
    let trend: DynamicsTrend = 'stable';
    if (share >= 0.25) trend = 'up';
    else if (share < 0.1) trend = 'down';
    items.push({
      category: GLOBE_CATEGORIES[cat].shortLabel,
      categoryId: cat,
      trend,
    });
  }
  return items.sort((a, b) => (b.trend === 'up' ? 1 : 0) - (a.trend === 'up' ? 1 : 0));
}
