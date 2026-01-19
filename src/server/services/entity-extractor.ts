/**
 * Entity Extractor
 * 
 * Extracts entities (countries, companies, commodities, organizations) from text using OpenAI
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
  throw new Error('OPENAI_API_KEY is required');
}

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

export interface Entity {
  id: string;
  type: 'country' | 'company' | 'commodity' | 'organization' | 'person';
  name: string;
  confidence: number;
  context?: string; // Context where entity was mentioned
}

export interface EntityExtractionResult {
  entities: Entity[];
  countries: Entity[];
  companies: Entity[];
  commodities: Entity[];
  organizations: Entity[];
  people: Entity[];
}

/**
 * Extract entities from text
 */
export async function extractEntities(text: string): Promise<Entity[]> {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Limit text length to avoid token limits
  const maxLength = 15000;
  const truncatedText = text.length > maxLength 
    ? text.substring(0, maxLength) + '...'
    : text;

  const prompt = `Extract all entities (countries, companies, commodities, organizations, people) from the following text.

Return ONLY a valid JSON array of entities. Each entity should have:
- id: unique identifier (use normalized name, e.g., "united-states" for "United States")
- type: one of "country", "company", "commodity", "organization", "person"
- name: the actual name as it appears in the text
- confidence: number between 0 and 1 (how confident you are this is a real entity)
- context: (optional) brief context where entity was mentioned

Rules:
1. Only extract entities that are clearly mentioned in the text
2. Normalize country names (e.g., "USA" → "United States", "UK" → "United Kingdom")
3. For companies, use official names when possible
4. For commodities, use standard names (e.g., "crude oil", "gold", "wheat")
5. Don't extract generic terms like "government" or "market" unless they refer to a specific entity
6. Return empty array [] if no entities found

Text:
${truncatedText}

Return ONLY the JSON array, no markdown, no code blocks, no explanations.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert entity extraction system. Extract entities from text and return only valid JSON.',
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
        console.error('[EntityExtractor] Failed to parse JSON response:', responseText);
        return [];
      }
    }

    // Handle different response formats
    let entities: Entity[] = [];
    if (Array.isArray(parsed)) {
      entities = parsed;
    } else if (parsed.entities && Array.isArray(parsed.entities)) {
      entities = parsed.entities;
    } else if (parsed.countries || parsed.companies || parsed.commodities || parsed.organizations || parsed.people) {
      // Flatten grouped entities
      entities = [
        ...(parsed.countries || []).map((e: any) => ({ ...e, type: 'country' })),
        ...(parsed.companies || []).map((e: any) => ({ ...e, type: 'company' })),
        ...(parsed.commodities || []).map((e: any) => ({ ...e, type: 'commodity' })),
        ...(parsed.organizations || []).map((e: any) => ({ ...e, type: 'organization' })),
        ...(parsed.people || []).map((e: any) => ({ ...e, type: 'person' })),
      ];
    }

    // Validate and normalize entities
    entities = entities
      .filter((e: any) => e.id && e.name && e.type && e.confidence !== undefined)
      .map((e: any) => ({
        id: normalizeId(e.id),
        type: e.type as Entity['type'],
        name: e.name,
        confidence: Math.max(0, Math.min(1, e.confidence || 0.5)),
        context: e.context,
      }))
      .filter((e: Entity) => {
        // Filter out low-confidence entities
        return e.confidence >= 0.3;
      });

    // Deduplicate by id
    const seen = new Set<string>();
    entities = entities.filter(e => {
      if (seen.has(e.id)) {
        return false;
      }
      seen.add(e.id);
      return true;
    });

    return entities;
  } catch (error: any) {
    console.error('[EntityExtractor] Error extracting entities:', error.message);
    return [];
  }
}

/**
 * Extract entities grouped by type
 */
export async function extractEntitiesGrouped(text: string): Promise<EntityExtractionResult> {
  const entities = await extractEntities(text);

  return {
    entities,
    countries: entities.filter(e => e.type === 'country'),
    companies: entities.filter(e => e.type === 'company'),
    commodities: entities.filter(e => e.type === 'commodity'),
    organizations: entities.filter(e => e.type === 'organization'),
    people: entities.filter(e => e.type === 'person'),
  };
}

/**
 * Normalize entity ID
 */
function normalizeId(id: string): string {
  return id
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
