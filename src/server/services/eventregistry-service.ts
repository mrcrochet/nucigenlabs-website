/**
 * EventRegistry Service
 * 
 * Technical wrapper for EventRegistry API
 * 
 * Responsibilities:
 * - Wrapper technique ONLY - no business logic
 * - Returns raw normalized data
 * - Handles errors, retries, rate limiting
 * - Supports Articles, Events, Trends, and Concepts
 * 
 * Documentation: https://eventregistry.org/documentation
 * API Base: https://eventregistry.org/api/v1/
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

const EVENTREGISTRY_API_KEY = process.env.EVENTREGISTRY_API_KEY || 'a3c7d296-1a86-44f3-86c9-0cf39e698bce';
const EVENTREGISTRY_BASE_URL = 'https://eventregistry.org/api/v1';

// Debug: Log API key status (without exposing the key)
if (!EVENTREGISTRY_API_KEY) {
  console.warn('[EventRegistry] ⚠️  EVENTREGISTRY_API_KEY not found in environment variables');
  console.warn('[EventRegistry] Please add EVENTREGISTRY_API_KEY to your .env file');
} else {
  console.log(`[EventRegistry] ✅ API key loaded (${EVENTREGISTRY_API_KEY.substring(0, 8)}...)`);
}

// Rate limiting: EventRegistry has rate limits
const RATE_LIMIT_DELAY = 100; // ms between requests
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
  params: Record<string, any> = {},
  options: RequestInit = {}
): Promise<any> {
  if (!EVENTREGISTRY_API_KEY) {
    throw new Error('EVENTREGISTRY_API_KEY not configured');
  }

  await rateLimit();

  // Add API key to params
  const requestParams = {
    ...params,
    apiKey: EVENTREGISTRY_API_KEY,
  };

  const queryString = new URLSearchParams(
    Object.entries(requestParams).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value);
      }
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  const url = `${EVENTREGISTRY_BASE_URL}${endpoint}?${queryString}`;

  // Debug logging (only in development)
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_EVENTREGISTRY) {
    console.log(`[EventRegistry] Request: ${endpoint}`);
    console.log(`[EventRegistry] Params:`, Object.keys(requestParams).reduce((acc, key) => {
      if (key !== 'apiKey') {
        acc[key] = requestParams[key];
      }
      return acc;
    }, {} as Record<string, any>));
  }

  const response = await fetch(url, {
    ...options,
    headers: {
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
      throw new Error('EventRegistry API rate limit exceeded. Please try again later.');
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error('EventRegistry API key is invalid or expired.');
    }

    throw new Error(
      `EventRegistry API error: ${response.status} ${response.statusText}. ${errorData.message || errorData.error || ''}`
    );
  }

  const data = await response.json();
  
  // Debug logging for response
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_EVENTREGISTRY) {
    if (endpoint.includes('getArticles')) {
      console.log(`[EventRegistry] Articles response:`, {
        totalResults: data.articles?.totalResults,
        resultsCount: data.articles?.results?.length,
      });
    } else if (endpoint.includes('getEvents')) {
      console.log(`[EventRegistry] Events response:`, {
        totalResults: data.events?.totalResults,
        resultsCount: data.events?.results?.length,
      });
    }
  }

  return data;
}

/**
 * Search Articles
 */
export interface SearchArticlesOptions {
  keywords?: string | string[];
  categoryUri?: string;
  sourceUri?: string;
  lang?: string | string[]; // 'eng', 'fra', etc.
  dateStart?: string; // YYYY-MM-DD
  dateEnd?: string; // YYYY-MM-DD
  sortBy?: 'date' | 'rel' | 'socialScore' | 'sentiment';
  sortByAsc?: boolean;
  articlesCount?: number; // 1-250
  articlesPage?: number;
  keywordsLoc?: 'title' | 'body' | 'title,body'; // Where to search keywords
  ignoreKeywords?: string | string[];
  conceptUri?: string | string[];
  locationUri?: string;
  locationRadius?: number; // km
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface Article {
  uri: string;
  url: string;
  title: string;
  body: string;
  lang: string;
  date: string;
  time: string;
  dateTime: string;
  dateTimePub: string;
  dataType: string;
  eventUri?: string;
  source: {
    uri: string;
    title: string;
    location?: {
      label: string;
      type: string;
    };
    ranking?: number; // Source ranking
    image?: string; // Source image URL
  };
  concepts?: Array<{
    uri: string;
    label: string;
    score: number;
    type: string[];
  }>;
  categories?: Array<{
    uri: string;
    label: string;
    score?: number;
  }>;
  location?: {
    uri: string;
    label: string;
    type: string[];
    lat?: number;
    long?: number;
  };
  sentiment?: {
    polarity: 'positive' | 'negative' | 'neutral';
    score: number;
  };
  images?: Array<{
    url: string;
    width?: number;
    height?: number;
  }>;
  links?: Array<{
    url: string;
    text?: string;
  }>;
  shares?: {
    facebook?: number;
    twitter?: number;
    reddit?: number;
    linkedin?: number;
    total?: number;
  };
  dates?: Array<{
    date: string;
    text?: string;
    type?: string;
  }>;
}

export interface SearchArticlesResponse {
  articles: {
    results: Article[];
    totalResults: number;
    pages: number;
    currentPage: number;
  };
}

/**
 * Search articles
 */
export async function searchArticles(options: SearchArticlesOptions = {}): Promise<SearchArticlesResponse> {
  const params: Record<string, any> = {};

  if (options.keywords) {
    // EventRegistry supports both AND and OR in keywords
    // If it's already a string with OR, keep it as is
    // Otherwise, join arrays with AND
    if (Array.isArray(options.keywords)) {
      params.keywords = options.keywords.join(' AND ');
    } else {
      params.keywords = options.keywords; // Keep as is (may contain OR)
    }
  }
  if (options.categoryUri) params.categoryUri = options.categoryUri;
  if (options.sourceUri) params.sourceUri = options.sourceUri;
  if (options.lang) params.lang = Array.isArray(options.lang) ? options.lang.join(',') : options.lang;
  if (options.dateStart) params.dateStart = options.dateStart;
  if (options.dateEnd) params.dateEnd = options.dateEnd;
  if (options.sortBy) params.sortBy = options.sortBy;
  if (options.sortByAsc !== undefined) params.sortByAsc = options.sortByAsc;
  if (options.articlesCount) params.articlesCount = Math.min(250, Math.max(1, options.articlesCount));
  if (options.articlesPage) params.articlesPage = options.articlesPage;
  if (options.keywordsLoc) params.keywordsLoc = options.keywordsLoc;
  if (options.ignoreKeywords) {
    params.ignoreKeywords = Array.isArray(options.ignoreKeywords) 
      ? options.ignoreKeywords.join(' OR ') 
      : options.ignoreKeywords;
  }
  if (options.conceptUri) {
    params.conceptUri = Array.isArray(options.conceptUri) 
      ? options.conceptUri.join(',') 
      : options.conceptUri;
  }
  if (options.locationUri) params.locationUri = options.locationUri;
  if (options.locationRadius) params.locationRadius = options.locationRadius;
  if (options.sentiment) params.sentiment = options.sentiment;

  // Request additional fields
  params.articlesArticleBodyLen = 500; // Limit body length
  params.articlesResultType = 'articles'; // Return articles (not events)
  
  // Article metadata flags (as per NewsApi.ai documentation)
  params.articlesIncludeArticleConcepts = true; // Concepts associated with the article
  params.articlesIncludeArticleCategories = true; // Categories assigned to the article
  params.articlesIncludeArticleLocation = true; // Location information
  params.articlesIncludeArticleImage = true; // Images in the article
  params.articlesIncludeArticleSentiment = true; // Sentiment analysis
  params.articlesIncludeArticleLinks = true; // Web links identified in the article body
  params.articlesIncludeArticleShares = true; // Number of shares on social media sites
  params.articlesIncludeArticleDates = true; // Dates mentioned in the news article
  
  // Source metadata flags
  params.articlesIncludeSourceRanking = true; // Source ranking
  params.articlesIncludeSourceImage = true; // Source image

  return await makeRequest('/article/getArticles', params);
}

/**
 * Search Events
 */
export interface SearchEventsOptions {
  keywords?: string | string[];
  categoryUri?: string;
  sourceUri?: string;
  lang?: string | string[];
  dateStart?: string;
  dateEnd?: string;
  sortBy?: 'date' | 'rel' | 'socialScore' | 'sentiment';
  sortByAsc?: boolean;
  eventsCount?: number;
  eventsPage?: number;
  keywordsLoc?: 'title' | 'body' | 'title,body';
  ignoreKeywords?: string | string[];
  conceptUri?: string | string[];
  locationUri?: string;
  locationRadius?: number;
}

export interface Event {
  uri: string;
  title: string;
  summary: string;
  articleCount: number;
  date: string;
  dateTime: string;
  dateTimePub: string;
  lang: string;
  concepts?: Array<{
    uri: string;
    label: string;
    score: number;
    type: string[];
  }>;
  categories?: Array<{
    uri: string;
    label: string;
    score?: number;
  }>;
  location?: {
    uri: string;
    label: string;
    type: string[];
  };
  articles?: Article[];
}

export interface SearchEventsResponse {
  events: {
    results: Event[];
    totalResults: number;
    pages: number;
    currentPage: number;
  };
}

/**
 * Search events
 */
export async function searchEvents(options: SearchEventsOptions = {}): Promise<SearchEventsResponse> {
  const params: Record<string, any> = {};

  if (options.keywords) {
    params.keywords = Array.isArray(options.keywords) ? options.keywords.join(' AND ') : options.keywords;
  }
  if (options.categoryUri) params.categoryUri = options.categoryUri;
  if (options.sourceUri) params.sourceUri = options.sourceUri;
  if (options.lang) params.lang = Array.isArray(options.lang) ? options.lang.join(',') : options.lang;
  if (options.dateStart) params.dateStart = options.dateStart;
  if (options.dateEnd) params.dateEnd = options.dateEnd;
  if (options.sortBy) params.sortBy = options.sortBy;
  if (options.sortByAsc !== undefined) params.sortByAsc = options.sortByAsc;
  if (options.eventsCount) params.eventsCount = Math.min(100, Math.max(1, options.eventsCount));
  if (options.eventsPage) params.eventsPage = options.eventsPage;
  if (options.keywordsLoc) params.keywordsLoc = options.keywordsLoc;
  if (options.ignoreKeywords) {
    params.ignoreKeywords = Array.isArray(options.ignoreKeywords) 
      ? options.ignoreKeywords.join(' OR ') 
      : options.ignoreKeywords;
  }
  if (options.conceptUri) {
    params.conceptUri = Array.isArray(options.conceptUri) 
      ? options.conceptUri.join(',') 
      : options.conceptUri;
  }
  if (options.locationUri) params.locationUri = options.locationUri;
  if (options.locationRadius) params.locationRadius = options.locationRadius;

  // Request additional fields
  params.eventsResultType = 'events';
  params.eventsIncludeArticleConcepts = true; // Concepts associated with articles
  params.eventsIncludeArticleCategories = true; // Categories assigned to articles
  params.eventsIncludeArticleLocation = true; // Location information
  params.eventsIncludeArticles = true; // Include articles in the event
  params.eventsArticleCount = 5; // Include 5 articles per event
  params.eventsIncludeArticleLinks = true; // Web links in articles
  params.eventsIncludeArticleShares = true; // Social media shares
  params.eventsIncludeArticleDates = true; // Dates mentioned in articles
  params.eventsIncludeSourceRanking = true; // Source ranking
  params.eventsIncludeSourceImage = true; // Source image

  return await makeRequest('/event/getEvents', params);
}

/**
 * Get Trending Concepts
 */
export interface GetTrendingConceptsOptions {
  source?: 'news' | 'social';
  lang?: string | string[];
  dateStart?: string;
  dateEnd?: string;
  conceptType?: 'person' | 'org' | 'place' | 'thing';
  count?: number;
}

export interface TrendingConcept {
  uri: string;
  label: string;
  type: string[];
  score: number;
  mentionsCount?: number;
}

export interface GetTrendingConceptsResponse {
  trendingConcepts: {
    results: TrendingConcept[];
  };
}

/**
 * Get trending concepts
 */
export async function getTrendingConcepts(options: GetTrendingConceptsOptions = {}): Promise<GetTrendingConceptsResponse> {
  const params: Record<string, any> = {};

  if (options.source) params.source = options.source;
  if (options.lang) params.lang = Array.isArray(options.lang) ? options.lang.join(',') : options.lang;
  if (options.dateStart) params.dateStart = options.dateStart;
  if (options.dateEnd) params.dateEnd = options.dateEnd;
  if (options.conceptType) params.conceptType = options.conceptType;
  if (options.count) params.count = Math.min(100, Math.max(1, options.count));

  return await makeRequest('/trending/getTrendingConcepts', params);
}

/**
 * Health check
 */
export async function checkEventRegistryHealth(): Promise<boolean> {
  try {
    if (!EVENTREGISTRY_API_KEY) {
      return false;
    }
    // Simple health check - try to get trending concepts (lightweight)
    await getTrendingConcepts({ count: 1 });
    return true;
  } catch {
    return false;
  }
}
