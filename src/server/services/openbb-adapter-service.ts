/**
 * OpenBB Platform adapter (Phase 3) — optional bridge to OpenBB REST API.
 * When OPENBB_API_URL is set (e.g. to a locally running OpenBB Platform or deployed instance),
 * fetches equity fundamental data to enrich company/signal views.
 * @see https://docs.openbb.co/platform/reference/equity/fundamental
 */

const OPENBB_BASE = process.env.OPENBB_API_URL || '';
const OPENBB_TIMEOUT_MS = 8000;

export interface OpenBBFundamentalMetrics {
  symbol: string;
  market_cap?: number | null;
  pe_ratio?: number | null;
  dividend_yield?: number | null;
  roe?: number | null;
  debt_to_equity?: number | null;
  source: 'openbb';
  raw?: Record<string, unknown>;
}

/**
 * Fetch fundamental metrics for a symbol from OpenBB Platform API.
 * Returns null if OPENBB_API_URL is not set or the request fails.
 */
export async function fetchOpenBBFundamentals(symbol: string): Promise<OpenBBFundamentalMetrics | null> {
  const base = OPENBB_BASE.replace(/\/$/, '');
  if (!base || !symbol?.trim()) return null;

  const ticker = symbol.trim().toUpperCase();
  try {
    // OpenBB Platform FastAPI often exposes paths like /api/v1/equity/fundamental/metrics
    const url = `${base}/api/v1/equity/fundamental/metrics?symbol=${encodeURIComponent(ticker)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(OPENBB_TIMEOUT_MS),
    });

    if (!res.ok) {
      // Try alternative path (some deployments use different prefix)
      const altUrl = `${base}/equity/fundamental/metrics?symbol=${encodeURIComponent(ticker)}`;
      const altRes = await fetch(altUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(OPENBB_TIMEOUT_MS),
      });
      if (!altRes.ok) return null;
      const data = await altRes.json().catch(() => null);
      return normalizeMetrics(ticker, data);
    }

    const data = await res.json().catch(() => null);
    return normalizeMetrics(ticker, data);
  } catch (err) {
    if (err instanceof Error && !err.message.includes('timeout')) {
      console.warn('[OpenBB] Adapter request failed:', err.message);
    }
    return null;
  }
}

function normalizeMetrics(symbol: string, data: unknown): OpenBBFundamentalMetrics {
  const obj = data && typeof data === 'object' ? data as Record<string, unknown> : {};
  const results = Array.isArray(obj.results) ? obj.results[0] : obj;
  const r = results && typeof results === 'object' ? results as Record<string, unknown> : obj;

  const num = (key: string): number | null => {
    const v = r[key];
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
    if (typeof v === 'string') {
      const n = parseFloat(v);
      return Number.isNaN(n) ? null : n;
    }
    return null;
  };

  return {
    symbol,
    market_cap: num('market_cap') ?? num('marketCap') ?? null,
    pe_ratio: num('pe_ratio') ?? num('peRatio') ?? num('pe') ?? null,
    dividend_yield: num('dividend_yield') ?? num('dividendYield') ?? null,
    roe: num('roe') ?? null,
    debt_to_equity: num('debt_to_equity') ?? num('debtToEquity') ?? null,
    source: 'openbb',
    raw: r as Record<string, unknown>,
  };
}
