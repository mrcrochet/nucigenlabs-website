/**
 * PHASE 8: Prompt Loader
 * 
 * Charge les prompts versionnés depuis la base de données
 * au lieu de les hardcoder dans les services
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type ComponentType = 
  | 'event_extraction' 
  | 'causal_chain' 
  | 'scenario' 
  | 'recommendation' 
  | 'relationship' 
  | 'historical_comparison';

export interface PromptVersion {
  id: string;
  version_number: number;
  prompt_template: string;
  system_message: string | null;
  model_config: {
    model: string;
    temperature: number;
    response_format?: { type: string };
    max_tokens?: number;
  };
}

/**
 * Charge le prompt actif pour un composant donné
 */
export async function loadActivePrompt(
  componentType: ComponentType
): Promise<PromptVersion | null> {
  try {
    const { data, error } = await supabase
      .from('prompt_versions')
      .select('id, version_number, prompt_template, system_message, model_config')
      .eq('component_type', componentType)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error(`Error loading prompt for ${componentType}:`, error);
      return null;
    }

    if (!data) {
      console.warn(`No active prompt found for ${componentType}, using fallback`);
      return null;
    }

    // Parse model_config if it's a string
    let modelConfig = data.model_config;
    if (typeof modelConfig === 'string') {
      modelConfig = JSON.parse(modelConfig);
    }

    return {
      id: data.id,
      version_number: data.version_number,
      prompt_template: data.prompt_template,
      system_message: data.system_message,
      model_config: modelConfig as PromptVersion['model_config'],
    };
  } catch (error) {
    console.error(`Error in loadActivePrompt for ${componentType}:`, error);
    return null;
  }
}

/**
 * Remplit les placeholders dans un template de prompt
 */
export function fillPromptTemplate(
  template: string,
  placeholders: Record<string, string | number | null>
): string {
  let filled = template;
  
  for (const [key, value] of Object.entries(placeholders)) {
    const placeholder = `{${key}}`;
    const replacement = value === null ? 'null' : String(value);
    filled = filled.replace(new RegExp(placeholder, 'g'), replacement);
  }
  
  return filled;
}

/**
 * Obtient le message système par défaut si aucun n'est défini
 */
export function getDefaultSystemMessage(componentType: ComponentType): string {
  const defaults: Record<ComponentType, string> = {
    event_extraction: 'You are a precise data extraction system. Return ONLY valid JSON, no other text.',
    causal_chain: 'You are a precise causal analysis system. Return ONLY valid JSON, no other text. Be deterministic and factual.',
    scenario: 'You are a strategic scenario planning system. Return ONLY valid JSON, no other text.',
    recommendation: 'You are a strategic recommendation engine. Return ONLY valid JSON, no other text.',
    relationship: 'You are a relationship analysis system. Return ONLY valid JSON, no other text.',
    historical_comparison: 'You are a historical analysis system. Return ONLY valid JSON, no other text.',
  };
  
  return defaults[componentType] || 'You are a precise analysis system. Return ONLY valid JSON, no other text.';
}

