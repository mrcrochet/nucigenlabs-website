/**
 * Decision Points Worker
 * 
 * Automatically generates decision points from scenario predictions
 * Analyzes scenarios and creates actionable decision points (monitor, prepare, act)
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config({ path: join(__dirname, '../../../../.env') });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[Decision Points] Missing Supabase config');
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.warn('[Decision Points] OPENAI_API_KEY not configured');
}

const openaiClient = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

interface ScenarioPrediction {
  id: string;
  nucigen_event_id: string;
  scenario_type: 'optimistic' | 'realistic' | 'pessimistic';
  predicted_outcome: string;
  probability: number;
  time_horizon: string;
  confidence: number;
  reasoning: string;
  key_indicators: string[];
  risk_factors: string[];
  opportunities: string[];
}

interface DecisionPoint {
  type: 'monitor' | 'prepare' | 'act';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  deadline?: string;
}

/**
 * Get recent scenario predictions without decision points
 */
async function getScenariosWithoutDecisionPoints(limit: number = 10): Promise<ScenarioPrediction[]> {
  try {
    // Get scenarios that don't have decision points yet
    const { data, error } = await supabase
      .from('scenario_predictions')
      .select(`
        *,
        decision_points!left(id)
      `)
      .is('decision_points.id', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Decision Points] Error fetching scenarios:', error);
      return [];
    }

    return (data || []) as ScenarioPrediction[];
  } catch (error: any) {
    console.error('[Decision Points] Error:', error);
    return [];
  }
}

/**
 * Generate decision points from a scenario using OpenAI
 */
async function generateDecisionPointsFromScenario(
  scenario: ScenarioPrediction,
  eventSummary?: string
): Promise<DecisionPoint[]> {
  if (!openaiClient) {
    // Fallback: generate basic decision points without AI
    return generateBasicDecisionPoints(scenario);
  }

  try {
    const prompt = `You are a strategic intelligence analyst. Based on the following scenario prediction, generate 2-4 actionable decision points.

Scenario:
- Type: ${scenario.scenario_type}
- Outcome: ${scenario.predicted_outcome}
- Probability: ${(scenario.probability * 100).toFixed(0)}%
- Time Horizon: ${scenario.time_horizon}
- Confidence: ${(scenario.confidence * 100).toFixed(0)}%
- Reasoning: ${scenario.reasoning}
${scenario.risk_factors.length > 0 ? `- Risk Factors: ${scenario.risk_factors.join(', ')}` : ''}
${scenario.opportunities.length > 0 ? `- Opportunities: ${scenario.opportunities.join(', ')}` : ''}
${eventSummary ? `- Event Context: ${eventSummary}` : ''}

Generate decision points that are:
1. Actionable (specific, not vague)
2. Prioritized (high/medium/low based on urgency and impact)
3. Categorized as: "monitor" (watch and track), "prepare" (get ready), or "act" (take immediate action)
4. Include deadline if time-sensitive (based on time_horizon)
5. Include role context indicating who should act (e.g., "For portfolio exposure", "For supply chain risk management", "For capital allocation", "For policy monitoring")

Return JSON array with format:
[
  {
    "type": "monitor|prepare|act",
    "title": "Short actionable title",
    "description": "Detailed description of what to do",
    "priority": "low|medium|high",
    "deadline": "ISO date string or null",
    "role_context": "For [portfolio exposure|supply chain risk|capital allocation|policy monitoring|operational readiness]"
  }
]`;

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a strategic intelligence analyst. Return ONLY valid JSON, no other text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse JSON (handle both array and object with array property)
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
      // Handle if response is wrapped in object
      if (parsed.decision_points) {
        parsed = parsed.decision_points;
      } else if (parsed.decisions) {
        parsed = parsed.decisions;
      } else if (!Array.isArray(parsed)) {
        parsed = [parsed];
      }
    } catch (parseError) {
      console.error('[Decision Points] JSON parse error:', parseError);
      return generateBasicDecisionPoints(scenario);
    }

    // Validate and return
    return parsed
      .filter((dp: any) => dp.type && dp.title && dp.description && dp.priority)
      .map((dp: any) => ({
        type: dp.type as DecisionPoint['type'],
        title: dp.title,
        description: dp.description,
        priority: dp.priority as DecisionPoint['priority'],
        deadline: dp.deadline || undefined,
        roleContext: dp.role_context || dp.roleContext || undefined,
      }));
  } catch (error: any) {
    console.error('[Decision Points] Error generating with AI:', error);
    return generateBasicDecisionPoints(scenario);
  }
}

/**
 * Generate basic decision points without AI (fallback)
 */
function generateBasicDecisionPoints(scenario: ScenarioPrediction): DecisionPoint[] {
  const points: DecisionPoint[] = [];

  // High probability scenarios → Act
  if (scenario.probability > 0.7) {
    points.push({
      type: 'act',
      title: `Take action based on ${scenario.scenario_type} scenario`,
      description: scenario.predicted_outcome,
      priority: 'high',
    });
  }

  // Medium probability → Prepare
  if (scenario.probability > 0.4 && scenario.probability <= 0.7) {
    points.push({
      type: 'prepare',
      title: `Prepare for ${scenario.scenario_type} scenario`,
      description: scenario.predicted_outcome,
      priority: 'medium',
    });
  }

  // All scenarios → Monitor key indicators
  if (scenario.key_indicators.length > 0) {
    points.push({
      type: 'monitor',
      title: `Monitor key indicators: ${scenario.key_indicators.slice(0, 3).join(', ')}`,
      description: `Track these indicators to validate the ${scenario.scenario_type} scenario`,
      priority: scenario.probability > 0.5 ? 'medium' : 'low',
    });
  }

  return points;
}

/**
 * Store decision points in database
 */
async function storeDecisionPoints(
  scenarioId: string,
  decisionPoints: DecisionPoint[],
  eventId?: string,
  signalId?: string
): Promise<number> {
  let inserted = 0;

  for (const point of decisionPoints) {
    try {
      const { error } = await supabase.from('decision_points').insert({
        scenario_id: scenarioId,
        event_id: eventId,
        signal_id: signalId,
        type: point.type,
        title: point.title,
        description: point.description,
        priority: point.priority,
        deadline: point.deadline,
        status: 'pending',
        metadata: {
          role_context: (point as any).roleContext || undefined,
          why: point.description?.split('.')[0] || undefined,
        },
      } as any);

      if (error) {
        console.error(`[Decision Points] Error inserting point:`, error.message);
      } else {
        inserted++;
      }
    } catch (error: any) {
      console.error(`[Decision Points] Error storing point:`, error.message);
    }
  }

  return inserted;
}

/**
 * Generate decision points for a single scenario
 */
async function generateDecisionPointsForScenario(scenarioId: string): Promise<number> {
  try {
    // Get scenario details
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenario_predictions')
      .select('*')
      .eq('id', scenarioId)
      .single();

    if (scenarioError || !scenario) {
      console.error(`[Decision Points] Scenario not found: ${scenarioId}`);
      return 0;
    }

    // Get event summary if available
    let eventSummary: string | undefined;
    if (scenario.nucigen_event_id) {
      const { data: event } = await supabase
        .from('nucigen_events')
        .select('summary, title')
        .eq('id', scenario.nucigen_event_id)
        .single();

      if (event) {
        eventSummary = event.summary || event.title;
      }
    }

    // Generate decision points
    const decisionPoints = await generateDecisionPointsFromScenario(
      scenario as ScenarioPrediction,
      eventSummary
    );

    if (decisionPoints.length === 0) {
      console.log(`[Decision Points] No decision points generated for scenario ${scenarioId}`);
      return 0;
    }

    // Store decision points
    const inserted = await storeDecisionPoints(
      scenarioId,
      decisionPoints,
      scenario.nucigen_event_id,
      undefined
    );

    console.log(`[Decision Points] Generated ${inserted} decision points for scenario ${scenarioId}`);
    return inserted;
  } catch (error: any) {
    console.error(`[Decision Points] Error processing scenario ${scenarioId}:`, error.message);
    return 0;
  }
}

/**
 * Main worker function - processes scenarios and generates decision points
 */
export async function processDecisionPoints(limit: number = 10): Promise<{
  scenariosProcessed: number;
  decisionPointsGenerated: number;
  errors: number;
}> {
  console.log('[Decision Points] Starting decision points generation...');

  let scenariosProcessed = 0;
  let decisionPointsGenerated = 0;
  let errors = 0;

  try {
    // Get scenarios without decision points
    const scenarios = await getScenariosWithoutDecisionPoints(limit);
    console.log(`[Decision Points] Found ${scenarios.length} scenarios without decision points`);

    // Process each scenario
    for (const scenario of scenarios) {
      try {
        const count = await generateDecisionPointsForScenario(scenario.id);
        if (count > 0) {
          scenariosProcessed++;
          decisionPointsGenerated += count;
        }
      } catch (error: any) {
        console.error(`[Decision Points] Error processing scenario ${scenario.id}:`, error.message);
        errors++;
      }
    }

    console.log(
      `[Decision Points] Complete: ${scenariosProcessed} scenarios processed, ${decisionPointsGenerated} decision points generated, ${errors} errors`
    );

    return {
      scenariosProcessed,
      decisionPointsGenerated,
      errors,
    };
  } catch (error: any) {
    console.error('[Decision Points] Fatal error:', error.message);
    return {
      scenariosProcessed: 0,
      decisionPointsGenerated: 0,
      errors: 1,
    };
  }
}

// Export for use in pipeline
if (import.meta.url === `file://${process.argv[1]}`) {
  const limit = parseInt(process.argv[2]) || 10;
  processDecisionPoints(limit)
    .then((result) => {
      console.log('Result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
