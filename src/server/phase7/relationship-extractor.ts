/**
 * PHASE 7: Relationship Extractor
 * 
 * Extracts relationships between events using LLM
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

interface Relationship {
  target_event_id: string;
  relationship_type: 'causes' | 'precedes' | 'related_to' | 'contradicts' | 'amplifies' | 'mitigates' | 'triggers' | 'follows_from';
  strength: number; // 0-1
  confidence: number; // 0-1
  evidence: string;
  reasoning: string;
}

/**
 * Extract relationships between a source event and potential target events
 */
export async function extractRelationships(
  sourceEvent: Event,
  targetEvents: Event[]
): Promise<Relationship[]> {
  if (targetEvents.length === 0) {
    return [];
  }

  // Build context for LLM
  const targetEventsContext = targetEvents.map((e, idx) => 
    `[Event ${idx + 1}]
ID: ${e.id}
Summary: ${e.summary}
Type: ${e.event_type}
Sector: ${e.sector || 'N/A'}
Region: ${e.region || 'N/A'}
Impact: ${e.impact_score || 'N/A'}
Created: ${e.created_at}`
  ).join('\n\n');

  const prompt = `You are an expert geopolitical and economic analyst. Analyze the relationship between a source event and potential target events.

SOURCE EVENT:
ID: ${sourceEvent.id}
Summary: ${sourceEvent.summary}
Why it matters: ${sourceEvent.why_it_matters}
Type: ${sourceEvent.event_type}
Sector: ${sourceEvent.sector || 'N/A'}
Region: ${sourceEvent.region || 'N/A'}
Impact Score: ${sourceEvent.impact_score || 'N/A'}
Created: ${sourceEvent.created_at}

POTENTIAL TARGET EVENTS:
${targetEventsContext}

TASK:
For each target event, determine if there is a meaningful relationship with the source event. Consider:
- Causal relationships (does source event cause target event?)
- Temporal relationships (does source event precede target event?)
- Amplification/mitigation (does source event amplify or mitigate target event?)
- Contradiction (does source event contradict target event?)
- Generic relatedness (are they related in a meaningful way?)

RULES:
1. Only identify relationships if there is clear evidence or logical connection
2. Relationship types:
   - "causes": Source event directly causes target event
   - "precedes": Source event happens before target event (temporal)
   - "amplifies": Source event makes target event more likely/severe
   - "mitigates": Source event makes target event less likely/severe
   - "triggers": Source event triggers target event
   - "contradicts": Source event contradicts target event
   - "related_to": Generic relationship (use when specific type doesn't fit)
   - "follows_from": Target event follows from source event
3. Strength (0-1): How strong is the relationship? (1 = very strong, 0.5 = moderate, 0.2 = weak)
4. Confidence (0-1): How confident are you in this relationship?
5. Evidence: Brief explanation of why this relationship exists
6. Reasoning: Detailed reasoning behind the relationship

Return ONLY a valid JSON array of relationships. Each relationship must have:
- target_event_id (string)
- relationship_type (string, one of the types above)
- strength (number, 0-1)
- confidence (number, 0-1)
- evidence (string, 1-2 sentences)
- reasoning (string, 2-4 sentences)

If no meaningful relationships exist, return an empty array [].

Example format:
[
  {
    "target_event_id": "uuid-here",
    "relationship_type": "causes",
    "strength": 0.8,
    "confidence": 0.9,
    "evidence": "The source event directly led to the target event through regulatory changes.",
    "reasoning": "The source event involves new regulations that directly impact the sector mentioned in the target event. The timeline and sector alignment strongly suggest a causal relationship."
  }
]

Return ONLY the JSON array, no other text.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert analyst. Always return valid JSON only, no explanations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent relationships
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response - try to extract array from response
    let relationships: any[] = [];
    try {
      const parsed = JSON.parse(content);
      // Handle both { relationships: [...] } and [...] formats
      relationships = Array.isArray(parsed) ? parsed : (parsed.relationships || parsed.data || []);
    } catch (parseError) {
      // Try to extract JSON array from markdown code blocks
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        relationships = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from OpenAI');
      }
    }

    // Validate and filter relationships
    const validRelationships: Relationship[] = relationships
      .filter((rel: any) => {
        // Validate required fields
        if (!rel.target_event_id || !rel.relationship_type) return false;
        
        // Validate relationship type
        const validTypes = ['causes', 'precedes', 'related_to', 'contradicts', 'amplifies', 'mitigates', 'triggers', 'follows_from'];
        if (!validTypes.includes(rel.relationship_type)) return false;
        
        // Validate scores
        if (typeof rel.strength !== 'number' || rel.strength < 0 || rel.strength > 1) return false;
        if (typeof rel.confidence !== 'number' || rel.confidence < 0 || rel.confidence > 1) return false;
        
        // Only keep relationships with confidence >= 0.5 and strength >= 0.3
        if (rel.confidence < 0.5 || rel.strength < 0.3) return false;
        
        // Validate target event exists
        const targetExists = targetEvents.some(e => e.id === rel.target_event_id);
        if (!targetExists) return false;
        
        return true;
      })
      .map((rel: any) => ({
        target_event_id: rel.target_event_id,
        relationship_type: rel.relationship_type,
        strength: Math.round(rel.strength * 100) / 100, // Round to 2 decimals
        confidence: Math.round(rel.confidence * 100) / 100,
        evidence: (rel.evidence || '').substring(0, 500), // Limit length
        reasoning: (rel.reasoning || '').substring(0, 1000),
      }));

    return validRelationships;
  } catch (error: any) {
    console.error('Error extracting relationships:', error);
    throw new Error(`Failed to extract relationships: ${error.message}`);
  }
}

/**
 * Process relationships for a source event
 */
export async function processEventRelationships(sourceEventId: string): Promise<number> {
  try {
    // Get source event
    const { data: sourceEvent, error: sourceError } = await supabase
      .from('nucigen_events')
      .select('*')
      .eq('id', sourceEventId)
      .single();

    if (sourceError || !sourceEvent) {
      throw new Error(`Source event not found: ${sourceEventId}`);
    }

    // Get potential target events (recent events, different from source)
    // Look for events in similar sectors/regions or recent events
    const { data: targetEvents, error: targetError } = await supabase
      .from('nucigen_events')
      .select('*')
      .neq('id', sourceEventId)
      .order('created_at', { ascending: false })
      .limit(20); // Limit to 20 most recent events for efficiency

    if (targetError) {
      throw new Error(`Failed to fetch target events: ${targetError.message}`);
    }

    if (!targetEvents || targetEvents.length === 0) {
      console.log(`No target events found for relationship extraction`);
      return 0;
    }

    // Extract relationships
    const relationships = await extractRelationships(sourceEvent as Event, targetEvents as Event[]);

    if (relationships.length === 0) {
      console.log(`No relationships found for event ${sourceEventId}`);
      return 0;
    }

    // Insert relationships into database
    const relationshipsToInsert = relationships.map(rel => ({
      source_event_id: sourceEventId,
      target_event_id: rel.target_event_id,
      relationship_type: rel.relationship_type,
      strength: rel.strength,
      confidence: rel.confidence,
      evidence: rel.evidence,
      reasoning: rel.reasoning,
    }));

    const { error: insertError } = await supabase
      .from('event_relationships')
      .upsert(relationshipsToInsert, {
        onConflict: 'source_event_id,target_event_id,relationship_type',
      });

    if (insertError) {
      throw new Error(`Failed to insert relationships: ${insertError.message}`);
    }

    console.log(`✅ Extracted ${relationships.length} relationships for event ${sourceEventId}`);
    return relationships.length;
  } catch (error: any) {
    console.error(`❌ Error processing relationships for ${sourceEventId}:`, error);
    throw error;
  }
}

/**
 * Process relationships for all events that don't have relationships yet
 */
export async function processPendingRelationships(): Promise<{ processed: number; created: number; errors: string[] }> {
  try {
    // Get events that don't have outgoing relationships yet
    // Use a simple query instead of RPC (more reliable)
    const { data: allEvents, error: allEventsError } = await supabase
      .from('nucigen_events')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(20);

    if (allEventsError) {
      throw new Error(`Failed to fetch events: ${allEventsError.message}`);
    }

    if (!allEvents || allEvents.length === 0) {
      console.log('No events to process for relationships');
      return { processed: 0, created: 0, errors: [] };
    }

    // Get events that already have relationships
    const { data: eventsWithRelationships } = await supabase
      .from('event_relationships')
      .select('source_event_id')
      .limit(1000);

    const eventsWithRelationshipsSet = new Set(
      (eventsWithRelationships || []).map((r: any) => r.source_event_id)
    );

    // Filter to get events without relationships
    const eventsWithoutRelationships = allEvents.filter(
      (e: any) => !eventsWithRelationshipsSet.has(e.id)
    ).slice(0, 10);

    if (eventsWithoutRelationships.length === 0) {
      console.log('No events to process for relationships');
      return { processed: 0, created: 0, errors: [] };
    }

    let totalCreated = 0;
    const errors: string[] = [];

    for (const event of eventsWithoutRelationships) {
      try {
        const count = await processEventRelationships(event.id);
        totalCreated += count;
      } catch (error: any) {
        errors.push(`Event ${event.id}: ${error.message}`);
      }
    }

    console.log(`✅ Processed ${events.length} events, created ${totalCreated} relationships`);
    return {
      processed: events.length,
      created: totalCreated,
      errors,
    };
  } catch (error: any) {
    console.error('❌ Error processing pending relationships:', error);
    throw error;
  }
}

// Direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const eventId = process.argv[2];
  
  if (eventId) {
    // Process specific event
    processEventRelationships(eventId)
      .then(count => {
        console.log(`✅ Created ${count} relationships`);
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
      });
  } else {
    // Process pending relationships
    processPendingRelationships()
      .then(result => {
        console.log(`✅ Processed ${result.processed} events, created ${result.created} relationships`);
        if (result.errors.length > 0) {
          console.error('Errors:', result.errors);
        }
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
      });
  }
}

