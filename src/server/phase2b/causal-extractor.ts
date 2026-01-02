/**
 * PHASE 2B: Causal Chain Extraction
 * 
 * Service qui génère une chaîne causale structurée pour un nucigen_event
 * Utilise OpenAI pour extraire la causalité de manière déterministe
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
interface CausalChain {
  cause: string;
  first_order_effect: string;
  second_order_effect: string | null;
  affected_sectors: string[];
  affected_regions: string[];
  time_horizon: 'hours' | 'days' | 'weeks';
  confidence: number;
}

// Prompt strict pour OpenAI
const CAUSALITY_PROMPT = `You are a geopolitical and economic intelligence analyst. Your task is to extract a deterministic causal chain from a structured event.

CRITICAL RULES:
1. Return ONLY valid JSON, no markdown, no code blocks, no explanations
2. Be FACTUAL and DETERMINISTIC - no "could", "might", "possibly", "may"
3. Use present or future tense for effects (they WILL happen, not might)
4. If information is uncertain → use null
5. confidence must be a float between 0 and 1
6. affected_sectors and affected_regions must be arrays (can be empty [])
7. time_horizon must be exactly one of: "hours", "days", "weeks"
8. NO financial predictions, NO price forecasts, NO numerical estimates
9. Focus on structural, operational, and strategic impacts

JSON Schema (return ONLY this structure):
{
  "cause": "string (the event trigger, factual description)",
  "first_order_effect": "string (direct, immediate consequence)",
  "second_order_effect": "string|null (indirect consequence, or null if uncertain)",
  "affected_sectors": ["string"],
  "affected_regions": ["string"],
  "time_horizon": "hours|days|weeks",
  "confidence": 0.0
}

Event to analyze:
Event Type: {event_type}
Summary: {summary}
Country: {country}
Region: {region}
Sector: {sector}
Actors: {actors}
Why it matters: {why_it_matters}
First order effect: {first_order_effect}
Second order effect: {second_order_effect}

Return ONLY the JSON object, nothing else.`;

/**
 * Extrait une chaîne causale depuis un nucigen_event
 */
export async function extractCausalChain(nucigenEventId: string): Promise<CausalChain | null> {
  try {
    // Récupérer l'événement structuré
    const { data: event, error: fetchError } = await supabase
      .from('nucigen_events')
      .select('*')
      .eq('id', nucigenEventId)
      .maybeSingle();

    if (fetchError || !event) {
      throw new Error(`Nucigen event not found: ${nucigenEventId}`);
    }

    // Vérifier si une chaîne causale existe déjà
    const { data: existing } = await supabase
      .from('nucigen_causal_chains')
      .select('id')
      .eq('nucigen_event_id', nucigenEventId)
      .maybeSingle();

    if (existing) {
      console.log(`Causal chain already exists for event ${nucigenEventId}`);
      return null;
    }

    // Préparer le prompt
    const prompt = CAUSALITY_PROMPT
      .replace('{event_type}', event.event_type || '')
      .replace('{summary}', event.summary || '')
      .replace('{country}', event.country || 'null')
      .replace('{region}', event.region || 'null')
      .replace('{sector}', event.sector || 'null')
      .replace('{actors}', Array.isArray(event.actors) ? event.actors.join(', ') : '')
      .replace('{why_it_matters}', event.why_it_matters || '')
      .replace('{first_order_effect}', event.first_order_effect || 'null')
      .replace('{second_order_effect}', event.second_order_effect || 'null');

    // Appeler OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a precise causal analysis system. Return ONLY valid JSON, no other text. Be deterministic and factual.',
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
    let extracted: CausalChain;
    try {
      // Nettoyer la réponse (enlever markdown si présent)
      const cleaned = responseText.trim().replace(/^```json\n?/i, '').replace(/```\n?$/i, '').trim();
      extracted = JSON.parse(cleaned);
    } catch (parseError) {
      throw new Error(`Failed to parse JSON: ${parseError}. Response: ${responseText.substring(0, 200)}`);
    }

    // Valider le schéma
    validateCausalChain(extracted);

    // Insérer dans nucigen_causal_chains
    const { data: inserted, error: insertError } = await supabase
      .from('nucigen_causal_chains')
      .insert({
        nucigen_event_id: nucigenEventId,
        cause: extracted.cause,
        first_order_effect: extracted.first_order_effect,
        second_order_effect: extracted.second_order_effect,
        affected_sectors: extracted.affected_sectors || [],
        affected_regions: extracted.affected_regions || [],
        time_horizon: extracted.time_horizon,
        confidence: extracted.confidence,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to insert: ${insertError.message}`);
    }

    if (!inserted) {
      throw new Error('Failed to insert causal chain: no data returned');
    }

    return extracted;
  } catch (error) {
    console.error(`Error extracting causal chain for event ${nucigenEventId}:`, error);
    throw error;
  }
}

/**
 * Valide qu'un objet correspond au schéma CausalChain
 */
function validateCausalChain(chain: any): asserts chain is CausalChain {
  const validTimeHorizons = ['hours', 'days', 'weeks'];

  if (!chain.cause || typeof chain.cause !== 'string' || chain.cause.length === 0) {
    throw new Error('cause is required and must be a non-empty string');
  }

  if (!chain.first_order_effect || typeof chain.first_order_effect !== 'string' || chain.first_order_effect.length === 0) {
    throw new Error('first_order_effect is required and must be a non-empty string');
  }

  if (chain.second_order_effect !== null && typeof chain.second_order_effect !== 'string') {
    throw new Error('second_order_effect must be null or a string');
  }

  if (!Array.isArray(chain.affected_sectors)) {
    throw new Error('affected_sectors must be an array');
  }

  if (!Array.isArray(chain.affected_regions)) {
    throw new Error('affected_regions must be an array');
  }

  if (!validTimeHorizons.includes(chain.time_horizon)) {
    throw new Error(`time_horizon must be one of: ${validTimeHorizons.join(', ')}, got: ${chain.time_horizon}`);
  }

  if (typeof chain.confidence !== 'number' || chain.confidence < 0 || chain.confidence > 1) {
    throw new Error(`confidence must be a number between 0 and 1, got: ${chain.confidence}`);
  }

  // Vérifier qu'il n'y a pas de champs inventés
  const allowedFields = [
    'cause',
    'first_order_effect',
    'second_order_effect',
    'affected_sectors',
    'affected_regions',
    'time_horizon',
    'confidence',
  ];
  const extraFields = Object.keys(chain).filter((key) => !allowedFields.includes(key));
  if (extraFields.length > 0) {
    throw new Error(`Unexpected fields: ${extraFields.join(', ')}`);
  }

  // Vérifier qu'il n'y a pas de mots interdits (could, might, possibly, may)
  const forbiddenWords = ['could', 'might', 'possibly', 'may'];
  const textToCheck = `${chain.cause} ${chain.first_order_effect} ${chain.second_order_effect || ''}`.toLowerCase();
  for (const word of forbiddenWords) {
    if (textToCheck.includes(word)) {
      throw new Error(`Forbidden word "${word}" found in causal chain. Be deterministic.`);
    }
  }
}

/**
 * Traite plusieurs événements en batch
 */
export async function extractBatchCausalChains(eventIds: string[]): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const eventId of eventIds) {
    try {
      await extractCausalChain(eventId);
      success++;
    } catch (error) {
      failed++;
      errors.push(`${eventId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { success, failed, errors };
}

