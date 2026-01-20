/**
 * Claims Extractor
 * 
 * Extracts actionable claims from text (predictions, statements, implications, warnings)
 * These become the foundation for predictions and market intelligence
 * 
 * Strategy:
 * - Simple prompt: let model identify claims naturally
 * - Focus on actionable intelligence (not just facts)
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  throw new Error('OPENAI_API_KEY is required for claims extraction');
}

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

export interface Claim {
  id: string;
  text: string; // The actual claim statement
  certainty: number; // 0-1 (how certain is this claim)
  actor: string; // Who/what made the claim (entity, source, or "implied")
  timeHorizon: 'immediate' | 'short' | 'medium' | 'long';
  type: 'prediction' | 'statement' | 'implication' | 'warning';
  evidence: string[]; // Supporting evidence from the text
  entities: string[]; // Related entity names
  sectors?: string[]; // Affected sectors (if mentioned)
  regions?: string[]; // Affected regions (if mentioned)
}

/**
 * Extract actionable claims from text
 * 
 * A claim is:
 * - A prediction ("X might happen")
 * - A statement ("X is happening")
 * - An implication ("X could lead to Y")
 * - A warning ("X poses risk to Y")
 */
export async function extractClaims(
  text: string,
  context?: {
    title?: string;
    source?: string;
    entities?: Array<{ name: string; type: string }>;
  }
): Promise<Claim[]> {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Limit text length to avoid token limits
  const maxLength = 8000;
  const truncatedText = text.length > maxLength 
    ? text.substring(0, maxLength) + '...'
    : text;

  const contextInfo = context
    ? `\n\nContext:\nTitle: ${context.title || 'N/A'}\nSource: ${context.source || 'N/A'}\n${context.entities && context.entities.length > 0 ? `Entities: ${context.entities.map(e => e.name).join(', ')}` : ''}`
    : '';

  const prompt = `Extract actionable claims from this text. A claim is:
- A prediction ("X might happen", "Y could occur")
- A statement ("X is happening", "Y has occurred")
- An implication ("X could lead to Y", "This means Z")
- A warning ("X poses risk to Y", "Y is vulnerable to X")

${truncatedText}${contextInfo}

Return ONLY a JSON object with a "claims" array. Each claim should have:
- text: the actual claim statement (quote or paraphrase)
- certainty: 0-1 (how certain/confident is this claim? 1 = very certain, 0 = speculative)
- actor: who/what made the claim (entity name, source, or "implied" if not explicitly stated)
- timeHorizon: "immediate" | "short" | "medium" | "long" (when might this happen/apply?)
- type: "prediction" | "statement" | "implication" | "warning"
- evidence: array of 1-3 supporting quotes from the text
- entities: array of entity names mentioned in the claim
- sectors: array of sectors affected (if mentioned, e.g., "Energy", "Finance", "Technology")
- regions: array of regions affected (if mentioned, e.g., "Europe", "Asia", "United States")

Focus on claims that are:
- Actionable (can inform decisions)
- Specific (not vague)
- Relevant to geopolitical/economic intelligence

Return empty array [] if no actionable claims found.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert intelligence analyst. Extract actionable claims from text that can inform strategic decisions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return [];
    }

    const result = JSON.parse(responseText);
    const claims = result.claims || [];

    // Add IDs and validate
    return claims
      .filter((claim: any) => claim.text && claim.text.trim().length > 0)
      .map((claim: any, idx: number) => ({
        id: `claim-${Date.now()}-${idx}`,
        text: claim.text.trim(),
        certainty: Math.min(1, Math.max(0, claim.certainty || 0.5)),
        actor: claim.actor || 'implied',
        timeHorizon: claim.timeHorizon || 'medium',
        type: claim.type || 'statement',
        evidence: Array.isArray(claim.evidence) ? claim.evidence : [],
        entities: Array.isArray(claim.entities) ? claim.entities : [],
        sectors: Array.isArray(claim.sectors) ? claim.sectors : undefined,
        regions: Array.isArray(claim.regions) ? claim.regions : undefined,
      })) as Claim[];
  } catch (error: any) {
    console.error('[ClaimsExtractor] Error extracting claims:', error.message);
    return [];
  }
}

/**
 * Extract claims from multiple search results
 * Processes in batches for efficiency
 */
export async function extractClaimsFromResults(
  results: Array<{
    title: string;
    summary: string;
    content?: string;
    source?: string;
    entities?: Array<{ name: string; type: string }>;
  }>,
  maxClaimsPerResult: number = 5
): Promise<Claim[]> {
  if (results.length === 0) {
    return [];
  }

  const allClaims: Claim[] = [];

  // Process results in parallel (but limit concurrent requests)
  const batchSize = 5;
  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (result) => {
      const text = result.content || result.summary || result.title;
      const claims = await extractClaims(text, {
        title: result.title,
        source: result.source,
        entities: result.entities,
      });
      
      // Limit claims per result
      return claims.slice(0, maxClaimsPerResult);
    });

    const batchResults = await Promise.allSettled(batchPromises);
    
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        allClaims.push(...result.value);
      } else {
        console.error('[ClaimsExtractor] Error processing batch:', result.reason);
      }
    }
  }

  // Deduplicate similar claims
  return deduplicateClaims(allClaims);
}

/**
 * Deduplicate similar claims (simple text similarity)
 */
function deduplicateClaims(claims: Claim[]): Claim[] {
  const seen = new Set<string>();
  const unique: Claim[] = [];

  for (const claim of claims) {
    // Normalize claim text for comparison
    const normalized = claim.text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '')
      .substring(0, 100);

    // Simple hash for deduplication
    const hash = normalized.split(' ').slice(0, 10).join(' ');

    if (!seen.has(hash)) {
      seen.add(hash);
      unique.push(claim);
    }
  }

  return unique;
}
