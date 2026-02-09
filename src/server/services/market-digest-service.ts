/**
 * Market digest — short daily market summary (inspiration: financial-fast-feed / market-update).
 * Uses Perplexity for a 2–3 paragraph summary. Optionally enriches with Newsfilter (Phase 3) when configured.
 */

import { chatCompletions } from './perplexity-service.js';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let cached: { summary: string; sources: { title: string; url: string }[]; generatedAt: string } | null = null;
let cachedAt = 0;

export interface MarketDigestResult {
  summary: string;
  sources: { title: string; url: string }[];
  generatedAt: string;
}

export async function getMarketDigest(useCache = true): Promise<MarketDigestResult | null> {
  if (useCache && cached && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  try {
    const response = await chatCompletions({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content:
            'You are a concise market analyst. Reply with a short market summary only. Use 2-3 short paragraphs. Focus on major indices, key headlines, and overall sentiment. No bullet lists unless essential.',
        },
        {
          role: 'user',
          content: `Summarize today's financial markets in 2-3 short paragraphs: major indices (e.g. S&P 500, Nasdaq), key news driving markets, and overall sentiment. Today's date: ${new Date().toISOString().slice(0, 10)}.`,
        },
      ],
      return_citations: true,
      max_tokens: 800,
    });

    const content = (response.choices?.[0]?.message?.content ?? '').trim();
    const citations: string[] =
      response.choices?.[0]?.message?.citations ?? (response as { citations?: string[] }).citations ?? [];

    if (!content) return null;

    const sources = citations.slice(0, 5).map((url) => {
      try {
        const host = new URL(url).hostname.replace(/^www\./, '');
        return { title: host, url };
      } catch {
        return { title: url.slice(0, 40), url };
      }
    });

    // Phase 3: optional Newsfilter real-time headlines as extra sources
    try {
      const { fetchNewsfilterRecent } = await import('./newsfilter-service.js');
      const newsfilterArticles = await fetchNewsfilterRecent(5);
      const seen = new Set(sources.map((s) => s.url));
      for (const a of newsfilterArticles) {
        if (a.url && !seen.has(a.url)) {
          seen.add(a.url);
          sources.push({ title: a.title || new URL(a.url).hostname, url: a.url });
        }
      }
    } catch (_) {
      // ignore: Newsfilter is optional
    }

    const result: MarketDigestResult = {
      summary: content,
      sources,
      generatedAt: new Date().toISOString(),
    };

    cached = result;
    cachedAt = Date.now();
    return result;
  } catch (err) {
    console.warn('[Market Digest] Failed to generate:', err instanceof Error ? err.message : err);
    if (cached) return cached;
    return null;
  }
}
