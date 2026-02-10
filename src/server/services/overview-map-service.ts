/**
 * Overview Map Service – Transform events/signals into Overview map data
 *
 * V2: Case-insensitive geo matching, sort by impact, auto-expand date range,
 * coordinate jitter for same-location events, is_demo flag + pipeline stats.
 */

import type {
  OverviewMapData,
  OverviewSignal,
  OverviewEventSummary,
  OverviewCorporateImpactSummary,
  OverviewSignalType,
  OverviewSignalImpact,
  OverviewMapStats,
} from '../../types/overview';
import { eventToGeoPoint } from '../../lib/geo-coordinates';
import { OVERVIEW_MAP_MAX_SIGNALS } from '../../constants/overview-signals';
import type { SupabaseClient } from '@supabase/supabase-js';

interface NucigenEventRow {
  id: string;
  source_event_id?: string;
  event_type: string;
  event_subtype: string | null;
  summary: string;
  country: string | null;
  region: string | null;
  sector: string | null;
  why_it_matters: string | null;
  first_order_effect: string | null;
  impact_score: number | null;
  confidence: number | null;
  created_at: string;
}

/** Map nucigen_events.event_type + sector → OverviewSignalType */
function eventToOverviewType(row: NucigenEventRow): OverviewSignalType {
  const et = (row.event_type || '').toLowerCase();
  const sector = (row.sector || '').toLowerCase();

  if (sector.includes('energy') || et.includes('energy')) return 'energy';
  if (et === 'geopolitical' || et === 'regulatory') return 'geopolitics';
  if (et === 'supplychain' || et === 'industrial') return 'supply-chains';
  if (et === 'market') return 'markets';
  if (et === 'security') return 'security';

  if (sector.includes('commodity') || sector.includes('material')) return 'supply-chains';
  if (sector.includes('financial') || sector.includes('bank')) return 'markets';

  return 'geopolitics';
}

/** Map impact_score (0-1) to Overview impact scope */
function scoreToImpact(impact: number | null): OverviewSignalImpact {
  if (!impact) return 'regional';
  if (impact >= 0.7) return 'global';
  if (impact >= 0.4) return 'regional';
  return 'local';
}

export interface OverviewMapServiceParams {
  dateRange?: '24h' | '7d' | '30d';
  scopeMode?: 'global' | 'watchlist';
  q?: string;
  /** Filter events by country (case-insensitive match on nucigen_events.country) */
  countries?: string[];
  sourcesEnabled?: string[];
  typesEnabled?: string[];
  minImportance?: number;
  maxSignals?: number;
  /** Supabase user UUID; required when scopeMode is 'watchlist' to filter by watchlist entities */
  supabaseUserId?: string | null;
}

/** Default fixture when no real data */
const FIXTURE: OverviewMapData = {
  signals: [
    { id: '1', lat: -2.5, lon: 28.8, type: 'security', impact: 'regional', importance: 85, confidence: 82, occurred_at: new Date().toISOString(), label_short: 'DRC – North Kivu', subtitle_short: 'ADF activity escalation', impact_one_line: 'Gold supply risk', investigate_id: '/search' },
    { id: '2', lat: 25.2, lon: 55.3, type: 'supply-chains', impact: 'global', importance: 78, confidence: 76, occurred_at: new Date().toISOString(), label_short: 'UAE – Dubai', subtitle_short: 'Gold trade hub disruption', impact_one_line: 'Precious metals flow', investigate_id: '/search' },
    { id: '3', lat: 51.5, lon: -0.1, type: 'geopolitics', impact: 'global', importance: 90, confidence: 94, occurred_at: new Date().toISOString(), label_short: 'UK – London', subtitle_short: 'Sanctions policy update', impact_one_line: 'Financial compliance', investigate_id: '/search' },
    { id: '4', lat: 55.7, lon: 37.6, type: 'energy', impact: 'regional', importance: 72, confidence: 88, occurred_at: new Date().toISOString(), label_short: 'Russia – Moscow', subtitle_short: 'Energy export reconfiguration', impact_one_line: 'Gas supply routes', investigate_id: '/search' },
    { id: '5', lat: 39.9, lon: 116.4, type: 'supply-chains', impact: 'global', importance: 80, confidence: 79, occurred_at: new Date().toISOString(), label_short: 'China – Beijing', subtitle_short: 'Strategic minerals stockpiling', impact_one_line: 'Rare earth dominance', investigate_id: '/search' },
    { id: '6', lat: 40.7, lon: -74.0, type: 'markets', impact: 'global', importance: 88, confidence: 91, occurred_at: new Date().toISOString(), label_short: 'USA – New York', subtitle_short: 'Financial markets volatility', impact_one_line: 'Commodity futures', investigate_id: '/search' },
  ],
  top_events: [
    { id: '1', label_short: 'DRC – North Kivu', impact_one_line: 'Gold supply risk', investigate_id: '/search', type: 'security' },
    { id: '2', label_short: 'UAE – Dubai', impact_one_line: 'Precious metals flow', investigate_id: '/search', type: 'supply-chains' },
    { id: '3', label_short: 'UK – London', impact_one_line: 'Financial compliance', investigate_id: '/search', type: 'geopolitics' },
  ],
  top_impacts: [
    { name: 'Barrick Gold', impact_one_line: 'Production disruption', investigate_id: '/search' },
    { name: 'Gazprom', impact_one_line: 'Route reconfiguration', investigate_id: '/search' },
    { name: 'HSBC', impact_one_line: 'Compliance costs', investigate_id: '/search' },
  ],
  is_demo: true,
  stats: { total_queried: 0, geo_matched: 0, geo_missed: 0, filtered_out: 0, final_count: 6, effective_date_range: 'demo' },
};

/**
 * When scopeMode is watchlist, get nucigen_event IDs (or sector/country filters) from user watchlist.
 */
async function getWatchlistFilters(
  supabase: SupabaseClient,
  supabaseUserId: string
): Promise<{ eventIds: string[]; sectors: string[]; countries: string[] }> {
  const { data: watchlistRows, error } = await supabase
    .from('watchlists')
    .select('entity_type, entity_id')
    .eq('user_id', supabaseUserId);

  if (error || !watchlistRows?.length) {
    return { eventIds: [], sectors: [], countries: [] };
  }

  const eventIds: string[] = [];
  const sectors: string[] = [];
  const countries: string[] = [];

  for (const row of watchlistRows as { entity_type: string; entity_id: string }[]) {
    const type = (row.entity_type || '').toLowerCase();
    const id = (row.entity_id || '').trim();
    if (!id) continue;
    if (type === 'event') eventIds.push(id);
    else if (type === 'sector') sectors.push(id);
    else if (type === 'country') countries.push(id);
  }

  return { eventIds, sectors, countries };
}

const SELECT_COLS = 'id, source_event_id, event_type, event_subtype, summary, country, region, sector, why_it_matters, first_order_effect, impact_score, confidence, created_at';

/**
 * Query nucigen_events within a date range, sorted by impact then recency.
 */
async function queryEvents(
  supabase: SupabaseClient,
  dateFrom: string,
): Promise<NucigenEventRow[]> {
  const { data, error } = await supabase
    .from('nucigen_events')
    .select(SELECT_COLS)
    .gte('created_at', dateFrom)
    .order('impact_score', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.warn('[OverviewMapService] nucigen_events query failed:', error.message);
    return [];
  }

  return (data || []) as NucigenEventRow[];
}

function hoursToDateFrom(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

const DATE_RANGE_HOURS: Record<string, number> = {
  '24h': 24,
  '7d': 7 * 24,
  '30d': 30 * 24,
};

/** Enrich top_events with live news: EventRegistry first, then Tavily fallback when fewer than 3. */
async function enrichTopEventsFromNews(
  existing: OverviewEventSummary[],
  dateRange: string
): Promise<OverviewEventSummary[]> {
  if (existing.length >= 3) return existing;

  const days = dateRange === '30d' ? 30 : dateRange === '7d' ? 7 : 1;
  const seen = new Set(existing.map((e) => e.label_short.toLowerCase().slice(0, 30)));

  const pushNews = (id: string, label: string, impactLine: string) => {
    const key = label.toLowerCase().slice(0, 30);
    if (existing.length >= 3 || seen.has(key)) return;
    seen.add(key);
    existing.push({
      id,
      label_short: label.slice(0, 60),
      impact_one_line: impactLine.slice(0, 80),
      investigate_id: '/search',
      type: 'geopolitics',
    });
  };

  if (process.env.EVENTREGISTRY_API_KEY) {
    try {
      const { searchEvents } = await import('./eventregistry-service.js');
      const dateStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const dateEnd = new Date().toISOString().slice(0, 10);
      const res = await searchEvents({
        sortBy: 'date',
        sortByAsc: false,
        eventsCount: 5,
        dateStart,
        dateEnd,
        lang: 'eng',
      });
      const results = (res?.events?.results || []) as Array<{ uri?: string; title?: string; summary?: string; location?: { label?: string } }>;
      for (const ev of results) {
        const label = (ev.title || '').trim() || (ev.location?.label || 'News');
        const impactLine = (ev.summary || '').trim() || 'Latest development.';
        pushNews(`news-er-${ev.uri || Math.random().toString(36).slice(2)}`, label, impactLine);
      }
    } catch (err) {
      console.warn('[OverviewMapService] EventRegistry enrich skipped:', (err as Error)?.message);
    }
  }

  if (existing.length < 3 && process.env.TAVILY_API_KEY) {
    try {
      const { searchTavily } = await import('./tavily-unified-service.js');
      const tavilyRes = await searchTavily('geopolitics OR markets OR energy OR supply chain', 'news', {
        maxResults: 5,
        days,
      });
      const articles = tavilyRes?.articles || [];
      for (const a of articles) {
        const label = (a.title || '').trim();
        const impactLine = (a.content || a.title || '').trim().slice(0, 80) || 'Latest development.';
        if (label) pushNews(`news-tavily-${a.url || Math.random().toString(36).slice(2)}`, label, impactLine);
      }
    } catch (err) {
      console.warn('[OverviewMapService] Tavily enrich skipped:', (err as Error)?.message);
    }
  }

  return existing;
}

/**
 * Fetch Overview map data from nucigen_events (RSS + pipeline processed).
 * Auto-expands date range when no results. Falls back to fixture as last resort.
 */
export async function getOverviewMapDataFromEvents(
  supabase: SupabaseClient | null,
  params: OverviewMapServiceParams = {}
): Promise<OverviewMapData> {
  const {
    dateRange = '24h',
    q,
    scopeMode = 'global',
    countries: countriesFilter,
    sourcesEnabled,
    typesEnabled,
    minImportance,
    maxSignals = OVERVIEW_MAP_MAX_SIGNALS,
    supabaseUserId,
  } = params;

  if (!supabase) {
    return FIXTURE;
  }

  // --- Auto-expand: try requested range, then widen if empty ---
  const rangesToTry: string[] = [dateRange];
  if (dateRange === '24h') rangesToTry.push('7d', '30d');
  else if (dateRange === '7d') rangesToTry.push('30d');

  let rows: NucigenEventRow[] = [];
  let effectiveDateRange = dateRange;

  for (const range of rangesToTry) {
    const hours = DATE_RANGE_HOURS[range] ?? 24;
    rows = await queryEvents(supabase, hoursToDateFrom(hours));
    effectiveDateRange = range;
    if (rows.length > 0) break;
  }

  const stats: OverviewMapStats = {
    total_queried: rows.length,
    geo_matched: 0,
    geo_missed: 0,
    filtered_out: 0,
    final_count: 0,
    effective_date_range: effectiveDateRange,
  };

  if (rows.length === 0) {
    console.log('[OverviewMapService] No events found in any date range →', stats);
    return { ...FIXTURE, stats };
  }

  let events = rows;

  // --- Watchlist filtering ---
  if (scopeMode === 'watchlist' && supabaseUserId) {
    const { eventIds, sectors, countries } = await getWatchlistFilters(supabase, supabaseUserId);
    const hasFilter = eventIds.length > 0 || sectors.length > 0 || countries.length > 0;
    if (hasFilter) {
      const sectorSet = new Set(sectors.map((s) => s.toLowerCase()));
      const countrySet = new Set(countries.map((c) => c.toLowerCase()));
      const eventIdSet = new Set(eventIds);
      events = events.filter(
        (e) =>
          eventIdSet.has(e.id) ||
          (e.sector && sectorSet.has(e.sector.toLowerCase())) ||
          (e.country && countrySet.has(e.country.toLowerCase()))
      );
    }
  }

  // --- Country filtering ---
  if (countriesFilter?.length) {
    const countrySet = new Set(countriesFilter.map((c) => c.trim().toLowerCase()).filter(Boolean));
    const before = events.length;
    events = events.filter(
      (e) => e.country && countrySet.has(e.country.trim().toLowerCase())
    );
    stats.filtered_out += before - events.length;
  }

  // --- Source filtering ---
  if (sourcesEnabled?.length) {
    const eventIdsFromNe = events.map((e) => e.source_event_id).filter(Boolean) as string[];
    if (eventIdsFromNe.length > 0) {
      const { data: evRows } = await supabase
        .from('events')
        .select('id')
        .in('id', eventIdsFromNe)
        .in('source', sourcesEnabled);
      const allowedIds = new Set((evRows || []).map((r: { id: string }) => r.id));
      events = events.filter((e) => e.source_event_id && allowedIds.has(e.source_event_id));
    } else {
      events = [];
    }
  }

  // --- Build signals with geo-coordinates ---
  const signals: OverviewSignal[] = [];
  const seenCoords = new Set<string>();
  let jitterIndex = 0;

  for (const row of events) {
    if (signals.length >= maxSignals) break;

    const geo = eventToGeoPoint({
      country: row.country,
      region: row.region,
      location: row.summary?.match(/\b[A-Z][a-z]+(,\s*[A-Z][a-z]+)?\b/)?.[0] ?? null,
    });

    if (!geo) {
      stats.geo_missed++;
      continue;
    }

    stats.geo_matched++;

    // Dedup with jitter: allow multiple events near the same location
    let coordKey = `${geo.lat.toFixed(2)},${geo.lon.toFixed(2)}`;
    if (seenCoords.has(coordKey)) {
      jitterIndex++;
      // Offset by ~50km in alternating directions
      geo.lat += ((jitterIndex % 3) - 1) * 0.5;
      geo.lon += (jitterIndex % 2 === 0 ? 0.5 : -0.5);
      coordKey = `${geo.lat.toFixed(2)},${geo.lon.toFixed(2)}`;
      if (seenCoords.has(coordKey)) {
        stats.filtered_out++;
        continue;
      }
    }
    seenCoords.add(coordKey);

    const overviewType = eventToOverviewType(row);
    const importance = Math.round((row.impact_score ?? 0.5) * 100);
    const confidence = Math.round((row.confidence ?? 0.7) * 100);

    if (minImportance != null && importance < minImportance) {
      stats.filtered_out++;
      continue;
    }
    if (typesEnabled?.length && !typesEnabled.includes(overviewType)) {
      stats.filtered_out++;
      continue;
    }

    const label = [row.country || row.region || 'Unknown', row.sector ? ` – ${row.sector}` : ''].join('');
    const subtitle = row.summary?.slice(0, 80) || '';
    const impactLine = row.why_it_matters || row.first_order_effect || row.summary?.slice(0, 60) || '';

    if (q?.trim()) {
      const searchLower = q.toLowerCase();
      const matches =
        label.toLowerCase().includes(searchLower) ||
        subtitle.toLowerCase().includes(searchLower) ||
        impactLine.toLowerCase().includes(searchLower);
      if (!matches) {
        stats.filtered_out++;
        continue;
      }
    }

    signals.push({
      id: row.id,
      lat: geo.lat,
      lon: geo.lon,
      type: overviewType,
      impact: scoreToImpact(row.impact_score),
      importance: Math.max(30, Math.min(100, importance)),
      confidence: Math.max(50, Math.min(100, confidence)),
      occurred_at: row.created_at,
      label_short: label.slice(0, 60),
      subtitle_short: subtitle,
      impact_one_line: impactLine.slice(0, 80),
      investigate_id: `/events/${row.id}`,
    });
  }

  stats.final_count = signals.length;

  // --- Top events: first 3 from signals, then enrich with live news (EventRegistry) if needed ---
  let top_events: OverviewEventSummary[] = signals.slice(0, 3).map((s) => ({
    id: s.id,
    label_short: s.label_short,
    impact_one_line: s.impact_one_line,
    investigate_id: s.investigate_id,
    type: s.type,
  }));
  top_events = await enrichTopEventsFromNews(top_events, dateRange);

  // --- Top corporate impacts ---
  let top_impacts: OverviewCorporateImpactSummary[] = FIXTURE.top_impacts;
  const { data: impactRows } = await supabase
    .from('market_signals')
    .select('id, company_name, reasoning_summary, catalyst_event_title')
    .eq('is_active', true)
    .order('generated_at', { ascending: false })
    .limit(3);
  if (impactRows?.length) {
    top_impacts = (impactRows as { id: string; company_name: string; reasoning_summary: string; catalyst_event_title: string }[]).map((r) => ({
      name: r.company_name || 'Unknown',
      impact_one_line: (r.reasoning_summary || r.catalyst_event_title || '').slice(0, 80),
      investigate_id: `/corporate-impact`,
    }));
  }

  const isDemo = signals.length === 0;
  const useEnrichedEvents = top_events.length > 0 ? top_events : (isDemo ? FIXTURE.top_events : top_events);

  console.log('[OverviewMapService]', stats);

  return {
    signals: isDemo ? FIXTURE.signals : signals,
    top_events: useEnrichedEvents,
    top_impacts,
    is_demo: isDemo,
    stats,
  };
}
