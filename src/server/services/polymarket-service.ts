/**
 * Polymarket Gamma API Service
 *
 * Public API for reading prediction market data from Polymarket.
 * Base URL: https://gamma-api.polymarket.com
 * No auth required for reads. Rate limit: 300 req/10s.
 */

const GAMMA_BASE = 'https://gamma-api.polymarket.com';

// Tags relevant to geopolitical / economic intelligence
const RELEVANT_TAGS = [
  // Core
  'Geopolitics', 'Economy', 'Elections', 'Conflict', 'Energy', 'Trade',
  'Finance', 'World', 'War', 'Sanctions', 'NATO',
  // Regions
  'Middle East', 'China', 'Russia', 'Europe', 'Ukraine', 'Israel',
  'Iran', 'Taiwan', 'India', 'Africa', 'Latin America',
  // Topics
  'Immigration', 'Trump', 'Trump Presidency', 'Trade War', 'Tariffs',
  'Climate', 'Oil', 'Commodities', 'Defense', 'Military',
  'Regulation', 'Central Banks', 'Federal Reserve', 'Stocks',
  'Crypto', 'AI', 'Technology', 'Cybersecurity',
  // Politics
  'Politics', 'Government', 'Policy', 'Congress', 'Senate',
];

export interface PolymarketMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  outcomes: string[];
  outcomePrices: number[];   // parsed from JSON string
  volume: number;
  liquidity: number;
  active: boolean;
  closed: boolean;
  endDate: string;
  startDate: string;
  description: string;
  groupItemTitle?: string;
  bestBid: number;
  bestAsk: number;
  lastTradePrice: number;
  oneDayPriceChange: number;
}

export interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  active: boolean;
  closed: boolean;
  volume: number;
  liquidity: number;
  tags: Array<{ id: string; label: string; slug: string }>;
  markets: PolymarketMarket[];
  startDate: string;
  endDate: string;
}

// Simple in-memory cache (1h TTL)
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) return entry.data as T;
  if (entry) cache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

function parseOutcomePrices(raw: any): number[] {
  if (Array.isArray(raw)) {
    return raw.map((p: any) => typeof p === 'string' ? parseFloat(p) : Number(p));
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(Number);
    } catch { /* ignore */ }
  }
  return [];
}

function parseMarket(raw: any): PolymarketMarket {
  return {
    id: raw.id,
    question: raw.question || '',
    conditionId: raw.conditionId || '',
    slug: raw.slug || '',
    outcomes: raw.outcomes || [],
    outcomePrices: parseOutcomePrices(raw.outcomePrices),
    volume: Number(raw.volume) || 0,
    liquidity: Number(raw.liquidity) || 0,
    active: raw.active ?? false,
    closed: raw.closed ?? false,
    endDate: raw.endDate || '',
    startDate: raw.startDate || '',
    description: raw.description || '',
    groupItemTitle: raw.groupItemTitle,
    bestBid: Number(raw.bestBid) || 0,
    bestAsk: Number(raw.bestAsk) || 0,
    lastTradePrice: Number(raw.lastTradePrice) || 0,
    oneDayPriceChange: Number(raw.oneDayPriceChange) || 0,
  };
}

function parseEvent(raw: any): PolymarketEvent {
  return {
    id: raw.id,
    title: raw.title || '',
    slug: raw.slug || '',
    description: raw.description || '',
    active: raw.active ?? false,
    closed: raw.closed ?? false,
    volume: Number(raw.volume) || 0,
    liquidity: Number(raw.liquidity) || 0,
    tags: (raw.tags || []).map((t: any) => ({
      id: t.id,
      label: t.label,
      slug: t.slug,
    })),
    markets: (raw.markets || []).map(parseMarket),
    startDate: raw.startDate || '',
    endDate: raw.endDate || '',
  };
}

async function fetchJSON(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    throw new Error(`Polymarket API ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch active events by tag
 */
export async function fetchEventsByTag(tag: string, limit = 50): Promise<PolymarketEvent[]> {
  const cacheKey = `events-tag-${tag}-${limit}`;
  const cached = getCached<PolymarketEvent[]>(cacheKey);
  if (cached) return cached;

  const url = `${GAMMA_BASE}/events?active=true&closed=false&limit=${limit}&tag=${encodeURIComponent(tag)}`;
  const data = await fetchJSON(url);
  const events = (Array.isArray(data) ? data : []).map(parseEvent);
  setCache(cacheKey, events);
  return events;
}

/**
 * Fetch all relevant events across all geopolitical/economic tags
 */
export async function fetchAllRelevantEvents(): Promise<PolymarketEvent[]> {
  const cacheKey = 'all-relevant-events';
  const cached = getCached<PolymarketEvent[]>(cacheKey);
  if (cached) return cached;

  const allEvents = new Map<string, PolymarketEvent>();

  // Fetch in batches of 5 to respect rate limits
  for (let i = 0; i < RELEVANT_TAGS.length; i += 5) {
    const batch = RELEVANT_TAGS.slice(i, i + 5);
    const results = await Promise.allSettled(
      batch.map(tag => fetchEventsByTag(tag, 30))
    );
    for (const result of results) {
      if (result.status === 'fulfilled') {
        for (const event of result.value) {
          if (!allEvents.has(event.id)) {
            allEvents.set(event.id, event);
          }
        }
      }
    }
    // Small delay between batches
    if (i + 5 < RELEVANT_TAGS.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  const events = Array.from(allEvents.values());
  setCache(cacheKey, events);
  console.log(`[Polymarket] Fetched ${events.length} unique events across ${RELEVANT_TAGS.length} tags`);
  return events;
}

/**
 * Fetch active markets directly (for broader search)
 */
export async function fetchActiveMarkets(limit = 100, offset = 0): Promise<PolymarketMarket[]> {
  const cacheKey = `markets-${limit}-${offset}`;
  const cached = getCached<PolymarketMarket[]>(cacheKey);
  if (cached) return cached;

  const url = `${GAMMA_BASE}/markets?active=true&closed=false&limit=${limit}&offset=${offset}`;
  const data = await fetchJSON(url);
  const markets = (Array.isArray(data) ? data : []).map(parseMarket);
  setCache(cacheKey, markets);
  return markets;
}

/**
 * Extract all markets from events (flattened)
 */
export function flattenMarkets(events: PolymarketEvent[]): PolymarketMarket[] {
  const seen = new Set<string>();
  const markets: PolymarketMarket[] = [];
  for (const event of events) {
    for (const market of event.markets) {
      if (!seen.has(market.id)) {
        seen.add(market.id);
        markets.push(market);
      }
    }
  }
  return markets;
}

export { RELEVANT_TAGS };
