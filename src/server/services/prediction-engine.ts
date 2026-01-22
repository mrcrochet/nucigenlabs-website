/**
 * Prediction Engine
 * 
 * Generates scenario outlooks (3-9 scenarios) for events with:
 * - Grounded evidence (real articles with URLs + historical patterns)
 * - Normalized probabilities (sum = 1.0)
 * - Counter-evidence for top scenarios
 * - Watch indicators
 * - Strict JSON format output
 * 
 * Pipeline:
 * A. Evidence Collector (Tavily for articles + historical patterns)
 * B. Evidence Extractor (Firecrawl limited to top 3-5 links)
 * C. Scenario Generator (LLM strict, temperature 0)
 * D. Validation & Cache
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { searchTavily, TavilySearchOptions } from './tavily-unified-service';
import { scrapeOfficialDocument, isFirecrawlAvailable } from '../phase4/firecrawl-official-service';
import { createClient } from '@supabase/supabase-js';
import type { EventPrediction, Outlook, EvidenceItem, PredictionRequest, PredictionResponse } from '../../types/prediction';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const openaiApiKey = process.env.OPENAI_API_KEY;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!openaiApiKey) {
  throw new Error('OPENAI_API_KEY is required for prediction engine');
}

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

interface EventData {
  event_id: string;
  title: string;
  summary: string;
  sources: Array<{
    title: string;
    url: string;
    publisher?: string;
    date: string;
  }>;
  entities: string[];
  countries?: string[];
  topics?: string[];
  claims?: Array<{
    text: string;
    type: string;
    certainty: number;
  }>;
  graph_relations?: any;
  tier?: 'fast' | 'standard' | 'deep';
  score?: number;
}

/**
 * Main prediction generation function
 */
export async function generatePrediction(
  request: PredictionRequest
): Promise<PredictionResponse> {
  const startTime = Date.now();
  let apiCallsCount = 0;
  let estimatedCost = 0;

  try {
    // Step 0: Check cache first (unless force_refresh)
    if (!request.force_refresh) {
      const cached = await getCachedPrediction(request.event_id);
      if (cached) {
        return {
          success: true,
          prediction: cached.prediction_json as EventPrediction,
          from_cache: true,
          metadata: {
            cache_hit: true,
            generation_time_ms: Date.now() - startTime,
            api_calls_count: 0,
            estimated_cost_usd: 0,
          },
        };
      }
    }

    // Step 1: Get event data
    const eventData = await getEventData(request.event_id);
    if (!eventData) {
      return {
        success: false,
        error: `Event not found: ${request.event_id}`,
      };
    }

    const tier = request.tier || eventData.tier || 'standard';
    const ttlHours = tier === 'deep' ? 12 : tier === 'standard' ? 6 : 3;

    // Step A: Evidence Collector
    console.log(`[PredictionEngine] Step A: Collecting evidence for event ${request.event_id}...`);
    const evidence = await collectEvidence(eventData, tier);
    apiCallsCount += evidence.apiCalls;
    estimatedCost += evidence.estimatedCost;

    // Step B: Evidence Extractor (Firecrawl on top links)
    console.log(`[PredictionEngine] Step B: Extracting evidence from top sources...`);
    const extractedEvidence = await extractEvidence(evidence.articles, tier);
    apiCallsCount += extractedEvidence.apiCalls;
    estimatedCost += extractedEvidence.estimatedCost;

    // Combine all evidence
    const allEvidence = [
      ...extractedEvidence.evidence,
      ...evidence.historicalPatterns,
    ];

    // Step C: Scenario Generator (LLM strict)
    console.log(`[PredictionEngine] Step C: Generating scenarios with LLM...`);
    const scenarios = await generateScenarios(eventData, allEvidence, tier);
    apiCallsCount += scenarios.apiCalls;
    estimatedCost += scenarios.estimatedCost;

    // Step D: Validation & Normalization
    const validated = validateAndNormalize(scenarios.outlooks);

    // Build prediction
    const prediction: EventPrediction = {
      event_id: request.event_id,
      generated_at: new Date().toISOString(),
      ttl_expires_at: new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString(),
      assumptions: scenarios.assumptions || [],
      outlooks: validated.outlooks,
      probability_check: validated.probabilityCheck,
      tier,
      evidence_count: allEvidence.length,
      historical_patterns_count: evidence.historicalPatterns.length,
      confidence_score: calculateOverallConfidence(validated.outlooks),
    };

    // Store in cache
    await storePrediction(request.event_id, prediction, tier, apiCallsCount, estimatedCost);

    const generationTime = Date.now() - startTime;

    return {
      success: true,
      prediction,
      from_cache: false,
      metadata: {
        cache_hit: false,
        generation_time_ms: generationTime,
        api_calls_count: apiCallsCount,
        estimated_cost_usd: estimatedCost,
      },
    };
  } catch (error: any) {
    console.error('[PredictionEngine] Error generating prediction:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate prediction',
    };
  }
}

/**
 * Step 0: Get event data from database or search results
 */
async function getEventData(eventId: string): Promise<EventData | null> {
  // Try to get from nucigen_events table first
  if (supabase) {
    const { data: nucigenEvent, error } = await supabase
      .from('nucigen_events')
      .select('*')
      .eq('id', eventId)
      .maybeSingle();

    if (!error && nucigenEvent) {
      // Get related articles/sources
      const { data: articles } = await supabase
        .from('events')
        .select('title, url, source, published_at')
        .eq('nucigen_event_id', eventId)
        .limit(20);

      return {
        event_id: eventId,
        title: nucigenEvent.title || '',
        summary: nucigenEvent.summary || '',
        sources: (articles || []).map(a => ({
          title: a.title || '',
          url: a.url || '',
          publisher: a.source || undefined,
          date: a.published_at || new Date().toISOString(),
        })),
        entities: nucigenEvent.actors || [],
        countries: nucigenEvent.country ? [nucigenEvent.country] : undefined,
        topics: nucigenEvent.sector ? [nucigenEvent.sector] : undefined,
        tier: 'standard',
        score: nucigenEvent.impact_score || undefined,
      };
    }
  }

  // Fallback: try to get from search results (if event_id is a search result ID)
  // This would require access to search orchestrator results
  // For now, return null if not found in DB
  return null;
}

/**
 * Step A: Evidence Collector
 * Collects articles and historical patterns via Tavily
 */
async function collectEvidence(
  eventData: EventData,
  tier: 'fast' | 'standard' | 'deep'
): Promise<{
  articles: Array<{ url: string; title: string; publisher?: string; date: string }>;
  historicalPatterns: EvidenceItem[];
  apiCalls: number;
  estimatedCost: number;
}> {
  const articles: Array<{ url: string; title: string; publisher?: string; date: string }> = [];
  const historicalPatterns: EvidenceItem[] = [];
  let apiCalls = 0;
  let estimatedCost = 0;

  // A1: Use existing event sources
  articles.push(...eventData.sources.map(s => ({
    url: s.url,
    title: s.title,
    publisher: s.publisher,
    date: s.date,
  })));

  // A2: Search Tavily for additional supporting articles
  const maxTavilyResults = tier === 'deep' ? 10 : tier === 'standard' ? 5 : 3;
  
  try {
    const supportingQuery = `${eventData.title} ${eventData.summary}`;
    const tavilyOptions: TavilySearchOptions = {
      searchDepth: tier === 'deep' ? 'advanced' : 'basic',
      maxResults: maxTavilyResults,
      includeAnswer: false,
      includeRawContent: false,
      includeImages: false,
      minScore: 0.5,
    };

    const tavilyResult = await searchTavily(supportingQuery, 'news', tavilyOptions);
    apiCalls += 1;
    estimatedCost += 0.001; // Rough estimate for Tavily

    tavilyResult.articles.forEach(article => {
      if (article.url && !articles.find(a => a.url === article.url)) {
        articles.push({
          url: article.url,
          title: article.title || 'Untitled',
          publisher: new URL(article.url).hostname,
          date: article.publishedDate || new Date().toISOString(),
        });
      }
    });
  } catch (error: any) {
    console.error('[PredictionEngine] Error searching Tavily:', error.message);
  }

  // A3: Search for historical patterns
  try {
    const historicalQuery = `historical similar events to ${eventData.title} OR past cases where ${eventData.entities.slice(0, 2).join(' ')}`;
    const historicalOptions: TavilySearchOptions = {
      searchDepth: 'basic',
      maxResults: 5,
      includeAnswer: false,
      includeRawContent: false,
      includeImages: false,
      minScore: 0.4, // Lower threshold for historical patterns
    };

    const historicalResult = await searchTavily(historicalQuery, 'news', historicalOptions);
    apiCalls += 1;
    estimatedCost += 0.001;

    // Also use OpenAI to identify historical patterns
    const patterns = await findHistoricalPatternsWithOpenAI(eventData);
    apiCalls += 1;
    estimatedCost += 0.01; // GPT-4o-mini estimate

    historicalPatterns.push(...patterns);
  } catch (error: any) {
    console.error('[PredictionEngine] Error finding historical patterns:', error.message);
  }

  return {
    articles: articles.slice(0, 20), // Limit total articles
    historicalPatterns,
    apiCalls,
    estimatedCost,
  };
}

/**
 * Find historical patterns using OpenAI
 */
async function findHistoricalPatternsWithOpenAI(
  eventData: EventData
): Promise<EvidenceItem[]> {
  const prompt = `You are a historian and intelligence analyst. Identify 2-3 well-documented historical events or patterns that are similar or relevant to this event.

Event: ${eventData.title}
Summary: ${eventData.summary}
Entities: ${eventData.entities.join(', ')}

For each historical pattern, provide:
- title: Name of the historical event/pattern
- date_range: When it occurred (e.g., "2008-2009", "1997-1998")
- url: A reliable source URL (Wikipedia, IMF, World Bank, government site, or reputable news archive)
- why_relevant: 1 sentence explaining relevance

Return JSON:
{
  "patterns": [
    {
      "title": "...",
      "date_range": "...",
      "url": "https://...",
      "why_relevant": "..."
    }
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use cheaper model for pattern identification
      messages: [
        {
          role: 'system',
          content: 'You are an expert historian. Identify relevant historical patterns with reliable source URLs.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) return [];

    const result = JSON.parse(responseText);
    return (result.patterns || []).map((p: any) => ({
      type: 'historical_pattern' as const,
      title: p.title || '',
      date_range: p.date_range || '',
      url: p.url || 'https://en.wikipedia.org',
      why_relevant: p.why_relevant || '',
    }));
  } catch (error: any) {
    console.error('[PredictionEngine] Error finding historical patterns:', error.message);
    return [];
  }
}

/**
 * Step B: Evidence Extractor
 * Uses Firecrawl on top 3-5 links to extract snippets
 */
async function extractEvidence(
  articles: Array<{ url: string; title: string; publisher?: string; date: string }>,
  tier: 'fast' | 'standard' | 'deep'
): Promise<{
  evidence: EvidenceItem[];
  apiCalls: number;
  estimatedCost: number;
}> {
  const evidence: EvidenceItem[] = [];
  let apiCalls = 0;
  let estimatedCost = 0;

  const maxFirecrawl = tier === 'deep' ? 5 : tier === 'standard' ? 3 : 1;

  if (!isFirecrawlAvailable()) {
    // Fallback: use article metadata only
    articles.slice(0, 10).forEach(article => {
      evidence.push({
        type: 'article',
        title: article.title,
        publisher: article.publisher,
        date: article.date,
        url: article.url,
        why_relevant: 'Source article related to this event',
      });
    });
    return { evidence, apiCalls: 0, estimatedCost: 0 };
  }

  // Use Firecrawl on top articles
  const topArticles = articles.slice(0, maxFirecrawl);
  
  for (const article of topArticles) {
    try {
      const scraped = await scrapeOfficialDocument(article.url, {
        checkWhitelist: false, // Allow any URL for evidence extraction
      });
      apiCalls += 1;
      estimatedCost += 0.01; // Rough Firecrawl estimate

      if (scraped && scraped.content) {
        // Extract relevant snippet (100-300 words)
        const snippet = scraped.content
          .split(/\s+/)
          .slice(0, 250)
          .join(' ')
          .substring(0, 500);

        evidence.push({
          type: 'article',
          title: article.title,
          publisher: article.publisher || new URL(article.url).hostname,
          date: article.date,
          url: article.url,
          snippet,
          why_relevant: 'Direct source article with extracted content',
        });
      } else {
        // Fallback: use metadata
        evidence.push({
          type: 'article',
          title: article.title,
          publisher: article.publisher,
          date: article.date,
          url: article.url,
          why_relevant: 'Source article related to this event',
        });
      }
    } catch (error: any) {
      console.error(`[PredictionEngine] Error scraping ${article.url}:`, error.message);
      // Fallback: use metadata
      evidence.push({
        type: 'article',
        title: article.title,
        publisher: article.publisher,
        date: article.date,
        url: article.url,
        why_relevant: 'Source article related to this event',
      });
    }
  }

  // Add remaining articles without Firecrawl
  articles.slice(maxFirecrawl, 10).forEach(article => {
    evidence.push({
      type: 'article',
      title: article.title,
      publisher: article.publisher,
      date: article.date,
      url: article.url,
      why_relevant: 'Supporting source article',
    });
  });

  return { evidence, apiCalls, estimatedCost };
}

/**
 * Step C: Scenario Generator (LLM strict, temperature 0)
 */
async function generateScenarios(
  eventData: EventData,
  evidence: EvidenceItem[],
  tier: 'fast' | 'standard' | 'deep'
): Promise<{
  outlooks: Outlook[];
  assumptions: string[];
  apiCalls: number;
  estimatedCost: number;
}> {
  // Build evidence context
  const evidenceContext = evidence.map((ev, idx) => {
    if (ev.type === 'article') {
      return `${idx + 1}. ARTICLE: "${ev.title}" (${ev.publisher || 'unknown'}, ${ev.date || 'unknown'})
   URL: ${ev.url}
   Relevance: ${ev.why_relevant}
   ${ev.snippet ? `Snippet: ${ev.snippet.substring(0, 200)}...` : ''}`;
    } else {
      return `${idx + 1}. HISTORICAL PATTERN: "${ev.title}" (${ev.date_range || 'unknown'})
   URL: ${ev.url}
   Relevance: ${ev.why_relevant}`;
    }
  }).join('\n\n');

  const claimsContext = eventData.claims && eventData.claims.length > 0
    ? `\n\nClaims extracted from event:\n${eventData.claims.map((c, idx) => `${idx + 1}. [${c.type}] ${c.text} (certainty: ${(c.certainty * 100).toFixed(0)}%)`).join('\n')}`
    : '';

  const numScenarios = tier === 'deep' ? 9 : tier === 'standard' ? 6 : 3;

  const prompt = `You are an expert intelligence analyst specializing in probabilistic scenario analysis.

EVENT:
Title: ${eventData.title}
Summary: ${eventData.summary}
Entities: ${eventData.entities.join(', ')}
${eventData.countries ? `Countries: ${eventData.countries.join(', ')}` : ''}
${eventData.topics ? `Topics: ${eventData.topics.join(', ')}` : ''}

EVIDENCE (ALL SOURCES MUST BE FROM THIS LIST):
${evidenceContext}${claimsContext}

Generate ${numScenarios} plausible scenario outlooks. Each outlook must:

1. Have a clear title (max 10 words)
2. Have a probability (0-1) - ALL probabilities must sum to approximately 1.0
3. Reference SPECIFIC evidence from the list above (use evidence numbers like "Evidence #3")
4. Include 2-6 supporting_evidence items (ALL must have URLs from the evidence list)
5. Include counter_evidence for top 3 scenarios (evidence that contradicts)
6. Include 2-5 watch_indicators (what to monitor)
7. Have a time_horizon: "1-2 weeks" | "1-3 months" | "6-12 months" | "1-2 years" | "2+ years"
8. Have a mechanism (2-4 sentences explaining causal chain)
9. Have confidence: "high" | "medium" | "low"

CRITICAL RULES:
- Every supporting_evidence MUST reference an evidence item from the list (use its URL)
- If evidence is missing, write "Not confirmed by available sources."
- Probabilities must sum to 1.0 (you can adjust slightly, we'll normalize)
- Be specific, not vague
- Scenarios should be mutually exclusive or at least distinct

Return JSON:
{
  "assumptions": ["assumption 1", "assumption 2"],
  "outlooks": [
    {
      "id": "O1",
      "title": "...",
      "probability": 0.35,
      "time_horizon": "1-3 months",
      "mechanism": "...",
      "supporting_evidence": [
        {
          "type": "article",
          "title": "...",
          "publisher": "...",
          "date": "...",
          "url": "...",
          "why_relevant": "..."
        }
      ],
      "counter_evidence": [
        {
          "type": "article",
          "title": "...",
          "publisher": "...",
          "date": "...",
          "url": "...",
          "why_relevant": "..."
        }
      ],
      "watch_indicators": ["indicator 1", "indicator 2"],
      "confidence": "high"
    }
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Use best model for scenario generation
      messages: [
        {
          role: 'system',
          content: 'You are an expert intelligence analyst. Generate realistic, actionable scenarios with well-calibrated probabilities. Every evidence must reference real sources with URLs.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0, // Strict: no creativity, deterministic
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(responseText);
    
    // Validate evidence URLs exist in our evidence list
    const evidenceUrls = new Set(evidence.map(e => e.url));
    const validatedOutlooks = (result.outlooks || []).map((outlook: any) => {
      // Validate supporting evidence URLs
      const validatedSupporting = (outlook.supporting_evidence || []).map((ev: any) => {
        if (!ev.url || !evidenceUrls.has(ev.url)) {
          return {
            ...ev,
            url: ev.url || 'Not confirmed by available sources.',
            title: ev.title || 'Source not available',
          };
        }
        return ev;
      });

      // Validate counter evidence URLs
      const validatedCounter = (outlook.counter_evidence || []).map((ev: any) => {
        if (!ev.url || !evidenceUrls.has(ev.url)) {
          return {
            ...ev,
            url: ev.url || 'Not confirmed by available sources.',
            title: ev.title || 'Source not available',
          };
        }
        return ev;
      });

      return {
        ...outlook,
        supporting_evidence: validatedSupporting,
        counter_evidence: validatedCounter.length > 0 ? validatedCounter : undefined,
      };
    });

    return {
      outlooks: validatedOutlooks.slice(0, numScenarios),
      assumptions: Array.isArray(result.assumptions) ? result.assumptions : [],
      apiCalls: 1,
      estimatedCost: 0.05, // GPT-4o estimate for 4000 tokens
    };
  } catch (error: any) {
    console.error('[PredictionEngine] Error generating scenarios:', error.message);
    throw error;
  }
}

/**
 * Step D: Validation & Normalization
 */
function validateAndNormalize(outlooks: Outlook[]): {
  outlooks: Outlook[];
  probabilityCheck: { sum: number; method: string; original_sum?: number };
} {
  if (outlooks.length === 0) {
    throw new Error('No outlooks generated');
  }

  // Calculate original sum
  const originalSum = outlooks.reduce((sum, o) => sum + o.probability, 0);

  // Normalize probabilities to sum to 1.0
  if (originalSum > 0) {
    outlooks.forEach(outlook => {
      outlook.probability = outlook.probability / originalSum;
    });
  } else {
    // If all probabilities are 0, distribute equally
    const equalProb = 1.0 / outlooks.length;
    outlooks.forEach(outlook => {
      outlook.probability = equalProb;
    });
  }

  // Ensure probabilities are in valid range
  outlooks.forEach(outlook => {
    outlook.probability = Math.max(0, Math.min(1, outlook.probability));
  });

  // Re-normalize after clamping
  const finalSum = outlooks.reduce((sum, o) => sum + o.probability, 0);
  if (finalSum > 0) {
    outlooks.forEach(outlook => {
      outlook.probability = outlook.probability / finalSum;
    });
  }

  const normalizedSum = outlooks.reduce((sum, o) => sum + o.probability, 0);

  return {
    outlooks,
    probabilityCheck: {
      sum: normalizedSum,
      method: 'normalize',
      original_sum: originalSum,
    },
  };
}

/**
 * Calculate overall confidence score
 */
function calculateOverallConfidence(outlooks: Outlook[]): number {
  if (outlooks.length === 0) return 0;

  const confidenceMap = { high: 0.8, medium: 0.5, low: 0.3 };
  const weightedConfidence = outlooks.reduce((sum, o) => {
    const conf = confidenceMap[o.confidence] || 0.5;
    return sum + (conf * o.probability);
  }, 0);

  return Math.round(weightedConfidence * 100) / 100;
}

/**
 * Get cached prediction
 */
async function getCachedPrediction(eventId: string): Promise<{ prediction_json: EventPrediction } | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('event_predictions')
    .select('prediction_json')
    .eq('event_id', eventId)
    .gt('ttl_expires_at', new Date().toISOString())
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Store prediction in cache
 */
async function storePrediction(
  eventId: string,
  prediction: EventPrediction,
  tier: 'fast' | 'standard' | 'deep',
  apiCallsCount: number,
  estimatedCost: number
): Promise<void> {
  if (!supabase) return;

  // Generate cache key
  const cacheKey = createHash('sha256')
    .update(JSON.stringify({ eventId, tier, version: 1 }))
    .digest('hex')
    .substring(0, 32);

  const { error } = await supabase
    .from('event_predictions')
    .upsert({
      event_id: eventId,
      prediction_json: prediction,
      ttl_expires_at: prediction.ttl_expires_at,
      tier,
      cache_key: cacheKey,
      cache_version: 1,
      evidence_count: prediction.evidence_count || 0,
      historical_patterns_count: prediction.historical_patterns_count || 0,
      confidence_score: prediction.confidence_score,
      api_calls_count: apiCallsCount,
      estimated_cost: estimatedCost,
    }, {
      onConflict: 'event_id',
    });

  if (error) {
    console.error('[PredictionEngine] Error storing prediction:', error);
  } else {
    // History is automatically recorded via trigger, but we can also manually record if needed
    // The trigger in the migration will handle this automatically
  }
}
