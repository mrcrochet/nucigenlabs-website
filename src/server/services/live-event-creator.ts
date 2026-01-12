/**
 * Live Event Creator
 * 
 * ⚠️ DEPRECATED — DO NOT USE DIRECTLY
 * 
 * This file is deprecated. Use EventAgent instead:
 * - src/server/agents/event-agent.ts
 * 
 * Migration path:
 * - Replace calls to searchAndCreateLiveEvent() with EventAgent.searchAndExtractEvents()
 * - EventAgent is the ONLY authorized access point to Tavily/Firecrawl APIs
 * 
 * This file is kept temporarily for backward compatibility but will be removed.
 * 
 * @deprecated Use EventAgent instead
 */

// MIGRATION: Most Tavily/OpenAI calls now use EventAgent
// Only historical context still uses Tavily directly (TODO: migrate)
import { tavily } from '@tavily/core';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load .env from project root (src/server/services -> ../../../.env)
const envPath = join(__dirname, '../../../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn(`[Live Event Creator] Could not load .env from ${envPath}, trying alternative paths...`);
  // Try alternative paths
  dotenv.config({ path: join(__dirname, '../../.env') });
  dotenv.config({ path: join(process.cwd(), '.env') });
} else {
  console.log(`[Live Event Creator] Loaded .env from ${envPath}`);
}

// Validate environment variables (but don't throw at module load - check at runtime)
function validateEnvVars() {
  const missing: string[] = [];
  if (!process.env.OPENAI_API_KEY) missing.push('OPENAI_API_KEY');
  if (!process.env.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!process.env.TAVILY_API_KEY) missing.push('TAVILY_API_KEY');
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}. Please check your .env file at the project root.`);
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });

interface LiveEventResult {
  event: {
    id: string;
    summary: string;
    event_type: string;
    event_subtype: string | null;
    country: string | null;
    region: string | null;
    sector: string | null;
    actors: string[];
    why_it_matters: string;
    first_order_effect: string | null;
    second_order_effect: string | null;
    impact_score: number;
    confidence: number;
    created_at: string;
  };
  causalChain: {
    cause: string;
    first_order_effect: string;
    second_order_effect: string | null;
    affected_sectors: string[];
    affected_regions: string[];
    time_horizon: 'hours' | 'days' | 'weeks';
    confidence: number;
  } | null;
  historicalContext: {
    historical_context: string;
    similar_events: Array<{ title: string; date: string; relevance: number; url?: string }>;
    background_explanation: string;
    validation_notes: string;
  } | null;
}

/**
 * Recherche d'événements réels avec Tavily et création automatique
 * 
 * MIGRATED: Now uses EventAgent for event extraction
 * EventAgent is the ONLY authorized access point to Tavily/Firecrawl APIs
 */
export async function searchAndCreateLiveEvent(
  query: string,
  userId?: string
): Promise<LiveEventResult | null> {
  // Validate environment variables at runtime
  validateEnvVars();

  try {
    console.log(`[Live Event Creator] Searching for: "${query}"`);

    // MIGRATION: Use EventAgent instead of direct Tavily calls
    // EventAgent is the ONLY authorized access point to Tavily/Firecrawl APIs
    const { EventExtractionAgentImpl } = await import('../agents/event-agent');
    const eventAgent = new EventExtractionAgentImpl();

    console.log(`[Live Event Creator] Using EventAgent for search and extraction...`);
    
    // EventAgent handles Tavily search and event extraction
    const eventsResponse = await eventAgent.searchAndExtractEvents(query);

    if (eventsResponse.error || !eventsResponse.data || eventsResponse.data.length === 0) {
      console.log('[Live Event Creator] No events extracted:', eventsResponse.error);
      return null;
    }

    console.log(`[Live Event Creator] Extracted ${eventsResponse.data.length} events via EventAgent`);

    // Take the first event (highest quality from EventAgent)
    const extractedEvent = eventsResponse.data[0];

    if (!extractedEvent) {
      console.log('[Live Event Creator] No event extracted');
      return null;
    }

    // Convert Event (UI contract) to legacy format for backward compatibility
    // TODO: Migrate this endpoint to use Event[] directly instead of legacy format
    // For now, we need to convert Event to the legacy format expected by the rest of the function
    
    // Extract event type from headline/description (EventAgent doesn't return event_type directly)
    // We'll use a simple heuristic or extract from the first event's metadata
    const eventType = extractedEvent.sectors.length > 0 
      ? (extractedEvent.sectors[0] === 'Finance' ? 'Market' : 
         extractedEvent.sectors[0] === 'Technology' ? 'Industrial' : 
         'Geopolitical')
      : 'Geopolitical';

    // Create source event in 'events' table
    console.log(`[Live Event Creator] Creating source event in 'events' table...`);
    
    const { data: sourceEvent, error: sourceEventError } = await supabase
      .from('events')
      .insert({
        source: 'tavily_live_search',
        source_id: `live_search_${Date.now()}`,
        title: extractedEvent.headline || query,
        description: extractedEvent.description || null,
        content: extractedEvent.description || '', // EventAgent doesn't store raw content
        published_at: extractedEvent.date || new Date().toISOString(),
        url: extractedEvent.sources[0]?.url || null,
        status: 'processed',
      })
      .select()
      .single();

    if (sourceEventError) {
      console.error('[Live Event Creator] Source event error:', sourceEventError);
      throw new Error(`Failed to create source event: ${sourceEventError.message}`);
    }

    if (!sourceEvent || !sourceEvent.id) {
      throw new Error('Failed to create source event: No ID returned');
    }

    console.log(`[Live Event Creator] Created source event: ${sourceEvent.id}`);

    // Insert structured event in nucigen_events
    // Note: EventAgent returns impact=0 (facts only), but we need to store it
    // The impact will be calculated later by SignalAgent
    console.log(`[Live Event Creator] Inserting nucigen_event with source_event_id: ${sourceEvent.id}`);
    
    const { data: insertedEvent, error: insertError } = await supabase
      .from('nucigen_events')
      .insert({
        source_event_id: sourceEvent.id,
        event_type: eventType,
        event_subtype: null, // EventAgent doesn't extract subtype
        summary: extractedEvent.description,
        country: extractedEvent.location || null,
        region: extractedEvent.scope === 'regional' ? extractedEvent.location : null,
        sector: extractedEvent.sectors[0] || null,
        actors: extractedEvent.actors || [],
        why_it_matters: null, // EventAgent doesn't extract interpretation
        first_order_effect: null, // EventAgent doesn't extract predictions
        second_order_effect: null, // EventAgent doesn't extract predictions
        impact_score: 0, // EventAgent returns 0 (facts only)
        confidence: extractedEvent.confidence / 100, // Convert from 0-100 to 0-1
      })
      .select()
      .single();

    if (insertError || !insertedEvent) {
      throw new Error(`Failed to insert event: ${insertError?.message}`);
    }

    console.log(`[Live Event Creator] Created event: ${insertedEvent.id}`);

    // Generate causal chain (Phase 2B) - kept as is, not part of EventAgent
    const causalChain = await generateCausalChain(insertedEvent);

    // Generate historical context - NOTE: Still uses Tavily directly
    // TODO: This should also use EventAgent or a dedicated HistoricalContextAgent
    const historicalContext = await generateHistoricalContext(insertedEvent, query);

    return {
      event: insertedEvent,
      causalChain,
      historicalContext,
    };
  } catch (error: any) {
    console.error('[Live Event Creator] Error:', error);
    throw error;
  }
}

/**
 * Génère une causal chain pour l'événement
 * NOTE: This function still uses OpenAI directly (not part of EventAgent scope)
 * TODO: Create CausalChainAgent or keep as separate service
 */
async function generateCausalChain(event: any) {
  try {
    const prompt = `You are a geopolitical and economic intelligence analyst. Your task is to extract a deterministic causal chain from a structured event.

CRITICAL RULES:
1. Return ONLY valid JSON, no markdown, no code blocks, no explanations
2. Be FACTUAL and DETERMINISTIC - no "could", "might", "possibly", "may"
3. Use present or future tense for effects (they WILL happen, not might)
4. If information is uncertain → use null
5. confidence must be a float between 0 and 1
6. affected_sectors and affected_regions must be arrays (can be empty [])
7. time_horizon must be exactly one of: "hours", "days", "weeks"
8. NO financial predictions, NO price forecasts, NO numerical estimates
9. Focus on structural, operational, and strategic impacts

JSON Schema (return ONLY this structure):
{
  "cause": "string (the event trigger, factual description)",
  "first_order_effect": "string (direct, immediate consequence)",
  "second_order_effect": "string|null (indirect consequence, or null if uncertain)",
  "affected_sectors": ["string"],
  "affected_regions": ["string"],
  "time_horizon": "hours|days|weeks",
  "confidence": 0.0
}

Event to analyze:
Event Type: ${event.event_type}
Summary: ${event.summary}
Country: ${event.country || 'null'}
Region: ${event.region || 'null'}
Sector: ${event.sector || 'null'}
Actors: ${Array.isArray(event.actors) ? event.actors.join(', ') : ''}
Why it matters: ${event.why_it_matters}
First order effect: ${event.first_order_effect || 'null'}
Second order effect: ${event.second_order_effect || 'null'}

Return ONLY the JSON object, nothing else.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a precise causal analysis system. Return ONLY valid JSON, no other text. Be deterministic and factual.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const chainData = JSON.parse(completion.choices[0]?.message?.content || '{}');

    // Insérer la causal chain
    const { data: insertedChain } = await supabase
      .from('nucigen_causal_chains')
      .insert({
        nucigen_event_id: event.id,
        cause: chainData.cause,
        first_order_effect: chainData.first_order_effect,
        second_order_effect: chainData.second_order_effect,
        affected_sectors: chainData.affected_sectors || [],
        affected_regions: chainData.affected_regions || [],
        time_horizon: chainData.time_horizon,
        confidence: chainData.confidence,
      })
      .select()
      .single();

    return insertedChain;
  } catch (error) {
    console.error('[Live Event Creator] Error generating causal chain:', error);
    return null;
  }
}

/**
 * Génère le contexte historique avec Tavily (optimisé)
 */
async function generateHistoricalContext(event: any, originalQuery: string) {
  if (!tavilyClient) return null;

  try {
    // Construire une requête optimisée pour le contexte historique
    const contextQuery = `${event.summary} historical context similar past events ${event.sector || ''} ${event.region || ''} precedent comparison`;

    console.log(`[Live Event Creator] Searching historical context with Tavily...`);

    const contextResponse = await tavilyClient.search(contextQuery, {
      searchDepth: 'advanced',
      maxResults: 20, // Optimisé: 20 résultats pour meilleur contexte
      includeAnswer: true, // Réponse AI de Tavily pour le contexte
      includeRawContent: true, // Contenu complet pour analyse
    });

    // Filtrer et trier les événements similaires par pertinence
    const similarEvents = (contextResponse.results || [])
      .filter((r: any) => (r.score || 0) >= 0.4) // Filtrer par pertinence
      .sort((a: any, b: any) => (b.score || 0) - (a.score || 0)) // Trier par score
      .slice(0, 10) // Prendre les 10 meilleurs (au lieu de 5)
      .map((r: any) => ({
        title: r.title || 'Unknown',
        date: r.publishedDate || new Date().toISOString(),
        relevance: r.score || 0.5,
        url: r.url,
      }));

    console.log(`[Live Event Creator] Found ${similarEvents.length} similar historical events`);

    // Générer le contexte avec OpenAI
    const contextPrompt = `Analyze this event and provide historical context, background explanation, and validation notes.

Event: ${event.summary}
Why it matters: ${event.why_it_matters}
Sector: ${event.sector || 'N/A'}
Region: ${event.region || 'N/A'}

Tavily AI Summary:
${contextResponse.answer || 'No summary available'}

Historical Articles (${similarEvents.length} similar events):
${similarEvents.map((e, i) => `${i + 1}. ${e.title} (${e.date}) - Relevance: ${(e.relevance * 100).toFixed(0)}%`).join('\n')}

Article Contents:
${(contextResponse.results || [])
  .filter((r: any) => (r.score || 0) >= 0.4)
  .slice(0, 10)
  .map((r: any) => `${r.title}:\n${(r.content || r.rawContent || '').substring(0, 1000)}`)
  .join('\n\n---\n\n')}

Return ONLY a JSON object with this structure:
{
  "historical_context": "string (similar past events, historical patterns, 2-3 sentences)",
  "background_explanation": "string (why this matters, background, 2-3 sentences)",
  "validation_notes": "string (notes on second-order effects validation, 2-3 sentences)"
}

Return ONLY the JSON object, nothing else.`;

    const contextCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a historical analysis system. Return ONLY valid JSON, no other text.',
        },
        {
          role: 'user',
          content: contextPrompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const contextData = JSON.parse(contextCompletion.choices[0]?.message?.content || '{}');

    // Insérer le contexte
    const { data: insertedContext } = await supabase
      .from('event_context')
      .insert({
        nucigen_event_id: event.id,
        historical_context: contextData.historical_context || null,
        similar_events: similarEvents,
        background_explanation: contextData.background_explanation || null,
        validation_notes: contextData.validation_notes || null,
      })
      .select()
      .single();

    return insertedContext;
  } catch (error) {
    console.error('[Live Event Creator] Error generating historical context:', error);
    return null;
  }
}

