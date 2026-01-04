/**
 * PHASE 7: Historical Analyzer
 * 
 * Compares current events with historical events to find similarities and learn from the past
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

interface HistoricalComparison {
  historical_event_id: string;
  similarity_score: number;
  similarity_factors: string[];
  comparison_insights: string;
  outcome_differences: string;
  lessons_learned: string;
  predictive_value: number;
  confidence: number;
}

/**
 * Find similar historical events using embedding similarity
 * Falls back to LLM-based comparison if embeddings not available
 */
export async function findSimilarHistoricalEvents(
  currentEvent: Event,
  historicalEvents: Event[]
): Promise<HistoricalComparison[]> {
  if (historicalEvents.length === 0) {
    return [];
  }

  // Build context for LLM
  const historicalContext = historicalEvents.map((e, idx) => 
    `[Historical Event ${idx + 1}]
ID: ${e.id}
Summary: ${e.summary}
Why it matters: ${e.why_it_matters}
Type: ${e.event_type}
Sector: ${e.sector || 'N/A'}
Region: ${e.region || 'N/A'}
Impact: ${e.impact_score || 'N/A'}
Created: ${e.created_at}`
  ).join('\n\n');

  const prompt = `You are an expert geopolitical and economic historian. Compare a current event with historical events to identify similarities and learn from the past.

CURRENT EVENT:
ID: ${currentEvent.id}
Summary: ${currentEvent.summary}
Why it matters: ${currentEvent.why_it_matters}
Type: ${currentEvent.event_type}
Sector: ${currentEvent.sector || 'N/A'}
Region: ${currentEvent.region || 'N/A'}
Impact Score: ${currentEvent.impact_score || 'N/A'}
Created: ${currentEvent.created_at}

HISTORICAL EVENTS:
${historicalContext}

TASK:
For each historical event, determine:
1. Similarity score (0-1): How similar is this historical event to the current event?
2. Similarity factors: What makes them similar? (e.g., ['sector', 'region', 'event_type', 'actors'])
3. Comparison insights: What can we learn from comparing them?
4. Outcome differences: How did the historical event unfold? What were the key outcomes?
5. Lessons learned: What lessons can we apply from the historical event to the current one?
6. Predictive value (0-1): How useful is this historical event for predicting the current event's outcome?
7. Confidence (0-1): How confident are you in this comparison?

RULES:
1. Only identify comparisons if similarity_score >= 0.6
2. Be specific about outcomes and lessons
3. Focus on actionable insights
4. Consider context, timing, and scale differences

Return ONLY a valid JSON array. Each comparison must have:
- historical_event_id (string)
- similarity_score (number, 0-1)
- similarity_factors (array of strings)
- comparison_insights (string, 3-5 sentences)
- outcome_differences (string, 2-4 sentences)
- lessons_learned (string, 2-4 sentences)
- predictive_value (number, 0-1)
- confidence (number, 0-1)

If no meaningful comparisons exist (similarity < 0.6), return an empty array [].

Example format:
[
  {
    "historical_event_id": "uuid-here",
    "similarity_score": 0.85,
    "similarity_factors": ["sector", "region", "event_type"],
    "comparison_insights": "Both events involve similar regulatory changes in the same sector and region. The historical event led to significant market adjustments.",
    "outcome_differences": "The historical event resulted in a 15% sector-wide impact over 3 months, with regulatory compliance costs increasing by 20%.",
    "lessons_learned": "Early preparation and regulatory compliance are critical. Companies that adapted quickly fared better.",
    "predictive_value": 0.8,
    "confidence": 0.9
  }
]

Return ONLY the JSON array, no other text.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert historian and analyst. Always return valid JSON only, no explanations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response - try to extract array from response
    let comparisons: any[] = [];
    try {
      const parsed = JSON.parse(content);
      comparisons = Array.isArray(parsed) ? parsed : (parsed.comparisons || parsed.data || []);
    } catch (parseError) {
      // Try to extract JSON array from markdown code blocks
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        comparisons = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from OpenAI');
      }
    }

    // Validate and filter comparisons
    const validComparisons: HistoricalComparison[] = comparisons
      .filter((comp: any) => {
        if (!comp.historical_event_id || typeof comp.similarity_score !== 'number') return false;
        if (comp.similarity_score < 0.6) return false; // Only keep highly similar events
        if (comp.similarity_score < 0 || comp.similarity_score > 1) return false;
        if (typeof comp.confidence !== 'number' || comp.confidence < 0 || comp.confidence > 1) return false;
        
        const historicalExists = historicalEvents.some(e => e.id === comp.historical_event_id);
        if (!historicalExists) return false;
        
        return true;
      })
      .map((comp: any) => ({
        historical_event_id: comp.historical_event_id,
        similarity_score: Math.round(comp.similarity_score * 100) / 100,
        similarity_factors: Array.isArray(comp.similarity_factors) ? comp.similarity_factors : [],
        comparison_insights: (comp.comparison_insights || '').substring(0, 1000),
        outcome_differences: (comp.outcome_differences || '').substring(0, 1000),
        lessons_learned: (comp.lessons_learned || '').substring(0, 1000),
        predictive_value: Math.round((comp.predictive_value || 0.5) * 100) / 100,
        confidence: Math.round(comp.confidence * 100) / 100,
      }));

    return validComparisons;
  } catch (error: any) {
    console.error('Error finding similar historical events:', error);
    throw new Error(`Failed to find similar historical events: ${error.message}`);
  }
}

/**
 * Process historical comparison for a current event
 */
export async function processHistoricalComparison(currentEventId: string): Promise<number> {
  try {
    // Get current event
    const { data: currentEvent, error: currentError } = await supabase
      .from('nucigen_events')
      .select('*')
      .eq('id', currentEventId)
      .single();

    if (currentError || !currentEvent) {
      throw new Error(`Current event not found: ${currentEventId}`);
    }

    // Get historical events (events created before current event, similar sectors/regions)
    const currentDate = new Date(currentEvent.created_at);
    const { data: historicalEvents, error: historicalError } = await supabase
      .from('nucigen_events')
      .select('*')
      .neq('id', currentEventId)
      .lt('created_at', currentEvent.created_at) // Only events before current
      .order('created_at', { ascending: false })
      .limit(30); // Check last 30 historical events

    if (historicalError) {
      throw new Error(`Failed to fetch historical events: ${historicalError.message}`);
    }

    if (!historicalEvents || historicalEvents.length === 0) {
      console.log(`No historical events found for comparison`);
      return 0;
    }

    // Find similar historical events
    const comparisons = await findSimilarHistoricalEvents(
      currentEvent as Event,
      historicalEvents as Event[]
    );

    if (comparisons.length === 0) {
      console.log(`No similar historical events found for event ${currentEventId}`);
      return 0;
    }

    // Insert comparisons into database
    const comparisonsToInsert = comparisons.map(comp => ({
      current_event_id: currentEventId,
      historical_event_id: comp.historical_event_id,
      similarity_score: comp.similarity_score,
      similarity_factors: comp.similarity_factors,
      comparison_insights: comp.comparison_insights,
      outcome_differences: comp.outcome_differences,
      lessons_learned: comp.lessons_learned,
      predictive_value: comp.predictive_value,
      confidence: comp.confidence,
    }));

    const { error: insertError } = await supabase
      .from('historical_comparisons')
      .upsert(comparisonsToInsert, {
        onConflict: 'current_event_id,historical_event_id',
      });

    if (insertError) {
      throw new Error(`Failed to insert comparisons: ${insertError.message}`);
    }

    console.log(`✅ Found ${comparisons.length} similar historical events for event ${currentEventId}`);
    return comparisons.length;
  } catch (error: any) {
    console.error(`❌ Error processing historical comparison for ${currentEventId}:`, error);
    throw error;
  }
}

// Direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const eventId = process.argv[2];
  
  if (eventId) {
    processHistoricalComparison(eventId)
      .then(count => {
        console.log(`✅ Created ${count} historical comparisons`);
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
      });
  } else {
    console.error('Usage: tsx historical-analyzer.ts <event_id>');
    process.exit(1);
  }
}

