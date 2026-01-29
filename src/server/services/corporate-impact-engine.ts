/**
 * Corporate Impact Engine
 *
 * Runs the event-level analysis prompt (Corporate Impact Engine), parses the JSON output,
 * computes impact_score 0–100, and upserts into event_impact_analyses.
 * See CORPORATE_IMPACT_PRODUCT.md for the full prompt and guardrails.
 */

import OpenAI from 'openai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type {
  CorporateImpactEngineOutput,
  EventScope,
  EventImpactConfidence,
  EventImpactIntensity,
  EventImpactDirection,
  EventTimeHorizon,
} from '../../types/corporate-impact';
import { computeEventImpactScore } from '../utils/corporate-impact-scoring.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config({ path: join(__dirname, '../../../../.env') });
dotenv.config();

const openaiApiKey = process.env.OPENAI_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;
let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

const ENGINE_MODEL = 'gpt-4o';

const SYSTEM_PROMPT = `You are an intelligence analyst working for a geopolitical and economic risk intelligence platform.

Your task is NOT to predict stock prices.
Your task is to analyze how real-world events structurally impact companies, sectors, and supply chains through causal mechanisms.

Return ONLY valid JSON. No markdown, no explanation outside the JSON.`;

const USER_PROMPT_TEMPLATE = `Analyze this event and return the JSON structure below.

Event Title: {{title}}
Event Date: {{date}}
Event Location: {{location}}
Source Summary: {{summary}}
Source URL: {{url}}

Instructions:
1. Classify into ONE primary category: Geopolitical conflict | Political instability | Sanctions / Trade restrictions | Regulation / Policy change | Labor strike / Social unrest | Supply chain disruption | Energy / Resource shock | Financial / Macro shock | Security incident | Other (specify)
2. Scope: Local | Regional | Global
3. List affected_sectors with sector and rationale (one sentence each)
4. Build causal_chain as array of strings: "Event → First-order effect → Second-order effect → Corporate exposure"
5. List exposure_channels with channel and explanation (from: Geographic presence, Supply chain dependency, Resource dependency, Regulatory exposure, Security risk, Government contracts, Logistics routes, Market access, Reputation / compliance)
6. impact_assessment: direction (Positive|Negative|Mixed), intensity (Low|Medium|High|Critical), time_horizon (Immediate|Short-term|Medium-term|Long-term)
7. confidence_level: High | Medium | Low; confidence_rationale: one sentence

Guardrails: Do NOT mention stock prices, buy/sell, or returns. Use only the information provided.

Return ONLY this JSON structure, no other text:
{
  "event_type": "",
  "event_scope": "",
  "affected_sectors": [{"sector": "", "rationale": ""}],
  "causal_chain": [],
  "exposure_channels": [{"channel": "", "explanation": ""}],
  "impact_assessment": {"direction": "", "intensity": "", "time_horizon": ""},
  "confidence_level": "",
  "confidence_rationale": ""
}`;

export interface EventForEngine {
  id: string;
  title: string;
  published_at?: string;
  description?: string;
  content?: string;
  region?: string;
  sector?: string;
  discover_category?: string;
}

function buildPrompt(event: EventForEngine): string {
  const title = event.title || 'Unknown event';
  const date = event.published_at ? new Date(event.published_at).toISOString().slice(0, 10) : 'Unknown';
  const location = event.region || (event as any).country || 'Not specified';
  const summary = (event.description || event.content || '').slice(0, 2000) || 'No summary provided';
  const url = (event as any).url || (event as any).source_url || '';

  return USER_PROMPT_TEMPLATE.replace('{{title}}', title)
    .replace('{{date}}', date)
    .replace('{{location}}', location)
    .replace('{{summary}}', summary)
    .replace('{{url}}', url);
}

function normalizeScope(s: string): EventScope {
  const v = s?.trim();
  if (v === 'Local' || v === 'Regional' || v === 'Global') return v;
  if (/local/i.test(v)) return 'Local';
  if (/regional/i.test(v)) return 'Regional';
  return 'Global';
}

function normalizeConfidence(s: string): EventImpactConfidence {
  const v = s?.trim();
  if (v === 'High' || v === 'Medium' || v === 'Low') return v;
  if (/high/i.test(v)) return 'High';
  if (/low/i.test(v)) return 'Low';
  return 'Medium';
}

function normalizeIntensity(s: string): EventImpactIntensity {
  const v = s?.trim();
  if (v === 'Low' || v === 'Medium' || v === 'High' || v === 'Critical') return v;
  if (/critical/i.test(v)) return 'Critical';
  if (/high/i.test(v)) return 'High';
  if (/low/i.test(v)) return 'Low';
  return 'Medium';
}

function normalizeDirection(s: string): EventImpactDirection {
  const v = s?.trim();
  if (v === 'Positive' || v === 'Negative' || v === 'Mixed') return v;
  if (/positive/i.test(v)) return 'Positive';
  if (/negative/i.test(v)) return 'Negative';
  return 'Mixed';
}

function normalizeTimeHorizon(s: string): EventTimeHorizon {
  const v = s?.trim();
  if (v === 'Immediate' || v === 'Short-term' || v === 'Medium-term' || v === 'Long-term') return v;
  if (/immediate/i.test(v)) return 'Immediate';
  if (/short/i.test(v)) return 'Short-term';
  if (/long/i.test(v)) return 'Long-term';
  return 'Medium-term';
}

function parseAndValidate(body: unknown): CorporateImpactEngineOutput | null {
  if (!body || typeof body !== 'object') return null;
  const o = body as Record<string, unknown>;
  const event_type = typeof o.event_type === 'string' ? o.event_type : 'Other';
  const event_scope = normalizeScope(String(o.event_scope || 'Global'));
  const affected_sectors = Array.isArray(o.affected_sectors)
    ? (o.affected_sectors as Array<{ sector?: string; rationale?: string }>).map((x) => ({
        sector: String(x?.sector ?? ''),
        rationale: String(x?.rationale ?? ''),
      }))
    : [];
  const causal_chain = Array.isArray(o.causal_chain) ? (o.causal_chain as string[]).filter((x) => typeof x === 'string') : [];
  const exposure_channels = Array.isArray(o.exposure_channels)
    ? (o.exposure_channels as Array<{ channel?: string; explanation?: string }>).map((x) => ({
        channel: String(x?.channel ?? ''),
        explanation: String(x?.explanation ?? ''),
      }))
    : [];
  const ia = o.impact_assessment as Record<string, unknown> | undefined;
  const direction = normalizeDirection(String(ia?.direction ?? 'Mixed'));
  const intensity = normalizeIntensity(String(ia?.intensity ?? 'Medium'));
  const time_horizon = normalizeTimeHorizon(String(ia?.time_horizon ?? 'Medium-term'));
  const confidence_level = normalizeConfidence(String(o.confidence_level ?? 'Medium'));
  const confidence_rationale = String(o.confidence_rationale ?? '');

  return {
    event_type,
    event_scope,
    affected_sectors,
    causal_chain,
    exposure_channels,
    impact_assessment: { direction, intensity, time_horizon },
    confidence_level,
    confidence_rationale,
  };
}

/**
 * Run the Corporate Impact Engine on an event and upsert into event_impact_analyses.
 * Returns the analysis id if successful, null otherwise.
 */
export async function runEventImpactAnalysis(event: EventForEngine): Promise<string | null> {
  if (!openai) {
    console.warn('[Corporate Impact Engine] OPENAI_API_KEY not configured');
    return null;
  }
  if (!supabase) {
    console.warn('[Corporate Impact Engine] Supabase not configured');
    return null;
  }

  try {
    const userPrompt = buildPrompt(event);
    const completion = await openai.chat.completions.create({
      model: ENGINE_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.warn('[Corporate Impact Engine] Empty response for event', event.id);
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.warn('[Corporate Impact Engine] Invalid JSON for event', event.id);
      return null;
    }

    const analysis = parseAndValidate(parsed);
    if (!analysis) {
      console.warn('[Corporate Impact Engine] Invalid structure for event', event.id);
      return null;
    }

    const impact_score = computeEventImpactScore(
      analysis.impact_assessment.intensity,
      analysis.confidence_level
    );

    const row = {
      event_id: event.id,
      event_type: analysis.event_type,
      event_scope: analysis.event_scope,
      affected_sectors: analysis.affected_sectors,
      causal_chain: analysis.causal_chain,
      exposure_channels: analysis.exposure_channels,
      impact_assessment: analysis.impact_assessment,
      confidence_level: analysis.confidence_level,
      confidence_rationale: analysis.confidence_rationale || null,
      impact_score,
      model_used: ENGINE_MODEL,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('event_impact_analyses')
      .upsert(row, { onConflict: 'event_id' })
      .select('id')
      .single();

    if (error) {
      console.error('[Corporate Impact Engine] Upsert error:', error.message);
      return null;
    }

    console.log(`[Corporate Impact Engine] Event ${event.id} → analysis ${(data as { id: string })?.id}, score ${impact_score}`);
    return (data as { id: string })?.id ?? null;
  } catch (err: unknown) {
    console.error('[Corporate Impact Engine] Error:', (err as Error)?.message);
    return null;
  }
}
