/**
 * Live Event Creator
 * 
 * Recherche d'événements réels en temps réel avec Tavily
 * et création automatique d'événements structurés complets
 */

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

// Validate environment variables
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required. Please check your .env file at the project root.');
}
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL is required. Please check your .env file at the project root.');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required. Please check your .env file at the project root.');
}
if (!process.env.TAVILY_API_KEY) {
  throw new Error('TAVILY_API_KEY is required. Please check your .env file at the project root.');
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
 */
export async function searchAndCreateLiveEvent(
  query: string,
  userId?: string
): Promise<LiveEventResult | null> {
  if (!tavilyClient) {
    throw new Error('Tavily API key not configured');
  }

  try {
    console.log(`[Live Event Creator] Searching for: "${query}"`);

    // 1. Recherche optimisée avec Tavily (maximiser l'utilisation de l'API)
    console.log(`[Live Event Creator] Searching Tavily with optimized settings...`);
    
    const tavilyResponse = await tavilyClient.search(query, {
      searchDepth: 'advanced', // Recherche approfondie
      maxResults: 50, // Optimisé: 50 résultats (maximise l'utilisation de Tavily)
      includeAnswer: true, // Inclure la réponse AI de Tavily (résumé intelligent)
      includeRawContent: true, // Contenu complet des articles
      includeImages: false,
    });

    if (!tavilyResponse.results || tavilyResponse.results.length === 0) {
      console.log('[Live Event Creator] No results from Tavily');
      return null;
    }

    console.log(`[Live Event Creator] Found ${tavilyResponse.results.length} articles from Tavily`);

    // 2. Filtrer et trier les résultats par pertinence et date
    const filteredResults = tavilyResponse.results
      .filter((r: any) => {
        // Filtrer par score de pertinence (minimum 0.4 pour inclure plus de résultats)
        const score = r.score || 0;
        return score >= 0.4;
      })
      .filter((r: any) => {
        // Filtrer par date (priorité aux articles récents, mais accepter jusqu'à 30 jours)
        if (r.publishedDate) {
          const publishedDate = new Date(r.publishedDate);
          const daysAgo = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysAgo <= 30; // Articles des 30 derniers jours
        }
        return true; // Inclure même sans date (mais avec priorité moindre)
      })
      .sort((a: any, b: any) => {
        // Trier par score de pertinence (décroissant)
        const scoreA = a.score || 0;
        const scoreB = b.score || 0;
        return scoreB - scoreA;
      })
      .slice(0, 30); // Prendre les 30 meilleurs résultats

    console.log(`[Live Event Creator] Filtered to ${filteredResults.length} high-quality articles`);

    // 3. Combiner les résultats en un texte riche et structuré
    const combinedContent = [
      // Réponse AI de Tavily (résumé intelligent)
      tavilyResponse.answer ? `Tavily AI Summary:\n${tavilyResponse.answer}\n\n---\n\n` : '',
      // Articles triés par pertinence
      ...filteredResults.map((r: any, index: number) => 
        `Article ${index + 1} (Relevance: ${((r.score || 0) * 100).toFixed(0)}%):
Title: ${r.title || 'No title'}
Published: ${r.publishedDate || 'Unknown date'}
URL: ${r.url || 'No URL'}
Content: ${(r.content || r.rawContent || '').substring(0, 2000)}${(r.content || r.rawContent || '').length > 2000 ? '...' : ''}`
      ),
    ].filter(Boolean).join('\n\n---\n\n');

    // 3. Créer un événement structuré avec OpenAI (Phase 1 amélioré)
    const extractionPrompt = `You are a geopolitical and economic intelligence analyst. Your task is to extract structured information from real-time search results about a current event.

CRITICAL RULES:
1. Return ONLY valid JSON, no markdown, no code blocks, no explanations
2. All scores must be floats between 0 and 1
3. Use null (not "null" string) for unknown information
4. Be FACTUAL and CURRENT - focus on recent/ongoing events
5. Summary must be max 2 sentences, factual only
6. why_it_matters must link event to economic/strategic impact (1-2 sentences)
7. actors must be an array (can be empty [])
8. If information is unknown, use null

JSON Schema (return ONLY this structure):
{
  "event_type": "Geopolitical | Industrial | SupplyChain | Regulatory | Security | Market",
  "event_subtype": "string|null",
  "summary": "max 2 sentences, factual, current event",
  "country": "string|null",
  "region": "string|null",
  "sector": "string|null",
  "actors": ["string"],
  "why_it_matters": "1-2 sentences linking event to economic/strategic impact",
  "first_order_effect": "string|null",
  "second_order_effect": "string|null",
  "impact_score": 0.0,
  "confidence": 0.0
}

Search Query: ${query}

Tavily Search Results (${filteredResults.length} high-quality articles):
${combinedContent.substring(0, 20000)} // Optimisé: plus de contexte (20,000 chars)

Return ONLY the JSON object, nothing else.`;

    const extractionCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a precise data extraction system. Return ONLY valid JSON, no other text. Focus on CURRENT, REAL events.',
        },
        {
          role: 'user',
          content: extractionPrompt,
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const extractedData = JSON.parse(extractionCompletion.choices[0]?.message?.content || '{}');

    // 4. Créer d'abord un enregistrement source dans events (requis pour source_event_id)
    console.log(`[Live Event Creator] Creating source event in 'events' table...`);
    
    const { data: sourceEvent, error: sourceEventError } = await supabase
      .from('events')
      .insert({
        source: 'tavily_live_search',
        source_id: `live_search_${Date.now()}`,
        title: extractedData.summary || query,
        description: extractedData.why_it_matters || null,
        content: combinedContent.substring(0, 5000), // Stocker le contenu source
        published_at: new Date().toISOString(),
        url: filteredResults[0]?.url || null,
        status: 'processed', // Directement marqué comme processed car on crée l'événement structuré immédiatement
      })
      .select()
      .single();

    if (sourceEventError) {
      console.error('[Live Event Creator] Source event error:', sourceEventError);
      throw new Error(`Failed to create source event: ${sourceEventError.message} (Code: ${sourceEventError.code})`);
    }

    if (!sourceEvent || !sourceEvent.id) {
      console.error('[Live Event Creator] Source event is null or missing ID:', sourceEvent);
      throw new Error('Failed to create source event: No ID returned');
    }

    console.log(`[Live Event Creator] Created source event: ${sourceEvent.id}`);

    // 5. Insérer l'événement structuré dans nucigen_events
    console.log(`[Live Event Creator] Inserting nucigen_event with source_event_id: ${sourceEvent.id}`);
    
    const { data: insertedEvent, error: insertError } = await supabase
      .from('nucigen_events')
      .insert({
        source_event_id: sourceEvent.id, // Utiliser l'ID de l'événement source créé (DOIT être défini)
        event_type: extractedData.event_type,
        event_subtype: extractedData.event_subtype,
        summary: extractedData.summary,
        country: extractedData.country,
        region: extractedData.region,
        sector: extractedData.sector,
        actors: extractedData.actors || [],
        why_it_matters: extractedData.why_it_matters,
        first_order_effect: extractedData.first_order_effect,
        second_order_effect: extractedData.second_order_effect,
        impact_score: extractedData.impact_score,
        confidence: extractedData.confidence,
      })
      .select()
      .single();

    if (insertError || !insertedEvent) {
      throw new Error(`Failed to insert event: ${insertError?.message}`);
    }

    console.log(`[Live Event Creator] Created event: ${insertedEvent.id}`);

    // 6. Générer la causal chain (Phase 2B)
    const causalChain = await generateCausalChain(insertedEvent);

    // 7. Générer le contexte historique (Tavily + Phase 4)
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

