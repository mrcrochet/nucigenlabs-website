/**
 * PHASE 4: Tavily Context Service (CORRECTED)
 * 
 * Enriches existing events with historical context, similar events, and background.
 * Tavily is NOT used to detect new events, only to enrich existing ones.
 */

import { tavily } from '@tavily/core';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const tavilyApiKey = process.env.TAVILY_API_KEY;

if (!tavilyApiKey) {
  console.warn('[Tavily] TAVILY_API_KEY not set. Tavily features will be disabled.');
}

let tavilyClient: ReturnType<typeof tavily> | null = null;

if (tavilyApiKey) {
  try {
    tavilyClient = tavily({ apiKey: tavilyApiKey });
  } catch (error) {
    console.error('[Tavily] Failed to initialize Tavily client:', error);
  }
}

export interface SimilarEvent {
  title: string;
  date: string;
  relevance: number; // 0-1
  url?: string;
}

export interface EventContext {
  historical_context: string; // Similar past events, historical patterns
  similar_events: SimilarEvent[]; // Array of similar events
  background_explanation: string; // Why this matters, background
  validation_notes: string; // Notes on second-order effects validation
}

/**
 * Build a context search query from event data
 * Focus on historical patterns and similar events
 */
function buildContextQuery(event: {
  summary: string;
  why_it_matters?: string | null;
  sector?: string | null;
  region?: string | null;
  country?: string | null;
  event_type?: string | null;
}): string {
  const parts: string[] = [];

  // Add event type for historical context
  if (event.event_type) {
    parts.push(`${event.event_type} events`);
  }

  // Add sector/region for specificity
  if (event.sector) {
    parts.push(event.sector);
  }
  if (event.country) {
    parts.push(event.country);
  } else if (event.region) {
    parts.push(event.region);
  }

  // Add summary (key context)
  if (event.summary) {
    parts.push(event.summary);
  }

  // Add "historical" or "similar" keywords
  parts.push('historical context similar events');

  // Combine and limit length
  const query = parts.join(' ').substring(0, 400);

  return query;
}

/**
 * Enrich an event with historical context using Tavily
 */
export async function enrichEventContext(event: {
  id: string;
  summary: string;
  why_it_matters?: string | null;
  sector?: string | null;
  region?: string | null;
  country?: string | null;
  event_type?: string | null;
  first_order_effect?: string | null;
  second_order_effect?: string | null;
}): Promise<EventContext | null> {
  if (!tavilyClient) {
    console.warn('[Tavily] Tavily not initialized. Skipping context enrichment.');
    return null;
  }

  try {
    console.log(`[Tavily] Enriching context for event: ${event.id}`);

    // Build query for historical context
    const contextQuery = buildContextQuery(event);
    
    // Search for historical context and similar events
    const contextResponse = await tavilyClient.search(contextQuery, {
      searchDepth: 'advanced',
      maxResults: 10,
      includeAnswer: true, // Get AI-generated answer for context
      includeRawContent: false,
    });

    // Extract historical context from answer
    const historical_context = contextResponse.answer || '';
    
    // Extract similar events from results
    const similar_events: SimilarEvent[] = (contextResponse.results || [])
      .slice(0, 5)
      .map((result: any, index: number) => ({
        title: result.title || '',
        date: result.publishedDate || 'Unknown',
        relevance: result.score || (1 - index * 0.1), // Use score or decreasing relevance
        url: result.url,
      }))
      .filter((event: SimilarEvent) => event.title && event.relevance > 0.3);

    // Build query for background explanation
    const backgroundQuery = `${event.summary} ${event.why_it_matters || ''} why important background explanation`.substring(0, 400);
    
    const backgroundResponse = await tavilyClient.search(backgroundQuery, {
      searchDepth: 'basic',
      maxResults: 5,
      includeAnswer: true,
      includeRawContent: false,
    });

    const background_explanation = backgroundResponse.answer || '';

    // Build query for validation (second-order effects)
    let validation_notes = '';
    if (event.second_order_effect) {
      const validationQuery = `${event.summary} ${event.second_order_effect} validation similar effects historical precedent`.substring(0, 400);
      
      const validationResponse = await tavilyClient.search(validationQuery, {
        searchDepth: 'basic',
        maxResults: 3,
        includeAnswer: true,
        includeRawContent: false,
      });

      validation_notes = validationResponse.answer || '';
    }

    return {
      historical_context: historical_context || 'No historical context found.',
      similar_events: similar_events.length > 0 ? similar_events : [],
      background_explanation: background_explanation || 'No background explanation available.',
      validation_notes: validation_notes || 'No validation notes available.',
    };
  } catch (error: any) {
    console.error('[Tavily] Error enriching context:', error.message);
    
    if (error.message?.includes('rate limit')) {
      throw new Error('Tavily rate limit exceeded. Please wait before retrying.');
    }
    if (error.message?.includes('quota')) {
      throw new Error('Tavily quota exceeded.');
    }
    
    return null;
  }
}

/**
 * Check if Tavily is available
 */
export function isTavilyAvailable(): boolean {
  return tavilyClient !== null;
}

