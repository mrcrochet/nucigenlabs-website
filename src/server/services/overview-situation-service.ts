/**
 * Overview Situation Service – Perplexity-powered brief for Overview page.
 * Returns a short geopolitical/market situation summary for a country or globally.
 */

import { chatCompletions } from './perplexity-service.js';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min
const cache = new Map<string, { summary: string; at: number }>();

function cacheKey(country: string | null): string {
  return country ? country.trim().toLowerCase() : 'global';
}

export interface OverviewSituationResult {
  summary: string;
  country: string | null;
}

/**
 * Get a 2–4 sentence situation brief via Perplexity. Cached per country (or global) for 5 min.
 */
export async function getOverviewSituation(
  country: string | null
): Promise<OverviewSituationResult> {
  const key = cacheKey(country);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { summary: cached.summary, country: country || null };
  }

  const scope = country
    ? `for ${country}`
    : 'globally (key geopolitical and economic developments)';
  const systemPrompt = `You are a concise analyst. Reply in 2 to 4 short sentences only. No bullet points, no headers. Focus on recent developments relevant to markets, supply chains, and geopolitics. Use neutral, factual language.`;
  const userPrompt = `What is the current situation ${scope} in the last days? Summarize the most relevant developments for a risk and market audience.`;

  const response = await chatCompletions({
    model: 'sonar',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 300,
    search_recency_filter: 'week',
  });

  const content = response?.choices?.[0]?.message?.content?.trim() || '';
  const summary = content.slice(0, 600); // cap length
  cache.set(key, { summary, at: Date.now() });
  return { summary, country: country || null };
}
