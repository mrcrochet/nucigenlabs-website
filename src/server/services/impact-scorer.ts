/**
 * Impact Scorer - Pre-Firecrawl Filtering
 * 
 * Uses cheap OpenAI model (gpt-4o-mini) to score impact BEFORE expensive Firecrawl calls
 * Only results with impactScore > 0.7 get Firecrawl enrichment
 * 
 * Strategy:
 * - Simple prompt: let model reason qualitatively
 * - Normalize and weight factors in code (not in prompt)
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
  throw new Error('OPENAI_API_KEY is required for impact scoring');
}

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

export interface ImpactScoreFactors {
  eventType: 'critical' | 'high' | 'medium' | 'low';
  rarity: number; // 0-1 (how unique/rare this event is)
  entityCount: number; // raw count of entities
  sectorImpact: number; // 0-1 (how many sectors affected)
  temporalNovelty: number; // 0-1 (how recent/new)
}

export interface ImpactScore {
  score: number; // 0-1 (final weighted score)
  factors: ImpactScoreFactors;
  reasoning: string; // Model's qualitative reasoning
}

/**
 * Calculate impact score for a search result
 * 
 * Strategy:
 * 1. Simple prompt - let model reason qualitatively
 * 2. Extract factors from model response
 * 3. Normalize and weight factors in code
 */
export async function calculateImpactScore(
  title: string,
  summary: string,
  content?: string,
  entities?: Array<{ type: string; name: string }>
): Promise<ImpactScore> {
  // Limit content length to avoid token limits
  const maxContentLength = 2000;
  const truncatedContent = content 
    ? (content.length > maxContentLength ? content.substring(0, maxContentLength) + '...' : content)
    : '';

  // Simple prompt - let model reason, don't over-constrain
  const prompt = `Analyze the potential impact of this event:

Title: ${title}
Summary: ${summary}
${truncatedContent ? `Content: ${truncatedContent}` : ''}
${entities && entities.length > 0 ? `Entities mentioned: ${entities.map(e => e.name).join(', ')}` : ''}

Provide your analysis as a JSON object with:
- eventType: "critical" | "high" | "medium" | "low" (your assessment of event severity)
- rarity: 0-1 (how unique/rare is this event? 1 = very rare, 0 = common)
- entityCount: number (how many distinct entities are involved)
- sectorImpact: 0-1 (how many sectors could be affected? 1 = many sectors, 0 = single sector)
- temporalNovelty: 0-1 (how new/recent is this? 1 = breaking news, 0 = old news)
- reasoning: brief explanation of your assessment

Return ONLY the JSON object, no markdown, no code blocks.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert geopolitical and economic impact analyst. Analyze events and provide structured assessments.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      // Fallback to default score
      return getDefaultImpactScore(title, summary, entities);
    }

    const modelResponse = JSON.parse(responseText);
    
    // Extract factors from model response
    const factors: ImpactScoreFactors = {
      eventType: modelResponse.eventType || 'medium',
      rarity: normalizeFactor(modelResponse.rarity, 0, 1),
      entityCount: typeof modelResponse.entityCount === 'number' ? modelResponse.entityCount : (entities?.length || 0),
      sectorImpact: normalizeFactor(modelResponse.sectorImpact, 0, 1),
      temporalNovelty: normalizeFactor(modelResponse.temporalNovelty, 0, 1),
    };

    // Normalize entity count (0-1 scale, assuming max 20 entities is significant)
    const entityCountNorm = Math.min(1, factors.entityCount / 20);

    // Normalize event type to 0-1 scale
    const eventTypeScore = {
      critical: 1.0,
      high: 0.75,
      medium: 0.5,
      low: 0.25,
    }[factors.eventType] || 0.5;

    // Final weighted score - PONDÉRATION EN CODE (pas dans le prompt)
    const finalScore = 
      0.4 * factors.rarity +
      0.3 * factors.sectorImpact +
      0.2 * factors.temporalNovelty +
      0.1 * entityCountNorm;

    // Boost if critical event type
    const boostedScore = finalScore * 0.7 + eventTypeScore * 0.3;

    return {
      score: Math.min(1, Math.max(0, boostedScore)),
      factors,
      reasoning: modelResponse.reasoning || 'No reasoning provided',
    };
  } catch (error: any) {
    console.error('[ImpactScorer] Error calculating impact score:', error.message);
    // Fallback to default score
    return getDefaultImpactScore(title, summary, entities);
  }
}

/**
 * Normalize a factor value to 0-1 range
 */
function normalizeFactor(value: number, min: number, max: number): number {
  if (typeof value !== 'number' || isNaN(value)) {
    return 0.5; // Default middle value
  }
  if (value < min) return 0;
  if (value > max) return 1;
  return (value - min) / (max - min);
}

/**
 * Default impact score when model fails
 */
function getDefaultImpactScore(
  title: string,
  summary: string,
  entities?: Array<{ type: string; name: string }>
): ImpactScore {
  // Simple heuristics for fallback
  const entityCount = entities?.length || 0;
  const hasCriticalKeywords = /sanction|conflict|war|crisis|disruption|embargo/i.test(title + summary);
  
  return {
    score: hasCriticalKeywords ? 0.7 : 0.5,
    factors: {
      eventType: hasCriticalKeywords ? 'high' : 'medium',
      rarity: 0.5,
      entityCount,
      sectorImpact: entityCount > 3 ? 0.7 : 0.4,
      temporalNovelty: 0.6,
    },
    reasoning: 'Fallback scoring based on simple heuristics',
  };
}
