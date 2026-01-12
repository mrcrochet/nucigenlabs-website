/**
 * Event Extraction Agent
 * 
 * REAL AGENT IMPLEMENTATION
 * 
 * Responsibilities:
 * - Extract structured events from raw content
 * - ONLY agent that has access to Tavily + Firecrawl API keys
 * - Returns Event[] (UI contract)
 * 
 * CRITICAL RULES:
 * 1. FACTS ONLY - No interpretation, no scoring, no business logic
 * 2. EventAgent does NOT assign impact, priority, or importance
 * 3. EventAgent does NOT filter by "relevance" or "importance"
 * 4. EventAgent extracts: who, what, where, when - that's it
 * 
 * RULE: No other code should directly call Tavily/Firecrawl APIs
 */

import type {
  EventExtractionAgent,
  EventExtractionInput,
  AgentResponse,
} from '../../lib/agents/agent-interfaces';
import type { Event } from '../../types/intelligence';
import { tavily } from '@tavily/core';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config({ path: join(__dirname, '../../../../.env') });
dotenv.config();

// Initialize API clients (ONLY place in codebase that does this)
let tavilyClient: ReturnType<typeof tavily> | null = null;
let openaiClient: OpenAI | null = null;
let supabaseClient: ReturnType<typeof createClient> | null = null;

const tavilyApiKey = process.env.TAVILY_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (tavilyApiKey) {
  tavilyClient = tavily({ apiKey: tavilyApiKey });
  console.log('[EventAgent] Tavily client initialized');
} else {
  console.warn('[EventAgent] TAVILY_API_KEY not configured');
}

if (openaiApiKey) {
  openaiClient = new OpenAI({ apiKey: openaiApiKey });
  console.log('[EventAgent] OpenAI client initialized');
} else {
  console.warn('[EventAgent] OPENAI_API_KEY not configured');
}

if (supabaseUrl && supabaseServiceKey) {
  supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
  console.log('[EventAgent] Supabase client initialized');
} else {
  console.warn('[EventAgent] Supabase not configured');
}

export class EventExtractionAgentImpl implements EventExtractionAgent {
  /**
   * Extract a structured event from raw content
   * Returns null if information is ambiguous or unverified
   */
  async extractEvent(input: EventExtractionInput): Promise<AgentResponse<Event>> {
    const startTime = Date.now();

    try {
      if (!input.raw_content || !input.raw_content.trim()) {
        return {
          data: null,
          error: 'Raw content is required',
          metadata: {
            processing_time_ms: Date.now() - startTime,
          },
        };
      }

      if (!openaiClient) {
        return {
          data: null,
          error: 'OpenAI API key not configured',
          metadata: {
            processing_time_ms: Date.now() - startTime,
          },
        };
      }

      // Extract event using OpenAI
      // CRITICAL: EventAgent extracts FACTS ONLY - no interpretation, no scoring, no business logic
      const extractionPrompt = `You are a factual event extractor. Your task is to extract ONLY verifiable facts from raw content about a current event.

CRITICAL RULES (FACTS ONLY):
1. Return ONLY valid JSON, no markdown, no code blocks, no explanations
2. Use null (not "null" string) for unknown information
3. Be FACTUAL and CURRENT - focus on recent/ongoing events
4. Summary must be max 2 sentences, factual only (who, what, where, when)
5. NO interpretation, NO impact assessment, NO priority scoring
6. actors must be an array (can be empty [])
7. If information is ambiguous or unverified, use null
8. confidence is ONLY about data quality (0.0-1.0), NOT about event importance

JSON Schema (return ONLY this structure - FACTS ONLY):
{
  "event_type": "Geopolitical | Industrial | SupplyChain | Regulatory | Security | Market",
  "event_subtype": "string|null",
  "summary": "max 2 sentences, factual description (who, what, where, when)",
  "country": "string|null",
  "region": "string|null",
  "sector": "string|null",
  "actors": ["string"],
  "confidence": 0.0
}

NOTE: Do NOT include:
- impact_score (not a fact)
- why_it_matters (interpretation, not a fact)
- first_order_effect (prediction, not a fact)
- second_order_effect (prediction, not a fact)

Raw Content:
${input.raw_content.substring(0, 20000)}

Return ONLY the JSON object, nothing else.`;

      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a factual event extractor. Extract ONLY verifiable facts from raw content. NO interpretation, NO scoring, NO business logic. Return ONLY valid JSON.',
          },
          {
            role: 'user',
            content: extractionPrompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        return {
          data: null,
          error: 'No response from OpenAI',
          metadata: {
            processing_time_ms: Date.now() - startTime,
          },
        };
      }

      let extractedData: any;
      try {
        extractedData = JSON.parse(responseText);
      } catch (parseError) {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        } else {
          return {
            data: null,
            error: 'Failed to parse OpenAI response',
            metadata: {
              processing_time_ms: Date.now() - startTime,
            },
          };
        }
      }

      // Validate extracted data
      if (!extractedData.event_type || !extractedData.summary) {
        return {
          data: null,
          error: 'Invalid event data: missing required fields',
          metadata: {
            processing_time_ms: Date.now() - startTime,
          },
        };
      }

      // Convert to Event type (UI contract)
      // CRITICAL: EventAgent returns FACTS ONLY - no impact, no priority, no business logic
      const event: Event = {
        id: `event-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        type: 'event',
        scope: extractedData.region ? 'regional' : 'global', // Factual classification only
        confidence: Math.round((extractedData.confidence || 0.5) * 100), // Data quality, not importance
        impact: 0, // EventAgent does NOT assign impact - this is a fact, not an interpretation
        horizon: 'medium', // Default factual classification
        source_count: 1,
        last_updated: input.source.published_at || new Date().toISOString(),
        event_id: `event-${Date.now()}`,
        headline: extractedData.summary.substring(0, 200),
        description: extractedData.summary,
        date: input.source.published_at || new Date().toISOString(),
        location: extractedData.country || extractedData.region || null,
        actors: extractedData.actors || [],
        sectors: extractedData.sector ? [extractedData.sector] : [],
        sources: [
          {
            name: input.source.name,
            url: input.source.url,
          },
        ],
      };

      return {
        data: event,
        metadata: {
          processing_time_ms: Date.now() - startTime,
          tokens_used: completion.usage?.total_tokens,
          confidence: extractedData.confidence || 0,
        },
      };
    } catch (error: any) {
      return {
        data: null,
        error: error.message || 'Failed to extract event',
        metadata: {
          processing_time_ms: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Extract multiple events from a batch of content
   */
  async extractEvents(inputs: EventExtractionInput[]): Promise<AgentResponse<Event[]>> {
    const startTime = Date.now();

    try {
      const results = await Promise.all(
        inputs.map(input => this.extractEvent(input))
      );

      const events: Event[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.data) {
          events.push(result.data);
        } else if (result.error) {
          errors.push(`Input ${index}: ${result.error}`);
        }
      });

      return {
        data: events,
        error: errors.length > 0 ? errors.join('; ') : undefined,
        metadata: {
          processing_time_ms: Date.now() - startTime,
        },
      };
    } catch (error: any) {
      return {
        data: [],
        error: error.message || 'Failed to extract events',
        metadata: {
          processing_time_ms: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Search for events using Tavily (ONLY method that calls Tavily API)
   */
  async searchAndExtractEvents(query: string): Promise<AgentResponse<Event[]>> {
    const startTime = Date.now();

    try {
      if (!tavilyClient) {
        return {
          data: [],
          error: 'Tavily API key not configured',
          metadata: {
            processing_time_ms: Date.now() - startTime,
          },
        };
      }

      console.log(`[EventAgent] Searching Tavily for: "${query}"`);

      const tavilyResponse = await tavilyClient.search(query, {
        searchDepth: 'advanced',
        maxResults: 50,
        includeAnswer: true,
        includeRawContent: true,
        includeImages: false,
      });

      if (!tavilyResponse.results || tavilyResponse.results.length === 0) {
        return {
          data: [],
          error: 'No results from Tavily',
          metadata: {
            processing_time_ms: Date.now() - startTime,
          },
        };
      }

      console.log(`[EventAgent] Found ${tavilyResponse.results.length} articles from Tavily`);

      // Filter by relevance score (technical filter, not business logic)
      // Note: This is a technical quality filter (Tavily's relevance score), not a business priority filter
      const filteredResults = tavilyResponse.results
        .filter((r: any) => (r.score || 0) >= 0.3) // Lower threshold - we want facts, not "important" facts
        .slice(0, 50); // Take more results - EventAgent doesn't decide what's "important"

      // Convert to EventExtractionInput
      const extractionInputs: EventExtractionInput[] = filteredResults.map((r: any) => ({
        raw_content: [
          tavilyResponse.answer ? `Tavily AI Summary:\n${tavilyResponse.answer}\n\n---\n\n` : '',
          `Title: ${r.title || 'No title'}\nPublished: ${r.publishedDate || 'Unknown date'}\nURL: ${r.url || 'No URL'}\nContent: ${(r.content || r.rawContent || '').substring(0, 2000)}`,
        ].filter(Boolean).join('\n\n'),
        source: {
          name: r.title || 'Unknown Source',
          url: r.url || '',
          published_at: r.publishedDate || new Date().toISOString(),
        },
      }));

      // Extract events from all inputs
      const eventsResponse = await this.extractEvents(extractionInputs);

      return {
        data: eventsResponse.data || [],
        error: eventsResponse.error,
        metadata: {
          processing_time_ms: Date.now() - startTime,
        },
      };
    } catch (error: any) {
      return {
        data: [],
        error: error.message || 'Failed to search and extract events',
        metadata: {
          processing_time_ms: Date.now() - startTime,
        },
      };
    }
  }
}

// Export singleton instance
export const eventAgent = new EventExtractionAgentImpl();
