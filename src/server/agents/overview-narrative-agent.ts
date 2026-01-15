/**
 * Overview Narrative Agent
 * 
 * Generates "Today's Narrative" - a coherent story from events
 * 
 * PROMPT: Today's Narrative (PROMPT CLÉ)
 * 
 * Role: Synthesize real-world events into a concise macro-economic narrative
 * Output: Structured narrative with key themes and confidence level
 */

import { callOpenAI } from '../services/openai-optimizer';
import type { EventWithChain } from '../../lib/supabase';

export interface NarrativeResult {
  narrative: string;
  key_themes: string[];
  confidence_level: 'low' | 'medium' | 'high';
  // Executive Narrative format
  what_changed?: string;
  why_it_matters?: string;
  what_to_watch_next?: string;
}

export interface OverviewNarrativeInput {
  events: EventWithChain[];
  timeframe?: '24h' | '7d' | '30d';
}

export class OverviewNarrativeAgent {
  /**
   * Generate today's narrative from events
   */
  async generateNarrative(input: OverviewNarrativeInput): Promise<NarrativeResult> {
    const { events, timeframe = '24h' } = input;

    if (!events || events.length === 0) {
      return {
        narrative: 'No significant events detected in the selected timeframe.',
        key_themes: [],
        confidence_level: 'low',
      };
    }

    // Format events for prompt
    const eventsJson = JSON.stringify(
      events.slice(0, 50).map(e => ({
        title: e.summary || e.title,
        sector: e.sector,
        region: e.region,
        event_type: e.event_type,
        timestamp: e.created_at,
      })),
      null,
      2
    );

    const systemPrompt = `You are an analytical intelligence engine.
Your role is to synthesize real-world events into a concise macro-economic narrative.
You do not speculate, exaggerate, or predict prices.
You explain WHY events matter, not WHAT to do.`;

    const userPrompt = `Here is a list of verified global events from the last ${timeframe === '24h' ? '24 hours' : timeframe === '7d' ? '7 days' : '30 days'}:
${eventsJson}

Task:
Generate an Executive Narrative with three sections:

1. "What changed" (max 60 words): Summarize the key developments
2. "Why it matters" (max 60 words): Explain the significance and implications
3. "What to watch next" (max 40 words): Identify what to monitor

Also provide:
- A single coherent narrative (max 120 words) combining all three
- Key themes (3-5 items)
- Confidence level

Focus on geopolitics, security, supply chains, energy, commodities, and capital markets.
Highlight causal links between events when they exist.
Use neutral, professional language.

Output format (JSON only):
{
  "narrative": "...",
  "what_changed": "...",
  "why_it_matters": "...",
  "what_to_watch_next": "...",
  "key_themes": ["theme1", "theme2", "theme3"],
  "confidence_level": "low | medium | high"
}`;

    try {
      const response = await callOpenAI({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for more consistent, factual output
        response_format: { type: 'json_object' },
      });

      // Parse JSON response
      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      return {
        narrative: parsed.narrative || 'Unable to generate narrative.',
        what_changed: parsed.what_changed || '',
        why_it_matters: parsed.why_it_matters || '',
        what_to_watch_next: parsed.what_to_watch_next || '',
        key_themes: parsed.key_themes || [],
        confidence_level: parsed.confidence_level || 'medium',
      };
    } catch (error: any) {
      console.error('[OverviewNarrativeAgent] Error:', error);
      return {
        narrative: 'Unable to generate narrative at this time.',
        key_themes: [],
        confidence_level: 'low',
      };
    }
  }
}
