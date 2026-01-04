/**
 * PHASE 8: Model Improver
 * 
 * Service qui analyse les feedbacks utilisateurs et améliore automatiquement
 * les prompts LLM pour améliorer la qualité des extractions/prédictions
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
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

export type ComponentType = 
  | 'event_extraction' 
  | 'causal_chain' 
  | 'scenario' 
  | 'recommendation' 
  | 'relationship' 
  | 'historical_comparison';

interface Feedback {
  id: string;
  event_id: string | null;
  component_type: ComponentType;
  feedback_type: 'correction' | 'improvement' | 'validation' | 'rejection';
  original_content: any;
  corrected_content: any;
  reasoning: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical' | null;
}

interface PromptVersion {
  id: string;
  component_type: ComponentType;
  version_number: number;
  prompt_template: string;
  system_message: string | null;
  model_config: any;
}

/**
 * Analyse les feedbacks en attente et génère des insights
 */
export async function analyzePendingFeedback(
  componentType: ComponentType,
  limit: number = 20
): Promise<{
  total: number;
  corrections: number;
  improvements: number;
  validations: number;
  rejections: number;
  commonIssues: string[];
  severityBreakdown: Record<string, number>;
}> {
  try {
    const { data: feedbacks, error } = await supabase
      .from('model_feedback')
      .select('*')
      .eq('component_type', componentType)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch feedback: ${error.message}`);
    }

    if (!feedbacks || feedbacks.length === 0) {
      return {
        total: 0,
        corrections: 0,
        improvements: 0,
        validations: 0,
        rejections: 0,
        commonIssues: [],
        severityBreakdown: {},
      };
    }

    // Analyser les patterns
    const corrections = feedbacks.filter(f => f.feedback_type === 'correction').length;
    const improvements = feedbacks.filter(f => f.feedback_type === 'improvement').length;
    const validations = feedbacks.filter(f => f.feedback_type === 'validation').length;
    const rejections = feedbacks.filter(f => f.feedback_type === 'rejection').length;

    // Extraire les problèmes communs depuis les reasonings
    const reasonings = feedbacks
      .map(f => f.reasoning)
      .filter((r): r is string => r !== null && r.length > 0);

    // Utiliser LLM pour identifier les patterns communs
    const commonIssues = await extractCommonIssues(reasonings, componentType);

    // Breakdown par sévérité
    const severityBreakdown: Record<string, number> = {};
    feedbacks.forEach(f => {
      const severity = f.severity || 'unknown';
      severityBreakdown[severity] = (severityBreakdown[severity] || 0) + 1;
    });

    return {
      total: feedbacks.length,
      corrections,
      improvements,
      validations,
      rejections,
      commonIssues,
      severityBreakdown,
    };
  } catch (error) {
    console.error('Error analyzing feedback:', error);
    throw error;
  }
}

/**
 * Extrait les problèmes communs depuis les reasonings
 */
async function extractCommonIssues(
  reasonings: string[],
  componentType: ComponentType
): Promise<string[]> {
  if (reasonings.length === 0) {
    return [];
  }

  try {
    const prompt = `Analyze the following user feedback reasonings and identify the 3-5 most common issues or patterns.

Component Type: ${componentType}

Feedback Reasonings:
${reasonings.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Return a JSON array of the most common issues, each as a short phrase (max 10 words).
Example: ["Missing context in summary", "Incorrect event type classification", "Overly confident scores"]

Return ONLY the JSON array, nothing else.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a feedback analysis system. Return ONLY a JSON array of common issues.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(responseText);
    return parsed.issues || parsed.common_issues || [];
  } catch (error) {
    console.error('Error extracting common issues:', error);
    return [];
  }
}

/**
 * Génère une version améliorée d'un prompt basée sur les feedbacks
 */
export async function generateImprovedPrompt(
  componentType: ComponentType,
  feedbackIds: string[]
): Promise<{
  newPrompt: string;
  newSystemMessage: string;
  improvements: string[];
  versionNumber: number;
} | null> {
  try {
    // Récupérer le prompt actuel
    const { data: currentPrompt, error: promptError } = await supabase
      .from('prompt_versions')
      .select('*')
      .eq('component_type', componentType)
      .eq('is_active', true)
      .maybeSingle();

    if (promptError || !currentPrompt) {
      throw new Error(`No active prompt found for ${componentType}`);
    }

    // Récupérer les feedbacks
    const { data: feedbacks, error: feedbackError } = await supabase
      .from('model_feedback')
      .select('*')
      .in('id', feedbackIds);

    if (feedbackError || !feedbacks || feedbacks.length === 0) {
      throw new Error('No feedback found');
    }

    // Préparer le contexte pour l'amélioration
    const feedbackContext = feedbacks.map(f => ({
      type: f.feedback_type,
      reasoning: f.reasoning || 'No reasoning provided',
      original: JSON.stringify(f.original_content, null, 2),
      corrected: f.corrected_content ? JSON.stringify(f.corrected_content, null, 2) : null,
      severity: f.severity,
    }));

    // Générer le prompt amélioré avec LLM
    const improvementPrompt = `You are a prompt engineering expert. Your task is to improve an existing LLM prompt based on user feedback.

CURRENT PROMPT:
${currentPrompt.prompt_template}

CURRENT SYSTEM MESSAGE:
${currentPrompt.system_message || 'None'}

USER FEEDBACK:
${JSON.stringify(feedbackContext, null, 2)}

TASK:
1. Analyze the feedback to identify what the current prompt is missing or doing wrong
2. Generate an improved version of the prompt that addresses these issues
3. Generate an improved system message if needed
4. List the specific improvements made

Return ONLY a JSON object with this structure:
{
  "improved_prompt": "the improved prompt template (keep placeholders like {title}, {summary}, etc.)",
  "improved_system_message": "the improved system message",
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "reasoning": "brief explanation of why these changes were made"
}

Return ONLY the JSON object, nothing else.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a prompt engineering expert. Return ONLY valid JSON, no other text.',
        },
        {
          role: 'user',
          content: improvementPrompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(responseText);

    // Obtenir le prochain numéro de version
    const { data: versions } = await supabase
      .from('prompt_versions')
      .select('version_number')
      .eq('component_type', componentType)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersion = versions && versions.length > 0 
      ? versions[0].version_number + 1 
      : 2;

    return {
      newPrompt: parsed.improved_prompt || currentPrompt.prompt_template,
      newSystemMessage: parsed.improved_system_message || currentPrompt.system_message || '',
      improvements: parsed.improvements || [],
      versionNumber: nextVersion,
    };
  } catch (error) {
    console.error('Error generating improved prompt:', error);
    return null;
  }
}

/**
 * Crée une nouvelle version de prompt dans la base de données
 */
export async function createPromptVersion(
  componentType: ComponentType,
  promptTemplate: string,
  systemMessage: string,
  modelConfig: any,
  description: string,
  improvementReason: string,
  feedbackIds: string[]
): Promise<string | null> {
  try {
    // Obtenir le prochain numéro de version
    const { data: versions } = await supabase
      .from('prompt_versions')
      .select('version_number')
      .eq('component_type', componentType)
      .order('version_number', { ascending: false })
      .limit(1);

    const versionNumber = versions && versions.length > 0 
      ? versions[0].version_number + 1 
      : 1;

    // Désactiver l'ancienne version active
    await supabase
      .from('prompt_versions')
      .update({ is_active: false })
      .eq('component_type', componentType)
      .eq('is_active', true);

    // Créer la nouvelle version (inactive par défaut, sera activée après tests)
    const { data, error } = await supabase
      .from('prompt_versions')
      .insert({
        component_type: componentType,
        version_number: versionNumber,
        prompt_template: promptTemplate,
        system_message: systemMessage,
        model_config: modelConfig,
        description,
        improvement_reason: improvementReason,
        based_on_feedback_ids: feedbackIds,
        is_active: false, // Inactive jusqu'à validation
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create prompt version: ${error.message}`);
    }

    return data.id;
  } catch (error) {
    console.error('Error creating prompt version:', error);
    return null;
  }
}

/**
 * Active une version de prompt (après validation)
 */
export async function activatePromptVersion(
  promptVersionId: string
): Promise<boolean> {
  try {
    // Récupérer le component_type de cette version
    const { data: version, error: fetchError } = await supabase
      .from('prompt_versions')
      .select('component_type')
      .eq('id', promptVersionId)
      .maybeSingle();

    if (fetchError || !version) {
      throw new Error('Prompt version not found');
    }

    // Désactiver toutes les autres versions de ce composant
    await supabase
      .from('prompt_versions')
      .update({ is_active: false })
      .eq('component_type', version.component_type)
      .eq('is_active', true);

    // Activer cette version
    const { error: updateError } = await supabase
      .from('prompt_versions')
      .update({ is_active: true })
      .eq('id', promptVersionId);

    if (updateError) {
      throw new Error(`Failed to activate prompt: ${updateError.message}`);
    }

    return true;
  } catch (error) {
    console.error('Error activating prompt version:', error);
    return false;
  }
}

/**
 * Marque les feedbacks comme traités
 */
export async function markFeedbackAsProcessed(
  feedbackIds: string[],
  promptVersionId: string | null = null
): Promise<boolean> {
  try {
    const updates: any = {
      status: 'processed',
      processed_at: new Date().toISOString(),
    };

    if (promptVersionId) {
      updates.status = 'applied';
    }

    const { error } = await supabase
      .from('model_feedback')
      .update(updates)
      .in('id', feedbackIds);

    if (error) {
      throw new Error(`Failed to mark feedback as processed: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Error marking feedback as processed:', error);
    return false;
  }
}

/**
 * Processus complet d'amélioration automatique
 */
export async function processAutoLearning(
  componentType: ComponentType,
  minFeedbackCount: number = 5
): Promise<{
  analyzed: number;
  improved: boolean;
  newVersionId: string | null;
  improvements: string[];
}> {
  try {
    console.log(`\n🧠 Processing auto-learning for ${componentType}...`);

    // 1. Analyser les feedbacks en attente
    const analysis = await analyzePendingFeedback(componentType, 50);
    
    if (analysis.total < minFeedbackCount) {
      console.log(`  ⚠️  Not enough feedback (${analysis.total} < ${minFeedbackCount}), skipping`);
      return {
        analyzed: analysis.total,
        improved: false,
        newVersionId: null,
        improvements: [],
      };
    }

    console.log(`  📊 Analyzed ${analysis.total} feedbacks:`);
    console.log(`     - Corrections: ${analysis.corrections}`);
    console.log(`     - Improvements: ${analysis.improvements}`);
    console.log(`     - Rejections: ${analysis.rejections}`);
    console.log(`     - Common issues: ${analysis.commonIssues.join(', ')}`);

    // 2. Récupérer les feedbacks les plus critiques
    const { data: criticalFeedbacks } = await supabase
      .from('model_feedback')
      .select('id')
      .eq('component_type', componentType)
      .eq('status', 'pending')
      .in('severity', ['critical', 'high'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (!criticalFeedbacks || criticalFeedbacks.length === 0) {
      console.log(`  ⚠️  No critical feedbacks found, skipping`);
      return {
        analyzed: analysis.total,
        improved: false,
        newVersionId: null,
        improvements: [],
      };
    }

    const feedbackIds = criticalFeedbacks.map(f => f.id);

    // 3. Générer un prompt amélioré
    const improved = await generateImprovedPrompt(componentType, feedbackIds);

    if (!improved) {
      console.log(`  ❌ Failed to generate improved prompt`);
      return {
        analyzed: analysis.total,
        improved: false,
        newVersionId: null,
        improvements: [],
      };
    }

    console.log(`  ✅ Generated improved prompt (v${improved.versionNumber})`);
    console.log(`     Improvements: ${improved.improvements.join(', ')}`);

    // 4. Créer la nouvelle version (inactive)
    const currentConfig = {
      model: 'gpt-4o-mini',
      temperature: 0.1,
      response_format: { type: 'json_object' },
    };

    const newVersionId = await createPromptVersion(
      componentType,
      improved.newPrompt,
      improved.newSystemMessage,
      currentConfig,
      `Version ${improved.versionNumber} - Auto-improved based on user feedback`,
      `Based on ${feedbackIds.length} critical feedbacks. Improvements: ${improved.improvements.join('; ')}`,
      feedbackIds
    );

    if (!newVersionId) {
      console.log(`  ❌ Failed to create prompt version`);
      return {
        analyzed: analysis.total,
        improved: false,
        newVersionId: null,
        improvements: [],
      };
    }

    // 5. Marquer les feedbacks comme traités
    await markFeedbackAsProcessed(feedbackIds, newVersionId);

    console.log(`  ✅ Created prompt version ${newVersionId} (inactive, requires validation)`);

    return {
      analyzed: analysis.total,
      improved: true,
      newVersionId,
      improvements: improved.improvements,
    };
  } catch (error) {
    console.error(`  ❌ Error in processAutoLearning:`, error);
    return {
      analyzed: 0,
      improved: false,
      newVersionId: null,
      improvements: [],
    };
  }
}

