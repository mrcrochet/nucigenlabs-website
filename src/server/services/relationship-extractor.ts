/**
 * Relationship Extractor
 * 
 * Extracts relationships between entities and events from text using OpenAI
 * Adapted from phase7/relationship-extractor.ts for search results
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

if (!openaiApiKey) {
  throw new Error('OPENAI_API_KEY is required');
}

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

export interface Relationship {
  source: string; // Entity or event ID
  target: string; // Entity or event ID
  type: 'causes' | 'precedes' | 'related_to' | 'operates_in' | 'exposes_to' | 'impacts';
  strength: number; // 0-1
  confidence: number; // 0-1
  evidence?: string;
}

/**
 * Extract relationships from text and search results
 */
export async function extractRelationshipsFromText(
  text: string,
  results: SearchResult[]
): Promise<Relationship[]> {
  if (!text || text.trim().length === 0 || results.length === 0) {
    return [];
  }

  // Limit text length
  const maxLength = 15000;
  const truncatedText = text.length > maxLength 
    ? text.substring(0, maxLength) + '...'
    : text;

  // Build context from results
  const resultsContext = results.map((r, idx) => 
    `[Result ${idx + 1}]
ID: ${r.id}
Title: ${r.title}
Summary: ${r.summary}
Entities: ${r.entities.map(e => e.name).join(', ')}
URL: ${r.url}`
  ).join('\n\n');

  const prompt = `You are an expert geopolitical and economic analyst. Analyze the relationships between entities and events mentioned in the following text.

TEXT:
${truncatedText}

SEARCH RESULTS:
${resultsContext}

TASK:
Identify meaningful relationships between entities and events. Consider:
- Causal relationships (does entity/event A cause event B?)
- Temporal relationships (does event A precede event B?)
- Operational relationships (does company A operate in country B?)
- Exposure relationships (does entity A expose to risk B?)
- Impact relationships (does event A impact entity B?)
- Generic relatedness (are they related in a meaningful way?)

RULES:
1. Only identify relationships if there is clear evidence in the text
2. Relationship types:
   - "causes": Source directly causes target
   - "precedes": Source happens before target (temporal)
   - "operates_in": Entity operates in location/context
   - "exposes_to": Entity exposes to risk/event
   - "impacts": Event/entity impacts target
   - "related_to": Generic relatedness
3. Strength: 0-1 (how strong the relationship is)
4. Confidence: 0-1 (how confident you are in the relationship)
5. Evidence: brief explanation of why this relationship exists

Return ONLY a valid JSON array of relationships. Each relationship should have:
- source: ID of source entity/event
- target: ID of target entity/event
- type: one of the relationship types above
- strength: number 0-1
- confidence: number 0-1
- evidence: (optional) brief explanation

Return empty array [] if no relationships found.

Return ONLY the JSON array, no markdown, no code blocks, no explanations.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert relationship extraction system. Extract relationships from text and return only valid JSON.',
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

    // Parse JSON response
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        console.error('[RelationshipExtractor] Failed to parse JSON response:', responseText);
        return [];
      }
    }

    // Handle different response formats
    let relationships: Relationship[] = [];
    if (Array.isArray(parsed)) {
      relationships = parsed;
    } else if (parsed.relationships && Array.isArray(parsed.relationships)) {
      relationships = parsed.relationships;
    }

    // Validate and normalize relationships
    relationships = relationships
      .filter((r: any) => r.source && r.target && r.type && r.strength !== undefined && r.confidence !== undefined)
      .map((r: any) => ({
        source: String(r.source),
        target: String(r.target),
        type: r.type as Relationship['type'],
        strength: Math.max(0, Math.min(1, r.strength || 0.5)),
        confidence: Math.max(0, Math.min(1, r.confidence || 0.5)),
        evidence: r.evidence,
      }))
      .filter((r: Relationship) => {
        // Filter out low-confidence relationships
        return r.confidence >= 0.4 && r.strength >= 0.3;
      })
      .filter((r: Relationship) => {
        // Don't allow self-relationships
        return r.source !== r.target;
      });

    // Deduplicate
    const seen = new Set<string>();
    relationships = relationships.filter(r => {
      const key = `${r.source}-${r.target}-${r.type}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    return relationships;
  } catch (error: any) {
    console.error('[RelationshipExtractor] Error extracting relationships:', error.message);
    return [];
  }
}
