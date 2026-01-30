/**
 * Discover feed enrichment via Perplexity API.
 * Fetches fresh news/trends by category and returns items in DiscoverItem shape
 * to merge with DB-sourced items for a richer feed.
 */

import { chatCompletions } from './perplexity-service.js';
import type { DiscoverItem } from './discover-service.js';

const CATEGORY_PROMPTS: Record<string, string> = {
  all: 'global news, business, technology, and geopolitics',
  tech: 'technology and innovation',
  finance: 'finance and markets',
  geopolitics: 'geopolitics and international relations',
  energy: 'energy and commodities',
  'supply-chain': 'supply chain and trade',
};

const PERPLEXITY_DISCOVER_LIMIT = 6;

/**
 * Fetch fresh news/trends from Perplexity for the Discover feed.
 * Returns items in DiscoverItem format. Non-blocking: on error returns [].
 */
export async function fetchDiscoverNewsFromPerplexity(
  category: string,
  limit: number = PERPLEXITY_DISCOVER_LIMIT
): Promise<DiscoverItem[]> {
  try {
    const categoryLabel = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.all;
    const prompt = `List the ${Math.min(limit, 8)} most important or trending news items today in ${categoryLabel}. For each item provide:
- title: short headline
- summary: one sentence summary
- source_url: best source URL for the story

Return ONLY a valid JSON array of objects with exactly those keys. No markdown, no explanation. Example: [{"title":"...","summary":"...","source_url":"https://..."}]`;

    const response = await chatCompletions({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: 'You are a news curator. Return only a JSON array of news items with keys title, summary, source_url. No other text.',
        },
        { role: 'user', content: prompt },
      ],
      return_citations: true,
      max_tokens: 2000,
    });

    const content = response.choices?.[0]?.message?.content?.trim() || '';
    const citations: string[] = response.choices?.[0]?.message?.citations || (response as any).citations || [];
    const now = new Date().toISOString();

    // Parse JSON array from response (allow code block wrapper)
    let raw: Array<{ title?: string; summary?: string; source_url?: string }> = [];
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        raw = JSON.parse(jsonMatch[0]) as typeof raw;
      } catch (_) {}
    }
    if (!Array.isArray(raw) || raw.length === 0) {
      return [];
    }

    const items: DiscoverItem[] = raw.slice(0, limit).map((entry, i) => {
      const title = String(entry.title || '').trim() || 'News';
      const summary = String(entry.summary || '').trim() || title;
      let sourceUrl = (entry.source_url || '').trim();
      if (!sourceUrl && citations[i]) {
        sourceUrl = citations[i];
      }
      if (!sourceUrl && citations[0]) {
        sourceUrl = citations[0];
      }
      let sourceName = 'Source';
      try {
        if (sourceUrl) {
          sourceName = new URL(sourceUrl).hostname.replace('www.', '');
        }
      } catch (_) {}

      return {
        id: `perplexity-${Date.now()}-${i}`,
        type: 'article' as const,
        title,
        summary,
        sources: sourceUrl
          ? [{ name: sourceName, url: sourceUrl, date: now }]
          : [{ name: 'Perplexity', url: '', date: now }],
        category: category === 'all' ? 'all' : category,
        tags: [],
        engagement: { views: 0, saves: 0, questions: 0 },
        metadata: {
          published_at: now,
          updated_at: now,
          relevance_score: 85,
        },
        related_questions: undefined,
      };
    });

    return items;
  } catch (err: any) {
    console.warn('[Discover Perplexity] Feed enrichment failed (non-blocking):', err?.message || err);
    return [];
  }
}
