/**
 * Signal Explanation Agent
 * 
 * Explains why a signal is significant, provides historical precedents,
 * and identifies invalidation conditions
 * 
 * PROMPT: Signal Explanation (Explain Like an Analyst)
 */

import { callOpenAI } from '../services/openai-optimizer';
import { chatCompletions } from '../services/perplexity-service';
import type { Signal } from '../../types/intelligence';

export interface SignalExplanationResult {
  why_significant: string;
  historical_precedents: Array<{
    event: string;
    outcome: string;
    similarity: string;
  }>;
  invalidation_conditions: string[];
  confidence: number;
}

export interface SignalExplanationInput {
  signal: Signal;
  relatedEvents?: Array<{
    title: string;
    sector?: string;
    region?: string;
  }>;
}

export class SignalExplanationAgent {
  /**
   * Generate comprehensive signal explanation
   */
  async explainSignal(input: SignalExplanationInput): Promise<SignalExplanationResult> {
    const { signal, relatedEvents = [] } = input;

    // First, get historical context from Perplexity
    let historicalContext = '';
    try {
      const perplexityResponse = await chatCompletions({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a geopolitical and industrial intelligence analyst. Provide historical precedents and context.',
          },
          {
            role: 'user',
            content: `Find historical precedents for this signal: "${signal.title}". 
Summary: ${signal.summary}
${signal.scope ? `Scope: ${signal.scope}` : ''}
${signal.time_horizon ? `Time horizon: ${signal.time_horizon}` : ''}

Provide:
1. Similar historical events or patterns
2. What happened in those cases
3. Why this signal is significant compared to those precedents`,
          },
        ],
        max_tokens: 800,
        return_citations: true,
      });

      historicalContext = perplexityResponse.choices[0]?.message?.content || '';
    } catch (error) {
      console.warn('[SignalExplanationAgent] Failed to get Perplexity context:', error);
    }

    const eventsJson = JSON.stringify(
      relatedEvents.map(e => ({
        title: e.title,
        sector: e.sector,
        region: e.region,
      })),
      null,
      2
    );

    const systemPrompt = `You are an analyst explaining signals to professionals.
Neutral, precise, structured.`;

    const userPrompt = `Signal:
Title: ${signal.title || 'Untitled Signal'}
Description: ${signal.summary || 'No description available'}
Strength: ${signal.impact_score || 0}/100
Confidence: ${signal.confidence_score || 0}/100
Scope: ${signal.scope || 'global'}
Time Horizon: ${signal.time_horizon || 'medium'}

Related events:
${eventsJson}

Historical context:
${historicalContext || 'No additional historical context available.'}

Task:
Explain this signal like an analyst would:

1. Why is this signal significant? (max 150 words)
   - What makes it different from noise?
   - Why should decision-makers pay attention?

2. Historical precedents (3-5 examples):
   - Similar events/patterns in the past
   - What happened in those cases
   - How this signal compares

3. Invalidation conditions (3-6 items):
   - What would change your mind about this signal?
   - What developments would make it irrelevant?
   - What evidence would contradict it?

Output format (JSON only):
{
  "why_significant": "...",
  "historical_precedents": [
    {
      "event": "...",
      "outcome": "...",
      "similarity": "..."
    }
  ],
  "invalidation_conditions": ["...", "..."],
  "confidence": 0-100
}`;

    try {
      const response = await callOpenAI({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      return {
        why_significant: parsed.why_significant || 'Signal significance analysis unavailable.',
        historical_precedents: parsed.historical_precedents || [],
        invalidation_conditions: parsed.invalidation_conditions || [],
        confidence: parsed.confidence || signal.confidence_score || 0,
      };
    } catch (error: any) {
      console.error('[SignalExplanationAgent] Error:', error);
      return {
        why_significant: 'Unable to generate explanation at this time.',
        historical_precedents: [],
        invalidation_conditions: [],
        confidence: 0,
      };
    }
  }
}
