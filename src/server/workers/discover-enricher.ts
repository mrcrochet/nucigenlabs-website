/**
 * Discover Enricher Worker (Batch Job)
 * 
 * Enrichit les events avec OpenAI (batch, pas dans le flow utilisateur)
 * 
 * Strategy:
 * - Sélectionne events avec discover_score élevé et discover_why_it_matters NULL
 * - Génère "Why it matters" avec OpenAI (gpt-4o-mini pour économiser)
 * - Met à jour events.discover_why_it_matters et events.discover_enriched_at
 * - Ne s'exécute PAS dans le flow utilisateur (batch uniquement)
 * 
 * Tiers:
 * - Tier 1 (critical, score > 90): enrichir immédiatement
 * - Tier 2 (strategic, score 70-90): enrichir par batch
 * - Tier 3 (background, score < 70): jamais auto-enrichi
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config({ path: join(__dirname, '../../../../.env') });
dotenv.config();

// Initialize Supabase client (service_role for workers)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize OpenAI client
const openaiApiKey = process.env.OPENAI_API_KEY;
let openaiClient: OpenAI | null = null;

if (openaiApiKey) {
  openaiClient = new OpenAI({ apiKey: openaiApiKey });
  console.log('[Discover Enricher] OpenAI client initialized');
} else {
  console.warn('[Discover Enricher] OPENAI_API_KEY not configured - enrichment will be skipped');
}

interface EventToEnrich {
  id: string;
  title: string;
  description: string;
  discover_category: string;
  discover_score: number;
  discover_tier: string;
  discover_sources: Array<{ name: string; url: string }>;
}

/**
 * Generate "Why it matters" statement with OpenAI
 */
async function generateWhyItMatters(event: EventToEnrich): Promise<string> {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized');
  }

  const sources = event.discover_sources.slice(0, 5).map(s => s.name).join(', ');
  
  const response = await openaiClient.chat.completions.create({
    model: 'gpt-4o-mini', // Cost-effective model
    messages: [
      {
        role: 'system',
        content: 'Generate a single-line "Why it matters" statement (max 100 chars) for decision-makers. Be concise, focus on impact, not description. Return only the statement, no quotes, no formatting.',
      },
      {
        role: 'user',
        content: `Title: ${event.title}\nSummary: ${event.description?.substring(0, 300) || ''}\nCategory: ${event.discover_category}\nSources: ${sources}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 100,
  });
  
  const content = response.choices[0]?.message?.content?.trim() || '';
  
  // Ensure it's max 100 chars
  if (content.length > 100) {
    return content.substring(0, 97) + '...';
  }
  
  return content;
}

/**
 * Enrich a batch of events with Perplexity
 * 
 * @param limit Maximum number of events to enrich
 * @param tierFilter Optional tier filter ('critical', 'strategic', or null for all)
 */
export async function enrichDiscoverItemsBatch(
  limit: number = 10,
  tierFilter?: 'critical' | 'strategic'
): Promise<{ enriched: number; errors: number }> {
  console.log(`[Discover Enricher] Starting batch enrichment (limit: ${limit}, tier: ${tierFilter || 'all'})`);
  
  try {
    // Build query: select events with high score, not yet enriched
    let query = supabase
      .from('events')
      .select('id, title, description, discover_category, discover_score, discover_tier, discover_sources')
      .is('discover_why_it_matters', null)
      .not('discover_score', 'is', null)
      .gte('discover_score', tierFilter === 'critical' ? 90 : 70) // Only enrich high-scoring items
      .order('discover_score', { ascending: false })
      .limit(limit);
    
    // Apply tier filter if specified
    if (tierFilter) {
      query = query.eq('discover_tier', tierFilter);
    }
    
    const { data: events, error: queryError } = await query;
    
    if (queryError) {
      console.error('[Discover Enricher] Query error:', queryError);
      return { enriched: 0, errors: 1 };
    }
    
    if (!events || events.length === 0) {
      console.log('[Discover Enricher] No events to enrich');
      return { enriched: 0, errors: 0 };
    }
    
    console.log(`[Discover Enricher] Found ${events.length} events to enrich`);
    
    // Enrich events (sequential to avoid rate limits, but could be parallelized with rate limiting)
    let enriched = 0;
    let errors = 0;
    
    for (const event of events) {
      try {
        const whyItMatters = await generateWhyItMatters(event as EventToEnrich);
        
        if (!whyItMatters) {
          console.warn(`[Discover Enricher] Empty response for event ${event.id}`);
          errors++;
          continue;
        }
        
        // Update event with enrichment
        const { error: updateError } = await supabase
          .from('events')
          .update({
            discover_why_it_matters: whyItMatters,
            discover_enriched_at: new Date().toISOString(),
          } as any)
          .eq('id', event.id);
        
        if (updateError) {
          console.error(`[Discover Enricher] Update error for event ${event.id}:`, updateError.message);
          errors++;
        } else {
          enriched++;
          console.log(`[Discover Enricher] Enriched event: ${event.title.substring(0, 50)}...`);
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`[Discover Enricher] Error enriching event ${event.id}:`, error.message);
        errors++;
      }
    }
    
    console.log(`[Discover Enricher] Batch enrichment complete: ${enriched} enriched, ${errors} errors`);
    
    return { enriched, errors };
  } catch (error: any) {
    console.error('[Discover Enricher] Fatal error:', error);
    return { enriched: 0, errors: 1 };
  }
}

/**
 * Enrich critical events immediately (Tier 1)
 * Called more frequently for high-priority items
 */
export async function enrichCriticalEvents(): Promise<{ enriched: number; errors: number }> {
  return enrichDiscoverItemsBatch(5, 'critical');
}

/**
 * Enrich strategic events (Tier 2)
 * Called less frequently
 */
export async function enrichStrategicEvents(): Promise<{ enriched: number; errors: number }> {
  return enrichDiscoverItemsBatch(10, 'strategic');
}
