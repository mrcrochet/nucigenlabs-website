/**
 * PHASE 1: Event Extraction MVP
 * 
 * Service qui transforme un article brut (events table) en événement structuré (nucigen_events)
 * Utilise OpenAI pour extraire et structurer les informations
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Schema strict pour la réponse JSON
interface NucigenEvent {
  event_type: 'Geopolitical' | 'Industrial' | 'SupplyChain' | 'Regulatory' | 'Security' | 'Market';
  event_subtype: string | null;
  summary: string;
  country: string | null;
  region: string | null;
  sector: string | null;
  actors: string[];
  why_it_matters: string;
  first_order_effect: string | null;
  second_order_effect: string | null;
  impact_score: number;
  confidence: number;
}

// Prompt strict pour OpenAI
const EXTRACTION_PROMPT = `You are a geopolitical and economic intelligence analyst. Your task is to extract structured information from a news article.

CRITICAL RULES:
1. Return ONLY valid JSON, no markdown, no code blocks, no explanations
2. All scores must be floats between 0 and 1
3. Use null (not "null" string) for unknown information
4. Be factual: no opinions, no "could", no marketing language
5. Summary must be max 2 sentences, factual only
6. why_it_matters must link event to economic/strategic impact (1-2 sentences)
7. actors must be an array (can be empty [])
8. If information is unknown, use null

JSON Schema (return ONLY this structure):
{
  "event_type": "Geopolitical | Industrial | SupplyChain | Regulatory | Security | Market",
  "event_subtype": "string|null",
  "summary": "max 2 sentences, factual, no hype",
  "country": "string|null",
  "region": "string|null",
  "sector": "string|null",
  "actors": ["string"],
  "why_it_matters": "1-2 sentences linking event to economic/strategic impact",
  "first_order_effect": "string|null",
  "second_order_effect": "string|null",
  "impact_score": 0.0,
  "confidence": 0.0
}

Article to analyze:
Title: {title}
Description: {description}
Content: {content}
URL: {url}
Published: {published_at}

Return ONLY the JSON object, nothing else.`;

/**
 * Extrait un événement structuré depuis un article brut
 */
export async function extractNucigenEvent(eventId: string): Promise<NucigenEvent | null> {
  try {
    // Récupérer l'article depuis events
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('id, title, description, content, url, published_at')
      .eq('id', eventId)
      .maybeSingle();

    if (fetchError || !event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    // Préparer le prompt
    const prompt = EXTRACTION_PROMPT
      .replace('{title}', event.title || '')
      .replace('{description}', event.description || '')
      .replace('{content}', event.content || event.description || '')
      .replace('{url}', event.url || '')
      .replace('{published_at}', event.published_at || '');

    // Appeler OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // ou 'gpt-4' pour meilleure qualité
      messages: [
        {
          role: 'system',
          content: 'You are a precise data extraction system. Return ONLY valid JSON, no other text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1, // Low temperature pour plus de cohérence
      response_format: { type: 'json_object' }, // Force JSON mode
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('Empty response from OpenAI');
    }

    // Parser le JSON
    let extracted: NucigenEvent;
    try {
      // Nettoyer la réponse (enlever markdown si présent)
      const cleaned = responseText.trim().replace(/^```json\n?/i, '').replace(/```\n?$/i, '').trim();
      extracted = JSON.parse(cleaned);
    } catch (parseError) {
      throw new Error(`Failed to parse JSON: ${parseError}. Response: ${responseText.substring(0, 200)}`);
    }

    // Valider le schéma
    validateNucigenEvent(extracted);

    // Insérer dans nucigen_events
    const { data: inserted, error: insertError } = await supabase
      .from('nucigen_events')
      .insert({
        source_event_id: eventId,
        event_type: extracted.event_type,
        event_subtype: extracted.event_subtype,
        summary: extracted.summary,
        country: extracted.country,
        region: extracted.region,
        sector: extracted.sector,
        actors: extracted.actors || [],
        why_it_matters: extracted.why_it_matters,
        first_order_effect: extracted.first_order_effect,
        second_order_effect: extracted.second_order_effect,
        impact_score: extracted.impact_score,
        confidence: extracted.confidence,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to insert: ${insertError.message}`);
    }

    // Marquer l'event source comme processed
    await supabase
      .from('events')
      .update({ status: 'processed' })
      .eq('id', eventId);

    return extracted;
  } catch (error) {
    // Marquer l'event comme erreur
    await supabase
      .from('events')
      .update({
        status: 'error',
        processing_error: error instanceof Error ? error.message : String(error),
      })
      .eq('id', eventId);

    throw error;
  }
}

/**
 * Valide qu'un objet correspond au schéma NucigenEvent
 */
function validateNucigenEvent(event: any): asserts event is NucigenEvent {
  const validTypes = ['Geopolitical', 'Industrial', 'SupplyChain', 'Regulatory', 'Security', 'Market'];

  if (!validTypes.includes(event.event_type)) {
    throw new Error(`Invalid event_type: ${event.event_type}`);
  }

  if (!event.summary || typeof event.summary !== 'string') {
    throw new Error('summary is required and must be a string');
  }

  if (!Array.isArray(event.actors)) {
    throw new Error('actors must be an array');
  }

  if (typeof event.impact_score !== 'number' || event.impact_score < 0 || event.impact_score > 1) {
    throw new Error(`impact_score must be a number between 0 and 1, got: ${event.impact_score}`);
  }

  if (typeof event.confidence !== 'number' || event.confidence < 0 || event.confidence > 1) {
    throw new Error(`confidence must be a number between 0 and 1, got: ${event.confidence}`);
  }

  if (!event.why_it_matters || typeof event.why_it_matters !== 'string') {
    throw new Error('why_it_matters is required and must be a string');
  }
}

/**
 * Traite plusieurs événements en batch
 */
export async function extractBatch(eventIds: string[]): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const eventId of eventIds) {
    try {
      await extractNucigenEvent(eventId);
      success++;
    } catch (error) {
      failed++;
      errors.push(`${eventId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { success, failed, errors };
}

