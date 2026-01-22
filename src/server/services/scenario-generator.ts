/**
 * Scenario Generator
 * 
 * Generates 3-9 plausible scenarios with relative probabilities for a given claim/context.
 * Each scenario is backed by web sources (articles, patterns) found via Tavily.
 * 
 * This is the core of the "Scenario Outlook" / "Probabilistic Outlook" feature.
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { searchTavily, TavilySearchOptions } from './tavily-unified-service';
import { withCache, type CacheOptions } from './cache-service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  throw new Error('OPENAI_API_KEY is required for scenario generation');
}

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

export interface Scenario {
  id: string;
  title: string;
  description: string;
  relativeProbability: number; // 0-1, relative to other scenarios (must sum to ~1.0)
  mechanisms: string[]; // Causal mechanisms at play
  invalidationConditions: string[]; // What would invalidate this scenario
  confidence: number; // 0-1, confidence in this scenario
  timeframe?: 'immediate' | 'short' | 'medium' | 'long';
  sources?: Array<{
    title: string;
    url: string;
    relevanceScore: number;
    snippet?: string;
  }>; // Web sources backing this scenario
}

export interface ScenarioOutlook {
  currentState: string; // "What's happening now"
  mechanisms: string[]; // General mechanisms in play
  scenarios: Scenario[]; // 3-9 plausible scenarios
  claimId?: string; // Link to original claim
  generatedAt: string; // ISO timestamp
  crossScenarioInsights?: {
    keyDrivers: string[]; // Key drivers across all scenarios
    commonFactors: string[]; // Factors common to multiple scenarios
    criticalUncertainties: string[]; // Critical uncertainties that affect multiple scenarios
    decisionPoints: string[]; // Key decision points or inflection points
  };
}

/**
 * Generate probabilistic scenario outlook for a claim or context
 */
export async function generateScenarioOutlook(
  claimText: string,
  context?: {
    title?: string;
    source?: string;
    entities?: string[];
    sectors?: string[];
    regions?: string[];
    existingEvidence?: string[];
  }
): Promise<ScenarioOutlook> {
  // Limit text length
  const maxLength = 6000;
  const truncatedText = claimText.length > maxLength 
    ? claimText.substring(0, maxLength) + '...'
    : claimText;

  const contextInfo = context
    ? `\n\nContext:\nTitle: ${context.title || 'N/A'}\nSource: ${context.source || 'N/A'}\n${context.entities && context.entities.length > 0 ? `Entities: ${context.entities.join(', ')}` : ''}\n${context.sectors && context.sectors.length > 0 ? `Sectors: ${context.sectors.join(', ')}` : ''}\n${context.regions && context.regions.length > 0 ? `Regions: ${context.regions.join(', ')}` : ''}`
    : '';

  // Use cache to avoid regenerating same scenarios
  const cacheOptions: CacheOptions = {
    apiType: 'openai',
    endpoint: 'generateScenarios',
    ttlSeconds: 12 * 60 * 60, // 12 hours - scenarios can evolve
  };

  return await withCache(
    cacheOptions,
    { text: truncatedText, context },
    async () => {
      const prompt = `You are an expert intelligence analyst specializing in probabilistic scenario analysis.

Given this claim/context:
${truncatedText}${contextInfo}

Generate a probabilistic scenario outlook with:

1. CURRENT STATE (1-2 sentences): What's happening now? What is the current situation?

2. MECHANISMS (3-5 items): What are the key causal mechanisms, forces, or dynamics at play? Be specific about how things work.

3. SCENARIOS (3-9 plausible scenarios): Generate multiple plausible future scenarios. Each scenario should have:
   - title: Short, descriptive title (max 10 words)
   - description: 2-3 sentences explaining what would happen
   - relativeProbability: A number between 0 and 1. All probabilities should sum to approximately 1.0. Higher probability = more likely given current evidence.
   - mechanisms: 2-4 specific causal mechanisms that would drive this scenario
   - invalidationConditions: 2-3 conditions that, if they occur, would invalidate or significantly reduce the probability of this scenario
   - confidence: 0-1 (how confident are you in this scenario's probability assessment?)
   - timeframe: "immediate" | "short" | "medium" | "long" (when might this scenario unfold?)

IMPORTANT:
- Generate 3-9 scenarios (aim for 5-7 for good coverage)
- Probabilities must be RELATIVE (they sum to ~1.0)
- Scenarios should be MUTUALLY EXCLUSIVE or at least DISTINCT
- Focus on actionable intelligence (scenarios that matter for decision-making)
- Be specific, not vague
- Consider both optimistic and pessimistic outcomes
- Include "status quo" or "continuation" scenarios if relevant

Return ONLY a JSON object with:
{
  "currentState": "...",
  "mechanisms": ["...", "..."],
  "scenarios": [
    {
      "title": "...",
      "description": "...",
      "relativeProbability": 0.35,
      "mechanisms": ["...", "..."],
      "invalidationConditions": ["...", "..."],
      "confidence": 0.7,
      "timeframe": "medium"
    },
    ...
  ]
}`;

      try {
        // Use gpt-4o (latest and most capable model) for scenario generation
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o', // Latest model with best reasoning capabilities
          messages: [
            {
              role: 'system',
              content: 'You are an expert intelligence analyst specializing in probabilistic scenario analysis and decision support under uncertainty. Generate realistic, actionable scenarios with well-calibrated probabilities. Use your knowledge of current events, historical patterns, and causal mechanisms.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7, // Higher temperature for more diverse scenarios
          max_tokens: 4000, // Increased for richer scenarios
          response_format: { type: 'json_object' },
        });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) {
          throw new Error('No response from OpenAI');
        }

        const result = JSON.parse(responseText);
        
        // Validate and normalize probabilities
        const scenarios = (result.scenarios || []).map((scenario: any, idx: number) => {
          // Normalize probability to ensure they sum to ~1.0
          const rawProb = Math.max(0, Math.min(1, scenario.relativeProbability || 0.1));
          return {
            id: `scenario-${Date.now()}-${idx}`,
            title: (scenario.title || `Scenario ${idx + 1}`).trim(),
            description: (scenario.description || '').trim(),
            relativeProbability: rawProb,
            mechanisms: Array.isArray(scenario.mechanisms) ? scenario.mechanisms : [],
            invalidationConditions: Array.isArray(scenario.invalidationConditions) ? scenario.invalidationConditions : [],
            confidence: Math.max(0, Math.min(1, scenario.confidence || 0.5)),
            timeframe: scenario.timeframe || 'medium',
          };
        });

        // Normalize probabilities to sum to 1.0
        const totalProb = scenarios.reduce((sum: number, s: Scenario) => sum + s.relativeProbability, 0);
        if (totalProb > 0) {
          scenarios.forEach((s: Scenario) => {
            s.relativeProbability = s.relativeProbability / totalProb;
          });
        }

        const outlook: ScenarioOutlook = {
          currentState: (result.currentState || 'Current situation unclear').trim(),
          mechanisms: Array.isArray(result.mechanisms) ? result.mechanisms : [],
          scenarios: scenarios.slice(0, 9), // Limit to 9 scenarios max
          generatedAt: new Date().toISOString(),
        };

        // Now, for each scenario, search for backing sources AND enrich with OpenAI
        console.log(`[ScenarioGenerator] Generated ${outlook.scenarios.length} scenarios, now enriching with sources and OpenAI analysis...`);
        
        // Enrich each scenario with sources AND OpenAI analysis in parallel
        const enrichmentPromises = outlook.scenarios.map(async (scenario) => {
          try {
            // Step 1: Find web sources
            const sources = await findSourcesForScenario(scenario, context);
            scenario.sources = sources;
            
            // Step 2: Enrich scenario with OpenAI analysis of sources and deeper insights
            if (sources.length > 0) {
              await enrichScenarioWithOpenAI(scenario, context, sources);
            }
          } catch (error: any) {
            console.error(`[ScenarioGenerator] Error enriching scenario "${scenario.title}":`, error.message);
            // Continue even if enrichment fails
          }
        });

        await Promise.allSettled(enrichmentPromises);

        // Step 3: Generate cross-scenario insights using OpenAI
        const crossScenarioInsights = await generateCrossScenarioInsights(outlook, context);
        if (crossScenarioInsights) {
          outlook.crossScenarioInsights = crossScenarioInsights;
        }

        return outlook;
      } catch (error: any) {
        console.error('[ScenarioGenerator] Error generating scenarios:', error.message);
        throw error;
      }
    }
  );
}

/**
 * Enrich a scenario with OpenAI analysis of sources and deeper insights
 * This uses additional OpenAI calls to maximize API usage and quality
 */
async function enrichScenarioWithOpenAI(
  scenario: Scenario,
  context?: {
    entities?: string[];
    sectors?: string[];
    regions?: string[];
  },
  sources?: Scenario['sources']
): Promise<void> {
  if (!sources || sources.length === 0) return;

  try {
    // Build context from sources
    const sourcesContext = sources
      .slice(0, 3) // Use top 3 sources
      .map(s => `- ${s.title}: ${s.snippet || ''}`)
      .join('\n');

    const enrichmentPrompt = `You are an expert intelligence analyst. Analyze this scenario and its backing sources to provide deeper insights.

Scenario: ${scenario.title}
Description: ${scenario.description}
Probability: ${(scenario.relativeProbability * 100).toFixed(0)}%

Backing Sources:
${sourcesContext}

Provide:
1. Enhanced mechanisms: Refine or add 1-2 additional causal mechanisms based on the sources
2. Refined invalidation conditions: Add 1-2 more specific invalidation conditions based on source analysis
3. Confidence adjustment: Reassess confidence (0-1) based on source quality and relevance

Return JSON:
{
  "enhancedMechanisms": ["...", "..."],
  "refinedInvalidationConditions": ["...", "..."],
  "refinedConfidence": 0.75
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Use best model for analysis
      messages: [
        {
          role: 'system',
          content: 'You are an expert intelligence analyst. Analyze scenarios and sources to provide deeper, actionable insights.',
        },
        {
          role: 'user',
          content: enrichmentPrompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more precise analysis
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (responseText) {
      const enrichment = JSON.parse(responseText);
      
      // Merge enhanced mechanisms
      if (Array.isArray(enrichment.enhancedMechanisms)) {
        scenario.mechanisms = [...scenario.mechanisms, ...enrichment.enhancedMechanisms].slice(0, 6);
      }
      
      // Merge refined invalidation conditions
      if (Array.isArray(enrichment.refinedInvalidationConditions)) {
        scenario.invalidationConditions = [...scenario.invalidationConditions, ...enrichment.refinedInvalidationConditions].slice(0, 5);
      }
      
      // Update confidence if provided
      if (typeof enrichment.refinedConfidence === 'number') {
        scenario.confidence = Math.max(0, Math.min(1, enrichment.refinedConfidence));
      }
    }
  } catch (error: any) {
    console.error(`[ScenarioGenerator] Error enriching scenario with OpenAI:`, error.message);
    // Continue without enrichment if it fails
  }
}

/**
 * Generate cross-scenario insights using OpenAI
 * This analyzes all scenarios together to find patterns, common factors, etc.
 */
async function generateCrossScenarioInsights(
  outlook: ScenarioOutlook,
  context?: {
    entities?: string[];
    sectors?: string[];
    regions?: string[];
  }
): Promise<ScenarioOutlook['crossScenarioInsights'] | null> {
  try {
    const scenariosSummary = outlook.scenarios
      .map((s, idx) => `${idx + 1}. ${s.title} (${(s.relativeProbability * 100).toFixed(0)}%): ${s.description}`)
      .join('\n\n');

    const insightsPrompt = `You are an expert intelligence analyst. Analyze these multiple scenarios together to identify patterns and insights.

Current State: ${outlook.currentState}

Mechanisms: ${outlook.mechanisms.join(', ')}

Scenarios:
${scenariosSummary}

Analyze across ALL scenarios to identify:
1. Key Drivers: 3-5 key drivers or forces that affect multiple scenarios
2. Common Factors: Factors that appear across multiple scenarios (what's consistent?)
3. Critical Uncertainties: 3-5 critical uncertainties that, if resolved, would significantly change scenario probabilities
4. Decision Points: 2-3 key decision points or inflection points where actions could influence outcomes

Return JSON:
{
  "keyDrivers": ["...", "..."],
  "commonFactors": ["...", "..."],
  "criticalUncertainties": ["...", "..."],
  "decisionPoints": ["...", "..."]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Use best model for cross-scenario analysis
      messages: [
        {
          role: 'system',
          content: 'You are an expert intelligence analyst specializing in multi-scenario analysis and strategic decision support. Identify patterns, drivers, and critical factors across scenarios.',
        },
        {
          role: 'user',
          content: insightsPrompt,
        },
      ],
      temperature: 0.4, // Balanced for creative but precise insights
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (responseText) {
      return JSON.parse(responseText);
    }
  } catch (error: any) {
    console.error(`[ScenarioGenerator] Error generating cross-scenario insights:`, error.message);
    return null;
  }
  
  return null;
}

/**
 * Find web sources (articles, patterns) that back a specific scenario
 */
async function findSourcesForScenario(
  scenario: Scenario,
  context?: {
    entities?: string[];
    sectors?: string[];
    regions?: string[];
  }
): Promise<Scenario['sources']> {
  // Build search query from scenario title + description + context
  const queryParts: string[] = [];
  
  // Add scenario title and key terms
  queryParts.push(scenario.title);
  
  // Extract key terms from description (first 50 words)
  const descWords = scenario.description.split(' ').slice(0, 20).join(' ');
  queryParts.push(descWords);
  
  // Add context entities if available
  if (context?.entities && context.entities.length > 0) {
    queryParts.push(context.entities.slice(0, 3).join(' '));
  }
  
  // Add sectors if available
  if (context?.sectors && context.sectors.length > 0) {
    queryParts.push(context.sectors[0]);
  }
  
  const searchQuery = queryParts.join(' ');

  try {
    const tavilyOptions: TavilySearchOptions = {
      searchDepth: 'basic',
      maxResults: 5, // Get top 5 sources per scenario
      includeAnswer: false,
      includeRawContent: false, // We don't need full content, just snippets
      includeImages: false,
      minScore: 0.5, // Only high-relevance sources
    };

    const tavilyResult = await searchTavily(searchQuery, 'news', tavilyOptions);

    // Map Tavily results to scenario sources
    return tavilyResult.articles.slice(0, 5).map(article => ({
      title: article.title || 'Untitled',
      url: article.url || '',
      relevanceScore: article.score || 0.5,
      snippet: article.content?.substring(0, 200) || undefined,
    }));
  } catch (error: any) {
    console.error(`[ScenarioGenerator] Error searching sources for scenario:`, error.message);
    return [];
  }
}

/**
 * Generate scenarios for multiple claims (batch processing)
 */
export async function generateScenariosForClaims(
  claims: Array<{
    id: string;
    text: string;
    entities?: string[];
    sectors?: string[];
    regions?: string[];
    evidence?: string[];
  }>,
  maxScenariosPerClaim: number = 1
): Promise<Map<string, ScenarioOutlook>> {
  const results = new Map<string, ScenarioOutlook>();

  // Process claims in parallel (but limit concurrency to avoid rate limits)
  const batchSize = 3;
  for (let i = 0; i < claims.length; i += batchSize) {
    const batch = claims.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (claim) => {
      try {
        const outlook = await generateScenarioOutlook(claim.text, {
          entities: claim.entities,
          sectors: claim.sectors,
          regions: claim.regions,
          existingEvidence: claim.evidence,
        });
        
        outlook.claimId = claim.id;
        results.set(claim.id, outlook);
      } catch (error: any) {
        console.error(`[ScenarioGenerator] Error generating scenarios for claim ${claim.id}:`, error.message);
      }
    });

    await Promise.allSettled(batchPromises);
  }

  return results;
}
