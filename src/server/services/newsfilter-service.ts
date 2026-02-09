/**
 * Newsfilter.io adapter (Phase 3) — optional real-time financial news source.
 * When NEWSFILTER_API_KEY (and optionally NEWSFILTER_API_URL) is set, fetches recent articles
 * from the Query API to enrich market digest or Discover.
 * @see https://developers.newsfilter.io/
 */

const NEWSFILTER_BASE = process.env.NEWSFILTER_API_URL || 'https://api.newsfilter.io';
const NEWSFILTER_API_KEY = process.env.NEWSFILTER_API_KEY;
const TIMEOUT_MS = 8000;

export interface NewsfilterArticle {
  title: string;
  url: string;
  publishedAt?: string;
  source?: string;
  tickers?: string[];
}

/**
 * Fetch recent market/finance articles from Newsfilter Query API.
 * Returns empty array if not configured or on error.
 */
export async function fetchNewsfilterRecent(limit = 10): Promise<NewsfilterArticle[]> {
  if (!NEWSFILTER_API_KEY?.trim()) return [];

  const base = NEWSFILTER_BASE.replace(/\/$/, '');
  try {
    // Query API: common patterns are /search or /query with apiKey and limit
    const params = new URLSearchParams({
      limit: String(Math.min(limit, 25)),
      apiKey: NEWSFILTER_API_KEY,
    });
    const url = `${base}/search?${params.toString()}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) return [];

    const data = await res.json().catch(() => null);
    if (!data || typeof data !== 'object') return [];

    const items = data.articles ?? data.results ?? data.data ?? Array.isArray(data) ? data : [];
    if (!Array.isArray(items)) return [];

    return items.slice(0, limit).map((item: Record<string, unknown>) => ({
      title: String(item.title ?? item.headline ?? ''),
      url: String(item.url ?? item.link ?? item.source_url ?? ''),
      publishedAt: item.publishedAt ?? item.published_at ?? item.date ? String(item.publishedAt ?? item.published_at ?? item.date) : undefined,
      source: item.source ? String(item.source) : undefined,
      tickers: Array.isArray(item.tickers) ? item.tickers.map(String) : undefined,
    })).filter((a: { title: string; url: string }) => a.title && a.url);
  } catch (err) {
    if (err instanceof Error && !err.message.includes('timeout')) {
      console.warn('[Newsfilter] Request failed:', err.message);
    }
    return [];
  }
}
