/**
 * Impact Exposure Agent
 * 
 * Maps entity exposure to signals
 * 
 * PROMPT: Entity Exposure Mapping
 */

import { callOpenAI } from '../services/openai-optimizer';
import type { Signal } from '../../types/intelligence';

export interface EntityExposure {
  entity: string;
  entity_type: 'company' | 'sector' | 'country' | 'asset';
  exposure_type: 'direct' | 'indirect';
  reason: string;
  exposure_score: number; // 0-100
}

export interface ImpactExposureInput {
  signal: Signal;
  relatedEvents?: Array<{
    title: string;
    sector?: string;
    region?: string;
  }>;
}

export class ImpactExposureAgent {
  /**
   * Map entities exposed to a signal
   */
  async mapExposure(input: ImpactExposureInput): Promise<EntityExposure[]> {
    const { signal, relatedEvents = [] } = input;

    const eventsJson = JSON.stringify(
      relatedEvents.map(e => ({
        title: e.title,
        sector: e.sector,
        region: e.region,
      })),
      null,
      2
    );

    const systemPrompt = `You analyze exposure, not price action.`;

    const userPrompt = `Signal:
Title: ${signal.title}
Description: ${signal.summary}
Scope: ${signal.scope}
Time Horizon: ${signal.time_horizon}

Related events:
${eventsJson}

List entities potentially exposed.
For each entity:
- exposure_type (direct / indirect)
- exposure_reason

Output format (JSON only):
{
  "exposures": [
    {
      "entity": "...",
      "entity_type": "company | sector | country | asset",
      "exposure_type": "direct | indirect",
      "reason": "...",
      "exposure_score": 0-100
    }
  ]
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

      return parsed.exposures || [];
    } catch (error: any) {
      console.error('[ImpactExposureAgent] Error:', error);
      return [];
    }
  }
}
