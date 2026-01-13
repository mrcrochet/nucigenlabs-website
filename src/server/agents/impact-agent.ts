/**
 * Impact Agent
 * 
 * Generates future impact scenarios from signals
 * 
 * Rules:
 * - Uses Signal[] + Event[] (never calls external APIs)
 * - Generates projections only (not facts, not interpretations)
 * - Must include probability, magnitude, timeframe
 * - Must include invalidation conditions
 */

import type { Signal, Event, Impact } from '../../types/intelligence';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export interface ImpactAgentInput {
  signals: Signal[];
  events?: Event[];
  user_preferences?: {
    preferred_sectors?: string[];
    preferred_regions?: string[];
    min_impact_score?: number;
  };
}

export interface ImpactAgentResponse {
  data: Impact[] | null;
  error?: string;
  metadata?: {
    signals_processed: number;
    impacts_generated: number;
  };
}

export class ImpactAgent {
  async generateImpacts(input: ImpactAgentInput): Promise<ImpactAgentResponse> {
    try {
      const { signals, events = [], user_preferences } = input;

      if (!signals || signals.length === 0) {
        return {
          data: [],
          metadata: {
            signals_processed: 0,
            impacts_generated: 0,
          },
        };
      }

      if (!openai) {
        return {
          data: null,
          error: 'OPENAI_API_KEY not configured',
        };
      }

      // Build prompt for impact generation
      const signalsSummary = signals.map(s => ({
        id: s.id,
        title: s.title,
        summary: s.summary,
        impact_score: s.impact_score,
        confidence_score: s.confidence_score,
        scope: s.scope,
        horizon: s.horizon,
      }));

      const prompt = `You are the Impact Projection Agent for Nucigen Intelligence System.

Your role is to generate FUTURE IMPACT SCENARIOS based on intelligence signals.

CRITICAL RULES:
1. You generate PROJECTIONS ONLY - not facts, not interpretations
2. Each impact must have:
   - risk_headline: Clear risk statement
   - opportunity: Optional opportunity description
   - probability: 0-100 (likelihood of scenario)
   - magnitude: 0-100 (potential impact size)
   - timeframe: immediate/short/medium/long
   - assumptions: List of assumptions (3-5 items)
   - pathways: First and second order effects
   - invalidation_conditions: What would change my mind? (3-6 items)

3. You must NOT:
   - Repeat facts from events
   - Provide interpretations (that's Signal territory)
   - Make predictions without probability
   - Skip invalidation conditions

Signals to analyze:
${JSON.stringify(signalsSummary, null, 2)}

User preferences:
${JSON.stringify(user_preferences || {}, null, 2)}

Generate 1-3 impact scenarios. Return JSON array of impacts matching this structure:
{
  "impacts": [
    {
      "risk_headline": string,
      "opportunity"?: string,
      "probability": number (0-100),
      "magnitude": number (0-100),
      "timeframe": "immediate" | "short" | "medium" | "long",
      "assumptions": string[],
      "pathways": {
        "first_order_effects": [{"effect": string, "confidence": number}],
        "second_order_effects": [{"effect": string, "confidence": number}]
      },
      "invalidation_conditions": string[],
      "linked_signal_ids": string[],
      "affected_assets"?: string[]
    }
  ]
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional intelligence analyst generating future impact scenarios. You are precise, analytical, and always include probability and invalidation conditions. Return valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        return {
          data: null,
          error: 'No response from OpenAI',
        };
      }

      const parsed = JSON.parse(responseContent);
      const impactsData = Array.isArray(parsed.impacts) ? parsed.impacts : [parsed];

      // Convert to Impact type
      const impacts: Impact[] = impactsData.map((impact: any, index: number) => ({
        id: `impact_${Date.now()}_${index}`,
        type: 'impact',
        scope: signals[0]?.scope || 'global',
        confidence: 75, // Default confidence for projections
        impact: impact.magnitude || 0,
        horizon: impact.timeframe || 'medium',
        source_count: signals.length,
        last_updated: new Date().toISOString(),
        risk_headline: impact.risk_headline || 'Impact Scenario',
        opportunity: impact.opportunity,
        probability: impact.probability || 50,
        magnitude: impact.magnitude || 50,
        timeframe: impact.timeframe || 'medium',
        linked_signal_ids: impact.linked_signal_ids || signals.map(s => s.id),
        affected_assets: impact.affected_assets || [],
        scenario_summary: impact.scenario_summary,
        assumptions: impact.assumptions || [],
        pathways: impact.pathways || {
          first_order_effects: [],
          second_order_effects: [],
        },
        assets_exposure: impact.affected_assets?.map((asset: string) => ({
          symbol: asset,
          exposure: 'medium' as const,
        })) || [],
        invalidation_conditions: impact.invalidation_conditions || [],
      }));

      return {
        data: impacts,
        metadata: {
          signals_processed: signals.length,
          impacts_generated: impacts.length,
        },
      };
    } catch (error: any) {
      console.error('[ImpactAgent] Error:', error);
      return {
        data: null,
        error: error.message || 'Failed to generate impacts',
      };
    }
  }
}

export const impactAgent = new ImpactAgent();
