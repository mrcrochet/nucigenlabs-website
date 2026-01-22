/**
 * Economic Data Service
 * 
 * Uses Perplexity AI to fetch economic data and market indicators
 * Replaces any Trading Economics API dependencies
 */

import { chatCompletions } from './perplexity-service.js';

export interface EconomicIndicator {
  name: string;
  value: string;
  change?: string;
  change_percent?: number;
  date: string;
  source?: string;
}

export interface MarketIndicator {
  indicator: string;
  value: string;
  previous?: string;
  change?: string;
  unit?: string;
  date: string;
}

/**
 * Get economic indicators using Perplexity + Firecrawl + OpenAI
 * 
 * Architecture:
 * 1. Perplexity: Find relevant sources/URLs
 * 2. Firecrawl: Extract content from URLs
 * 3. OpenAI: Synthesize structured data
 */
export async function getEconomicIndicators(
  country?: string,
  indicators?: string[]
): Promise<EconomicIndicator[]> {
  try {
    // STEP 1: Perplexity - Find sources only
    const searchQuery = `Find authoritative sources with current economic indicators${country ? ` for ${country}` : ' globally'}. 
    ${indicators ? `Focus on: ${indicators.join(', ')}` : 'Include: GDP growth, inflation rate, unemployment rate, interest rates, currency exchange rates'}
    
    Return ONLY URLs from:
    - Government statistical offices
    - Central banks
    - International organizations (IMF, World Bank, etc.)
    - Reputable economic news sources
    
    Return ONLY URLs, one per line. No analysis.`;

    const perplexityResponse = await chatCompletions({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: 'You are a web search assistant. Your ONLY task is to find and return relevant URLs. Return URLs one per line, nothing else.',
        },
        {
          role: 'user',
          content: searchQuery,
        },
      ],
      return_citations: true,
      search_recency_filter: 'week',
      max_tokens: 500, // Limited - just for finding URLs
    });

    // Extract URLs
    const content = perplexityResponse.choices[0]?.message?.content || '';
    const citations = perplexityResponse.choices[0]?.message?.citations || perplexityResponse.citations || [];
    const urlPattern = /https?:\/\/[^\s\)]+/g;
    const foundUrls = [...new Set([...content.match(urlPattern) || [], ...citations])].slice(0, 5);

    // STEP 2: Firecrawl - Extract content
    const { scrapeOfficialDocument, isFirecrawlAvailable } = await import('../phase4/firecrawl-official-service.js');
    const extractedContents: Array<{ url: string; title: string; content: string }> = [];

    if (isFirecrawlAvailable() && foundUrls.length > 0) {
      const extractionPromises = foundUrls.map(async (url) => {
        try {
          const document = await scrapeOfficialDocument(url, { checkWhitelist: false });
          if (document && document.content) {
            return {
              url,
              title: document.title || url,
              content: document.content.substring(0, 3000),
            };
          }
          return null;
        } catch (error: any) {
          console.warn(`[EconomicData] Failed to extract ${url}:`, error.message);
          return null;
        }
      });

      const results = await Promise.allSettled(extractionPromises);
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          extractedContents.push(result.value);
        }
      }
    }

    // STEP 3: OpenAI - Synthesize structured data
    const { default: OpenAI } = await import('openai');
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });
    const contextText = extractedContents
      .map((doc, idx) => `[Source ${idx + 1}: ${doc.title}]\n${doc.content}`)
      .join('\n\n---\n\n');

    const openaiPrompt = `Extract current economic indicators${country ? ` for ${country}` : ' globally'} from the provided sources.

${indicators ? `Focus on: ${indicators.join(', ')}` : 'Include: GDP growth, inflation rate, unemployment rate, interest rates, currency exchange rates'}

Sources:
${contextText || 'No sources extracted. Provide indicators based on general knowledge.'}

For each indicator, provide:
- Name
- Current value
- Change from previous period (if available)
- Date of the data
- Source URL

Format as a structured list.`;

    const openaiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an economic data analyst. Extract and structure economic indicators from provided sources. Return structured data.',
        },
        {
          role: 'user',
          content: openaiPrompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    });

    const analysisContent = openaiResponse.choices[0]?.message?.content || '';

    // Parse indicators from OpenAI response
    const parsedIndicators: EconomicIndicator[] = [];
    const indicatorMatches = analysisContent.matchAll(/(?:^|\n)([^:]+):\s*([^\n]+)(?:\s*\(([^)]+)\))?/g);
    for (const match of indicatorMatches) {
      if (match[1] && match[2]) {
        const name = match[1].trim();
        const value = match[2].trim();
        const change = match[3]?.trim();
        
        const changePercentMatch = change?.match(/([+-]?\d+\.?\d*)%/);
        const changePercent = changePercentMatch ? parseFloat(changePercentMatch[1]) : undefined;
        
        parsedIndicators.push({
          name,
          value,
          change,
          change_percent: changePercent,
          date: new Date().toISOString().split('T')[0],
          source: foundUrls[0] || undefined,
        });
      }
    }

    return parsedIndicators;
  } catch (error: any) {
    console.error('[EconomicData] Error fetching indicators:', error);
    throw new Error(`Failed to fetch economic indicators: ${error.message}`);
  }
}

/**
 * Get market indicators using Perplexity + Firecrawl + OpenAI
 */
export async function getMarketIndicators(
  type?: 'commodities' | 'currencies' | 'bonds' | 'all'
): Promise<MarketIndicator[]> {
  try {
    const queryType = type === 'all' ? 'commodities, currencies, and bond yields' :
                     type === 'commodities' ? 'commodity prices (oil, gold, copper, etc.)' :
                     type === 'currencies' ? 'major currency exchange rates' :
                     type === 'bonds' ? 'government bond yields' :
                     'key market indicators';

    // STEP 1: Perplexity - Find sources
    const searchQuery = `Find authoritative sources with current ${queryType}. 
    Return ONLY URLs from:
    - Financial news sources (Bloomberg, Reuters, Financial Times)
    - Commodity exchanges
    - Central banks (for currencies)
    - Government bond markets
    
    Return ONLY URLs, one per line. No analysis.`;

    const perplexityResponse = await chatCompletions({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: 'You are a web search assistant. Your ONLY task is to find and return relevant URLs. Return URLs one per line, nothing else.',
        },
        {
          role: 'user',
          content: searchQuery,
        },
      ],
      return_citations: true,
      search_recency_filter: 'day',
      max_tokens: 500,
    });

    const content = perplexityResponse.choices[0]?.message?.content || '';
    const citations = perplexityResponse.choices[0]?.message?.citations || perplexityResponse.citations || [];
    const urlPattern = /https?:\/\/[^\s\)]+/g;
    const foundUrls = [...new Set([...content.match(urlPattern) || [], ...citations])].slice(0, 5);

    // STEP 2: Firecrawl - Extract content
    const { scrapeOfficialDocument, isFirecrawlAvailable } = await import('../phase4/firecrawl-official-service.js');
    const extractedContents: Array<{ url: string; title: string; content: string }> = [];

    if (isFirecrawlAvailable() && foundUrls.length > 0) {
      const extractionPromises = foundUrls.map(async (url) => {
        try {
          const document = await scrapeOfficialDocument(url, { checkWhitelist: false });
          if (document && document.content) {
            return {
              url,
              title: document.title || url,
              content: document.content.substring(0, 3000),
            };
          }
          return null;
        } catch (error: any) {
          console.warn(`[EconomicData] Failed to extract ${url}:`, error.message);
          return null;
        }
      });

      const results = await Promise.allSettled(extractionPromises);
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          extractedContents.push(result.value);
        }
      }
    }

    // STEP 3: OpenAI - Synthesize structured data
    const { default: OpenAI } = await import('openai');
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });
    const contextText = extractedContents
      .map((doc, idx) => `[Source ${idx + 1}: ${doc.title}]\n${doc.content}`)
      .join('\n\n---\n\n');

    const openaiPrompt = `Extract current ${queryType} from the provided sources.

Sources:
${contextText || 'No sources extracted. Provide indicators based on general knowledge.'}

For each indicator, provide:
- Name
- Current value/price
- Previous value (if available)
- Change/change percentage
- Unit (USD, %, etc.)
- Date of the data

Format as a structured list.`;

    const openaiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a financial market data analyst. Extract and structure market indicators from provided sources. Return structured data.',
        },
        {
          role: 'user',
          content: openaiPrompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    });

    const analysisContent = openaiResponse.choices[0]?.message?.content || '';

    // Parse indicators
    const parsedIndicators: MarketIndicator[] = [];
    const indicatorMatches = analysisContent.matchAll(/(?:^|\n)([^:]+):\s*([^\n]+)(?:\s*\(([^)]+)\))?/g);
    for (const match of indicatorMatches) {
      if (match[1] && match[2]) {
        const indicator = match[1].trim();
        const valueStr = match[2].trim();
        const change = match[3]?.trim();
        
        const valueMatch = valueStr.match(/([\d,]+\.?\d*)\s*([A-Z%]+)?/);
        const value = valueMatch ? valueMatch[1].replace(/,/g, '') : valueStr;
        const unit = valueMatch?.[2] || undefined;
        
        parsedIndicators.push({
          indicator,
          value,
          change,
          unit,
          date: new Date().toISOString().split('T')[0],
        });
      }
    }

    return parsedIndicators;
  } catch (error: any) {
    console.error('[EconomicData] Error fetching market indicators:', error);
    throw new Error(`Failed to fetch market indicators: ${error.message}`);
  }
}

/**
 * Get economic calendar using Perplexity + Firecrawl + OpenAI
 */
export async function getEconomicCalendar(
  days: number = 7
): Promise<Array<{
  date: string;
  event: string;
  country?: string;
  impact?: 'low' | 'medium' | 'high';
  previous?: string;
  forecast?: string;
}>> {
  try {
    // STEP 1: Perplexity - Find sources
    const searchQuery = `Find authoritative sources with upcoming economic events and releases for the next ${days} days. 
    Return ONLY URLs from:
    - Economic calendar websites
    - Central banks
    - Government statistical offices
    - Financial news sources
    
    Return ONLY URLs, one per line. No analysis.`;

    const perplexityResponse = await chatCompletions({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: 'You are a web search assistant. Your ONLY task is to find and return relevant URLs. Return URLs one per line, nothing else.',
        },
        {
          role: 'user',
          content: searchQuery,
        },
      ],
      return_citations: true,
      search_recency_filter: 'day',
      max_tokens: 500,
    });

    const content = perplexityResponse.choices[0]?.message?.content || '';
    const citations = perplexityResponse.choices[0]?.message?.citations || perplexityResponse.citations || [];
    const urlPattern = /https?:\/\/[^\s\)]+/g;
    const foundUrls = [...new Set([...content.match(urlPattern) || [], ...citations])].slice(0, 5);

    // STEP 2: Firecrawl - Extract content
    const { scrapeOfficialDocument, isFirecrawlAvailable } = await import('../phase4/firecrawl-official-service.js');
    const extractedContents: Array<{ url: string; title: string; content: string }> = [];

    if (isFirecrawlAvailable() && foundUrls.length > 0) {
      const extractionPromises = foundUrls.map(async (url) => {
        try {
          const document = await scrapeOfficialDocument(url, { checkWhitelist: false });
          if (document && document.content) {
            return {
              url,
              title: document.title || url,
              content: document.content.substring(0, 3000),
            };
          }
          return null;
        } catch (error: any) {
          console.warn(`[EconomicData] Failed to extract ${url}:`, error.message);
          return null;
        }
      });

      const results = await Promise.allSettled(extractionPromises);
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          extractedContents.push(result.value);
        }
      }
    }

    // STEP 3: OpenAI - Synthesize structured data
    const { default: OpenAI } = await import('openai');
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });
    const contextText = extractedContents
      .map((doc, idx) => `[Source ${idx + 1}: ${doc.title}]\n${doc.content}`)
      .join('\n\n---\n\n');

    const openaiPrompt = `Extract upcoming economic events and releases for the next ${days} days from the provided sources.

Sources:
${contextText || 'No sources extracted. Provide events based on general knowledge.'}

For each event, provide:
- Date
- Event name/description
- Country/region
- Expected impact level (low/medium/high)
- Previous value (if applicable)
- Forecast/consensus (if available)

Format as a structured list.`;

    const openaiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an economic calendar analyst. Extract and structure upcoming economic events from provided sources. Return structured data.',
        },
        {
          role: 'user',
          content: openaiPrompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    });

    const analysisContent = openaiResponse.choices[0]?.message?.content || '';

    // Parse calendar events
    const parsedEvents: Array<{
      date: string;
      event: string;
      country?: string;
      impact?: 'low' | 'medium' | 'high';
      previous?: string;
      forecast?: string;
    }> = [];
    
    const eventMatches = analysisContent.matchAll(/(?:^|\n)([\d\-]+)[:\-]?\s*([^\n]+)/g);
    for (const match of eventMatches) {
      if (match[1] && match[2]) {
        const dateStr = match[1].trim();
        const eventStr = match[2].trim();
        
        const countryMatch = eventStr.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
        const impactMatch = eventStr.match(/(low|medium|high)\s+impact/i);
        
        parsedEvents.push({
          date: dateStr,
          event: eventStr,
          country: countryMatch?.[1],
          impact: impactMatch ? (impactMatch[1].toLowerCase() as 'low' | 'medium' | 'high') : undefined,
        });
      }
    }

    return parsedEvents;
  } catch (error: any) {
    console.error('[EconomicData] Error fetching economic calendar:', error);
    throw new Error(`Failed to fetch economic calendar: ${error.message}`);
  }
}
