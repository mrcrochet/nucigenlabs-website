/**
 * Search Memory System
 * 
 * Stores and retrieves search context across sessions
 * Reduces API calls and improves predictions by learning from past searches
 * 
 * Strategy:
 * - Store entities and relationships from each search
 * - Accumulate knowledge over time
 * - Use for context in future searches
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Entity } from './entity-extractor';
import type { Relationship } from './relationship-extractor';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
} else {
  console.warn('[SearchMemory] Supabase not configured. Memory features will be disabled.');
}

export interface EntityMemory {
  id: string;
  name: string;
  type: string;
  mentions: number; // Total mentions across all searches
  lastSeen: string; // ISO timestamp
  contexts: string[]; // Recent contexts (last 5) where entity appeared
  relevanceScore: number; // Average relevance score
}

export interface RelationshipMemory {
  source: string; // Entity or event ID
  target: string; // Entity or event ID
  type: string; // Relationship type
  strength: number; // Average strength
  occurrences: number; // How many times this relationship was seen
  lastSeen: string; // ISO timestamp
  confidence: number; // Average confidence
}

export interface SearchMemory {
  userId: string;
  entities: Map<string, EntityMemory>;
  relationships: Map<string, RelationshipMemory>;
  lastUpdated: string;
}

/**
 * Get search memory for a user
 * Loads from database and caches in memory
 */
const memoryCache = new Map<string, SearchMemory>();

export async function getSearchMemory(userId: string | null): Promise<SearchMemory | null> {
  if (!userId || !supabase) {
    return null;
  }

  // Check cache first
  if (memoryCache.has(userId)) {
    return memoryCache.get(userId)!;
  }

  try {
    // Load from database
    const { data: entitiesData, error: entitiesError } = await supabase
      .from('search_memory_entities')
      .select('*')
      .eq('user_id', userId)
      .order('last_seen', { ascending: false })
      .limit(1000); // Limit to most recent 1000 entities

    if (entitiesError) {
      console.error('[SearchMemory] Error loading entities:', entitiesError);
    }

    const { data: relationshipsData, error: relationshipsError } = await supabase
      .from('search_memory_relationships')
      .select('*')
      .eq('user_id', userId)
      .order('last_seen', { ascending: false })
      .limit(1000); // Limit to most recent 1000 relationships

    if (relationshipsError) {
      console.error('[SearchMemory] Error loading relationships:', relationshipsError);
    }

    // Build memory maps
    const entities = new Map<string, EntityMemory>();
    const relationships = new Map<string, RelationshipMemory>();

    if (entitiesData) {
      for (const row of entitiesData) {
        entities.set(row.entity_id, {
          id: row.entity_id,
          name: row.name,
          type: row.type,
          mentions: row.mentions || 1,
          lastSeen: row.last_seen,
          contexts: row.contexts || [],
          relevanceScore: row.relevance_score || 0.5,
        });
      }
    }

    if (relationshipsData) {
      for (const row of relationshipsData) {
        const key = `${row.source_id}-${row.target_id}`;
        relationships.set(key, {
          source: row.source_id,
          target: row.target_id,
          type: row.type,
          strength: row.strength || 0.5,
          occurrences: row.occurrences || 1,
          lastSeen: row.last_seen,
          confidence: row.confidence || 0.5,
        });
      }
    }

    const memory: SearchMemory = {
      userId,
      entities,
      relationships,
      lastUpdated: new Date().toISOString(),
    };

    // Cache in memory
    memoryCache.set(userId, memory);

    return memory;
  } catch (error: any) {
    console.error('[SearchMemory] Error loading memory:', error.message);
    return null;
  }
}

/**
 * Update search memory with new entities and relationships
 * Persists to database asynchronously
 */
export async function updateSearchMemory(
  userId: string | null,
  entities: Entity[],
  relationships: Relationship[],
  context?: string
): Promise<void> {
  if (!userId || !supabase) {
    return;
  }

  const now = new Date().toISOString();
  const memory = await getSearchMemory(userId);

  if (!memory) {
    // Create new memory
    const newMemory: SearchMemory = {
      userId,
      entities: new Map(),
      relationships: new Map(),
      lastUpdated: now,
    };
    memoryCache.set(userId, newMemory);
  }

  const currentMemory = memoryCache.get(userId)!;

  // Update entities
  for (const entity of entities) {
    const existing = currentMemory.entities.get(entity.id);
    
    if (existing) {
      // Update existing
      existing.mentions++;
      existing.lastSeen = now;
      existing.relevanceScore = (existing.relevanceScore + entity.confidence) / 2; // Running average
      
      // Add context (keep last 5)
      if (context) {
        existing.contexts.push(context);
        if (existing.contexts.length > 5) {
          existing.contexts.shift();
        }
      }
    } else {
      // New entity
      currentMemory.entities.set(entity.id, {
        id: entity.id,
        name: entity.name,
        type: entity.type,
        mentions: 1,
        lastSeen: now,
        contexts: context ? [context] : [],
        relevanceScore: entity.confidence,
      });
    }
  }

  // Update relationships
  for (const rel of relationships) {
    const key = `${rel.source}-${rel.target}`;
    const existing = currentMemory.relationships.get(key);
    
    if (existing) {
      // Update existing
      existing.occurrences++;
      existing.lastSeen = now;
      existing.strength = (existing.strength + rel.strength) / 2; // Running average
      existing.confidence = (existing.confidence + (rel.confidence || rel.strength)) / 2;
    } else {
      // New relationship
      currentMemory.relationships.set(key, {
        source: rel.source,
        target: rel.target,
        type: rel.type,
        strength: rel.strength,
        occurrences: 1,
        lastSeen: now,
        confidence: rel.confidence || rel.strength,
      });
    }
  }

  currentMemory.lastUpdated = now;

  // Persist to database (async, don't wait)
  persistMemoryToDatabase(userId, currentMemory).catch(error => {
    console.error('[SearchMemory] Error persisting memory:', error);
  });
}

/**
 * Persist memory to database
 */
async function persistMemoryToDatabase(
  userId: string,
  memory: SearchMemory
): Promise<void> {
  if (!supabase) {
    return;
  }

  try {
    // Upsert entities
    const entitiesToUpsert = Array.from(memory.entities.values()).map(entity => ({
      user_id: userId,
      entity_id: entity.id,
      name: entity.name,
      type: entity.type,
      mentions: entity.mentions,
      last_seen: entity.lastSeen,
      contexts: entity.contexts,
      relevance_score: entity.relevanceScore,
      updated_at: new Date().toISOString(),
    }));

    if (entitiesToUpsert.length > 0) {
      const { error: entitiesError } = await supabase
        .from('search_memory_entities')
        .upsert(entitiesToUpsert, {
          onConflict: 'user_id,entity_id',
        });

      if (entitiesError) {
        console.error('[SearchMemory] Error upserting entities:', entitiesError);
      }
    }

    // Upsert relationships
    const relationshipsToUpsert = Array.from(memory.relationships.values()).map(rel => ({
      user_id: userId,
      source_id: rel.source,
      target_id: rel.target,
      type: rel.type,
      strength: rel.strength,
      occurrences: rel.occurrences,
      last_seen: rel.lastSeen,
      confidence: rel.confidence,
      updated_at: new Date().toISOString(),
    }));

    if (relationshipsToUpsert.length > 0) {
      const { error: relationshipsError } = await supabase
        .from('search_memory_relationships')
        .upsert(relationshipsToUpsert, {
          onConflict: 'user_id,source_id,target_id',
        });

      if (relationshipsError) {
        console.error('[SearchMemory] Error upserting relationships:', relationshipsError);
      }
    }
  } catch (error: any) {
    console.error('[SearchMemory] Error persisting memory:', error.message);
  }
}

/**
 * Get relevant entities from memory (for context in new searches)
 */
export async function getRelevantEntitiesFromMemory(
  userId: string | null,
  query?: string,
  limit: number = 20
): Promise<EntityMemory[]> {
  const memory = await getSearchMemory(userId);
  
  if (!memory) {
    return [];
  }

  const entities = Array.from(memory.entities.values());

  // Filter by query if provided
  if (query) {
    const queryLower = query.toLowerCase();
    return entities
      .filter(e => 
        e.name.toLowerCase().includes(queryLower) ||
        e.contexts.some(c => c.toLowerCase().includes(queryLower))
      )
      .sort((a, b) => {
        // Sort by relevance and recency
        const scoreA = a.relevanceScore * (1 / (1 + daysSince(a.lastSeen)));
        const scoreB = b.relevanceScore * (1 / (1 + daysSince(b.lastSeen)));
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  // Return most relevant entities
  return entities
    .sort((a, b) => {
      const scoreA = a.relevanceScore * (1 / (1 + daysSince(a.lastSeen)));
      const scoreB = b.relevanceScore * (1 / (1 + daysSince(b.lastSeen)));
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

/**
 * Get relevant relationships from memory
 */
export async function getRelevantRelationshipsFromMemory(
  userId: string | null,
  entityIds?: string[],
  limit: number = 50
): Promise<RelationshipMemory[]> {
  const memory = await getSearchMemory(userId);
  
  if (!memory) {
    return [];
  }

  const relationships = Array.from(memory.relationships.values());

  // Filter by entity IDs if provided
  if (entityIds && entityIds.length > 0) {
    return relationships
      .filter(r => 
        entityIds.includes(r.source) || entityIds.includes(r.target)
      )
      .sort((a, b) => {
        // Sort by strength and recency
        const scoreA = a.strength * (1 / (1 + daysSince(a.lastSeen)));
        const scoreB = b.strength * (1 / (1 + daysSince(b.lastSeen)));
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  // Return most relevant relationships
  return relationships
    .sort((a, b) => {
      const scoreA = a.strength * (1 / (1 + daysSince(a.lastSeen)));
      const scoreB = b.strength * (1 / (1 + daysSince(b.lastSeen)));
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

/**
 * Helper: Calculate days since timestamp
 */
function daysSince(timestamp: string): number {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  return (now - then) / (1000 * 60 * 60 * 24);
}
