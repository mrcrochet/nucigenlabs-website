/**
 * Tavily Follow-up Service
 * 
 * Uses Tavily for intelligent follow-up queries:
 * - Validation ("Is this true?")
 * - Contradictions ("What contradicts this?")
 * - Updates ("What changed since X?")
 * - Counter-arguments ("What are the counter-arguments?")
 * 
 * Strategy:
 * - Tavily becomes an agent of validation, not just a search engine
 * - Enables real-time fact-checking and update detection
 */

import { searchTavily } from './tavily-unified-service';
import type { TavilySearchResult } from './tavily-unified-service';

export interface ValidationResult {
  validated: boolean; // Is the claim validated?
  confidence: number; // 0-1 (how confident are we?)
  supportingSources: number; // Number of sources supporting
  contradictingSources: number; // Number of sources contradicting
  evidence: Array<{
    url: string;
    title: string;
    supports: boolean; // true = supports, false = contradicts
    date: string;
    relevanceScore?: number;
  }>;
}

export interface UpdateResult {
  updates: Array<{
    url: string;
    title: string;
    date: string;
    summary: string;
    relevanceScore?: number;
  }>;
  totalUpdates: number;
  timeRange: string; // e.g., "last 72 hours"
}

/**
 * Validate a claim by searching for supporting and contradicting evidence
 */
export async function validateClaim(
  claim: string,
  timeRange: '24h' | '7d' | '30d' = '7d'
): Promise<ValidationResult> {
  const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
  
  // Search for supporting evidence
  const supportingQuery = claim; // Direct search for the claim
  const supporting = await searchTavily(
    supportingQuery,
    'news',
    {
      maxResults: 10,
      days,
      minScore: 0.5,
    }
  );
  
  // Search for contradictions
  const contradictingQuery = `contradicts OR refutes OR denies OR disputes: ${claim}`;
  const contradicting = await searchTavily(
    contradictingQuery,
    'news',
    {
      maxResults: 10,
      days,
      minScore: 0.5,
    }
  );
  
  const supportingCount = supporting.articles.length;
  const contradictingCount = contradicting.articles.length;
  
  // Calculate confidence
  const total = supportingCount + contradictingCount;
  const confidence = total > 0 
    ? supportingCount / (total + 1) // +1 to avoid division by zero
    : 0.5; // Neutral if no evidence
  
  const validated = supportingCount > contradictingCount;
  
  // Build evidence array
  const evidence = [
    ...supporting.articles.map(a => ({
      url: a.url,
      title: a.title || '',
      supports: true,
      date: a.publishedDate || new Date().toISOString(),
      relevanceScore: a.score,
    })),
    ...contradicting.articles.map(a => ({
      url: a.url,
      title: a.title || '',
      supports: false,
      date: a.publishedDate || new Date().toISOString(),
      relevanceScore: a.score,
    })),
  ];
  
  return {
    validated,
    confidence,
    supportingSources: supportingCount,
    contradictingSources: contradictingCount,
    evidence,
  };
}

/**
 * Find updates related to an event since a specific date
 */
export async function findUpdates(
  eventTitle: string,
  originalDate: string,
  timeRange: '24h' | '7d' | '30d' = '7d'
): Promise<UpdateResult> {
  const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
  
  // Search for updates since original date
  const updateQuery = `${eventTitle} since ${originalDate}`;
  const updates = await searchTavily(
    updateQuery,
    'news',
    {
      maxResults: 20,
      days,
      minScore: 0.4,
    }
  );
  
  // Filter to only articles published after original date
  const originalTimestamp = new Date(originalDate).getTime();
  const filteredUpdates = updates.articles
    .filter(a => {
      if (!a.publishedDate) return false;
      const articleDate = new Date(a.publishedDate).getTime();
      return articleDate > originalTimestamp;
    })
    .map(a => ({
      url: a.url,
      title: a.title || '',
      date: a.publishedDate || new Date().toISOString(),
      summary: a.content?.substring(0, 200) || '',
      relevanceScore: a.score,
    }));
  
  return {
    updates: filteredUpdates,
    totalUpdates: filteredUpdates.length,
    timeRange: timeRange === '24h' ? 'last 24 hours' : timeRange === '7d' ? 'last 7 days' : 'last 30 days',
  };
}

/**
 * Find counter-arguments to a claim
 */
export async function findCounterArguments(
  claim: string,
  timeRange: '24h' | '7d' | '30d' = '7d'
): Promise<Array<{
  url: string;
  title: string;
  date: string;
  summary: string;
  relevanceScore?: number;
}>> {
  const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
  
  // Search for counter-arguments
  const counterQuery = `counter-argument OR alternative view OR different perspective: ${claim}`;
  const results = await searchTavily(
    counterQuery,
    'news',
    {
      maxResults: 15,
      days,
      minScore: 0.4,
    }
  );
  
  return results.articles.map(a => ({
    url: a.url,
    title: a.title || '',
    date: a.publishedDate || new Date().toISOString(),
    summary: a.content?.substring(0, 200) || '',
    relevanceScore: a.score,
  }));
}

/**
 * Check if an event is still relevant (has recent mentions)
 */
export async function checkEventRelevance(
  eventTitle: string,
  eventDate: string,
  thresholdDays: number = 7
): Promise<{
  stillRelevant: boolean;
  recentMentions: number;
  lastMention?: string;
}> {
  const results = await searchTavily(
    eventTitle,
    'news',
    {
      maxResults: 10,
      days: thresholdDays,
      minScore: 0.3,
    }
  );
  
  // Filter to mentions after event date
  const eventTimestamp = new Date(eventDate).getTime();
  const recentMentions = results.articles.filter(a => {
    if (!a.publishedDate) return false;
    const articleDate = new Date(a.publishedDate).getTime();
    return articleDate > eventTimestamp;
  });
  
  const lastMention = recentMentions.length > 0
    ? recentMentions.sort((a, b) => {
        const dateA = new Date(a.publishedDate || '').getTime();
        const dateB = new Date(b.publishedDate || '').getTime();
        return dateB - dateA;
      })[0].publishedDate
    : undefined;
  
  return {
    stillRelevant: recentMentions.length > 0,
    recentMentions: recentMentions.length,
    lastMention,
  };
}
