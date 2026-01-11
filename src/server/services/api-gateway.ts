/**
 * API Gateway
 * 
 * Unified entry point for all API calls (OpenAI, Tavily, Firecrawl).
 * Provides abstraction, caching, rate limiting, retry logic, and monitoring.
 * Enables easy extension with new APIs and consistent usage patterns.
 */

import { callOpenAI, batchCallOpenAI, OpenAICallOptions, OpenAIResponse } from './openai-optimizer';
import { 
  searchTavily, 
  searchNews as searchNewsTavily, 
  searchPersonalized as searchPersonalizedTavily, 
  enrichContext as enrichContextTavily, 
  searchLive as searchLiveTavily, 
  batchSearchTavily, 
  TavilySearchResult, 
  TavilySearchOptions 
} from './tavily-unified-service';
import { 
  enrichEventWithFirecrawl, 
  batchEnrichEventsWithFirecrawl, 
  enrichPendingEvents,
  FirecrawlEnrichmentOptions,
  FirecrawlEnrichmentResult 
} from './firecrawl-ecosystem';
import { scrapeOfficialDocument, isFirecrawlAvailable } from '../phase4/firecrawl-official-service';
import { logApiCall } from './api-metrics';

/**
 * OpenAI Gateway
 */
export const openaiGateway = {
  /**
   * Extract event from raw content (Phase 1)
   */
  async extractEvent(prompt: string, systemPrompt: string, inputData: any): Promise<any> {
    return await callOpenAI(prompt, systemPrompt, {
      taskType: 'extraction',
      model: 'gpt-4o',
      useCache: true,
    });
  },

  /**
   * Extract causal chain from event (Phase 2B)
   */
  async extractCausalChain(prompt: string, systemPrompt: string, eventData: any): Promise<any> {
    return await callOpenAI(prompt, systemPrompt, {
      taskType: 'causal',
      model: 'gpt-4o-mini',
      useCache: true,
    });
  },

  /**
   * Generate scenarios for event (Phase 7)
   */
  async generateScenarios(prompt: string, systemPrompt: string, eventData: any): Promise<any> {
    return await callOpenAI(prompt, systemPrompt, {
      taskType: 'scenarios',
      model: 'gpt-4-turbo-preview',
      temperature: 0.4,
      useCache: true,
    });
  },

  /**
   * Find historical comparisons (Phase 7)
   */
  async findHistoricalComparisons(prompt: string, systemPrompt: string, eventData: any): Promise<any> {
    return await callOpenAI(prompt, systemPrompt, {
      taskType: 'historical',
      model: 'gpt-4-turbo-preview',
      temperature: 0.3,
      useCache: true,
    });
  },

  /**
   * Extract relationships between events (Phase 7)
   */
  async extractRelationships(prompt: string, systemPrompt: string, eventsData: any): Promise<any> {
    return await callOpenAI(prompt, systemPrompt, {
      taskType: 'relationships',
      model: 'gpt-4-turbo-preview',
      temperature: 0.2,
      useCache: true,
    });
  },

  /**
   * Validate event against sources
   */
  async validateEvent(prompt: string, systemPrompt: string, validationData: any): Promise<any> {
    return await callOpenAI(prompt, systemPrompt, {
      taskType: 'validation',
      model: 'gpt-4o-mini',
      temperature: 0.1,
      useCache: true,
    });
  },

  /**
   * Extract structured data from document
   */
  async extractStructuredData(prompt: string, systemPrompt: string, documentData: any): Promise<any> {
    return await callOpenAI(prompt, systemPrompt, {
      taskType: 'data-extraction',
      model: 'gpt-4o-mini',
      temperature: 0.1,
      useCache: true,
    });
  },

  /**
   * Batch process multiple OpenAI calls
   */
  async batchProcess<T>(calls: Array<{
    prompt: string;
    systemPrompt: string;
    options: OpenAICallOptions;
  }>): Promise<Array<OpenAIResponse<T>>> {
    return await batchCallOpenAI<T>(calls, { parallelize: true });
  },
};

/**
 * Tavily Gateway
 */
export const tavilyGateway = {
  /**
   * Generic search (for news collector)
   */
  async searchGeneric(query: string, options?: TavilySearchOptions): Promise<TavilySearchResult> {
    return await searchNewsTavily(query, options);
  },

  /**
   * Personalized search (for user-specific feeds)
   */
  async searchPersonalized(query: string, userId: string, options?: TavilySearchOptions): Promise<TavilySearchResult> {
    return await searchPersonalizedTavily(query, userId, options);
  },

  /**
   * Context enrichment (for historical context)
   */
  async enrichContext(query: string, options?: TavilySearchOptions): Promise<TavilySearchResult> {
    return await enrichContextTavily(query, options);
  },

  /**
   * Live search (for real-time queries)
   */
  async searchLive(query: string, options?: TavilySearchOptions): Promise<TavilySearchResult> {
    return await searchLiveTavily(query, options);
  },

  /**
   * Batch search multiple queries
   */
  async batchSearch(queries: Array<{ query: string; type: 'news' | 'personalized' | 'context' | 'live'; options?: TavilySearchOptions }>): Promise<TavilySearchResult[]> {
    return await batchSearchTavily(queries, { parallelize: true });
  },
};

/**
 * Firecrawl Gateway
 */
export const firecrawlGateway = {
  /**
   * Scrape official document (basic functionality)
   */
  async scrapeOfficial(url: string): Promise<any> {
    const startTime = Date.now();
    
    try {
      const document = await scrapeOfficialDocument(url, { checkWhitelist: true });
      
      const latencyMs = Date.now() - startTime;
      
      await logApiCall({
        apiType: 'firecrawl',
        apiEndpoint: 'scrapeOfficial',
        featureName: 'official-document',
        wasCached: false,
        success: document !== null,
        latencyMs,
        wasRateLimited: false,
        retryCount: 0,
      });

      return document;
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      
      await logApiCall({
        apiType: 'firecrawl',
        apiEndpoint: 'scrapeOfficial',
        featureName: 'official-document',
        wasCached: false,
        success: false,
        latencyMs,
        errorMessage: error.message,
        errorCode: error.code,
        wasRateLimited: error.message?.includes('rate limit') || false,
        retryCount: 0,
      });

      throw error;
    }
  },

  /**
   * Enrich event with all Firecrawl capabilities
   */
  async enrichEvent(
    eventId: string,
    nucigenEventId: string | null = null,
    options: FirecrawlEnrichmentOptions = {}
  ): Promise<FirecrawlEnrichmentResult> {
    return await enrichEventWithFirecrawl(eventId, nucigenEventId, {
      ...options,
      parallelize: true,
    });
  },

  /**
   * Batch enrich multiple events
   */
  async batchEnrichEvents(
    eventIds: string[],
    options: FirecrawlEnrichmentOptions = {}
  ): Promise<FirecrawlEnrichmentResult> {
    return await batchEnrichEventsWithFirecrawl(eventIds, {
      ...options,
      parallelize: true,
    });
  },

  /**
   * Enrich pending events (automatic)
   */
  async enrichPending(limit: number = 20, options: FirecrawlEnrichmentOptions = {}): Promise<FirecrawlEnrichmentResult> {
    return await enrichPendingEvents(limit, {
      ...options,
      parallelize: true,
    });
  },

  /**
   * Check if Firecrawl is available
   */
  isAvailable(): boolean {
    return isFirecrawlAvailable();
  },
};

/**
 * Unified API Gateway
 */
export const apiGateway = {
  openai: openaiGateway,
  tavily: tavilyGateway,
  firecrawl: firecrawlGateway,
};

/**
 * Health check for all APIs
 */
export async function checkApiHealth(): Promise<{
  openai: boolean;
  tavily: boolean;
  firecrawl: boolean;
}> {
  return {
    openai: !!process.env.OPENAI_API_KEY,
    tavily: !!process.env.TAVILY_API_KEY,
    firecrawl: isFirecrawlAvailable(),
  };
}
