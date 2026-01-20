/**
 * Canonical Event Resolver - MVP Version
 * 
 * Merges duplicate events into canonical events with stable IDs
 * 
 * MVP Strategy (simple & fast):
 * - Fuzzy match on title + date (no pairwise exhaustive matching)
 * - OpenAI only when ambiguous (not for every comparison)
 * - Avoids latency/cost explosion
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { SearchResult } from './search-orchestrator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const openaiApiKey = process.env.OPENAI_API_KEY;

let openai: OpenAI | null = null;
if (openaiApiKey) {
  openai = new OpenAI({ apiKey: openaiApiKey });
}

export interface CanonicalEvent {
  canonicalId: string; // Stable ID: "canonical:hash"
  title: string; // Normalized title (from best representative)
  publishedDate: string; // Date from best representative
  mergedFrom: string[]; // Original result IDs
  representativeResult: SearchResult; // Best quality result
  confidence: number; // How confident we are these are the same (0-1)
}

/**
 * Normalize title for fuzzy matching
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 100); // Limit length
}

/**
 * Extract date key (YYYY-MM-DD) from publishedAt
 */
function extractDateKey(publishedAt: string): string {
  try {
    const date = new Date(publishedAt);
    return date.toISOString().substring(0, 10); // YYYY-MM-DD
  } catch {
    return 'unknown';
  }
}

/**
 * Calculate simple string similarity (Levenshtein-like, simplified)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = normalizeTitle(str1);
  const s2 = normalizeTitle(str2);
  
  if (s1 === s2) return 1.0;
  
  // Simple word overlap
  const words1 = new Set(s1.split(' ').filter(w => w.length > 2));
  const words2 = new Set(s2.split(' ').filter(w => w.length > 2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Check if two results are likely the same event (fuzzy match)
 * Returns confidence 0-1
 */
function fuzzyMatchResults(r1: SearchResult, r2: SearchResult): number {
  // Must be same date (within same day)
  const date1 = extractDateKey(r1.publishedAt);
  const date2 = extractDateKey(r2.publishedAt);
  
  if (date1 !== date2 && date1 !== 'unknown' && date2 !== 'unknown') {
    return 0; // Different dates = different events
  }
  
  // Calculate title similarity
  const titleSimilarity = calculateStringSimilarity(r1.title, r2.title);
  
  // High similarity threshold for MVP (0.7 = 70% word overlap)
  if (titleSimilarity >= 0.7) {
    return titleSimilarity;
  }
  
  // Medium similarity - might be same, might not (ambiguous)
  if (titleSimilarity >= 0.5) {
    return titleSimilarity * 0.7; // Lower confidence for ambiguous cases
  }
  
  return 0; // Too different
}

/**
 * Use OpenAI to resolve ambiguous cases (only when needed)
 */
async function resolveAmbiguousMatch(
  r1: SearchResult,
  r2: SearchResult
): Promise<number> {
  if (!openai) {
    // No OpenAI available, use fuzzy match only
    return fuzzyMatchResults(r1, r2);
  }
  
  try {
    const prompt = `Are these two events about the same thing?

Event 1: "${r1.title}"
Published: ${r1.publishedAt}
Summary: ${r1.summary.substring(0, 200)}

Event 2: "${r2.title}"
Published: ${r2.publishedAt}
Summary: ${r2.summary.substring(0, 200)}

Return ONLY a JSON object with:
- sameEvent: boolean
- confidence: 0-1 (how confident)
- reasoning: brief explanation (one sentence)`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at identifying duplicate events. Be conservative - only mark as same if clearly the same event.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return fuzzyMatchResults(r1, r2); // Fallback
    }

    const result = JSON.parse(responseText);
    return result.sameEvent ? (result.confidence || 0.8) : 0;
  } catch (error: any) {
    console.error('[CanonicalResolver] Error in OpenAI resolution:', error.message);
    return fuzzyMatchResults(r1, r2); // Fallback to fuzzy match
  }
}

/**
 * Generate stable canonical ID from title + date
 */
function generateCanonicalId(title: string, date: string): string {
  const normalized = normalizeTitle(title);
  const dateKey = extractDateKey(date);
  // Simple hash (not cryptographic, just for stability)
  const hash = (normalized + dateKey).split('').reduce((acc, char) => {
    const code = char.charCodeAt(0);
    return ((acc << 5) - acc) + code;
  }, 0);
  return `canonical:${Math.abs(hash).toString(36)}`;
}

/**
 * Resolve canonical events from search results (MVP version)
 * 
 * Strategy:
 * 1. Group by date + fuzzy title match (fast)
 * 2. Use OpenAI only for ambiguous cases (cost-efficient)
 * 3. Return canonical events with stable IDs
 */
export async function resolveCanonicalEvents(
  results: SearchResult[]
): Promise<Map<string, CanonicalEvent>> {
  if (results.length < 2) {
    // No duplicates possible
    const canonicalMap = new Map<string, CanonicalEvent>();
    for (const result of results) {
      const canonicalId = generateCanonicalId(result.title, result.publishedAt);
      canonicalMap.set(canonicalId, {
        canonicalId,
        title: result.title,
        publishedDate: result.publishedAt,
        mergedFrom: [result.id],
        representativeResult: result,
        confidence: 1.0,
      });
    }
    return canonicalMap;
  }
  
  const canonicalMap = new Map<string, CanonicalEvent>();
  const processed = new Set<string>();
  
  // Group by date first (fast pre-filtering)
  const byDate = new Map<string, SearchResult[]>();
  for (const result of results) {
    const dateKey = extractDateKey(result.publishedAt);
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, []);
    }
    byDate.get(dateKey)!.push(result);
  }
  
  // Process each date group
  for (const [dateKey, dateResults] of byDate) {
    for (let i = 0; i < dateResults.length; i++) {
      const result = dateResults[i];
      if (processed.has(result.id)) continue;
      
      // Find matches within this date group
      const matches: SearchResult[] = [];
      const ambiguousMatches: SearchResult[] = [];
      
      for (let j = i + 1; j < dateResults.length; j++) {
        const other = dateResults[j];
        if (processed.has(other.id)) continue;
        
        const similarity = fuzzyMatchResults(result, other);
        
        if (similarity >= 0.7) {
          // Clear match
          matches.push(other);
        } else if (similarity >= 0.5) {
          // Ambiguous - needs OpenAI check
          ambiguousMatches.push(other);
        }
      }
      
      // Resolve ambiguous matches with OpenAI (only if needed)
      if (ambiguousMatches.length > 0 && openai) {
        console.log(`[CanonicalResolver] Resolving ${ambiguousMatches.length} ambiguous matches with OpenAI...`);
        
        for (const ambiguous of ambiguousMatches) {
          const confidence = await resolveAmbiguousMatch(result, ambiguous);
          if (confidence >= 0.7) {
            matches.push(ambiguous);
          }
        }
      }
      
      // Create canonical event
      const canonicalId = generateCanonicalId(result.title, result.publishedAt);
      const allMatches = [result, ...matches];
      
      // Choose best representative (highest source score or relevance)
      const representative = allMatches.reduce((best, current) => {
        const bestScore = (best.sourceScore || 0) + (best.relevanceScore || 0);
        const currentScore = (current.sourceScore || 0) + (current.relevanceScore || 0);
        return currentScore > bestScore ? current : best;
      });
      
      canonicalMap.set(canonicalId, {
        canonicalId,
        title: representative.title,
        publishedDate: representative.publishedAt,
        mergedFrom: allMatches.map(m => m.id),
        representativeResult: representative,
        confidence: matches.length > 0 ? 0.9 : 1.0, // High confidence if merged
      });
      
      // Mark all as processed
      allMatches.forEach(m => processed.add(m.id));
    }
  }
  
  console.log(`[CanonicalResolver] Resolved ${results.length} results into ${canonicalMap.size} canonical events`);
  
  return canonicalMap;
}
