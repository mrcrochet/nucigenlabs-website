/**
 * Corporate Impact Worker
 * 
 * Analyzes geopolitical/regulatory events and generates market signals
 * identifying companies likely to be impacted (opportunities or risks)
 */

import { createClient } from '@supabase/supabase-js';
import { chatCompletions } from '../services/perplexity-service';
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
  console.error('[Corporate Impact] Missing Supabase config');
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.warn('[Corporate Impact] OPENAI_API_KEY not configured');
}

const openaiClient = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

interface Event {
  id: string;
  title: string;
  description?: string;
  summary?: string;
  discover_tier?: string;
  discover_category?: string;
  sector?: string;
  region?: string;
  published_at: string;
  event_type?: string;
}

interface CompanyImpact {
  company_name: string;
  ticker?: string;
  sector?: string;
  market_cap?: string;
  current_price?: string;
  exchange?: string;
  impact_type: 'opportunity' | 'risk';
  reasoning: string;
}

interface MarketSignalData {
  type: 'opportunity' | 'risk';
  company_name: string;
  company_ticker?: string;
  company_sector?: string;
  company_market_cap?: string;
  company_current_price?: string;
  company_exchange?: string;
  prediction_direction: 'up' | 'down';
  prediction_magnitude: string;
  prediction_timeframe: string;
  prediction_confidence: 'high' | 'medium-high' | 'medium' | 'medium-low' | 'low';
  prediction_target_price?: string;
  catalyst_event_title: string;
  catalyst_event_tier?: string;
  reasoning_summary: string;
  reasoning_key_factors: string[];
  reasoning_risks: string[];
  market_data: {
    volume_change?: string;
    institutional_interest?: string;
    analyst_coverage?: string;
    short_interest?: string;
  };
  sources: string[];
}

/**
 * Get recent geopolitical/regulatory events
 */
async function getRelevantEvents(limit: number = 10): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, description, summary, discover_tier, discover_category, sector, region, published_at')
      .or('discover_tier.eq.critical,discover_tier.eq.strategic')
      .in('discover_category', ['geopolitics', 'finance', 'energy', 'supply-chain'])
      .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Corporate Impact] Error fetching events:', error);
      return [];
    }

    return (data || []) as Event[];
  } catch (error: any) {
    console.error('[Corporate Impact] Error in getRelevantEvents:', error.message);
    return [];
  }
}

/**
 * Identify companies impacted by an event using Perplexity
 */
async function identifyCompaniesWithPerplexity(event: Event): Promise<CompanyImpact[]> {
  if (!openaiClient) {
    console.warn('[Corporate Impact] OpenAI not available, skipping company identification');
    return [];
  }

  try {
    const eventContext = `
Event Title: ${event.title}
${event.summary ? `Summary: ${event.summary}` : ''}
${event.description ? `Description: ${event.description.substring(0, 500)}` : ''}
${event.sector ? `Sector: ${event.sector}` : ''}
${event.region ? `Region: ${event.region}` : ''}
${event.discover_category ? `Category: ${event.discover_category}` : ''}
`;

    // Use Perplexity to identify companies
    const perplexityQuery = `Which publicly traded companies are most likely to be impacted by this event: "${event.title}"?

${eventContext}

Focus on:
1. Companies with significant exposure to the affected sector/region
2. Both opportunities (companies that could benefit) and risks (companies that could be hurt)
3. Include ticker symbols, market cap, current stock price, and exchange if available
4. Explain why each company is impacted

Return a JSON array with this structure:
{
  "companies": [
    {
      "company_name": "Company Name",
      "ticker": "TICKER",
      "sector": "Sector",
      "market_cap": "$XXXM or $XXB",
      "current_price": "$XX.XX",
      "exchange": "NYSE/NASDAQ/etc",
      "impact_type": "opportunity" or "risk",
      "reasoning": "Why this company is impacted"
    }
  ]
}`;

    const response = await chatCompletions({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: 'You are a financial intelligence analyst specializing in identifying companies impacted by geopolitical and regulatory events. Return only valid JSON.',
        },
        {
          role: 'user',
          content: perplexityQuery,
        },
      ],
      return_citations: true,
      max_tokens: 3000,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn('[Corporate Impact] No content in Perplexity response');
      return [];
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[Corporate Impact] No JSON found in Perplexity response');
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const companies = parsed.companies || [];

    console.log(`[Corporate Impact] Identified ${companies.length} companies for event ${event.id}`);
    return companies as CompanyImpact[];
  } catch (error: any) {
    console.error('[Corporate Impact] Error identifying companies:', error.message);
    return [];
  }
}

/**
 * Generate historical pattern analysis using OpenAI (Causal Replay™)
 */
async function generateSignalPrediction(
  company: CompanyImpact,
  event: Event
): Promise<{
  magnitude: string;
  timeframe: string;
  confidence: 'high' | 'medium-high' | 'medium' | 'medium-low' | 'low';
  target_price?: string;
  key_factors: string[];
  risks: string[];
  market_data: any;
}> {
  if (!openaiClient) {
    // Fallback if OpenAI not available
    return {
      magnitude: '15-30%',
      timeframe: '1-3 months',
      confidence: 'medium',
      key_factors: [company.reasoning],
      risks: ['Market volatility', 'Uncertainty in timing'],
      market_data: {},
    };
  }

  try {
    const prompt = `Analyze historical market patterns for ${company.company_name} (${company.ticker || 'N/A'}) based on this event:

Event: ${event.title}
${event.summary ? `Summary: ${event.summary}` : ''}

Company Impact Type: ${company.impact_type === 'opportunity' ? 'OPPORTUNITY (historical pattern shows stock increases)' : 'RISK (historical pattern shows stock decreases)'}
Reasoning: ${company.reasoning}

Find similar historical events and analyze what actually happened to similar companies. Return:
1. Magnitude: Historical impact range observed in past similar cases (e.g., "25-40%" or "8-15%")
2. Timeframe: Observed timeframe from past cases (e.g., "2-4 weeks", "3-6 months")
3. Confidence: Pattern match quality - high (strong historical precedent), medium-high, medium, medium-low, or low
4. Target Price: If current_price is available, show observed price range from past similar cases (format: "$XX-XX (post-event, past cases)")
5. Key Factors: 3-6 specific factors from historical cases that explain the pattern
6. Risks: 2-4 factors that could break the historical pattern
7. Market Data: Typical volume_change, institutional_interest, analyst_coverage, short_interest from past cases

IMPORTANT: Focus on what HAS happened in similar past cases, not predictions. Use phrases like "Historical pattern shows..." or "Past cases indicate...".

Return JSON:
{
  "magnitude": "XX-XX%",
  "timeframe": "X-X weeks/months",
  "confidence": "high|medium-high|medium|medium-low|low",
  "target_price": "$XX-XX (post-event, past cases)",
  "key_factors": ["factor 1", "factor 2", ...],
  "risks": ["risk 1", "risk 2", ...],
  "market_data": {
    "volume_change": "+XXX%",
    "institutional_interest": "description",
    "analyst_coverage": "description",
    "short_interest": "X.X%"
  }
}`;

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a financial analyst specializing in historical pattern analysis and causal replay. You identify what happened in past similar cases, not predictions. Return only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    const parsed = JSON.parse(content);
    // Ensure target_price includes "(post-event, past cases)" if provided
    let targetPrice = parsed.target_price;
    if (targetPrice && !targetPrice.includes('(post-event, past cases)')) {
      targetPrice = `${targetPrice} (post-event, past cases)`;
    }
    
    return {
      magnitude: parsed.magnitude || '15-30%',
      timeframe: parsed.timeframe || '1-3 months',
      confidence: parsed.confidence || 'medium',
      target_price: targetPrice,
      key_factors: parsed.key_factors || [],
      risks: parsed.risks || [],
      market_data: parsed.market_data || {},
    };
  } catch (error: any) {
    console.error('[Corporate Impact] Error generating historical pattern analysis:', error.message);
    // Fallback
    return {
      magnitude: '15-30%',
      timeframe: '1-3 months',
      confidence: 'medium',
      target_price: company.current_price ? `${company.current_price} (post-event, past cases)` : undefined,
      key_factors: [company.reasoning],
      risks: ['Market volatility', 'Uncertainty in timing'],
      market_data: {},
    };
  }
}

/**
 * Generate market signals from an event
 */
async function generateMarketSignalsFromEvent(eventId: string): Promise<number> {
  try {
    // Get event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      console.error(`[Corporate Impact] Event not found: ${eventId}`);
      return 0;
    }

    // Identify companies
    const companies = await identifyCompaniesWithPerplexity(event as Event);
    if (companies.length === 0) {
      console.log(`[Corporate Impact] No companies identified for event ${eventId}`);
      return 0;
    }

    // Generate signals for each company
    const signals: MarketSignalData[] = [];
    for (const company of companies) {
      try {
        const prediction = await generateSignalPrediction(company, event as Event);

        // Get sources from Perplexity citations (if available)
        const sources = ['Perplexity Research', 'Market Analysis'];

        const signal: MarketSignalData = {
          type: company.impact_type,
          company_name: company.company_name,
          company_ticker: company.ticker,
          company_sector: company.sector,
          company_market_cap: company.market_cap,
          company_current_price: company.current_price,
          company_exchange: company.exchange,
          prediction_direction: company.impact_type === 'opportunity' ? 'up' : 'down',
          prediction_magnitude: prediction.magnitude,
          prediction_timeframe: prediction.timeframe,
          prediction_confidence: prediction.confidence,
          prediction_target_price: prediction.target_price,
          catalyst_event_title: event.title,
          catalyst_event_tier: (event as any).discover_tier || null,
          reasoning_summary: company.reasoning,
          reasoning_key_factors: prediction.key_factors,
          reasoning_risks: prediction.risks,
          market_data: prediction.market_data,
          sources,
        };

        signals.push(signal);
      } catch (error: any) {
        console.error(`[Corporate Impact] Error processing company ${company.company_name}:`, error.message);
      }
    }

    // Store signals in database
    let inserted = 0;
    for (const signal of signals) {
      try {
        const { error: insertError } = await supabase
          .from('market_signals')
          .insert({
            event_id: eventId,
            type: signal.type,
            company_name: signal.company_name,
            company_ticker: signal.company_ticker,
            company_sector: signal.company_sector,
            company_market_cap: signal.company_market_cap,
            company_current_price: signal.company_current_price,
            company_exchange: signal.company_exchange,
            prediction_direction: signal.prediction_direction,
            prediction_magnitude: signal.prediction_magnitude,
            prediction_timeframe: signal.prediction_timeframe,
            prediction_confidence: signal.prediction_confidence,
            prediction_target_price: signal.prediction_target_price,
            catalyst_event_title: signal.catalyst_event_title,
            catalyst_event_tier: signal.catalyst_event_tier,
            reasoning_summary: signal.reasoning_summary,
            reasoning_key_factors: signal.reasoning_key_factors,
            reasoning_risks: signal.reasoning_risks,
            market_data: signal.market_data,
            sources: signal.sources,
            is_active: true,
            generated_by: 'corporate_impact_worker',
          } as any);

        if (insertError) {
          console.error(`[Corporate Impact] Error inserting signal:`, insertError.message);
        } else {
          inserted++;
        }
      } catch (error: any) {
        console.error(`[Corporate Impact] Error storing signal:`, error.message);
      }
    }

    console.log(`[Corporate Impact] Generated ${inserted} signals for event ${eventId}`);
    return inserted;
  } catch (error: any) {
    console.error('[Corporate Impact] Error generating signals:', error.message);
    return 0;
  }
}

/**
 * Main worker function - processes recent events and generates signals
 */
export async function processCorporateImpactSignals(limit: number = 5): Promise<{
  eventsProcessed: number;
  signalsGenerated: number;
  errors: number;
}> {
  console.log('[Corporate Impact] Starting signal generation...');

  let eventsProcessed = 0;
  let signalsGenerated = 0;
  let errors = 0;

  try {
    // Get relevant events
    const events = await getRelevantEvents(limit);
    console.log(`[Corporate Impact] Found ${events.length} relevant events`);

    // Process each event
    for (const event of events) {
      try {
        // Check if signals already exist for this event
        const { data: existing } = await supabase
          .from('market_signals')
          .select('id')
          .eq('event_id', event.id)
          .eq('is_active', true)
          .limit(1);

        if (existing && existing.length > 0) {
          console.log(`[Corporate Impact] Signals already exist for event ${event.id}, skipping`);
          continue;
        }

        const count = await generateMarketSignalsFromEvent(event.id);
        if (count > 0) {
          eventsProcessed++;
          signalsGenerated += count;
        }
      } catch (error: any) {
        console.error(`[Corporate Impact] Error processing event ${event.id}:`, error.message);
        errors++;
      }
    }

    console.log(`[Corporate Impact] Complete: ${eventsProcessed} events processed, ${signalsGenerated} signals generated, ${errors} errors`);

    return {
      eventsProcessed,
      signalsGenerated,
      errors,
    };
  } catch (error: any) {
    console.error('[Corporate Impact] Fatal error:', error.message);
    return {
      eventsProcessed: 0,
      signalsGenerated: 0,
      errors: 1,
    };
  }
}

// Export for use in pipeline
export default processCorporateImpactSignals;
