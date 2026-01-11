/**
 * Earnings Calls Service
 * 
 * Fetches and processes earnings call transcripts with LLM extraction.
 * Phase A.2: Earnings Calls Support (PRIORITY HIGH)
 * 
 * Uses external APIs (Seeking Alpha, Alpha Vantage, etc.) or manual input.
 * Transcripts are analyzed using OpenAI for structured extraction.
 */

import { createClient } from '@supabase/supabase-js';
import { callOpenAI } from './openai-optimizer';
import { logApiCall } from './api-metrics';
import { withCache, CacheOptions } from './cache-service';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Alpha Vantage API (for earnings calls transcripts)
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';

export interface EarningsCallMetadata {
  ticker: string;
  companyName?: string;
  quarter: string; // e.g., 'Q1 2025'
  callDate: string; // YYYY-MM-DD
  fiscalYear?: number;
  fiscalQuarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  transcriptUrl?: string;
  transcriptSource?: 'alpha_vantage' | 'seeking_alpha' | 'manual' | 'other';
  durationMinutes?: number;
}

export interface GuidanceChanges {
  revenue?: {
    oldLow?: number;
    oldHigh?: number;
    newLow?: number;
    newHigh?: number;
    direction: 'raised' | 'lowered' | 'maintained';
  };
  eps?: {
    old?: number;
    new?: number;
    direction: 'raised' | 'lowered' | 'maintained';
  };
  [key: string]: any; // Allow other guidance metrics
}

export interface EarningsCallAnalysis {
  summary: string;
  keyPoints: string[];
  guidanceChanges?: GuidanceChanges;
  sentimentScore: number; // -1.00 to 1.00
  sentimentLabel: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  mentionedMetrics?: {
    revenueGrowth?: number;
    marginExpansion?: number;
    capexIncrease?: number;
    [key: string]: any;
  };
  linkedEvents?: string[]; // Array of nucigen_events.id
}

export interface EarningsCallResult {
  metadata: EarningsCallMetadata;
  analysis?: EarningsCallAnalysis;
  rawTranscript?: string; // Full transcript (if requested)
}

/**
 * Fetch earnings call transcript from Alpha Vantage
 * Note: Alpha Vantage has limited earnings calls data. For production, consider:
 * - Seeking Alpha API (paid)
 * - Manual transcript input
 * - Web scraping (with proper attribution and legal compliance)
 */
async function fetchTranscriptFromAlphaVantage(ticker: string, quarter: string): Promise<string | null> {
  if (!ALPHA_VANTAGE_API_KEY) {
    console.warn('[Earnings Calls] ALPHA_VANTAGE_API_KEY not set. Cannot fetch from Alpha Vantage.');
    return null;
  }

  try {
    // Alpha Vantage earnings call endpoint (if available)
    // Note: This may not be available in the free tier
    const url = `${ALPHA_VANTAGE_BASE}?function=EARNINGS_CALL&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`[Earnings Calls] Alpha Vantage API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Parse Alpha Vantage response (format may vary)
    // TODO: Implement proper parsing based on actual API response format
    if (data['Error Message']) {
      console.warn(`[Earnings Calls] Alpha Vantage error: ${data['Error Message']}`);
      return null;
    }

    // Extract transcript from response (adjust based on actual format)
    return data.transcript || data.content || null;
  } catch (error: any) {
    console.warn(`[Earnings Calls] Error fetching from Alpha Vantage:`, error.message);
    return null;
  }
}

/**
 * Analyze earnings call transcript using OpenAI
 */
async function analyzeTranscript(
  transcript: string,
  ticker: string,
  quarter: string
): Promise<EarningsCallAnalysis> {
  const systemPrompt = `You are a financial analyst expert at analyzing earnings call transcripts.
Extract key information including: summary, key points, guidance changes, sentiment, and mentioned metrics.
Return structured JSON with high accuracy and financial insight.`;

  const userPrompt = `Analyze this earnings call transcript for ${ticker} ${quarter}:

${transcript.substring(0, 20000)}... (truncated if longer)

Return a JSON object with:
{
  "summary": "<high-level summary of the earnings call>",
  "keyPoints": ["<point 1>", "<point 2>", ...],
  "guidanceChanges": {
    "revenue": {
      "oldLow": <number or null>,
      "oldHigh": <number or null>,
      "newLow": <number or null>,
      "newHigh": <number or null>,
      "direction": "raised" | "lowered" | "maintained"
    },
    "eps": {
      "old": <number or null>,
      "new": <number or null>,
      "direction": "raised" | "lowered" | "maintained"
    }
  },
  "sentimentScore": <number from -1.00 to 1.00>,
  "sentimentLabel": "very_negative" | "negative" | "neutral" | "positive" | "very_positive",
  "mentionedMetrics": {
    "revenueGrowth": <percentage as decimal or null>,
    "marginExpansion": <percentage as decimal or null>,
    "capexIncrease": <percentage as decimal or null>
  }
}`;

  try {
    const result = await callOpenAI<EarningsCallAnalysis>(
      userPrompt,
      systemPrompt,
      {
        model: 'gpt-4o-mini', // Use cost-effective model
        temperature: 0.2, // Low temperature for accuracy
        maxTokens: 2500,
      }
    );

    const analysis = result.data || {
      summary: '',
      keyPoints: [],
      sentimentScore: 0,
      sentimentLabel: 'neutral',
    };

    // Normalize sentiment label based on score
    if (analysis.sentimentScore && !analysis.sentimentLabel) {
      if (analysis.sentimentScore <= -0.7) {
        analysis.sentimentLabel = 'very_negative';
      } else if (analysis.sentimentScore <= -0.3) {
        analysis.sentimentLabel = 'negative';
      } else if (analysis.sentimentScore <= 0.3) {
        analysis.sentimentLabel = 'neutral';
      } else if (analysis.sentimentScore <= 0.7) {
        analysis.sentimentLabel = 'positive';
      } else {
        analysis.sentimentLabel = 'very_positive';
      }
    }

    return analysis;
  } catch (error: any) {
    console.error('[Earnings Calls] Error analyzing transcript:', error.message);
    // Return default analysis on error
    return {
      summary: 'Analysis failed',
      keyPoints: [],
      sentimentScore: 0,
      sentimentLabel: 'neutral',
    };
  }
}

/**
 * Link earnings call to related events
 */
async function linkEvents(
  ticker: string,
  callDate: string,
  quarter: string
): Promise<string[]> {
  try {
    // Find related events based on company name, ticker, date, etc.
    const { data, error } = await supabase
      .from('nucigen_events')
      .select('id, actors, summary, published_at')
      .ilike('actors', `%${ticker}%`)
      .or(`published_at.gte.${new Date(new Date(callDate).getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()},published_at.lte.${new Date(new Date(callDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()}`)
      .limit(20);

    if (error) {
      console.warn('[Earnings Calls] Error linking events:', error.message);
      return [];
    }

    return (data || []).map(event => event.id);
  } catch (error: any) {
    console.warn('[Earnings Calls] Error linking events:', error.message);
    return [];
  }
}

/**
 * Save earnings call to database
 */
async function saveEarningsCallToDatabase(
  metadata: EarningsCallMetadata,
  analysis: EarningsCallAnalysis
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('earnings_calls')
      .insert({
        company_ticker: metadata.ticker,
        company_name: metadata.companyName || null,
        quarter: metadata.quarter,
        call_date: metadata.callDate,
        fiscal_year: metadata.fiscalYear || null,
        fiscal_quarter: metadata.fiscalQuarter || null,
        transcript_url: metadata.transcriptUrl || null,
        transcript_source: metadata.transcriptSource || 'manual',
        duration_minutes: metadata.durationMinutes || null,
        summary: analysis.summary,
        key_points: analysis.keyPoints || [],
        guidance_changes: analysis.guidanceChanges || null,
        sentiment_score: analysis.sentimentScore,
        sentiment_label: analysis.sentimentLabel,
        mentioned_metrics: analysis.mentionedMetrics || null,
        linked_events: analysis.linkedEvents || [],
        processing_status: 'completed',
        extraction_model: 'gpt-4o-mini',
        extracted_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      // Handle duplicate (already exists)
      if (error.code === '23505') { // Unique violation
        const { data: existing } = await supabase
          .from('earnings_calls')
          .select('id')
          .eq('company_ticker', metadata.ticker)
          .eq('call_date', metadata.callDate)
          .single();
        return existing?.id || '';
      }
      throw error;
    }

    return data?.id || '';
  } catch (error: any) {
    console.error('[Earnings Calls] Error saving to database:', error.message);
    throw error;
  }
}

/**
 * Process earnings call: fetch transcript, analyze, and save
 */
export async function processEarningsCall(
  ticker: string,
  quarter: string,
  callDate: string,
  options: {
    transcriptSource?: 'alpha_vantage' | 'manual' | 'seeking_alpha';
    transcriptText?: string; // If manual input
    transcriptUrl?: string; // If external source
    linkEvents?: boolean;
  } = {}
): Promise<EarningsCallResult> {
  const { transcriptSource = 'manual', transcriptText, transcriptUrl, linkEvents = false } = options;

  try {
    // Fetch or use provided transcript
    let transcript: string | null = null;

    if (transcriptText) {
      transcript = transcriptText;
    } else if (transcriptSource === 'alpha_vantage') {
      transcript = await fetchTranscriptFromAlphaVantage(ticker, quarter);
    } else if (transcriptUrl) {
      // TODO: Implement fetching from transcript URL (with proper attribution)
      console.warn('[Earnings Calls] Fetching from URL not yet implemented');
      throw new Error('Transcript URL fetching not yet implemented');
    }

    if (!transcript) {
      throw new Error('No transcript available for processing');
    }

    // Analyze transcript
    const analysis = await analyzeTranscript(transcript, ticker, quarter);

    // Link related events if requested
    if (linkEvents) {
      analysis.linkedEvents = await linkEvents(ticker, callDate, quarter);
    }

    // Prepare metadata
    const metadata: EarningsCallMetadata = {
      ticker,
      quarter,
      callDate,
      fiscalYear: extractFiscalYear(callDate, quarter),
      fiscalQuarter: extractFiscalQuarter(quarter),
      transcriptUrl: transcriptUrl || undefined,
      transcriptSource,
    };

    // Save to database
    const callId = await saveEarningsCallToDatabase(metadata, analysis);

    return {
      metadata,
      analysis,
      rawTranscript: transcript,
    };
  } catch (error: any) {
    console.error(`[Earnings Calls] Error processing earnings call for ${ticker} ${quarter}:`, error.message);
    throw error;
  }
}

/**
 * Extract fiscal year from date and quarter
 */
function extractFiscalYear(callDate: string, quarter: string): number | undefined {
  const yearMatch = quarter.match(/\d{4}/);
  if (yearMatch) {
    return parseInt(yearMatch[0], 10);
  }
  return new Date(callDate).getFullYear();
}

/**
 * Extract fiscal quarter from quarter string
 */
function extractFiscalQuarter(quarter: string): 'Q1' | 'Q2' | 'Q3' | 'Q4' | undefined {
  const qMatch = quarter.match(/Q([1-4])/i);
  if (qMatch) {
    return `Q${qMatch[1]}` as 'Q1' | 'Q2' | 'Q3' | 'Q4';
  }
  return undefined;
}

/**
 * Get earnings calls from database
 */
export async function getEarningsCallsFromDatabase(
  ticker?: string,
  limit: number = 50
): Promise<any[]> {
  try {
    let query = supabase
      .from('earnings_calls')
      .select('*')
      .order('call_date', { ascending: false })
      .limit(limit);

    if (ticker) {
      query = query.eq('company_ticker', ticker);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('[Earnings Calls] Error fetching from database:', error.message);
    throw error;
  }
}
