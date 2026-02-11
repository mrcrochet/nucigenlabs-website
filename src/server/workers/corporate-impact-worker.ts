/**
 * Corporate Impact Worker
 * 
 * Analyzes geopolitical/regulatory events and generates market signals
 * identifying companies likely to be impacted (opportunities or risks)
 */

import { createClient } from '@supabase/supabase-js';
import { chatCompletions } from '../services/perplexity-service';
import { getQuote } from '../services/finnhub-service';
import { normalizeSector } from '../utils/sector-normalize';
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
  content?: string;
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
 * Get recent events for Corporate Impact (real data).
 * Wide criteria: all tiers, geopolitics/finance/energy/supply-chain or uncategorized, last 30 days.
 */
async function getRelevantEvents(limit: number = 20): Promise<Event[]> {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('events')
      .select('id, title, description, content, discover_tier, discover_category, published_at')
      .gte('published_at', since)
      .not('title', 'is', null)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Corporate Impact] Error fetching events:', error);
      return [];
    }

    const rows = (data || []) as Event[];
    if (rows.length > 0) {
      const withCategory = rows.filter(
        (e) => e.discover_category && ['geopolitics', 'finance', 'energy', 'supply-chain'].includes(e.discover_category)
      );
      const withoutCategory = rows.filter(
        (e) => !e.discover_category || !['geopolitics', 'finance', 'energy', 'supply-chain'].includes(e.discover_category)
      );
      return [...withCategory, ...withoutCategory].slice(0, limit);
    }
    // Fallback: sync from nucigen_events so Corporate Impact can run with real data
    console.log('[Corporate Impact] No events in events table, syncing from nucigen_events...');
    return getOrSyncEventsFromNucigenEvents(limit);
  } catch (error: any) {
    console.error('[Corporate Impact] Error in getRelevantEvents:', error.message);
    return [];
  }
}

const NUCIGEN_SYNC_SOURCE = 'nucigen_sync';

/** When events table is empty, sync recent nucigen_events into events so the worker can process them. */
async function getOrSyncEventsFromNucigenEvents(limit: number): Promise<Event[]> {
  try {
    const { data: neList, error: fetchError } = await supabase
      .from('nucigen_events')
      .select('id, summary, sector, region, created_at, why_it_matters')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (fetchError || !neList || neList.length === 0) {
      console.warn('[Corporate Impact] No nucigen_events found:', fetchError?.message);
      return [];
    }

    const syncedIds: string[] = [];
    for (const ne of neList as Array<{ id: string; summary: string; sector?: string; region?: string; created_at: string; why_it_matters?: string }>) {
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('source', NUCIGEN_SYNC_SOURCE)
        .eq('source_id', ne.id)
        .maybeSingle();

      if (existing) {
        syncedIds.push(ne.id);
        continue;
      }

      const title = (ne.summary || '').slice(0, 500) || 'Event';
      const description = (ne.why_it_matters || ne.summary || '').slice(0, 2000);
      const { error: insertError } = await supabase.from('events').insert({
        source: NUCIGEN_SYNC_SOURCE,
        source_id: ne.id,
        title,
        description: description || title,
        content: description || title,
        published_at: ne.created_at || new Date().toISOString(),
        status: 'pending',
      } as Record<string, unknown>);

      if (insertError) {
        console.warn('[Corporate Impact] Sync insert failed for nucigen_event', ne.id, insertError.message);
      } else {
        syncedIds.push(ne.id);
      }
    }

    if (syncedIds.length === 0) return [];

    const { data: events, error: selectError } = await supabase
      .from('events')
      .select('id, title, description, content, discover_tier, discover_category, published_at')
      .eq('source', NUCIGEN_SYNC_SOURCE)
      .in('source_id', syncedIds)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (selectError || !events) return [];
    console.log('[Corporate Impact] Synced', events.length, 'events from nucigen_events');
    return events as Event[];
  } catch (err: any) {
    console.error('[Corporate Impact] getOrSyncEventsFromNucigenEvents error:', err?.message);
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
${event.description ? `Description: ${event.description.substring(0, 500)}` : ''}
${event.content ? `Content: ${event.content.substring(0, 500)}` : ''}
${event.discover_category ? `Category: ${event.discover_category}` : ''}
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

    // Extract citations/URLs from Perplexity response
    const citations = response.choices[0]?.message?.citations || response.citations || [];
    const urlPattern = /https?:\/\/[^\s\)]+/g;
    const foundUrls = [...new Set([...content.match(urlPattern) || [], ...citations])];

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[Corporate Impact] No JSON found in Perplexity response');
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const companies = parsed.companies || [];

    // Store URLs in a global variable or return them with companies
    // We'll attach them to the companies array as metadata
    (companies as any[]).forEach((company: any) => {
      company._perplexityUrls = foundUrls;
    });

    console.log(`[Corporate Impact] Identified ${companies.length} companies for event ${event.id} with ${foundUrls.length} source URLs`);
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
export async function generateMarketSignalsFromEvent(eventId: string): Promise<number> {
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

    // STEP: Run Corporate Impact Engine (event-level analysis → event_impact_analyses)
    try {
      const { runEventImpactAnalysis } = await import('../services/corporate-impact-engine.js');
      await runEventImpactAnalysis({
        id: event.id,
        title: event.title,
        published_at: event.published_at,
        description: event.description,
        content: event.content,
        region: event.region,
        sector: event.sector,
        discover_category: event.discover_category,
      });
    } catch (engineErr: any) {
      console.warn('[Corporate Impact] Engine analysis failed (non-blocking):', engineErr?.message);
    }

    // STEP: Analyze trade impact with Comtrade (if applicable)
    let tradeImpactData = null;
    try {
      const { analyzeTradeImpact, generateTradeImpactExplanation, storeTradeImpactData } = await import('../services/comtrade-impact-analyzer.js');
      
      // Extract countries and sectors from event
      const countries: string[] = [];
      const sectors: string[] = [];
      
      // Try to extract from event fields
      if (event.region) {
        countries.push(event.region);
      }
      if (event.sector) {
        sectors.push(event.sector);
      }
      if ((event as any).country) {
        countries.push((event as any).country);
      }
      
      // If we have countries and sectors, analyze trade impact
      if (countries.length > 0 && sectors.length > 0) {
        console.log(`[Corporate Impact] Analyzing trade impact with Comtrade for event ${eventId}`);
        
        const tradeImpact = await analyzeTradeImpact({
          event_id: eventId,
          countries,
          sectors,
          event_date: event.published_at || new Date().toISOString(),
          comparison_window: '3-6 months',
        });

        if (tradeImpact && tradeImpact.trade_impact_score > 0.3) {
          // Only store if impact is significant
          const explanation = await generateTradeImpactExplanation(
            tradeImpact,
            event.title,
            event.description || event.content || ''
          );
          
          await storeTradeImpactData(eventId, tradeImpact, explanation);
          tradeImpactData = tradeImpact;
          
          console.log(`[Corporate Impact] Trade impact validated: Score ${tradeImpact.trade_impact_score.toFixed(2)}, Type: ${tradeImpact.impact_type}`);
        }
      }
    } catch (error: any) {
      console.warn(`[Corporate Impact] Comtrade analysis failed (non-blocking):`, error.message);
      // Continue without trade impact data
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
        const perplexityUrls = (company as any)._perplexityUrls || [];
        const sources: Array<string | { type: string; title?: string; url?: string }> = [];
        
        // Add Perplexity sources with URLs
        if (perplexityUrls.length > 0) {
          perplexityUrls.slice(0, 10).forEach((url: string) => {
            sources.push({
              type: 'perplexity',
              url: url,
              title: new URL(url).hostname.replace('www.', ''),
            });
          });
        } else {
          // Fallback if no URLs found
          sources.push('Perplexity Research');
        }
        
        // Add Market Analysis
        sources.push('Market Analysis');

        // Boost confidence if trade impact is validated
        let finalConfidence = prediction.confidence;
        if (tradeImpactData && tradeImpactData.confidence > 0.7) {
          // Boost confidence by one level if trade impact is validated
          const confidenceLevels: Array<'low' | 'medium-low' | 'medium' | 'medium-high' | 'high'> = 
            ['low', 'medium-low', 'medium', 'medium-high', 'high'];
          const currentIndex = confidenceLevels.indexOf(prediction.confidence);
          if (currentIndex < confidenceLevels.length - 1) {
            finalConfidence = confidenceLevels[currentIndex + 1];
          }
        }

        // Include trade impact data if available
        let tradeImpactForSignal = null;
        if (tradeImpactData) {
          tradeImpactForSignal = {
            trade_impact_score: tradeImpactData.trade_impact_score,
            impact_type: tradeImpactData.impact_type,
            direction: tradeImpactData.direction,
            confidence: tradeImpactData.confidence,
            trade_evidence: tradeImpactData.trade_evidence,
            hs_codes: tradeImpactData.hs_codes,
            countries_affected: tradeImpactData.countries_affected,
          };
        }

        // Enrich with real market data from Finnhub
        if (company.ticker && !company.ticker.toLowerCase().includes('not available')) {
          try {
            const quote = await getQuote(company.ticker);
            if (quote && quote.c > 0) {
              company.current_price = `$${quote.c.toFixed(2)}`;
              prediction.market_data = {
                ...prediction.market_data,
                current_price: quote.c,
                previous_close: quote.pc,
                change: quote.d,
                change_percent: quote.dp,
                day_high: quote.h,
                day_low: quote.l,
              };
            }
          } catch { /* silent — Finnhub rate limit or unknown ticker */ }
          // Rate limit: Finnhub free tier = 60 calls/min
          await new Promise(r => setTimeout(r, 200));
        }

        const signal: MarketSignalData = {
          type: company.impact_type,
          company_name: company.company_name,
          company_ticker: company.ticker,
          company_sector: normalizeSector(company.sector || 'Other'),
          company_market_cap: company.market_cap,
          company_current_price: company.current_price,
          company_exchange: company.exchange,
          prediction_direction: company.impact_type === 'opportunity' ? 'up' : 'down',
          prediction_magnitude: prediction.magnitude,
          prediction_timeframe: prediction.timeframe,
          prediction_confidence: finalConfidence,
          prediction_target_price: prediction.target_price,
          catalyst_event_title: event.title,
          catalyst_event_tier: (event as any).discover_tier || null,
          reasoning_summary: company.reasoning,
          reasoning_key_factors: prediction.key_factors,
          reasoning_risks: prediction.risks,
          market_data: prediction.market_data,
          sources: tradeImpactData ? [...sources, { type: 'comtrade', title: 'UN Comtrade', description: 'Trade flow analysis' }] : sources,
          trade_impact: tradeImpactForSignal || undefined,
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
            trade_impact: signal.trade_impact || null,
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
export async function processCorporateImpactSignals(limit: number = 20): Promise<{
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
        // Always ensure event-level analysis exists (event_impact_analyses) so Deep Dive works
        try {
          const { runEventImpactAnalysis } = await import('../services/corporate-impact-engine.js');
          await runEventImpactAnalysis({
            id: event.id,
            title: event.title,
            published_at: event.published_at,
            description: event.description,
            content: event.content,
            region: event.region,
            sector: event.sector,
            discover_category: event.discover_category,
          });
        } catch (engineErr: any) {
          console.warn('[Corporate Impact] Engine analysis failed (non-blocking):', engineErr?.message);
        }

        // Check if signals already exist for this event
        const { data: existing } = await supabase
          .from('market_signals')
          .select('id')
          .eq('event_id', event.id)
          .eq('is_active', true)
          .limit(1);

        if (existing && existing.length > 0) {
          console.log(`[Corporate Impact] Signals already exist for event ${event.id}, skipping signal generation`);
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

/**
 * Refresh Finnhub prices on all active signals (daily job).
 * Deduplicates by ticker to minimize API calls, then batch-updates all matching signals.
 */
export async function refreshSignalPrices(): Promise<{ updated: number; tickers: number; errors: number }> {
  console.log('[Corporate Impact] Starting daily price refresh...');

  // Fetch all active signals with a valid ticker
  const { data: signals, error } = await supabase
    .from('market_signals')
    .select('id, company_ticker, market_data')
    .eq('is_active', true)
    .not('company_ticker', 'is', null);

  if (error || !signals || signals.length === 0) {
    console.warn('[Corporate Impact] No signals to refresh:', error?.message);
    return { updated: 0, tickers: 0, errors: 0 };
  }

  // Group signal IDs by ticker
  const tickerMap = new Map<string, string[]>();
  for (const s of signals) {
    const ticker = (s.company_ticker || '').trim();
    if (!ticker || ticker.toLowerCase().includes('not available')) continue;
    if (!tickerMap.has(ticker)) tickerMap.set(ticker, []);
    tickerMap.get(ticker)!.push(s.id);
  }

  console.log(`[Corporate Impact] Refreshing prices for ${tickerMap.size} unique tickers (${signals.length} signals)`);

  let updated = 0;
  let errors = 0;

  for (const [ticker, ids] of tickerMap) {
    try {
      const quote = await getQuote(ticker);
      if (!quote || quote.c <= 0) continue;

      const newPrice = `$${quote.c.toFixed(2)}`;
      const newMarketData = {
        current_price: quote.c,
        previous_close: quote.pc,
        change: quote.d,
        change_percent: quote.dp,
        day_high: quote.h,
        day_low: quote.l,
        refreshed_at: new Date().toISOString(),
      };

      // Update all signals with this ticker
      for (const id of ids) {
        const existing = signals.find(s => s.id === id);
        const mergedMarketData = {
          ...(typeof existing?.market_data === 'object' ? existing.market_data : {}),
          ...newMarketData,
        };

        const { error: updateError } = await supabase
          .from('market_signals')
          .update({
            company_current_price: newPrice,
            market_data: mergedMarketData,
          })
          .eq('id', id);

        if (updateError) {
          errors++;
        } else {
          updated++;
        }
      }
    } catch {
      errors++;
    }

    // Rate limit: 60 calls/min
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`[Corporate Impact] Price refresh complete: ${updated} signals updated, ${tickerMap.size} tickers, ${errors} errors`);
  return { updated, tickers: tickerMap.size, errors };
}

// Export for use in pipeline
export default processCorporateImpactSignals;
