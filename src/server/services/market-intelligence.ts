/**
 * Market Intelligence Service
 * 
 * Generates market insights (company stock impacts) from geopolitical events.
 * Uses OpenAI with strict prompt to identify companies likely to benefit or suffer.
 * 
 * Pipeline:
 * 1. Collect event context (title, summary, regions, sectors, entities)
 * 2. Use OpenAI with market intelligence prompt to identify companies
 * 3. Validate and store insights in database
 * 4. Cache results with TTL
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { searchTavily } from './tavily-unified-service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const openaiApiKey = process.env.OPENAI_API_KEY;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!openaiApiKey) {
  throw new Error('OPENAI_API_KEY is required for market intelligence');
}

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

interface EventData {
  event_id: string;
  title: string;
  summary: string;
  date?: string;
  regions?: string[];
  sectors?: string[];
  entities?: string[];
  sources?: Array<{
    title: string;
    url: string;
    publisher?: string;
    date?: string;
  }>;
}

interface MarketInsight {
  company: {
    name: string;
    ticker: string;
    exchange: string;
    sector: string;
  };
  direction: 'up' | 'down';
  probability: number;
  time_horizon: 'short' | 'medium' | 'long';
  thesis: string;
  supporting_evidence: Array<{
    type: 'news' | 'historical_pattern';
    description: string;
    source: string;
    url: string;
  }>;
  confidence?: 'low' | 'medium' | 'high';
}

interface MarketIntelligenceResponse {
  market_insights: MarketInsight[];
}

/**
 * Get event data from Supabase
 */
async function getEventData(eventId: string): Promise<EventData | null> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('events')
    .select('id, headline, description, published_at, discover_regions, discover_sectors, discover_entities, sources')
    .eq('id', eventId)
    .single();

  if (error || !data) {
    console.error(`[MarketIntelligence] Error fetching event ${eventId}:`, error);
    return null;
  }

  // Parse sources if stored as JSONB
  let sources: Array<{ title: string; url: string; publisher?: string; date?: string }> = [];
  if (data.sources) {
    if (typeof data.sources === 'string') {
      try {
        sources = JSON.parse(data.sources);
      } catch (e) {
        console.warn('[MarketIntelligence] Failed to parse sources:', e);
      }
    } else if (Array.isArray(data.sources)) {
      sources = data.sources;
    }
  }

  return {
    event_id: data.id,
    title: data.headline || 'Untitled Event',
    summary: data.description || '',
    date: data.published_at || new Date().toISOString(),
    regions: data.discover_regions || [],
    sectors: data.discover_sectors || [],
    entities: data.discover_entities || [],
    sources,
  };
}

/**
 * Enrich event context with additional market-relevant information via Tavily
 */
async function enrichEventContext(eventData: EventData): Promise<{
  additionalContext: string;
  apiCalls: number;
  estimatedCost: number;
}> {
  let apiCalls = 0;
  let estimatedCost = 0;

  try {
    // Search for recent market analysis related to the event
    const query = `${eventData.title} market impact stock companies`;
    console.log(`[MarketIntelligence] Enriching context with Tavily: ${query}`);
    
    const tavilyResults = await searchTavily({
      query,
      maxResults: 5,
      searchDepth: 'basic',
    });

    apiCalls += 1;
    estimatedCost += 0.001; // Tavily cost estimate

    // Extract key market-relevant information
    const snippets = tavilyResults.results
      .slice(0, 3)
      .map(r => r.content || r.summary)
      .filter(Boolean)
      .join('\n\n');

    return {
      additionalContext: snippets || '',
      apiCalls,
      estimatedCost,
    };
  } catch (error: any) {
    console.warn('[MarketIntelligence] Tavily enrichment failed:', error.message);
    return {
      additionalContext: '',
      apiCalls,
      estimatedCost,
    };
  }
}

/**
 * Generate market insights using OpenAI with strict prompt
 */
async function generateMarketInsights(
  eventData: EventData,
  additionalContext: string
): Promise<{
  insights: MarketInsight[];
  apiCalls: number;
  estimatedCost: number;
}> {
  console.log(`[MarketIntelligence] Generating insights for event: ${eventData.title}`);

  // Build the prompt as specified by the user
  const prompt = `You are a geopolitical and macroeconomic market intelligence analyst.

Your task is to identify publicly traded companies that are likely to BENEFIT or SUFFER
from a specific geopolitical, regulatory, or macroeconomic event.

CRITICAL RULES (NON-NEGOTIABLE):
1. Use ONLY information grounded in real-world facts.
2. Every claim MUST be supported by:
   - a verifiable news article (Reuters, Bloomberg, FT, WSJ, etc.)
   OR
   - a clearly described historical pattern that has occurred before.
3. If no strong causal link exists, explicitly state "No clear market impact identified".
4. Do NOT speculate.
5. Do NOT provide investment advice.
6. Do NOT invent companies, events, or sources.
7. Prefer UNDERCOVERED or SECOND-ORDER companies when relevant (suppliers, logistics, infrastructure).
8. Output MUST be valid JSON only. No markdown. No commentary.

EVENT CONTEXT:
Title: ${eventData.title}
Summary: ${eventData.summary}
Date: ${eventData.date || 'Recent'}
Regions: ${eventData.regions?.join(', ') || 'Global'}
Sectors impacted: ${eventData.sectors?.join(', ') || 'Multiple'}
Entities involved: ${eventData.entities?.join(', ') || 'Various'}

${additionalContext ? `\nADDITIONAL CONTEXT:\n${additionalContext}\n` : ''}

TASK:
Identify between 3 and 9 publicly listed companies that could be impacted.

For each company:
- Determine the direction of impact (UP or DOWN)
- Assign a probability (0.50–0.90) reflecting likelihood, not certainty
- Specify a time horizon (short / medium / long)
- Explain the causal mechanism in 2–3 sentences
- Provide supporting evidence with hyperlinks
- When possible, include historical precedents

OUTPUT FORMAT (STRICT JSON):

{
  "market_insights": [
    {
      "company": {
        "name": "",
        "ticker": "",
        "exchange": "",
        "sector": ""
      },
      "direction": "up | down",
      "probability": 0.00,
      "time_horizon": "short | medium | long",
      "thesis": "",
      "supporting_evidence": [
        {
          "type": "news | historical_pattern",
          "description": "",
          "source": "",
          "url": ""
        }
      ]
    }
  ]
}

QUALITY CHECK BEFORE RESPONDING:
- Are all companies real and publicly listed?
- Is every thesis causally linked to the event?
- Are all evidence items verifiable?
- Are probabilities realistic and conservative?

If any condition is not met, do not include the company.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a market intelligence analyst. Return ONLY valid JSON, no markdown, no commentary.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0, // Strict, deterministic
      response_format: { type: 'json_object' },
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse JSON response
    let parsed: MarketIntelligenceResponse;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse JSON response');
      }
    }

    // Validate insights
    const insights = (parsed.market_insights || []).filter(insight => {
      // Basic validation
      if (!insight.company?.name || !insight.company?.ticker) {
        console.warn('[MarketIntelligence] Invalid insight: missing company info');
        return false;
      }
      if (!['up', 'down'].includes(insight.direction)) {
        console.warn('[MarketIntelligence] Invalid insight: invalid direction');
        return false;
      }
      if (insight.probability < 0.5 || insight.probability > 0.9) {
        console.warn('[MarketIntelligence] Invalid insight: probability out of range');
        return false;
      }
      if (!['short', 'medium', 'long'].includes(insight.time_horizon)) {
        console.warn('[MarketIntelligence] Invalid insight: invalid time_horizon');
        return false;
      }
      return true;
    });

    // Estimate cost (gpt-4o pricing)
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    const estimatedCost = (inputTokens / 1000) * 0.0025 + (outputTokens / 1000) * 0.01; // Approximate pricing

    console.log(`[MarketIntelligence] Generated ${insights.length} insights`);

    return {
      insights,
      apiCalls: 1,
      estimatedCost,
    };
  } catch (error: any) {
    console.error('[MarketIntelligence] Error generating insights:', error);
    throw error;
  }
}

/**
 * Store insights in database
 */
async function storeInsights(
  eventId: string,
  insights: MarketInsight[]
): Promise<{ inserted: number; updated: number; errors: number }> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const insight of insights) {
    try {
      const { error: upsertError } = await supabase
        .from('market_insights')
        .upsert({
          event_id: eventId,
          company_name: insight.company.name,
          company_ticker: insight.company.ticker,
          company_exchange: insight.company.exchange,
          company_sector: insight.company.sector,
          direction: insight.direction,
          probability: insight.probability,
          time_horizon: insight.time_horizon,
          thesis: insight.thesis,
          confidence: insight.confidence || 'medium',
          supporting_evidence: insight.supporting_evidence,
          generated_at: new Date().toISOString(),
          generated_by: 'market_intelligence_service',
          quality_score: 0.7, // Default quality score
          ttl_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days TTL
        }, {
          onConflict: 'event_id,company_ticker,company_exchange',
        });

      if (upsertError) {
        console.error(`[MarketIntelligence] Error storing insight for ${insight.company.ticker}:`, upsertError);
        errors++;
      } else {
        // Check if it was insert or update (we can't tell from upsert, so assume insert for simplicity)
        inserted++;
      }
    } catch (error: any) {
      console.error(`[MarketIntelligence] Error storing insight for ${insight.company.ticker}:`, error.message);
      errors++;
    }
  }

  return { inserted, updated, errors };
}

/**
 * Get cached insights for an event
 */
async function getCachedInsights(eventId: string): Promise<MarketInsight[] | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('market_insights')
    .select('*')
    .eq('event_id', eventId)
    .is('ttl_expires_at', null)
    .or('ttl_expires_at.gt.' + new Date().toISOString())
    .order('probability', { ascending: false });

  if (error || !data || data.length === 0) {
    return null;
  }

  // Convert DB format to MarketInsight format
  return data.map(row => ({
    company: {
      name: row.company_name,
      ticker: row.company_ticker,
      exchange: row.company_exchange,
      sector: row.company_sector,
    },
    direction: row.direction,
    probability: row.probability,
    time_horizon: row.time_horizon,
    thesis: row.thesis,
    confidence: row.confidence,
    supporting_evidence: row.supporting_evidence || [],
  }));
}

/**
 * Main function to generate market insights for an event
 */
export async function generateMarketInsightsForEvent(
  eventId: string,
  options: {
    force_refresh?: boolean;
  } = {}
): Promise<{
  success: boolean;
  insights?: MarketInsight[];
  error?: string;
  metadata?: {
    from_cache: boolean;
    generation_time_ms: number;
    api_calls_count: number;
    estimated_cost_usd: number;
    inserted: number;
    updated: number;
    errors: number;
  };
}> {
  const startTime = Date.now();
  let apiCalls = 0;
  let estimatedCost = 0;

  try {
    // Check cache first
    if (!options.force_refresh) {
      const cached = await getCachedInsights(eventId);
      if (cached && cached.length > 0) {
        return {
          success: true,
          insights: cached,
          metadata: {
            from_cache: true,
            generation_time_ms: Date.now() - startTime,
            api_calls_count: 0,
            estimated_cost_usd: 0,
            inserted: 0,
            updated: 0,
            errors: 0,
          },
        };
      }
    }

    // Get event data
    const eventData = await getEventData(eventId);
    if (!eventData) {
      return {
        success: false,
        error: `Event not found: ${eventId}`,
      };
    }

    // Enrich context with Tavily
    const enriched = await enrichEventContext(eventData);
    apiCalls += enriched.apiCalls;
    estimatedCost += enriched.estimatedCost;

    // Generate insights
    const generated = await generateMarketInsights(eventData, enriched.additionalContext);
    apiCalls += generated.apiCalls;
    estimatedCost += generated.estimatedCost;

    // Store insights
    const storage = await storeInsights(eventId, generated.insights);

    return {
      success: true,
      insights: generated.insights,
      metadata: {
        from_cache: false,
        generation_time_ms: Date.now() - startTime,
        api_calls_count: apiCalls,
        estimated_cost_usd: estimatedCost,
        inserted: storage.inserted,
        updated: storage.updated,
        errors: storage.errors,
      },
    };
  } catch (error: any) {
    console.error('[MarketIntelligence] Error generating insights:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate market insights',
    };
  }
}
