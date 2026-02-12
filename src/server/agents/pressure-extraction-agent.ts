/**
 * Pressure Extraction Agent
 *
 * Extracts structured pressure features from signals using LLM.
 * The agent does NOT compute scores — only features.
 * Scores are computed deterministically by pressure-score.ts.
 */

import { z } from 'zod';
import { callOpenAI } from '../services/openai-optimizer';
import type { Signal } from '../../types/intelligence';
import type { PressureFeatures } from '../../types/intelligence';

const pressureFeaturesSchema = z.object({
  system: z.enum(['Security', 'Maritime', 'Energy', 'Industrial', 'Monetary']),
  pressure_vector: z.string().min(3).max(60),
  impact_order: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  time_horizon_days: z.number().int().min(1).max(365),
  evidence_strength: z.number().min(0).max(1),
  novelty: z.number().min(0).max(1),
  transmission_channels: z.array(z.string()).min(1).max(5),
  exposed_entities: z.array(z.string()).max(10),
  uncertainties: z.array(z.string()).min(1).max(3),
  citations: z.array(z.string()),
});

interface RelatedEvent {
  summary: string;
  sources?: string[];
}

const SYSTEM_PROMPT = `You are a pressure extraction engine. You classify geopolitical and economic signals into structured pressure features. You output STRICT JSON only. You do NOT compute scores — only features.

Output a single JSON object with exactly these fields:
- system: one of "Security", "Maritime", "Energy", "Industrial", "Monetary"
- pressure_vector: short snake_case label (e.g. "freight_rate_shock", "sanctions_escalation")
- impact_order: 1 (direct), 2 (second-order), or 3 (third-order)
- time_horizon_days: integer 1-365, estimated days until impact materializes
- evidence_strength: 0-1 float, how strong the factual evidence is
- novelty: 0-1 float, how new/unexpected this pressure is
- transmission_channels: 1-5 strings describing how pressure propagates (e.g. "supply_chain", "currency_markets")
- exposed_entities: up to 10 strings of affected entities (companies, countries, sectors)
- uncertainties: 1-3 strings describing key unknowns
- citations: array of source URLs or references if available`;

function buildUserPrompt(signal: Signal, relatedEvents: RelatedEvent[]): string {
  const parts: string[] = [];

  parts.push(`SIGNAL TITLE: ${signal.title}`);
  parts.push(`SUMMARY: ${signal.summary}`);
  if (signal.why_it_matters) {
    parts.push(`WHY IT MATTERS: ${signal.why_it_matters}`);
  }

  if (relatedEvents.length > 0) {
    parts.push('\nRELATED EVENTS:');
    for (const evt of relatedEvents.slice(0, 5)) {
      parts.push(`- ${evt.summary}`);
      if (evt.sources && evt.sources.length > 0) {
        parts.push(`  Sources: ${evt.sources.join(', ')}`);
      }
    }
  }

  parts.push('\nExtract pressure features as JSON.');
  return parts.join('\n');
}

export class PressureExtractionAgent {
  async extract(
    signal: Signal,
    relatedEvents: RelatedEvent[] = [],
  ): Promise<PressureFeatures | null> {
    const userPrompt = buildUserPrompt(signal, relatedEvents);

    try {
      const response = await callOpenAI<Record<string, unknown>>(
        userPrompt,
        SYSTEM_PROMPT,
        {
          taskType: 'data-extraction',
          model: 'gpt-4o-mini',
          temperature: 0.3,
        },
      );

      // The LLM may wrap features in a parent key — try to unwrap
      let rawData = response.data as Record<string, unknown>;
      if (rawData && typeof rawData === 'object' && !('system' in rawData)) {
        // Try common wrapper keys
        const inner = rawData.pressure_features ?? rawData.features ?? rawData.result ?? rawData.data;
        if (inner && typeof inner === 'object') {
          rawData = inner as Record<string, unknown>;
        }
      }

      const parsed = pressureFeaturesSchema.safeParse(rawData);

      if (parsed.success) {
        return parsed.data;
      }

      // Retry once with fix-up prompt
      console.warn(
        '[PressureExtractionAgent] Zod validation failed, retrying:',
        parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
      );

      const fixPrompt = `The previous JSON had validation errors:\n${parsed.error.issues.map(i => `- ${i.path.join('.')}: ${i.message}`).join('\n')}\n\nFix the JSON and output a corrected version. Original input:\n${userPrompt}`;

      const retryResponse = await callOpenAI<Record<string, unknown>>(
        fixPrompt,
        SYSTEM_PROMPT,
        {
          taskType: 'data-extraction',
          model: 'gpt-4o-mini',
          temperature: 0.2,
        },
      );

      let retryRawData = retryResponse.data as Record<string, unknown>;
      if (retryRawData && typeof retryRawData === 'object' && !('system' in retryRawData)) {
        const inner = retryRawData.pressure_features ?? retryRawData.features ?? retryRawData.result ?? retryRawData.data;
        if (inner && typeof inner === 'object') {
          retryRawData = inner as Record<string, unknown>;
        }
      }

      const retryParsed = pressureFeaturesSchema.safeParse(retryRawData);

      if (retryParsed.success) {
        return retryParsed.data;
      }

      console.error('[PressureExtractionAgent] Retry also failed:', retryParsed.error.issues);
      return null;
    } catch (error: any) {
      console.error('[PressureExtractionAgent] Error:', error.message || error);
      return null;
    }
  }
}

export const pressureExtractionAgent = new PressureExtractionAgent();
