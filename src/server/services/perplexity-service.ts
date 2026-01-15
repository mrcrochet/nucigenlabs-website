/**
 * Perplexity Service
 * 
 * Technical wrapper for Perplexity API
 * 
 * Responsibilities:
 * - Wrapper technique ONLY - no business logic
 * - Returns raw normalized data
 * - Handles errors, retries, rate limiting
 * - Supports Chat Completions, Search, and future Finance Tools
 * 
 * Based on: https://docs.perplexity.ai/
 * Roadmap: https://docs.perplexity.ai/feature-roadmap#finance-tools-integration
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config({ path: join(__dirname, '../../../../.env') });
dotenv.config();

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_BASE_URL = 'https://api.perplexity.ai';

// Debug: Log API key status (without exposing the key)
if (!PERPLEXITY_API_KEY) {
  console.warn('[Perplexity] ⚠️  PERPLEXITY_API_KEY not found in environment variables');
  console.warn('[Perplexity] Please add PERPLEXITY_API_KEY to your .env file');
} else {
  console.log(`[Perplexity] ✅ API key loaded (${PERPLEXITY_API_KEY.substring(0, 8)}...)`);
}

// Rate limiting: Perplexity has rate limits based on tier
// Default: 5 requests/second (adjust based on your tier)
const RATE_LIMIT_DELAY = 200; // ms between requests
let lastRequestTime = 0;

/**
 * Rate limiting helper
 */
async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

/**
 * Make API request with retry logic
 */
async function makeRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY not configured');
  }

  await rateLimit();

  const url = `${PERPLEXITY_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY.trim()}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData: any;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }

    if (response.status === 429) {
      throw new Error('Perplexity API rate limit exceeded. Please try again later.');
    }

    if (response.status === 401) {
      throw new Error('Perplexity API key is invalid or expired.');
    }

    throw new Error(
      `Perplexity API error: ${response.status} ${response.statusText}. ${errorData.message || errorData.error || ''}`
    );
  }

  return await response.json();
}

/**
 * Chat Completions
 * 
 * Use Perplexity's chat models for research and analysis
 * Models: sonar, sonar-pro, sonar-reasoning, etc.
 */
export interface PerplexityChatOptions {
  model?: 'sonar' | 'sonar-pro' | 'sonar-reasoning' | 'sonar-online' | 'llama-3.1-sonar-small-128k-online' | 'llama-3.1-sonar-large-128k-online';
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
  return_citations?: boolean;
  return_related_questions?: boolean;
  search_domain_filter?: string[];
  search_recency_filter?: 'month' | 'week' | 'day' | 'hour';
  return_images?: boolean;
  return_videos?: boolean;
  disable_web_search?: boolean;
}

export interface PerplexityChatResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
      citations?: string[];
      images?: string[];
    };
    delta?: {
      role?: string;
      content?: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations?: string[];
  images?: string[];
  related_questions?: string[];
}

/**
 * Chat Completions API
 */
export async function chatCompletions(
  options: PerplexityChatOptions
): Promise<PerplexityChatResponse> {
  const response = await makeRequest('/chat/completions', {
    method: 'POST',
    body: JSON.stringify({
      model: options.model || 'sonar',
      messages: options.messages,
      temperature: options.temperature,
      max_tokens: options.max_tokens,
      top_p: options.top_p,
      top_k: options.top_k,
      stream: options.stream || false,
      presence_penalty: options.presence_penalty,
      frequency_penalty: options.frequency_penalty,
      return_citations: options.return_citations !== false, // Default true
      return_related_questions: options.return_related_questions,
      search_domain_filter: options.search_domain_filter,
      search_recency_filter: options.search_recency_filter,
      return_images: options.return_images,
      return_videos: options.return_videos,
      disable_web_search: options.disable_web_search,
    }),
  });

  return response;
}

/**
 * Enrich Signal with Perplexity
 * 
 * Uses Perplexity to provide:
 * - Historical context
 * - Expert analysis
 * - Market implications
 * - Citations
 */
export interface SignalEnrichmentOptions {
  signalTitle: string;
  signalSummary: string;
  sector?: string;
  region?: string;
  userPreferences?: {
    preferred_sectors?: string[];
    preferred_regions?: string[];
  };
}

export interface SignalEnrichmentResult {
  historical_context?: string;
  expert_analysis?: string;
  market_implications?: string;
  citations?: string[];
  related_questions?: string[];
  confidence?: number;
}

export async function enrichSignalWithPerplexity(
  options: SignalEnrichmentOptions
): Promise<SignalEnrichmentResult> {
  const { signalTitle, signalSummary, sector, region, userPreferences } = options;

  // Build query for Perplexity
  const query = `Explain why this geopolitical/industrial signal is significant: "${signalTitle}". 
Summary: ${signalSummary}
${sector ? `Sector: ${sector}` : ''}
${region ? `Region: ${region}` : ''}

Provide:
1. Historical context: Similar events in the past and their outcomes
2. Expert analysis: What industry analysts and experts say about this
3. Market implications: How this typically affects markets and assets
4. Citations: Reliable sources for this information`;

  // Filter by domain if user has preferences
  const searchDomainFilter: string[] = [];
  if (userPreferences?.preferred_sectors) {
    searchDomainFilter.push(...userPreferences.preferred_sectors.map(s => s.toLowerCase()));
  }
  if (userPreferences?.preferred_regions) {
    searchDomainFilter.push(...userPreferences.preferred_regions.map(r => r.toLowerCase()));
  }

  try {
    const response = await chatCompletions({
      model: 'sonar-pro', // Use pro model for better analysis
      messages: [
        {
          role: 'system',
          content: 'You are a financial intelligence analyst specializing in geopolitical and industrial events that affect markets. Provide detailed, factual analysis with citations.',
        },
        {
          role: 'user',
          content: query,
        },
      ],
      return_citations: true,
      return_related_questions: true,
      search_domain_filter: searchDomainFilter.length > 0 ? searchDomainFilter : undefined,
      search_recency_filter: 'month', // Focus on recent information
      max_tokens: 2000,
    });

    // Extract information from response
    const content = response.choices[0]?.message?.content || '';
    const citations = response.choices[0]?.message?.citations || response.citations || [];
    const relatedQuestions = response.related_questions || [];

    // Parse content to extract sections (simple parsing - could be improved)
    const historicalContextMatch = content.match(/Historical context[:\-]?\s*(.+?)(?=\n\n|Expert analysis|Market implications|$)/is);
    const expertAnalysisMatch = content.match(/Expert analysis[:\-]?\s*(.+?)(?=\n\n|Market implications|Historical context|$)/is);
    const marketImplicationsMatch = content.match(/Market implications[:\-]?\s*(.+?)(?=\n\n|Historical context|Expert analysis|$)/is);

    return {
      historical_context: historicalContextMatch?.[1]?.trim(),
      expert_analysis: expertAnalysisMatch?.[1]?.trim(),
      market_implications: marketImplicationsMatch?.[1]?.trim(),
      citations,
      related_questions: relatedQuestions,
      confidence: citations.length > 0 ? Math.min(100, citations.length * 20) : undefined,
    };
  } catch (error: any) {
    console.error('[Perplexity] Error enriching signal:', error);
    throw new Error(`Failed to enrich signal with Perplexity: ${error.message}`);
  }
}

/**
 * Finance Tools Integration (Future)
 * 
 * When Finance Tools become available, these functions will be implemented:
 * - Market Data Access
 * - Ticker Symbol Lookup
 * - Financial Analysis Tools
 * - SEC Filing Integration
 * 
 * See: https://docs.perplexity.ai/feature-roadmap#finance-tools-integration
 */

export interface FinanceToolsOptions {
  // Market Data
  symbol?: string;
  timeframe?: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y';
  
  // Ticker Lookup
  companyName?: string;
  
  // SEC Filings
  ticker?: string;
  filingType?: '10-K' | '10-Q' | '8-K' | 'DEF 14A';
}

/**
 * Placeholder for future Finance Tools
 * Will be implemented when available in Perplexity API
 */
export async function getMarketData(options: FinanceToolsOptions): Promise<any> {
  // TODO: Implement when Finance Tools are available
  throw new Error('Finance Tools not yet available in Perplexity API. Coming soon per roadmap.');
}

export async function lookupTicker(options: FinanceToolsOptions): Promise<any> {
  // TODO: Implement when Finance Tools are available
  throw new Error('Finance Tools not yet available in Perplexity API. Coming soon per roadmap.');
}

export async function analyzeSECFiling(options: FinanceToolsOptions): Promise<any> {
  // TODO: Implement when Finance Tools are available
  throw new Error('Finance Tools not yet available in Perplexity API. Coming soon per roadmap.');
}

/**
 * Health check
 */
export async function checkPerplexityHealth(): Promise<boolean> {
  try {
    if (!PERPLEXITY_API_KEY) {
      return false;
    }
    // Simple health check - try a minimal request
    await chatCompletions({
      model: 'sonar',
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 10,
    });
    return true;
  } catch {
    return false;
  }
}
