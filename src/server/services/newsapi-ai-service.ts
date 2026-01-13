/**
 * NewsAPI.ai Service
 * 
 * Technical wrapper for NewsAPI.ai Event Registry API
 * 
 * Responsibilities:
 * - Wrapper technique ONLY - no business logic
 * - Returns raw normalized event data
 * - Handles errors, retries, rate limiting
 * 
 * RULE: This is a SERVICE, not an AGENT
 * - Does NOT decide what's important
 * - Does NOT filter by relevance
 * - Does NOT assign impact/priority
 * 
 * Usage: EventAgent uses this service to fetch structured events
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

const NEWSAI_API_KEY = process.env.NEWSAI_API_KEY;
const NEWSAI_BASE_URL = 'https://eventregistry.org/api/v1';

// Rate limiting: depends on plan (typically 10-100 requests/minute)
const RATE_LIMIT_DELAY = 6000; // 6 seconds between requests (conservative)
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
  params: Record<string, any>
): Promise<any> {
  if (!NEWSAI_API_KEY) {
    throw new Error('NEWSAI_API_KEY not configured');
  }

  await rateLimit();

  const url = new URL(endpoint, NEWSAI_BASE_URL);
  url.searchParams.append('apiKey', NEWSAI_API_KEY);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        url.searchParams.append(key, value.join(','));
      } else {
        url.searchParams.append(key, String(value));
      }
    }
  });

  let lastError: Error | null = null;
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limit hit - wait longer
          await new Promise(resolve => setTimeout(resolve, 10000 * (attempt + 1)));
          continue;
        }
        throw new Error(`NewsAPI.ai API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // NewsAPI.ai returns error in response
      if (data.error) {
        throw new Error(`NewsAPI.ai API error: ${data.error.message || 'Unknown error'}`);
      }

      return data;
    } catch (error: any) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 5000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Failed to fetch from NewsAPI.ai API');
}

/**
 * Event filters for search
 */
export interface EventFilters {
  dateStart?: string; // ISO-8601
  dateEnd?: string; // ISO-8601
  location?: string; // Country code (e.g., 'US', 'CN')
  category?: string; // Event category
  keywords?: string[];
  minArticles?: number;
  lang?: string; // Language code (e.g., 'eng', 'fra')
}

/**
 * Raw event from NewsAPI.ai
 */
export interface NewsAPIEvent {
  uri: string;
  id: number;
  title: string;
  summary: string;
  date: string; // ISO-8601
  location?: {
    label: string;
    country?: string;
    countryCode?: string;
    lat?: number;
    lng?: number;
  };
  categories?: Array<{
    label: string;
    uri: string;
  }>;
  concepts?: Array<{
    label: string;
    uri: string;
    type: string; // 'person', 'org', 'location', etc.
    score: number;
  }>;
  articles?: Array<{
    uri: string;
    title: string;
    url: string;
    date: string;
    source: {
      title: string;
      uri: string;
    };
  }>;
  articleCount?: number;
}

/**
 * Search for events
 */
export async function searchEvents(
  query: string,
  filters: EventFilters = {}
): Promise<{
  events: NewsAPIEvent[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const params: Record<string, any> = {
    query,
    action: 'getEvents',
    resultType: 'events',
    articlesCount: filters.minArticles || 1,
    lang: filters.lang || 'eng',
    dateStart: filters.dateStart,
    dateEnd: filters.dateEnd,
    location: filters.location,
    category: filters.category,
    keywords: filters.keywords?.join(','),
    articlesPage: 1,
    articlesCount: 10, // Number of articles per event
  };

  const data = await makeRequest('/event', params);

  const events: NewsAPIEvent[] = (data.events?.results || []).map((e: any) => ({
    uri: e.uri,
    id: e.id,
    title: e.title?.eng || e.title || '',
    summary: e.summary?.eng || e.summary || '',
    date: e.date || new Date().toISOString(),
    location: e.location ? {
      label: e.location.label?.eng || e.location.label || '',
      country: e.location.country?.eng || e.location.country,
      countryCode: e.location.countryCode,
      lat: e.location.lat,
      lng: e.location.lng,
    } : undefined,
    categories: e.categories?.map((c: any) => ({
      label: c.label?.eng || c.label || '',
      uri: c.uri,
    })),
    concepts: e.concepts?.map((c: any) => ({
      label: c.label?.eng || c.label || '',
      uri: c.uri,
      type: c.type,
      score: c.score || 0,
    })),
    articles: e.articles?.results?.map((a: any) => ({
      uri: a.uri,
      title: a.title || '',
      url: a.url || '',
      date: a.date || '',
      source: {
        title: a.source?.title || '',
        uri: a.source?.uri || '',
      },
    })),
    articleCount: e.articlesCount || 0,
  }));

  return {
    events,
    total: data.events?.totalResults || 0,
    page: data.events?.page || 1,
    pageSize: data.events?.pageSize || 20,
  };
}

/**
 * Get event by ID
 */
export async function getEventById(eventId: string): Promise<NewsAPIEvent | null> {
  try {
    const data = await makeRequest('/event', {
      action: 'getEvent',
      eventUri: eventId,
      articlesPage: 1,
      articlesCount: 10,
    });

    if (!data.event) {
      return null;
    }

    const e = data.event;
    return {
      uri: e.uri,
      id: e.id,
      title: e.title?.eng || e.title || '',
      summary: e.summary?.eng || e.summary || '',
      date: e.date || new Date().toISOString(),
      location: e.location ? {
        label: e.location.label?.eng || e.location.label || '',
        country: e.location.country?.eng || e.location.country,
        countryCode: e.location.countryCode,
        lat: e.location.lat,
        lng: e.location.lng,
      } : undefined,
      categories: e.categories?.map((c: any) => ({
        label: c.label?.eng || c.label || '',
        uri: c.uri,
      })),
      concepts: e.concepts?.map((c: any) => ({
        label: c.label?.eng || c.label || '',
        uri: c.uri,
        type: c.type,
        score: c.score || 0,
      })),
      articles: e.articles?.results?.map((a: any) => ({
        uri: a.uri,
        title: a.title || '',
        url: a.url || '',
        date: a.date || '',
        source: {
          title: a.source?.title || '',
          uri: a.source?.uri || '',
        },
      })),
      articleCount: e.articlesCount || 0,
    };
  } catch (error: any) {
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      return null;
    }
    throw error;
  }
}

/**
 * Get events by entity (person, organization, location)
 */
export async function getEventsByEntity(
  entityId: string,
  entityType: 'person' | 'org' | 'location' | 'concept'
): Promise<{
  events: NewsAPIEvent[];
  total: number;
}> {
  const params: Record<string, any> = {
    action: 'getEvents',
    resultType: 'events',
    [`${entityType}Uri`]: entityId,
    articlesPage: 1,
    articlesCount: 10,
  };

  const data = await makeRequest('/event', params);

  const events: NewsAPIEvent[] = (data.events?.results || []).map((e: any) => ({
    uri: e.uri,
    id: e.id,
    title: e.title?.eng || e.title || '',
    summary: e.summary?.eng || e.summary || '',
    date: e.date || new Date().toISOString(),
    location: e.location ? {
      label: e.location.label?.eng || e.location.label || '',
      country: e.location.country?.eng || e.location.country,
      countryCode: e.location.countryCode,
      lat: e.location.lat,
      lng: e.location.lng,
    } : undefined,
    categories: e.categories?.map((c: any) => ({
      label: c.label?.eng || c.label || '',
      uri: c.uri,
    })),
    concepts: e.concepts?.map((c: any) => ({
      label: c.label?.eng || c.label || '',
      uri: c.uri,
      type: c.type,
      score: c.score || 0,
    })),
    articles: e.articles?.results?.map((a: any) => ({
      uri: a.uri,
      title: a.title || '',
      url: a.url || '',
      date: a.date || '',
      source: {
        title: a.source?.title || '',
        uri: a.source?.uri || '',
      },
    })),
    articleCount: e.articlesCount || 0,
  }));

  return {
    events,
    total: data.events?.totalResults || 0,
  };
}

/**
 * Get events by location
 */
export async function getEventsByLocation(
  country: string,
  region?: string
): Promise<{
  events: NewsAPIEvent[];
  total: number;
}> {
  return searchEvents('', {
    location: country,
  });
}

/**
 * Get events by sector/category
 */
export async function getEventsBySector(sector: string): Promise<{
  events: NewsAPIEvent[];
  total: number;
}> {
  return searchEvents('', {
    category: sector,
  });
}

/**
 * Health check
 */
export async function checkHealth(): Promise<boolean> {
  try {
    if (!NEWSAI_API_KEY) {
      return false;
    }
    // Try a simple search
    const result = await searchEvents('technology', { minArticles: 1 });
    return result.total >= 0; // Just check if API responds
  } catch {
    return false;
  }
}
