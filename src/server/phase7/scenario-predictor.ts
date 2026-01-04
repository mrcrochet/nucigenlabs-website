/**
 * PHASE 7: Scenario Predictor
 * 
 * Generates multi-scenario predictions for events
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Event {
  id: string;
  summary: string;
  why_it_matters: string;
  event_type: string;
  sector: string | null;
  region: string | null;
  country: string | null;
  impact_score: number | null;
  confidence: number | null;
  created_at: string;
}

interface CausalChain {
  cause: string;
  first_order_effect: string;
  second_order_effect: string | null;
  time_horizon: string;
}

interface Scenario {
  scenario_type: 'optimistic' | 'realistic' | 'pessimistic';
  predicted_outcome: string;
  probability: number; // 0-1
  time_horizon: '1week' | '1month' | '3months' | '6months' | '1year';
  confidence: number;
  reasoning: string;
  key_indicators: string[];
  risk_factors: string[];
  opportunities: string[];
}

/**
 * Generate scenarios for an event
 */
export async function generateScenarios(
  event: Event,
  causalChain: CausalChain | null,
  historicalComparisons: any[] = []
): Promise<Scenario[]> {
  const historicalContext = historicalComparisons.length > 0
    ? `\n\nHISTORICAL CONTEXT:\n${historicalComparisons.map((h, i) => 
        `${i + 1}. Similar event: ${h.historical_event_summary}\n   Lessons: ${h.lessons_learned}`
      ).join('\n')}`
    : '';

  const prompt = `You are an expert strategic analyst. Generate three scenarios (optimistic, realistic, pessimistic) for how this event might unfold.

EVENT:
Summary: ${event.summary}
Why it matters: ${event.why_it_matters}
Type: ${event.event_type}
Sector: ${event.sector || 'N/A'}
Region: ${event.region || 'N/A'}
Impact Score: ${event.impact_score || 'N/A'}${historicalContext}

${causalChain ? `CAUSAL CHAIN:
Cause: ${causalChain.cause}
First-order effect: ${causalChain.first_order_effect}
Second-order effect: ${causalChain.second_order_effect || 'N/A'}
Time horizon: ${causalChain.time_horizon}` : ''}

TASK:
Generate THREE scenarios for EACH time horizon (1week, 1month, 3months, 6months, 1year):
- Optimistic: Best-case scenario
- Realistic: Most likely scenario (baseline)
- Pessimistic: Worst-case scenario

For each scenario, provide:
1. predicted_outcome: Detailed description of what happens (3-5 sentences)
2. probability: Probability this scenario occurs (0-1). Probabilities for the 3 scenarios should sum to ~1.0
3. reasoning: Why this scenario is possible (2-4 sentences)
4. key_indicators: 3-5 indicators to watch (array of strings)
5. risk_factors: 2-4 risk factors (array of strings)
6. opportunities: 2-4 opportunities (array of strings)
7. confidence: Confidence in this prediction (0-1)

RULES:
- Be realistic and evidence-based
- No financial predictions or price forecasts
- Focus on structural, geopolitical, and economic impacts
- Probabilities must sum to ~1.0 for each time horizon
- Scenarios should be distinct and meaningful

Return ONLY a valid JSON array with all scenarios. Format:
[
  {
    "scenario_type": "optimistic",
    "predicted_outcome": "...",
    "probability": 0.3,
    "time_horizon": "1week",
    "confidence": 0.8,
    "reasoning": "...",
    "key_indicators": ["..."],
    "risk_factors": ["..."],
    "opportunities": ["..."]
  },
  ...
]

Return ONLY the JSON array, no other text.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert strategic analyst. Always return valid JSON only, no explanations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    let scenarios: any[] = [];
    try {
      const parsed = JSON.parse(content);
      scenarios = Array.isArray(parsed) ? parsed : (parsed.scenarios || parsed.data || []);
    } catch (parseError) {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        scenarios = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from OpenAI');
      }
    }

    // Validate and normalize scenarios
    const validScenarios: Scenario[] = scenarios
      .filter((s: any) => {
        if (!s.scenario_type || !s.time_horizon) return false;
        const validTypes = ['optimistic', 'realistic', 'pessimistic'];
        const validHorizons = ['1week', '1month', '3months', '6months', '1year'];
        if (!validTypes.includes(s.scenario_type) || !validHorizons.includes(s.time_horizon)) return false;
        if (typeof s.probability !== 'number' || s.probability < 0 || s.probability > 1) return false;
        if (typeof s.confidence !== 'number' || s.confidence < 0 || s.confidence > 1) return false;
        return true;
      })
      .map((s: any) => ({
        scenario_type: s.scenario_type,
        predicted_outcome: (s.predicted_outcome || '').substring(0, 2000),
        probability: Math.round(s.probability * 100) / 100,
        time_horizon: s.time_horizon,
        confidence: Math.round(s.confidence * 100) / 100,
        reasoning: (s.reasoning || '').substring(0, 1000),
        key_indicators: Array.isArray(s.key_indicators) ? s.key_indicators.slice(0, 5) : [],
        risk_factors: Array.isArray(s.risk_factors) ? s.risk_factors.slice(0, 4) : [],
        opportunities: Array.isArray(s.opportunities) ? s.opportunities.slice(0, 4) : [],
      }));

    // Normalize probabilities per time horizon (should sum to ~1.0)
    const horizons = ['1week', '1month', '3months', '6months', '1year'];
    const normalized: Scenario[] = [];
    
    for (const horizon of horizons) {
      const horizonScenarios = validScenarios.filter(s => s.time_horizon === horizon);
      if (horizonScenarios.length === 3) {
        const sum = horizonScenarios.reduce((acc, s) => acc + s.probability, 0);
        if (sum > 0) {
          // Normalize to sum to 1.0
          horizonScenarios.forEach(s => {
            normalized.push({
              ...s,
              probability: Math.round((s.probability / sum) * 100) / 100,
            });
          });
        }
      } else {
        normalized.push(...horizonScenarios);
      }
    }

    return normalized;
  } catch (error: any) {
    console.error('Error generating scenarios:', error);
    throw new Error(`Failed to generate scenarios: ${error.message}`);
  }
}

/**
 * Process scenarios for an event
 */
export async function processEventScenarios(eventId: string): Promise<number> {
  try {
    // Get event
    const { data: event, error: eventError } = await supabase
      .from('nucigen_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    // Get causal chain
    const { data: causalChains } = await supabase
      .from('nucigen_causal_chains')
      .select('*')
      .eq('nucigen_event_id', eventId)
      .limit(1)
      .single();

    // Get historical comparisons
    const { data: historicalComparisons } = await supabase
      .from('historical_comparisons')
      .select('*')
      .eq('current_event_id', eventId)
      .order('similarity_score', { ascending: false })
      .limit(3);

    // Generate scenarios
    const scenarios = await generateScenarios(
      event as Event,
      causalChains as CausalChain | null,
      historicalComparisons || []
    );

    if (scenarios.length === 0) {
      console.log(`No scenarios generated for event ${eventId}`);
      return 0;
    }

    // Insert scenarios
    const scenariosToInsert = scenarios.map(s => ({
      nucigen_event_id: eventId,
      scenario_type: s.scenario_type,
      predicted_outcome: s.predicted_outcome,
      probability: s.probability,
      time_horizon: s.time_horizon,
      confidence: s.confidence,
      reasoning: s.reasoning,
      key_indicators: s.key_indicators,
      risk_factors: s.risk_factors,
      opportunities: s.opportunities,
    }));

    const { error: insertError } = await supabase
      .from('scenario_predictions')
      .upsert(scenariosToInsert, {
        onConflict: 'nucigen_event_id,scenario_type,time_horizon',
      });

    if (insertError) {
      throw new Error(`Failed to insert scenarios: ${insertError.message}`);
    }

    console.log(`✅ Generated ${scenarios.length} scenarios for event ${eventId}`);
    return scenarios.length;
  } catch (error: any) {
    console.error(`❌ Error processing scenarios for ${eventId}:`, error);
    throw error;
  }
}

// Direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const eventId = process.argv[2];
  
  if (eventId) {
    processEventScenarios(eventId)
      .then(count => {
        console.log(`✅ Generated ${count} scenarios`);
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
      });
  } else {
    console.error('Usage: tsx scenario-predictor.ts <event_id>');
    process.exit(1);
  }
}

