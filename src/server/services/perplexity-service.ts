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
 * Uses Perplexity to provide comprehensive analysis:
 * - Historical context & comparable past events
 * - Expert analysis & quotes
 * - Market implications & sector breakdown
 * - Key stakeholders affected
 * - Risk factors breakdown
 * - Timeline of similar events
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
  comparable_events?: Array<{
    event: string;
    date: string;
    outcome: string;
  }>;
  key_stakeholders?: Array<{
    name: string;
    role: string;
    impact: string;
  }>;
  risk_factors?: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  impacted_sectors?: Array<{
    sector: string;
    impact_level: 'low' | 'medium' | 'high';
    reasoning: string;
  }>;
  expert_quotes?: Array<{
    quote: string;
    source: string;
    date?: string;
  }>;
  timeline?: Array<{
    date: string;
    event: string;
  }>;
  citations?: string[];
  related_questions?: string[];
  confidence?: number;
}

/**
 * NEW ARCHITECTURE: Perplexity + Firecrawl + OpenAI
 * 
 * 1. Perplexity: Search for relevant sources/URLs (limited text generation)
 * 2. Firecrawl: Extract content from URLs found by Perplexity
 * 3. OpenAI: Synthesize and generate structured content from extracted content
 */
export async function enrichSignalWithPerplexity(
  options: SignalEnrichmentOptions
): Promise<SignalEnrichmentResult> {
  const { signalTitle, signalSummary, sector, region, userPreferences } = options;

  // STEP 1: Perplexity - Search for relevant sources/URLs only
  // Limit Perplexity to finding sources, not generating long text
  const searchQuery = `Find authoritative sources and articles about this geopolitical/industrial signal: "${signalTitle}". 
Summary: ${signalSummary}
${sector ? `Sector: ${sector}` : ''}
${region ? `Region: ${region}` : ''}

Return ONLY a list of relevant URLs from:
- News articles from reputable sources (Reuters, Bloomberg, Financial Times, etc.)
- Expert analysis from think tanks and research institutions
- Government and regulatory sources
- Industry reports and market analysis

Focus on sources that discuss:
- Historical precedents or similar past events
- Expert opinions and analysis
- Market implications and sector impacts
- Risk assessments

Return ONLY URLs, one per line. Do not provide analysis or summaries.`;

  // Filter by domain if user has preferences
  const searchDomainFilter: string[] = [];
  if (userPreferences?.preferred_sectors) {
    searchDomainFilter.push(...userPreferences.preferred_sectors.map(s => s.toLowerCase()));
  }
  if (userPreferences?.preferred_regions) {
    searchDomainFilter.push(...userPreferences.preferred_regions.map(r => r.toLowerCase()));
  }

  try {
    // STEP 1: Perplexity searches for URLs only (limited tokens)
    const perplexityResponse = await chatCompletions({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: 'You are a web search assistant. Your ONLY task is to find and return relevant URLs. Return URLs one per line, nothing else. No analysis, no summaries, just URLs.',
        },
        {
          role: 'user',
          content: searchQuery,
        },
      ],
      return_citations: true,
      return_related_questions: true,
      search_domain_filter: searchDomainFilter.length > 0 ? searchDomainFilter : undefined,
      search_recency_filter: 'month',
      max_tokens: 500, // Limited - just for finding URLs
    });

    // Extract URLs from Perplexity response
    const content = perplexityResponse.choices[0]?.message?.content || '';
    const citations = perplexityResponse.choices[0]?.message?.citations || perplexityResponse.citations || [];
    const relatedQuestions = perplexityResponse.related_questions || [];

    // Extract URLs from content and citations
    const urlPattern = /https?:\/\/[^\s\)]+/g;
    const foundUrls: string[] = [];
    
    // Add URLs from content
    const contentUrls = content.match(urlPattern) || [];
    foundUrls.push(...contentUrls);
    
    // Add URLs from citations
    foundUrls.push(...citations);
    
    // Deduplicate URLs
    const uniqueUrls = [...new Set(foundUrls)].slice(0, 10); // Limit to 10 URLs

    console.log(`[Perplexity+Firecrawl+OpenAI] Found ${uniqueUrls.length} URLs from Perplexity search`);

    // STEP 2: Firecrawl - Extract content from URLs
    const { scrapeOfficialDocument, isFirecrawlAvailable } = await import('../phase4/firecrawl-official-service.js');
    const extractedContents: Array<{ url: string; title: string; content: string }> = [];

    if (isFirecrawlAvailable() && uniqueUrls.length > 0) {
      console.log(`[Perplexity+Firecrawl+OpenAI] Extracting content from ${uniqueUrls.length} URLs with Firecrawl...`);
      
      // Extract content in parallel (limited concurrency)
      const extractionPromises = uniqueUrls.slice(0, 5).map(async (url) => {
        try {
          const document = await scrapeOfficialDocument(url, { checkWhitelist: false }); // Allow all URLs from Perplexity
          if (document && document.content) {
            return {
              url,
              title: document.title || url,
              content: document.content.substring(0, 5000), // Limit content length
            };
          }
          return null;
        } catch (error: any) {
          console.warn(`[Perplexity+Firecrawl+OpenAI] Failed to extract ${url}:`, error.message);
          return null;
        }
      });

      const results = await Promise.allSettled(extractionPromises);
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          extractedContents.push(result.value);
        }
      }

      console.log(`[Perplexity+Firecrawl+OpenAI] Successfully extracted content from ${extractedContents.length} URLs`);
    }

    // STEP 3: OpenAI - Synthesize and generate structured content
    const { default: OpenAI } = await import('openai');
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is required for content synthesis');
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });

    // Build context from extracted content
    const contextText = extractedContents
      .map((doc, idx) => `[Source ${idx + 1}: ${doc.title}]\n${doc.content}`)
      .join('\n\n---\n\n');

    const openaiPrompt = `Analyze this geopolitical/industrial signal based on the provided sources:

Signal: "${signalTitle}"
Summary: ${signalSummary}
${sector ? `Sector: ${sector}` : ''}
${region ? `Region: ${region}` : ''}

Sources and extracted content:
${contextText || 'No sources extracted. Provide analysis based on general knowledge.'}

Provide a comprehensive analysis with the following sections:

1. **Historical Context**: Similar events in the past (with dates), their outcomes, and how markets reacted. Include specific comparable events.

2. **Expert Analysis**: What industry analysts, think tanks, and domain experts are saying about this signal. Include direct quotes when available.

3. **Market Implications**: How this typically affects markets, assets, and sectors. Be specific about which sectors are most impacted and why.

4. **Comparable Past Events**: List 2-4 specific past events that are similar to this signal, including:
   - Event name/description
   - Date (approximate)
   - Outcome/impact

5. **Key Stakeholders Affected**: Who are the main actors, companies, or entities most affected by this signal? Include:
   - Name/entity
   - Role/position
   - How they are impacted

6. **Risk Factors**: What are the main risks associated with this signal? Include:
   - Risk factor name
   - Severity (low/medium/high)
   - Description

7. **Impacted Sectors**: Which market sectors are most impacted? Include:
   - Sector name
   - Impact level (low/medium/high)
   - Reasoning

8. **Expert Quotes**: Include 2-3 direct quotes from experts, analysts, or authoritative sources about this signal.

9. **Timeline**: If applicable, provide a timeline of similar events that led to similar outcomes.

Format your response clearly with section headers. Reference the sources when making factual claims.`;

    console.log(`[Perplexity+Firecrawl+OpenAI] Generating structured analysis with OpenAI...`);

    const openaiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a financial intelligence analyst specializing in geopolitical and industrial events that affect markets. 

Your task is to synthesize information from provided sources and generate comprehensive, structured analysis with:
- Specific historical precedents with dates
- Direct expert quotes when available
- Clear sector-by-sector impact breakdown
- Identified stakeholders and their exposure
- Risk assessment with severity levels
- Timeline of similar events when relevant

Always reference your sources. Be factual, specific, and actionable. Return structured information that can be parsed programmatically.`,
        },
        {
          role: 'user',
          content: openaiPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const analysisContent = openaiResponse.choices[0]?.message?.content || '';

    // Parse OpenAI response (same parsing logic as before)
    const response = {
      choices: [{
        message: {
          content: analysisContent,
          citations: uniqueUrls, // Use found URLs as citations
        },
      }],
      citations: uniqueUrls,
      related_questions: relatedQuestions,
    };

    // Extract information from response
    const content = response.choices[0]?.message?.content || '';
    const citations = response.choices[0]?.message?.citations || response.citations || [];
    const relatedQuestions = response.related_questions || [];

    // Parse content to extract sections with improved regex
    const historicalContextMatch = content.match(/(?:Historical Context|Historical context)[:\-]?\s*(.+?)(?=\n\n(?:Expert|Market|Comparable|Key|Risk|Impacted|Timeline)|$)/is);
    const expertAnalysisMatch = content.match(/(?:Expert Analysis|Expert analysis)[:\-]?\s*(.+?)(?=\n\n(?:Market|Comparable|Key|Risk|Impacted|Timeline|Historical)|$)/is);
    const marketImplicationsMatch = content.match(/(?:Market Implications|Market implications)[:\-]?\s*(.+?)(?=\n\n(?:Comparable|Key|Risk|Impacted|Timeline|Expert|Historical)|$)/is);
    
    // Extract comparable events
    const comparableEventsSection = content.match(/(?:Comparable Past Events|Comparable events)[:\-]?\s*(.+?)(?=\n\n(?:Key|Risk|Impacted|Timeline|Expert|Market|Historical)|$)/is);
    const comparableEvents: Array<{ event: string; date: string; outcome: string }> = [];
    if (comparableEventsSection) {
      const eventsText = comparableEventsSection[1];
      const eventMatches = eventsText.matchAll(/(?:^|\n)[\d\-\.]+[:\-]?\s*(.+?)(?:\((.+?)\))?[:\-]?\s*(.+?)(?=\n|$)/g);
      for (const match of eventMatches) {
        if (match[1] && match[3]) {
          comparableEvents.push({
            event: match[1].trim(),
            date: match[2]?.trim() || 'Unknown',
            outcome: match[3].trim(),
          });
        }
      }
    }

    // Extract key stakeholders
    const stakeholdersSection = content.match(/(?:Key Stakeholders|Stakeholders Affected)[:\-]?\s*(.+?)(?=\n\n(?:Risk|Impacted|Timeline|Comparable|Expert|Market|Historical)|$)/is);
    const keyStakeholders: Array<{ name: string; role: string; impact: string }> = [];
    if (stakeholdersSection) {
      const stakeholdersText = stakeholdersSection[1];
      const stakeholderMatches = stakeholdersText.matchAll(/(?:^|\n)[\-\*•]\s*(.+?)[:\-]\s*(.+?)[:\-]\s*(.+?)(?=\n|$)/g);
      for (const match of stakeholderMatches) {
        if (match[1] && match[2] && match[3]) {
          keyStakeholders.push({
            name: match[1].trim(),
            role: match[2].trim(),
            impact: match[3].trim(),
          });
        }
      }
    }

    // Extract risk factors
    const riskFactorsSection = content.match(/(?:Risk Factors|Risk factors)[:\-]?\s*(.+?)(?=\n\n(?:Impacted|Timeline|Comparable|Key|Expert|Market|Historical)|$)/is);
    const riskFactors: Array<{ factor: string; severity: 'low' | 'medium' | 'high'; description: string }> = [];
    if (riskFactorsSection) {
      const risksText = riskFactorsSection[1];
      const riskMatches = risksText.matchAll(/(?:^|\n)[\-\*•]\s*(.+?)\s*\((.+?)\)[:\-]?\s*(.+?)(?=\n|$)/g);
      for (const match of riskMatches) {
        if (match[1] && match[2] && match[3]) {
          const severity = (match[2].toLowerCase().includes('high') ? 'high' : 
                           match[2].toLowerCase().includes('medium') ? 'medium' : 'low') as 'low' | 'medium' | 'high';
          riskFactors.push({
            factor: match[1].trim(),
            severity,
            description: match[3].trim(),
          });
        }
      }
    }

    // Extract impacted sectors
    const sectorsSection = content.match(/(?:Impacted Sectors|Sectors)[:\-]?\s*(.+?)(?=\n\n(?:Timeline|Comparable|Key|Risk|Expert|Market|Historical)|$)/is);
    const impactedSectors: Array<{ sector: string; impact_level: 'low' | 'medium' | 'high'; reasoning: string }> = [];
    if (sectorsSection) {
      const sectorsText = sectorsSection[1];
      const sectorMatches = sectorsText.matchAll(/(?:^|\n)[\-\*•]\s*(.+?)\s*\((.+?)\)[:\-]?\s*(.+?)(?=\n|$)/g);
      for (const match of sectorMatches) {
        if (match[1] && match[2] && match[3]) {
          const impactLevel = (match[2].toLowerCase().includes('high') ? 'high' : 
                              match[2].toLowerCase().includes('medium') ? 'medium' : 'low') as 'low' | 'medium' | 'high';
          impactedSectors.push({
            sector: match[1].trim(),
            impact_level: impactLevel,
            reasoning: match[3].trim(),
          });
        }
      }
    }

    // Extract expert quotes
    const quotesSection = content.match(/(?:Expert Quotes|Quotes)[:\-]?\s*(.+?)(?=\n\n(?:Timeline|Comparable|Key|Risk|Impacted|Expert|Market|Historical)|$)/is);
    const expertQuotes: Array<{ quote: string; source: string; date?: string }> = [];
    if (quotesSection) {
      const quotesText = quotesSection[1];
      const quoteMatches = quotesText.matchAll(/"(.+?)"\s*[-–]\s*(.+?)(?:\s*\((.+?)\))?(?=\n|$)/g);
      for (const match of quoteMatches) {
        if (match[1] && match[2]) {
          expertQuotes.push({
            quote: match[1].trim(),
            source: match[2].trim(),
            date: match[3]?.trim(),
          });
        }
      }
    }

    // Extract timeline
    const timelineSection = content.match(/(?:Timeline|Timeline of similar events)[:\-]?\s*(.+?)(?=\n\n(?:Comparable|Key|Risk|Impacted|Expert|Market|Historical)|$)/is);
    const timeline: Array<{ date: string; event: string }> = [];
    if (timelineSection) {
      const timelineText = timelineSection[1];
      const timelineMatches = timelineText.matchAll(/(?:^|\n)([\d\-\.]+)[:\-]?\s*(.+?)(?=\n|$)/g);
      for (const match of timelineMatches) {
        if (match[1] && match[2]) {
          timeline.push({
            date: match[1].trim(),
            event: match[2].trim(),
          });
        }
      }
    }

    return {
      historical_context: historicalContextMatch?.[1]?.trim(),
      expert_analysis: expertAnalysisMatch?.[1]?.trim(),
      market_implications: marketImplicationsMatch?.[1]?.trim(),
      comparable_events: comparableEvents.length > 0 ? comparableEvents : undefined,
      key_stakeholders: keyStakeholders.length > 0 ? keyStakeholders : undefined,
      risk_factors: riskFactors.length > 0 ? riskFactors : undefined,
      impacted_sectors: impactedSectors.length > 0 ? impactedSectors : undefined,
      expert_quotes: expertQuotes.length > 0 ? expertQuotes : undefined,
      timeline: timeline.length > 0 ? timeline : undefined,
      citations,
      related_questions: relatedQuestions,
      confidence: citations.length > 0 ? Math.min(100, citations.length * 15 + (comparableEvents.length * 5)) : undefined,
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
