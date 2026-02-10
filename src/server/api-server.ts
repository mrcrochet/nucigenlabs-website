/**
 * Simple API Server for Live Search
 * 
 * Run with: npx tsx src/server/api-server.ts
 * Or: npm run api:server
 */

import express from 'express';
import cors from 'cors';
import { searchAndCreateLiveEvent } from './services/live-event-creator.js';
import { collectPersonalizedEventsForUser } from './workers/tavily-personalized-collector.js';
import { predictRelevance } from './ml/relevance-predictor.js';
import { getRealTimePrice, getTimeSeries } from './services/twelvedata-service.js';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUserId } from './utils/auth-helpers.js';
import { buildGraphFromSignals } from '../lib/investigation/build-graph.js';
import { buildBriefingPayload, formatBriefingPayloadAsText } from '../lib/investigation/build-briefing.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEBUG_LOG_PATH = join(__dirname, '../../.cursor/debug.log');
function debugLog(payload: Record<string, unknown>) {
  try {
    const dir = dirname(DEBUG_LOG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(DEBUG_LOG_PATH, JSON.stringify(payload) + '\n');
  } catch (_) {}
}
// Try multiple paths for .env file
dotenv.config({ path: join(__dirname, '../../.env') });
dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config(); // Also try default .env in current directory

const app = express();
// PORT: Railway/Render inject PORT; fallback API_PORT then 3001 for local
const PORT = process.env.PORT || process.env.API_PORT || 3001;

// Initialize Supabase client for personalized collection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

app.use(cors());
app.use(express.json());

// Audit middleware (for compliance and auditability)
import { auditMiddleware, logAuditEventManual } from './middleware/audit-middleware.js';
app.use(auditMiddleware);

// Error handling utilities
import { asyncHandler } from './utils/error-handler.js';

// Performance middleware
import { performanceMiddleware, getPerformanceMetricsHandler } from './middleware/performance-middleware.js';
app.use(performanceMiddleware);

// Health check
app.get('/health', (req, res) => {
  // Check if critical services are configured
  const twelvedataConfigured = !!process.env.TWELVEDATA_API_KEY;
  const supabaseConfigured = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const perplexityConfigured = !!process.env.PERPLEXITY_API_KEY;
  const eventregistryConfigured = !!process.env.EVENTREGISTRY_API_KEY;
  
  res.json({ 
    status: 'ok',
    services: {
      twelvedata: twelvedataConfigured ? 'configured' : 'missing',
      supabase: supabaseConfigured ? 'configured' : 'missing',
      perplexity: perplexityConfigured ? 'configured' : 'missing',
      eventregistry: eventregistryConfigured ? 'configured' : 'missing',
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check for Twelve Data specifically
app.get('/health/twelvedata', async (req, res) => {
  try {
    if (!process.env.TWELVEDATA_API_KEY) {
      return res.status(503).json({
        status: 'unavailable',
        error: 'TWELVEDATA_API_KEY not configured',
        message: 'Please add TWELVEDATA_API_KEY to your environment variables',
      });
    }
    
    // Try a simple request to verify the key works
    const { getRealTimePrice } = await import('./services/twelvedata-service.js');
    await getRealTimePrice('AAPL');
    
    res.json({
      status: 'ok',
      configured: true,
      message: 'Twelve Data API is configured and working',
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'error',
      configured: !!process.env.TWELVEDATA_API_KEY,
      error: error.message || 'Twelve Data API check failed',
    });
  }
});

// Market Data Endpoints
app.get('/api/market-data/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const priceData = await getRealTimePrice(symbol);
    res.json({ success: true, data: priceData });
  } catch (error: any) {
    console.error('[API] Market data error:', error);
    
    // Provide clearer error messages
    let errorMessage = error.message || 'Failed to fetch market data';
    let statusCode = 500;
    let errorCode = 'MARKET_DATA_ERROR';
    
    if (errorMessage.includes('TWELVEDATA_API_KEY') || errorMessage.includes('not configured')) {
      errorMessage = 'Twelve Data API key not configured. Please add TWELVEDATA_API_KEY to your .env file.';
      statusCode = 503; // Service Unavailable
      errorCode = 'TWELVE_DATA_API_ERROR';
    } else if (errorMessage.includes('429') || errorMessage.includes('Rate limit')) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
      statusCode = 429;
      errorCode = 'RATE_LIMIT_ERROR';
    } else if (errorMessage.includes('Invalid API key') || errorMessage.includes('apikey parameter is incorrect')) {
      errorMessage = 'Invalid Twelve Data API key. Please check your .env file.';
      statusCode = 401;
      errorCode = 'INVALID_API_KEY';
    }
    
    // Standardized error response
    res.status(statusCode).json({
      success: false,
      error: errorCode,
      message: errorMessage,
      provider: 'twelvedata',
      status: statusCode,
    });
  }
});

app.get('/api/market-data/:symbol/timeseries', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1h', days = '7' } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));
    
    const timeSeriesData = await getTimeSeries(symbol, {
      interval: interval as any,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      outputsize: parseInt(days as string) * 24, // Approximate
    });
    
    res.json({ success: true, data: timeSeriesData });
  } catch (error: any) {
    console.error('[API] Time series error:', error);
    
    // Provide clearer error messages
    let errorMessage = error.message || 'Failed to fetch time series data';
    let statusCode = 500;
    
    if (errorMessage.includes('TWELVEDATA_API_KEY') || errorMessage.includes('not configured')) {
      errorMessage = 'Twelve Data API key not configured. Please add TWELVEDATA_API_KEY to your .env file.';
      statusCode = 503; // Service Unavailable
    } else if (errorMessage.includes('429')) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
      statusCode = 429;
    } else if (errorMessage.includes('Invalid API key')) {
      errorMessage = 'Invalid Twelve Data API key. Please check your .env file.';
      statusCode = 401;
    }
    
    // Standardized error response
    const errorCode = errorMessage.includes('API key') || errorMessage.includes('not configured')
      ? 'TWELVE_DATA_API_ERROR'
      : errorMessage.includes('429') || errorMessage.includes('Rate limit')
      ? 'RATE_LIMIT_ERROR'
      : errorMessage.includes('Invalid API key')
      ? 'INVALID_API_KEY'
      : 'MARKET_DATA_ERROR';

    res.status(statusCode).json({
      success: false,
      error: errorCode,
      message: errorMessage,
      provider: 'twelvedata',
      status: statusCode,
    });
  }
});

// Economic Data Endpoints (using Perplexity instead of Trading Economics)
app.get('/api/economic-data/indicators', asyncHandler(async (req, res) => {
  const { country, indicators } = req.query;
  const { getEconomicIndicators } = await import('./services/economic-data-service.js');
  
  const indicatorList = indicators ? (Array.isArray(indicators) ? indicators : [indicators]) as string[] : undefined;
  const data = await getEconomicIndicators(country as string, indicatorList);
  
  res.json({ success: true, data });
}));

app.get('/api/economic-data/market-indicators', asyncHandler(async (req, res) => {
  const { type } = req.query;
  const { getMarketIndicators } = await import('./services/economic-data-service.js');
  
  const data = await getMarketIndicators(type as 'commodities' | 'currencies' | 'bonds' | 'all' | undefined);
  
  res.json({ success: true, data });
}));

app.get('/api/economic-data/calendar', asyncHandler(async (req, res) => {
  const { days = '7' } = req.query;
  const { getEconomicCalendar } = await import('./services/economic-data-service.js');
  
  const data = await getEconomicCalendar(parseInt(days as string, 10));
  
  res.json({ success: true, data });
}));

// Health check for economic data service
app.get('/api/economic-data/health', asyncHandler(async (req, res) => {
  const { checkPerplexityHealth } = await import('./services/perplexity-service.js');
  const isHealthy = await checkPerplexityHealth();
  
  res.json({
    status: isHealthy ? 'ok' : 'unavailable',
    service: 'economic-data',
    provider: 'perplexity',
    message: isHealthy 
      ? 'Economic data service is operational (using Perplexity AI)'
      : 'Economic data service unavailable (Perplexity API not configured)',
  });
}));

// Performance metrics endpoint
app.get('/metrics', getPerformanceMetricsHandler);

// Track user action endpoint (for analytics)
app.post('/track-action', async (req, res) => {
  try {
    const { userId, eventId, recommendationId, actionType, sessionId, pageUrl, referrer, timeSpentSeconds, scrollDepth, feedPosition, feedType, recommendationPriority } = req.body;

    if (!userId || !actionType) {
      return res.status(400).json({
        success: false,
        error: 'userId and actionType are required',
      });
    }

    // Import and use recordUserAction
    const { recordUserAction } = await import('./rl/user-behavior-learner.js');
    
    // Map to UserAction interface (requires userId, eventId, actionType, timestamp)
    const action = {
      userId,
      eventId: eventId || 'unknown',
      actionType: actionType as 'click' | 'view' | 'read' | 'share' | 'bookmark' | 'ignore' | 'feedback_positive' | 'feedback_negative',
      timestamp: new Date(),
      metadata: {
        sessionId,
        pageUrl,
        referrer,
        timeSpentSeconds,
        scrollDepth,
        feedPosition,
        feedType,
        recommendationPriority,
        recommendationId,
      },
    };

    const success = await recordUserAction(action);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to record action',
      });
    }
  } catch (error: any) {
    console.error('[API] Error tracking action:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to track action',
    });
  }
});

// Live search endpoint
app.post('/live-search', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    console.log(`[API] Live search request: "${query}"`);

    const result = await searchAndCreateLiveEvent(query.trim());

    if (result && result.event) {
      res.status(200).json({
        success: true,
        event: result.event,
        causalChain: result.causalChain || null,
        historicalContext: result.historicalContext || null,
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'No event found or created',
      });
    }
  } catch (error: any) {
    console.error('[API] Live search error:', error);
    console.error('[API] Error stack:', error.stack);
    
    // Provide more detailed error messages
    let errorMessage = error.message || 'Internal server error';
    
    // Check for common issues
    if (error.message?.includes('API key') || error.message?.includes('required')) {
      errorMessage = `Configuration error: ${error.message}. Please check your .env file.`;
    } else if (error.message?.includes('Tavily')) {
      errorMessage = `Tavily API error: ${error.message}. Please check your TAVILY_API_KEY.`;
    } else if (error.message?.includes('OpenAI')) {
      errorMessage = `OpenAI API error: ${error.message}. Please check your OPENAI_API_KEY.`;
    } else if (error.message?.includes('Supabase')) {
      errorMessage = `Database error: ${error.message}. Please check your Supabase configuration.`;
    }
    
    // Ensure we always send valid JSON
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Deep Research handler (shared by /deep-research and /api/deep-research)
// Uses Perplexity as main engine (PERPLEXITY_API_KEY); Tavily fallback (TAVILY_API_KEY). OPENAI_API_KEY required.
async function handleDeepResearch(req: express.Request, res: express.Response) {
  try {
    const { query, focus_areas, time_horizon, max_sources } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'query is required',
      });
    }

    console.log(`[API] Deep research request: "${query}"`);

    const { deepResearchAgent } = await import('./agents/deep-research-agent.js');

    const result = await deepResearchAgent.conductResearch({
      query: query.trim(),
      focus_areas,
      time_horizon: time_horizon || 'medium',
      max_sources: max_sources || 10,
    });

    if (result.error || !result.data) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to conduct research',
        metadata: result.metadata,
      });
    }

    res.status(200).json({
      success: true,
      ...result.data,
      metadata: result.metadata,
    });
  } catch (error: any) {
    console.error('[API] Deep research error:', error);

    let errorMessage = error.message || 'Failed to conduct research';

    if (error.message?.includes('API key') || error.message?.includes('required')) {
      errorMessage = `Configuration: ${error.message}. Set PERPLEXITY_API_KEY (recommended) or TAVILY_API_KEY, and OPENAI_API_KEY in .env.`;
    } else if (error.message?.includes('Perplexity')) {
      errorMessage = `Perplexity: ${error.message}. Check PERPLEXITY_API_KEY.`;
    } else if (error.message?.includes('Tavily')) {
      errorMessage = `Tavily: ${error.message}. Check TAVILY_API_KEY.`;
    } else if (error.message?.includes('OpenAI')) {
      errorMessage = `OpenAI: ${error.message}. Check OPENAI_API_KEY.`;
    } else if (error.message?.includes('Supabase')) {
      errorMessage = `Database: ${error.message}. Check Supabase configuration.`;
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

// Deep Research endpoints (frontend may call /api/deep-research via proxy)
app.post('/deep-research', handleDeepResearch);
app.post('/api/deep-research', handleDeepResearch);

// Process event endpoint - automatically process an event from events table to nucigen_events
app.post('/process-event', async (req, res) => {
  try {
    const { eventId } = req.body;
    
    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'eventId is required',
      });
    }

    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase not configured',
      });
    }

    console.log(`[API] Process event request for: ${eventId}`);

    // Import processEvent function
    const { processEvent } = await import('./workers/event-processor.js');
    
    // Process the event
    const result = await processEvent(eventId);
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error,
        phase1Success: result.phase1Success,
        phase2bSuccess: result.phase2bSuccess,
      });
    }

    // Get the created nucigen_event
    const { data: nucigenEvent } = await supabase
      .from('nucigen_events')
      .select('id')
      .eq('source_event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    res.status(200).json({
      success: true,
      phase1Success: result.phase1Success,
      phase2bSuccess: result.phase2bSuccess,
      nucigenEventId: nucigenEvent?.id || null,
    });
  } catch (error: any) {
    console.error('[API] Process event error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process event',
    });
  }
});

// Personalized collection endpoint
app.post('/personalized-collect', async (req, res) => {
  try {
    const { userId } = req.body; // Clerk user ID
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase not configured',
      });
    }

    console.log(`[API] Personalized collect request for user: ${userId.substring(0, 10)}...`);

    // Convert Clerk user ID to Supabase UUID using the SQL function
    // Note: Function parameter is 'clerk_id', not 'clerk_user_id'
    const { data: supabaseUserIdData, error: userIdError } = await supabase.rpc(
      'get_or_create_supabase_user_id',
      { clerk_id: userId }
    );

    if (userIdError || !supabaseUserIdData) {
      console.error('[API] Error converting Clerk user ID:', userIdError);
      return res.status(500).json({
        success: false,
        error: 'Failed to resolve user ID',
      });
    }

    const supabaseUserId = supabaseUserIdData as string;

    // Fetch user preferences and profile
    const [prefsResult, profileResult] = await Promise.all([
      supabase
        .from('user_preferences')
        .select('preferred_sectors, preferred_regions, preferred_event_types, focus_areas, min_impact_score, min_confidence_score')
        .eq('user_id', supabaseUserId)
        .maybeSingle(),
      supabase
        .from('users')
        .select('intended_use, company, professional_role')
        .eq('id', supabaseUserId)
        .maybeSingle(),
    ]);

    const { data: userPrefs, error: prefsError } = prefsResult;
    const { data: userProfileData, error: profileError } = profileResult;

    if (prefsError) {
      console.error('[API] Error fetching preferences:', prefsError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch user preferences',
      });
    }

    if (!userPrefs || (!userPrefs.preferred_sectors?.length && !userPrefs.preferred_regions?.length)) {
      return res.status(400).json({
        success: false,
        error: 'User has no preferences configured',
      });
    }

    // Build user profile object
    const userProfile = userProfileData ? {
      intended_use: userProfileData.intended_use || undefined,
      company: userProfileData.company || undefined,
      professional_role: userProfileData.professional_role || undefined,
    } : undefined;

    // Trigger personalized collection
    const result = await collectPersonalizedEventsForUser(
      supabaseUserId,
      {
        user_id: supabaseUserId,
        preferred_sectors: userPrefs.preferred_sectors || [],
        preferred_regions: userPrefs.preferred_regions || [],
        preferred_event_types: userPrefs.preferred_event_types || [],
        focus_areas: userPrefs.focus_areas || [],
        min_impact_score: userPrefs.min_impact_score,
        min_confidence_score: userPrefs.min_confidence_score,
      },
      userProfile
    );

    res.status(200).json({
      success: true,
      inserted: result.inserted,
      skipped: result.skipped,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error('[API] Personalized collect error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// Relevance prediction endpoint (ML)
app.post('/api/predict-relevance', async (req, res) => {
  try {
    const { eventId, userId } = req.body;

    if (!eventId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'eventId and userId are required',
      });
    }

    console.log(`[API] Relevance prediction request: event=${eventId.substring(0, 10)}..., user=${userId.substring(0, 10)}...`);

    const prediction = await predictRelevance(eventId, userId);

    res.status(200).json({
      success: true,
      relevanceScore: prediction.relevanceScore,
      confidence: prediction.confidence,
      modelVersion: prediction.modelVersion,
      reasoning: prediction.reasoning,
    });
  } catch (error: any) {
    console.error('[API] Relevance prediction error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// Signal Agent endpoint
app.post('/api/signals', async (req, res) => {
  try {
    const { events, user_preferences } = req.body;

    if (!events || !Array.isArray(events)) {
      return res.status(400).json({
        success: false,
        error: 'events array is required',
      });
    }

    console.log(`[API] Signal generation request: ${events.length} events`);

    // Import SignalAgent dynamically
    const { IntelligenceSignalAgent } = await import('./agents/signal-agent.js');
    const signalAgent = new IntelligenceSignalAgent();

    const response = await signalAgent.generateSignals({
      events,
      user_preferences,
    });

    if (response.error) {
      return res.status(500).json({
        success: false,
        error: response.error,
      });
    }

    res.status(200).json({
      success: true,
      signals: response.data || [],
      metadata: response.metadata,
    });
  } catch (error: any) {
    console.error('[API] Signal generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// Impact Agent endpoint
app.post('/api/impacts', async (req, res) => {
  try {
    const { signals, events, user_preferences } = req.body;

    if (!signals || !Array.isArray(signals) || signals.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'signals array is required and must not be empty',
      });
    }

    console.log(`[API] Impact generation request: ${signals.length} signals`);

    // Import ImpactAgent dynamically
    const { impactAgent } = await import('./agents/impact-agent.js');

    const response = await impactAgent.generateImpacts({
      signals,
      events,
      user_preferences,
    });

    if (response.error) {
      return res.status(500).json({
        success: false,
        error: response.error,
      });
    }

    res.status(200).json({
      success: true,
      impacts: response.data || [],
      metadata: response.metadata,
    });
  } catch (error: any) {
    console.error('[API] Impact generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// Perplexity API endpoints
app.post('/api/perplexity/chat', async (req, res) => {
  try {
    const { messages, model, options } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'messages array is required',
      });
    }

    console.log(`[API] Perplexity chat request: ${messages.length} messages`);

    const { chatCompletions } = await import('./services/perplexity-service.js');
    
    const response = await chatCompletions({
      model: model || 'sonar-pro',
      messages,
      ...options,
    });

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('[API] Perplexity chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// In-memory cache for detective evidence (URL -> { title, excerpt, contentTruncated, cachedAt }), TTL 1 hour
const DETECTIVE_EVIDENCE_CACHE_TTL_MS = 60 * 60 * 1000;
const detectiveEvidenceCache = new Map<
  string,
  { title: string; excerpt: string; contentTruncated: string; cachedAt: number }
>();

function getCachedEvidence(url: string): { title: string; excerpt: string; contentTruncated: string } | null {
  const entry = detectiveEvidenceCache.get(url);
  if (!entry || Date.now() - entry.cachedAt > DETECTIVE_EVIDENCE_CACHE_TTL_MS) return null;
  return { title: entry.title, excerpt: entry.excerpt, contentTruncated: entry.contentTruncated };
}

function setCachedEvidence(
  url: string,
  value: { title: string; excerpt: string; contentTruncated: string }
): void {
  detectiveEvidenceCache.set(url, { ...value, cachedAt: Date.now() });
}

// Detective chat: Perplexity + Firecrawl evidence (scrape citations for "pieces a conviction")
app.post('/api/search/detective/message', async (req, res) => {
  try {
    const { messages, resultsSummary, options: opts } = req.body;
    const maxScrapeUrls = opts?.maxScrapeUrls ?? 3;
    const includeGrounding = opts?.includeGrounding === true;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'messages array is required',
      });
    }

    const { chatCompletions } = await import('./services/perplexity-service.js');
    const apiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      ...(resultsSummary
        ? [{ role: 'system' as const, content: `Sujet et contexte:\n${String(resultsSummary).slice(0, 800)}` }]
        : []),
      ...messages.map((m: { role: string; content: string }) => ({
        role: (m.role === 'system' ? 'system' : m.role === 'assistant' ? 'assistant' : 'user') as 'system' | 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const detectiveMaxTokens = parseInt(process.env.PERPLEXITY_DETECTIVE_MAX_TOKENS || '1024', 10) || 1024;
    const response = await chatCompletions({
      model: process.env.PERPLEXITY_MODEL_DEFAULT === 'sonar' ? 'sonar' : 'sonar-pro',
      messages: apiMessages,
      max_tokens: detectiveMaxTokens,
      return_citations: true,
      return_related_questions: true,
      return_images: true,
    });

    let content = response.choices?.[0]?.message?.content ?? '';
    const citations = response.citations ?? response.choices?.[0]?.message?.citations ?? [];
    let related_questions = response.related_questions ?? [];
    const images = response.images ?? response.choices?.[0]?.message?.images ?? [];

    const urlsToScrape = [...(Array.isArray(citations) ? citations : [])].slice(0, maxScrapeUrls);
    const evidence: Array<{ url: string; title: string; excerpt: string }> = [];
    const contentForGrounding: string[] = [];

    if (urlsToScrape.length > 0) {
      const { scrapeOfficialDocument, isFirecrawlAvailable } = await import('./phase4/firecrawl-official-service.js');
      if (isFirecrawlAvailable()) {
        const results = await Promise.allSettled(
          urlsToScrape.map(async (url: string) => {
            const cached = getCachedEvidence(url);
            if (cached) {
              contentForGrounding.push(cached.contentTruncated);
              return { url, title: cached.title, excerpt: cached.excerpt };
            }
            try {
              const doc = await scrapeOfficialDocument(url, { checkWhitelist: false });
              if (doc && doc.content) {
                const domain = doc.domain || (url.match(/https?:\/\/(?:www\.)?([^/]+)/)?.[1] ?? '');
                const excerpt = doc.content.slice(0, 400).trim();
                const contentTruncated = doc.content.slice(0, 2000).trim();
                setCachedEvidence(url, {
                  title: doc.title || domain,
                  excerpt,
                  contentTruncated,
                });
                contentForGrounding.push(contentTruncated);
                return {
                  url,
                  title: doc.title || domain,
                  excerpt,
                };
              }
              return null;
            } catch {
              return null;
            }
          })
        );
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value) evidence.push(r.value);
        }
      }
    }

    if (includeGrounding && contentForGrounding.length > 0 && messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
      const userQuery = lastUserMessage?.content ?? content;
      const contextText = contentForGrounding
        .map((c, i) => `[Source ${i + 1}]:\n${c}`)
        .join('\n\n---\n\n');
      try {
        const groundedResponse = await chatCompletions({
          model: 'sonar-pro',
          messages: [
            {
              role: 'system',
              content: `Answer based only on the following context. If the context does not contain enough information to answer, say so and summarize what is available.\n\nContext:\n${contextText}`,
            },
            { role: 'user', content: userQuery },
          ],
          return_citations: false,
          return_related_questions: false,
        });
        const groundedContent = groundedResponse.choices?.[0]?.message?.content ?? '';
        if (groundedContent) content = groundedContent;
      } catch (groundErr: any) {
        console.warn('[API] Detective grounding fallback:', groundErr?.message);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        content,
        citations: Array.isArray(citations) ? citations : [],
        related_questions: Array.isArray(related_questions) ? related_questions : [],
        images: Array.isArray(images) ? images : [],
        evidence,
      },
    });
  } catch (error: any) {
    console.error('[API] Detective message error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// ============================================
// Investigation Threads (Nucigen Intelligence Detective)
// ============================================

function getInvestigationUserId(req: express.Request): string | null {
  return (req.body?.userId as string) || (req.query.userId as string) || (req.headers['x-user-id'] as string) || (req.headers['x-clerk-user-id'] as string) || null;
}

// POST /api/investigations — Create thread
app.post('/api/investigations', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ success: false, error: 'Database not configured' });
    }
    const clerkUserId = getInvestigationUserId(req);
    if (!clerkUserId) {
      return res.status(400).json({ success: false, error: 'User ID required. Send x-clerk-user-id header or userId in body.' });
    }
    const supabaseUserId = await getSupabaseUserId(clerkUserId, supabase);
    if (!supabaseUserId) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }
    const { initial_hypothesis, title, scope } = req.body;
    if (!initial_hypothesis || typeof initial_hypothesis !== 'string') {
      return res.status(400).json({ success: false, error: 'initial_hypothesis required' });
    }
    const scopeVal = scope && ['geopolitics', 'commodities', 'security', 'finance'].includes(scope) ? scope : 'geopolitics';
    const titleVal = title && typeof title === 'string' ? title.trim() : initial_hypothesis.slice(0, 80);
    const { data: thread, error } = await supabase
      .from('investigation_threads')
      .insert({
        user_id: supabaseUserId,
        title: titleVal,
        initial_hypothesis: initial_hypothesis.trim(),
        scope: scopeVal,
        status: 'active',
        confidence_score: null,
        investigative_axes: [],
        blind_spots: [],
      })
      .select()
      .single();
    if (error) {
      console.error('[API] Investigation create error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Database error' });
    }
    // Génération du graphe dès la première question (hypothèse) — comme le knowledge graph Search
    const threadId = thread.id;
    const invTitle = (thread as { title?: string }).title ?? titleVal;
    const invHypothesis = (thread as { initial_hypothesis?: string }).initial_hypothesis ?? initial_hypothesis.trim();
    setImmediate(async () => {
      try {
        const { getOrCreateDetectiveInvestigation } = await import('./services/detective-graph-persistence.js');
        const { runDetectiveIngestion } = await import('./services/detective-ingestion-pipeline.js');
        await getOrCreateDetectiveInvestigation(supabase, threadId, { title: invTitle, hypothesis: invHypothesis });
        await runDetectiveIngestion({
          investigationId: threadId,
          hypothesis: invHypothesis,
          runGraphRebuild: true,
          useSearchGraph: true, // même Knowledge Graph que Search (Tavily → buildGraph), réponse = requête utilisateur
          supabase,
        });
        console.log('[API] Investigation graph generated for', threadId);
      } catch (e: any) {
        console.error('[API] Investigation graph generation (create):', e?.message);
      }
    });
    res.status(200).json({ success: true, thread });
  } catch (err: any) {
    console.error('[API] Investigations create:', err);
    res.status(500).json({ success: false, error: err?.message || 'Internal server error' });
  }
});

// GET /api/investigations — List threads for user
app.get('/api/investigations', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ success: false, error: 'Database not configured' });
    }
    const clerkUserId = getInvestigationUserId(req);
    if (!clerkUserId) {
      return res.status(400).json({ success: false, error: 'User ID required. Send x-clerk-user-id header or userId query.' });
    }
    const supabaseUserId = await getSupabaseUserId(clerkUserId, supabase);
    if (!supabaseUserId) {
      return res.json({ success: true, threads: [] });
    }
    const { data: threads, error } = await supabase
      .from('investigation_threads')
      .select('*')
      .eq('user_id', supabaseUserId)
      .order('updated_at', { ascending: false });
    if (error) {
      console.error('[API] Investigations list error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    res.status(200).json({ success: true, threads: threads || [] });
  } catch (err: any) {
    console.error('[API] Investigations list:', err);
    res.status(500).json({ success: false, error: err?.message || 'Internal server error' });
  }
});

// GET /api/investigations/:threadId — Thread detail + messages + signals
app.get('/api/investigations/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;
    const clerkUserId = getInvestigationUserId(req);
    if (!clerkUserId || !supabase) {
      return res.status(400).json({ success: false, error: 'User ID required' });
    }
    const supabaseUserId = await getSupabaseUserId(clerkUserId, supabase);
    if (!supabaseUserId) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }
    const { data: thread, error: threadError } = await supabase
      .from('investigation_threads')
      .select('*')
      .eq('id', threadId)
      .eq('user_id', supabaseUserId)
      .single();
    if (threadError || !thread) {
      return res.status(404).json({ success: false, error: 'Thread not found' });
    }
    const [messagesRes, signalsRes] = await Promise.all([
      supabase.from('investigation_messages').select('*').eq('thread_id', threadId).order('created_at', { ascending: true }),
      supabase.from('investigation_signals').select('*').eq('thread_id', threadId).order('created_at', { ascending: false }),
    ]);
    const messages = messagesRes.data || [];
    const signals = signalsRes.data || [];
    res.status(200).json({ success: true, thread, messages, signals });
  } catch (err: any) {
    console.error('[API] Investigation get:', err);
    res.status(500).json({ success: false, error: err?.message || 'Internal server error' });
  }
});

// POST /api/investigations/:threadId/messages — Send message, run detective, persist message + signals
app.post('/api/investigations/:threadId/messages', async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content } = req.body;
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ success: false, error: 'content required' });
    }
    const clerkUserId = getInvestigationUserId(req);
    if (!clerkUserId || !supabase) {
      return res.status(400).json({ success: false, error: 'User ID required' });
    }
    const supabaseUserId = await getSupabaseUserId(clerkUserId, supabase);
    if (!supabaseUserId) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const { data: thread } = await supabase
      .from('investigation_threads')
      .select('id, title, initial_hypothesis')
      .eq('id', threadId)
      .eq('user_id', supabaseUserId)
      .single();
    if (!thread) {
      return res.status(404).json({ success: false, error: 'Thread not found' });
    }
    const { data: existingMessages } = await supabase
      .from('investigation_messages')
      .select('role, content')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
    const apiMessages = (existingMessages || []).map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }));
    apiMessages.push({ role: 'user', content: content.trim() });
    const resultsSummary = thread.initial_hypothesis ? `Hypothèse de la piste: ${thread.initial_hypothesis}` : undefined;
    const detectiveRes = await fetch(`${req.protocol}://${req.get('host') || 'localhost:3001'}/api/search/detective/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: apiMessages, resultsSummary, options: { maxScrapeUrls: 3 } }),
    });
    if (!detectiveRes.ok) {
      const errData = await detectiveRes.json().catch(() => ({}));
      return res.status(502).json({ success: false, error: (errData as { error?: string }).error || 'Detective request failed' });
    }
    const detectiveData = await detectiveRes.json();
    const data = detectiveData.data || {};
    const assistantContent = data.content || '';
    const citations = Array.isArray(data.citations) ? data.citations : [];
    const evidence = Array.isArray(data.evidence) ? data.evidence : [];
    const { data: userMsg, error: userMsgErr } = await supabase
      .from('investigation_messages')
      .insert({ thread_id: threadId, role: 'user', content: content.trim(), citations: [] })
      .select()
      .single();
    if (userMsgErr) {
      console.error('[API] Investigation user message insert:', userMsgErr);
    }
    const { data: assistantMsg, error: assistantMsgErr } = await supabase
      .from('investigation_messages')
      .insert({
        thread_id: threadId,
        role: 'assistant',
        content: assistantContent,
        citations,
        evidence_snapshot: evidence,
      })
      .select()
      .single();
    if (assistantMsgErr) {
      console.error('[API] Investigation assistant message insert:', assistantMsgErr);
    }
    const newSignals: any[] = [];
    for (let i = 0; i < evidence.length; i++) {
      const ev = evidence[i];
      const { data: sig } = await supabase
        .from('investigation_signals')
        .insert({
          thread_id: threadId,
          type: 'article',
          source: ev.title || new URL(ev.url).hostname,
          url: ev.url,
          summary: (ev.excerpt || '').slice(0, 500),
          actors: [],
          extracted_facts: [],
          raw_evidence: ev,
        })
        .select()
        .single();
      if (sig) newSignals.push(sig);
    }
    await supabase
      .from('investigation_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', threadId);

    // Pipeline Detective : evidence → claims → graphe (detective_*)
    if (evidence.length > 0 && thread?.title != null && thread?.initial_hypothesis) {
      try {
        const { getOrCreateDetectiveInvestigation } = await import('./services/detective-graph-persistence.js');
        const { runDetectiveIngestion } = await import('./services/detective-ingestion-pipeline.js');
        await getOrCreateDetectiveInvestigation(supabase, threadId, {
          title: thread.title,
          hypothesis: thread.initial_hypothesis,
        });
        const rawTextChunks = evidence.map((ev: { excerpt?: string; content?: string; title?: string; url?: string }) => ({
          text: (ev.excerpt || ev.content || ev.title || '').slice(0, 15000),
          sourceUrl: ev.url,
          sourceName: ev.title,
        }));
        await runDetectiveIngestion({
          investigationId: threadId,
          hypothesis: thread.initial_hypothesis,
          skipTavily: true,
          rawTextChunks,
          runGraphRebuild: true,
          useSearchGraph: true, // même Knowledge Graph que Search ; entrée = preuves de la réponse à la requête utilisateur
          supabase,
        });
      } catch (detectiveErr: any) {
        console.error('[API] Detective pipeline (claims/graph):', detectiveErr?.message);
      }
    }

    res.status(200).json({
      success: true,
      message: assistantMsg || { role: 'assistant', content: assistantContent, citations, evidence_snapshot: evidence },
      newSignals,
    });
  } catch (err: any) {
    console.error('[API] Investigation message:', err);
    res.status(500).json({ success: false, error: err?.message || 'Internal server error' });
  }
});

// GET /api/investigations/:threadId/signals
app.get('/api/investigations/:threadId/signals', async (req, res) => {
  try {
    const { threadId } = req.params;
    const clerkUserId = getInvestigationUserId(req);
    if (!clerkUserId || !supabase) {
      return res.status(400).json({ success: false, error: 'User ID required' });
    }
    const supabaseUserId = await getSupabaseUserId(clerkUserId, supabase);
    if (!supabaseUserId) {
      return res.json({ success: true, signals: [] });
    }
    const { data: thread } = await supabase
      .from('investigation_threads')
      .select('id')
      .eq('id', threadId)
      .eq('user_id', supabaseUserId)
      .single();
    if (!thread) {
      return res.status(404).json({ success: false, error: 'Thread not found' });
    }
    const { data: signals, error } = await supabase
      .from('investigation_signals')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false });
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    res.status(200).json({ success: true, signals: signals || [] });
  } catch (err: any) {
    console.error('[API] Investigation signals:', err);
    res.status(500).json({ success: false, error: err?.message || 'Internal server error' });
  }
});

// GET /api/investigations/:threadId/detective-graph — graphe depuis tables detective_* (nodes, edges, paths)
app.get('/api/investigations/:threadId/detective-graph', async (req, res) => {
  const threadIdParam = req.params.threadId;
  // #region agent log
  // #endregion
  try {
    const { threadId } = req.params;
    const clerkUserId = getInvestigationUserId(req);
    if (!clerkUserId || !supabase) {
      return res.status(400).json({ success: false, error: 'User ID required' });
    }
    const supabaseUserId = await getSupabaseUserId(clerkUserId, supabase);
    if (!supabaseUserId) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }
    const { data: thread } = await supabase
      .from('investigation_threads')
      .select('id')
      .eq('id', threadId)
      .eq('user_id', supabaseUserId)
      .single();
    if (!thread) {
      return res.status(404).json({ success: false, error: 'Thread not found' });
    }
    const { loadGraphForInvestigation } = await import('./services/detective-graph-persistence.js');
    const graph = await loadGraphForInvestigation(supabase, threadId);
    // #region agent log
    // #endregion
    if (!graph) {
      return res.status(200).json({ success: true, graph: null });
    }
    res.status(200).json({ success: true, graph });
  } catch (err: any) {
    console.error('[API] Detective graph:', err);
    res.status(500).json({ success: false, error: err?.message || 'Internal server error' });
  }
});

// POST /api/investigations/:threadId/generate-graph — lance la génération du graphe (Tavily → claims → graph)
app.post('/api/investigations/:threadId/generate-graph', async (req, res) => {
  try {
    const { threadId } = req.params;
    const clerkUserId = getInvestigationUserId(req);
    if (!clerkUserId || !supabase) {
      return res.status(400).json({ success: false, error: 'User ID required' });
    }
    const supabaseUserId = await getSupabaseUserId(clerkUserId, supabase);
    if (!supabaseUserId) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }
    const { data: thread } = await supabase
      .from('investigation_threads')
      .select('id, title, initial_hypothesis')
      .eq('id', threadId)
      .eq('user_id', supabaseUserId)
      .single();
    if (!thread) {
      return res.status(404).json({ success: false, error: 'Thread not found' });
    }
    const hypothesis = (thread as { initial_hypothesis?: string }).initial_hypothesis;
    const title = (thread as { title?: string }).title;
    if (!hypothesis) {
      return res.status(400).json({ success: false, error: 'Thread has no hypothesis' });
    }
    setImmediate(async () => {
      try {
        const { getOrCreateDetectiveInvestigation } = await import('./services/detective-graph-persistence.js');
        const { runDetectiveIngestion } = await import('./services/detective-ingestion-pipeline.js');
        await getOrCreateDetectiveInvestigation(supabase, threadId, { title: title ?? threadId, hypothesis });
        await runDetectiveIngestion({
          investigationId: threadId,
          hypothesis,
          runGraphRebuild: true,
          useSearchGraph: true, // même Knowledge Graph que Search ; graphe issu de la requête utilisateur
          supabase,
        });
        console.log('[API] Investigation graph generated for', threadId);
      } catch (e: any) {
        console.error('[API] Generate graph:', e?.message);
      }
    });
    res.status(200).json({ success: true, message: 'Graph generation started' });
  } catch (err: any) {
    console.error('[API] Generate graph:', err);
    res.status(500).json({ success: false, error: err?.message || 'Internal server error' });
  }
});

// PATCH /api/investigations/:threadId
app.patch('/api/investigations/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;
    const { status, title } = req.body;
    const clerkUserId = getInvestigationUserId(req);
    if (!clerkUserId || !supabase) {
      return res.status(400).json({ success: false, error: 'User ID required' });
    }
    const supabaseUserId = await getSupabaseUserId(clerkUserId, supabase);
    if (!supabaseUserId) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status && ['active', 'dormant', 'closed'].includes(status)) updates.status = status;
    if (title && typeof title === 'string') updates.title = title.trim();
    const { data: thread, error } = await supabase
      .from('investigation_threads')
      .update(updates)
      .eq('id', threadId)
      .eq('user_id', supabaseUserId)
      .select()
      .single();
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    if (!thread) {
      return res.status(404).json({ success: false, error: 'Thread not found' });
    }
    res.status(200).json({ success: true, thread });
  } catch (err: any) {
    console.error('[API] Investigation patch:', err);
    res.status(500).json({ success: false, error: err?.message || 'Internal server error' });
  }
});

// GET /api/investigations/:threadId/brief — Export Intelligence Brief (texte)
app.get('/api/investigations/:threadId/brief', async (req, res) => {
  try {
    const { threadId } = req.params;
    const clerkUserId = getInvestigationUserId(req);
    if (!clerkUserId || !supabase) {
      return res.status(400).json({ success: false, error: 'User ID required' });
    }
    const supabaseUserId = await getSupabaseUserId(clerkUserId, supabase);
    if (!supabaseUserId) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }
    const { data: thread, error: threadError } = await supabase
      .from('investigation_threads')
      .select('*')
      .eq('id', threadId)
      .eq('user_id', supabaseUserId)
      .single();
    if (threadError || !thread) {
      return res.status(404).json({ success: false, error: 'Thread not found' });
    }
    const { data: signals } = await supabase
      .from('investigation_signals')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false });
    const signalsList = (signals || []) as any[];
    const graph = buildGraphFromSignals(thread as any, signalsList);
    const payload = buildBriefingPayload(thread as any, graph);
    const text = formatBriefingPayloadAsText(payload);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="brief-${threadId.slice(0, 8)}.txt"`);
    res.send(text);
  } catch (err: any) {
    console.error('[API] Investigation brief:', err);
    res.status(500).json({ success: false, error: err?.message || 'Internal server error' });
  }
});

// Enrich signal with Perplexity
app.post('/api/signals/:id/enrich', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_preferences } = req.body;

    console.log(`[API] Signal enrichment request for signal: ${id}`);

    // Get signal data (you might want to fetch from database)
    // For now, we'll use the data from the request body
    const { signalTitle, signalSummary, sector, region } = req.body;

    // Ensure we have at least a title and summary
    const finalSignalTitle = signalTitle || 'Signal';
    const finalSignalSummary = signalSummary || 'Signal detected with significant implications';
    
    if (!finalSignalTitle || !finalSignalSummary) {
      return res.status(400).json({
        success: false,
        error: 'signalTitle and signalSummary are required',
      });
    }

    const { enrichSignalWithPerplexity } = await import('./services/perplexity-service.js');
    
    const enrichment = await enrichSignalWithPerplexity({
      signalTitle: finalSignalTitle,
      signalSummary: finalSignalSummary,
      sector,
      region,
      userPreferences: user_preferences,
    });

    res.status(200).json({
      success: true,
      data: enrichment,
    });
  } catch (error: any) {
    console.error('[API] Signal enrichment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// Perplexity health check
app.get('/api/perplexity/health', async (req, res) => {
  try {
    const { checkPerplexityHealth } = await import('./services/perplexity-service.js');
    const isHealthy = await checkPerplexityHealth();
    
    res.json({
      status: isHealthy ? 'ok' : 'unavailable',
      configured: !!process.env.PERPLEXITY_API_KEY,
      message: isHealthy 
        ? 'Perplexity API is configured and working'
        : 'Perplexity API is not configured or not responding',
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'error',
      configured: !!process.env.PERPLEXITY_API_KEY,
      error: error.message || 'Perplexity API check failed',
    });
  }
});

// Overview Narrative endpoint
app.get('/api/overview/narrative', async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    const supabaseUserId = await getSupabaseUserId(req.headers['x-clerk-user-id'] as string || null, supabase);

    // Get events for the timeframe
    const { getNormalizedEvents } = await import('../lib/supabase.js');
    const dateFrom = new Date();
    if (timeframe === '24h') dateFrom.setHours(dateFrom.getHours() - 24);
    else if (timeframe === '7d') dateFrom.setDate(dateFrom.getDate() - 7);
    else if (timeframe === '30d') dateFrom.setDate(dateFrom.getDate() - 30);

    const events = await getNormalizedEvents({
      dateFrom: dateFrom.toISOString(),
      dateTo: new Date().toISOString(),
      limit: 50,
    }, supabaseUserId || undefined);

    // Generate narrative
    const { OverviewNarrativeAgent } = await import('./agents/overview-narrative-agent.js');
    const agent = new OverviewNarrativeAgent();
    const narrative = await agent.generateNarrative({
      events,
      timeframe: timeframe as '24h' | '7d' | '30d',
    });

    res.json({
      success: true,
      data: narrative,
    });
  } catch (error: any) {
    console.error('[API] Overview narrative error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// Intelligence Clustering endpoint
app.post('/api/intelligence/cluster', async (req, res) => {
  try {
    const { events, maxClusters } = req.body;

    if (!events || !Array.isArray(events)) {
      return res.status(400).json({
        success: false,
        error: 'events array is required',
      });
    }

    const { IntelligenceClusterAgent } = await import('./agents/intelligence-cluster-agent.js');
    const agent = new IntelligenceClusterAgent();
    const clusters = await agent.clusterEvents({
      events,
      maxClusters: maxClusters || 10,
    });

    res.json({
      success: true,
      data: clusters,
    });
  } catch (error: any) {
    console.error('[API] Intelligence clustering error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// Signal Explanation endpoint
app.post('/api/signals/:id/explain', async (req, res) => {
  try {
    const { id } = req.params;
    const { signal, relatedEvents } = req.body;

    if (!signal) {
      return res.status(400).json({
        success: false,
        error: 'signal is required',
      });
    }

    const { SignalExplanationAgent } = await import('./agents/signal-explanation-agent.js');
    const agent = new SignalExplanationAgent();
    const explanation = await agent.explainSignal({
      signal,
      relatedEvents: relatedEvents || [],
    });

    res.json({
      success: true,
      data: explanation,
    });
  } catch (error: any) {
    console.error('[API] Signal explanation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// Intelligent Alert endpoint
app.post('/api/alerts/generate', async (req, res) => {
  try {
    const { signal, event, alertType, previousState, threshold } = req.body;

    if (!alertType) {
      return res.status(400).json({
        success: false,
        error: 'alertType is required',
      });
    }

    const { IntelligentAlertAgent } = await import('./agents/intelligent-alert-agent.js');
    const agent = new IntelligentAlertAgent();
    const result = await agent.generateAlert({
      signal,
      event,
      alertType,
      previousState,
      threshold,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[API] Intelligent alert error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// POST /api/alerts - Create user alert rule (from CreateAlertModal)
app.post('/api/alerts', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || (req.body?.userId as string) || (req.headers['x-user-id'] as string);
    const { name, indicator, scenarioTitle, eventId, notificationMethods, threshold } = req.body || {};
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }
    if (!indicator || typeof indicator !== 'string' || !indicator.trim()) {
      return res.status(400).json({ success: false, error: 'indicator is required' });
    }
    if (!supabase) {
      return res.status(503).json({ success: false, error: 'Database not configured' });
    }
    const supabaseUserId = await getSupabaseUserId(userId, supabase);
    if (!supabaseUserId) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }
    const { data, error } = await supabase
      .from('user_alert_rules')
      .insert({
        user_id: supabaseUserId,
        name: (name && typeof name === 'string' ? name.trim() : indicator) || indicator,
        indicator: indicator.trim(),
        scenario_title: scenarioTitle && typeof scenarioTitle === 'string' ? scenarioTitle.trim() : null,
        event_id: eventId && typeof eventId === 'string' ? eventId : null,
        threshold: threshold && typeof threshold === 'string' ? threshold : 'medium',
        notification_methods: notificationMethods && typeof notificationMethods === 'object' ? notificationMethods : { email: true, inApp: true, webhook: false },
      })
      .select('id')
      .single();
    if (error) {
      console.error('[API] Create alert rule error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    res.status(201).json({ success: true, id: data?.id, message: 'Alert created' });
  } catch (error: any) {
    console.error('[API] Create alert error:', error);
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

// Impact Exposure endpoint
app.post('/api/impacts/exposure', async (req, res) => {
  try {
    const { signal, relatedEvents } = req.body;

    if (!signal) {
      return res.status(400).json({
        success: false,
        error: 'signal is required',
      });
    }

    const { ImpactExposureAgent } = await import('./agents/impact-exposure-agent.js');
    const agent = new ImpactExposureAgent();
    const exposures = await agent.mapExposure({
      signal,
      relatedEvents: relatedEvents || [],
    });

    res.json({
      success: true,
      data: exposures,
    });
  } catch (error: any) {
    console.error('[API] Impact exposure error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// Helper function getSupabaseUserId is now imported from ./utils/auth-helpers.js

// ============================================
// Optional Endpoints - Overview
// ============================================

// GET /api/overview/kpis - KPIs for Overview page
app.get('/api/overview/kpis', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
    const range = (req.query.range as string) || '24h';

    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'Supabase not configured',
      });
    }

    const supabaseUserId = userId ? await getSupabaseUserId(userId, supabase) : null;

    // Import Supabase functions
    const { getNormalizedEvents, getSignalsFromEvents } = await import('../lib/supabase.js');

    // Calculate date range
    const now = new Date();
    let dateFrom: Date;
    let dateTo = now;

    if (range === '24h') {
      dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (range === '7d') {
      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get events and signals
    const [events24h, signals24h, eventsPrev, signalsPrev] = await Promise.all([
      getNormalizedEvents({ dateFrom: dateFrom.toISOString(), dateTo: dateTo.toISOString() }, supabaseUserId || undefined),
      getSignalsFromEvents({ dateFrom: dateFrom.toISOString(), dateTo: dateTo.toISOString() }, supabaseUserId || undefined),
      getNormalizedEvents({
        dateFrom: new Date(dateFrom.getTime() - (dateTo.getTime() - dateFrom.getTime())).toISOString(),
        dateTo: dateFrom.toISOString(),
      }, supabaseUserId || undefined),
      getSignalsFromEvents({
        dateFrom: new Date(dateFrom.getTime() - (dateTo.getTime() - dateFrom.getTime())).toISOString(),
        dateTo: dateFrom.toISOString(),
      }, supabaseUserId || undefined),
    ]);

    // Calculate trends (last 7 days)
    const trendDataEvents = await Promise.all(
      Array.from({ length: 7 }, async (_, i) => {
        const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        const dayEvents = await getNormalizedEvents(
          {
            dateFrom: new Date(date.setHours(0, 0, 0, 0)).toISOString(),
            dateTo: new Date(date.setHours(23, 59, 59, 999)).toISOString(),
          },
          supabaseUserId || undefined
        );
        return dayEvents.length;
      })
    );

    const trendDataSignals = await Promise.all(
      Array.from({ length: 7 }, async (_, i) => {
        const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        const daySignals = await getSignalsFromEvents(
          {
            dateFrom: new Date(date.setHours(0, 0, 0, 0)).toISOString(),
            dateTo: new Date(date.setHours(23, 59, 59, 999)).toISOString(),
          },
          supabaseUserId || undefined
        );
        return daySignals.length;
      })
    );

    // Calculate deltas
    const deltaEvents = events24h.length > 0 && eventsPrev.length > 0
      ? ((events24h.length - eventsPrev.length) / eventsPrev.length) * 100
      : 0;

    const deltaSignals = signals24h.length > 0 && signalsPrev.length > 0
      ? ((signals24h.length - signalsPrev.length) / signalsPrev.length) * 100
      : 0;

    // Get high-impact impacts (7d) - using signals with high impact as proxy
    const impacts7d = await getSignalsFromEvents(
      {
        dateFrom: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        dateTo: now.toISOString(),
        minImpact: 70,
      },
      supabaseUserId || undefined
    );

    res.json({
      success: true,
      data: {
        events_24h: {
          count: events24h.length,
          delta: deltaEvents,
          trend: trendDataEvents,
        },
        signals_24h: {
          count: signals24h.length,
          delta: deltaSignals,
          trend: trendDataSignals,
        },
        high_impact_impacts_7d: {
          count: impacts7d.length,
          delta: 0,
          trend: Array.from({ length: 7 }, () => Math.floor(Math.random() * 5)),
        },
        watchlist_volatility: {
          value: '0%',
          delta: 0,
          trend: Array.from({ length: 7 }, () => Math.floor(Math.random() * 25) + 10),
        },
      },
    });
  } catch (error: any) {
    console.error('[API] Overview KPIs error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// GET /api/overview/narrative - Narrative for Overview page
app.get('/api/overview/narrative', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
    const range = (req.query.range as string) || '24h';

    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'Supabase not configured',
      });
    }

    const supabaseUserId = userId ? await getSupabaseUserId(userId, supabase) : null;

    // Import Supabase functions
    const { getNormalizedEvents, getSignalsFromEvents } = await import('../lib/supabase.js');

    // Calculate date range
    const now = new Date();
    let dateFrom: Date;
    if (range === '24h') {
      dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (range === '7d') {
      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get recent events and signals
    const [events, signals] = await Promise.all([
      getNormalizedEvents({ dateFrom: dateFrom.toISOString(), dateTo: now.toISOString(), limit: 10 }, supabaseUserId || undefined),
      getSignalsFromEvents({ dateFrom: dateFrom.toISOString(), dateTo: now.toISOString(), limit: 5 }, supabaseUserId || undefined),
    ]);

    // Generate narrative bullets from events
    const bullets: string[] = [];
    if (events.length > 0) {
      const sectors = new Set(events.map(e => e.sector).filter(Boolean));
      const regions = new Set(events.map(e => e.region).filter(Boolean));
      
      if (sectors.size > 0) {
        bullets.push(`Multiple events detected across ${sectors.size} sector${sectors.size > 1 ? 's' : ''}.`);
      }
      if (regions.size > 0) {
        bullets.push(`Geopolitical activity in ${regions.size} region${regions.size > 1 ? 's' : ''}.`);
      }
      if (events.length > 5) {
        bullets.push(`High event volume: ${events.length} events in the last ${range}.`);
      }
    }

    // Get linked events, tickers, and signals
    const linkedEvents = events.slice(0, 3).map(e => ({
      id: e.id,
      headline: e.summary || 'Event',
    }));

    const linkedTickers: Array<{ symbol: string; name: string }> = [];
    // Extract tickers from events if available
    events.forEach(e => {
      if (e.actors && e.actors.length > 0) {
        // Try to extract ticker symbols from actors (simplified)
        e.actors.forEach(actor => {
          if (actor.length <= 5 && /^[A-Z]+$/.test(actor)) {
            linkedTickers.push({ symbol: actor, name: `${actor} Inc.` });
          }
        });
      }
    });

    const linkedSignal = signals.length > 0 ? {
      id: signals[0].id,
      title: signals[0].title || 'Signal',
    } : null;

    res.json({
      success: true,
      data: {
        bullets: bullets.length > 0 ? bullets : ['No significant activity detected.'],
        linked_events: linkedEvents,
        linked_tickers: linkedTickers.slice(0, 5),
        linked_signal: linkedSignal,
      },
    });
  } catch (error: any) {
    console.error('[API] Overview narrative error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// GET /api/market-digest - Short daily market summary (Perplexity)
app.get('/api/market-digest', async (req, res) => {
  try {
    const useCache = (req.query.cache as string) !== 'false';
    const { getMarketDigest } = await import('./services/market-digest-service.js');
    const digest = await getMarketDigest(useCache);
    if (!digest) {
      return res.json({ success: true, data: null, message: 'Market digest temporarily unavailable' });
    }
    res.json({ success: true, data: digest });
  } catch (error: any) {
    console.error('[API] Market digest error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch market digest' });
  }
});

// GET /api/news/realtime — Phase 3: optional Newsfilter recent articles (set NEWSFILTER_API_KEY)
app.get('/api/news/realtime', async (req, res) => {
  try {
    const limit = Math.min(parseInt((req.query.limit as string) || '15', 10) || 15, 50);
    const { fetchNewsfilterRecent } = await import('./services/newsfilter-service.js');
    const articles = await fetchNewsfilterRecent(limit);
    res.json({ success: true, data: articles, source: 'newsfilter' });
  } catch (error: any) {
    console.error('[API] News realtime error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch realtime news' });
  }
});

// GET /api/openbb/fundamentals/:symbol — Phase 3: optional OpenBB Platform adapter (set OPENBB_API_URL)
app.get('/api/openbb/fundamentals/:symbol', async (req, res) => {
  try {
    const symbol = (req.params.symbol || '').trim();
    if (!symbol) {
      return res.status(400).json({ success: false, error: 'Symbol is required' });
    }
    if (!process.env.OPENBB_API_URL) {
      return res.json({
        success: true,
        data: null,
        message: 'OpenBB adapter not configured. Set OPENBB_API_URL to your OpenBB Platform API base URL.',
      });
    }
    const { fetchOpenBBFundamentals } = await import('./services/openbb-adapter-service.js');
    const data = await fetchOpenBBFundamentals(symbol);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('[API] OpenBB fundamentals error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch OpenBB data' });
  }
});

// GET /api/overview/map - Global Situation map data (signals + top events + top corporate impacts)
// Query params: dateRange (24h|7d|30d), scopeMode (global|watchlist), q (search)
app.get('/api/overview/map', async (req, res) => {
  try {
    const dateRange = (req.query.dateRange as string) || '24h';
    const scopeMode = (req.query.scopeMode as string) || 'global';
    const q = (req.query.q as string) || '';

    // V1: static fixture. Later: derive from getNormalizedEvents/getSignalsFromEvents with geo resolution.
    const now = new Date().toISOString();
    const signals = [
      { id: '1', lat: -2.5, lon: 28.8, type: 'security', impact: 'regional', importance: 85, confidence: 82, occurred_at: now, label_short: 'DRC – North Kivu', subtitle_short: 'ADF activity escalation', impact_one_line: 'Gold supply risk', investigate_id: '/investigations' },
      { id: '2', lat: 25.2, lon: 55.3, type: 'supply-chains', impact: 'global', importance: 78, confidence: 76, occurred_at: now, label_short: 'UAE – Dubai', subtitle_short: 'Gold trade hub disruption', impact_one_line: 'Precious metals flow', investigate_id: '/investigations' },
      { id: '3', lat: 51.5, lon: -0.1, type: 'geopolitics', impact: 'global', importance: 90, confidence: 94, occurred_at: now, label_short: 'UK – London', subtitle_short: 'Sanctions policy update', impact_one_line: 'Financial compliance', investigate_id: '/investigations' },
      { id: '4', lat: 55.7, lon: 37.6, type: 'energy', impact: 'regional', importance: 72, confidence: 88, occurred_at: now, label_short: 'Russia – Moscow', subtitle_short: 'Energy export reconfiguration', impact_one_line: 'Gas supply routes', investigate_id: '/investigations' },
      { id: '5', lat: 39.9, lon: 116.4, type: 'supply-chains', impact: 'global', importance: 80, confidence: 79, occurred_at: now, label_short: 'China – Beijing', subtitle_short: 'Strategic minerals stockpiling', impact_one_line: 'Rare earth dominance', investigate_id: '/investigations' },
      { id: '6', lat: 40.7, lon: -74.0, type: 'markets', impact: 'global', importance: 88, confidence: 91, occurred_at: now, label_short: 'USA – New York', subtitle_short: 'Financial markets volatility', impact_one_line: 'Commodity futures', investigate_id: '/investigations' },
    ];
    const top_events = [
      { id: '1', label_short: 'DRC – North Kivu', impact_one_line: 'Gold supply risk', investigate_id: '/investigations', type: 'security' as const },
      { id: '2', label_short: 'UAE – Dubai', impact_one_line: 'Precious metals flow', investigate_id: '/investigations', type: 'supply-chains' as const },
      { id: '3', label_short: 'UK – London', impact_one_line: 'Financial compliance', investigate_id: '/investigations', type: 'geopolitics' as const },
    ];
    const top_impacts = [
      { name: 'Barrick Gold', impact_one_line: 'Production disruption', investigate_id: '/investigations' },
      { name: 'Gazprom', impact_one_line: 'Route reconfiguration', investigate_id: '/investigations' },
      { name: 'HSBC', impact_one_line: 'Compliance costs', investigate_id: '/investigations' },
    ];

    // Filter by search query if provided
    const filterByQ = (items: { label_short?: string; name?: string }[]) =>
      !q.trim() ? items : items.filter((item) => {
        const text = (item.label_short || item.name || '').toLowerCase();
        return text.includes(q.toLowerCase());
      });

    const data = {
      signals: filterByQ(signals),
      top_events: filterByQ(top_events),
      top_impacts,
    };
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('[API] Overview map error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// GET /api/alerts/triggered - Triggered alerts
app.get('/api/alerts/triggered', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
    const range = (req.query.range as string) || '7d';
    const limit = parseInt((req.query.limit as string) || '8', 10);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'Supabase not configured',
      });
    }

    const supabaseUserId = await getSupabaseUserId(userId, supabase);
    if (!supabaseUserId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID',
      });
    }

    // Calculate date range
    const now = new Date();
    let dateFrom: Date;
    if (range === '24h') {
      dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (range === '7d') {
      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get user alerts
    const { data: alerts, error } = await supabase
      .from('user_alerts')
      .select(`
        id,
        alert_type,
        priority,
        match_reasons,
        status,
        created_at,
        nucigen_events (
          id,
          summary,
          event_type,
          sector,
          region,
          impact_score,
          confidence
        )
      `)
      .eq('user_id', supabaseUserId)
      .gte('created_at', dateFrom.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[API] Error fetching alerts:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch alerts',
      });
    }

    res.json({
      success: true,
      data: {
        alerts: (alerts || []).map(alert => ({
          id: alert.id,
          title: (alert.nucigen_events as any)?.summary || 'Alert',
          severity: alert.priority,
          triggered_at: alert.created_at,
          related_event_id: (alert.nucigen_events as any)?.id,
          alert_type: alert.alert_type,
          match_reasons: alert.match_reasons,
        })),
      },
    });
  } catch (error: any) {
    console.error('[API] Triggered alerts error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// ============================================
// Optional Endpoints - Events
// ============================================

// GET /api/events - List events with filters
app.get('/api/events', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
    const {
      dateFrom,
      dateTo,
      region,
      sector,
      eventType,
      source_type,
      confidence_min,
      confidence_max,
      limit = 20,
      offset = 0,
    } = req.query;

    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'Supabase not configured',
      });
    }

    const supabaseUserId = userId ? await getSupabaseUserId(userId, supabase) : null;

    // Import Supabase functions
    const { getNormalizedEvents } = await import('../lib/supabase.js');

    const options: any = {
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    };

    if (dateFrom) options.dateFrom = dateFrom as string;
    if (dateTo) options.dateTo = dateTo as string;
    if (region) options.region = region as string;
    if (sector) options.sector = sector as string;
    if (eventType) options.eventType = eventType as string;
    if (confidence_min) options.minConfidence = parseFloat(confidence_min as string);
    if (confidence_max) options.maxConfidence = parseFloat(confidence_max as string);

    const events = await getNormalizedEvents(options, supabaseUserId || undefined);

    res.json({
      success: true,
      data: {
        events,
        total: events.length,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      },
    });
  } catch (error: any) {
    console.error('[API] Events list error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// GET /api/events/:id/context - Event context
app.get('/api/events/:id/context', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);

    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'Supabase not configured',
      });
    }

    const supabaseUserId = userId ? await getSupabaseUserId(userId, supabase) : null;

    // Get event
    const { getNormalizedEventById } = await import('../lib/supabase.js');
    const event = await getNormalizedEventById(id, supabaseUserId || undefined);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    // Get related entities (from actors)
    const relatedEntities = event.actors?.map(actor => ({
      id: actor.toLowerCase().replace(/\s+/g, '-'),
      name: actor,
      type: 'company' as const,
    })) || [];

    // Get related assets (extract from actors if they look like tickers)
    const relatedAssets = event.actors?.filter(actor => 
      actor.length <= 5 && /^[A-Z]+$/.test(actor)
    ).map(symbol => ({
      symbol,
      name: `${symbol} Inc.`,
    })) || [];

    // Get similar events (same sector or region)
    const { getNormalizedEvents } = await import('../lib/supabase.js');
    const similarEvents = await getNormalizedEvents({
      sector: event.sector || undefined,
      region: event.region || undefined,
      limit: 5,
    }, supabaseUserId || undefined);

    res.json({
      success: true,
      data: {
        related_entities: relatedEntities,
        related_assets: relatedAssets,
        similar_events: similarEvents.filter(e => e.id !== id).slice(0, 5).map(e => ({
          id: e.id,
          headline: e.summary || 'Event',
        })),
      },
    });
  } catch (error: any) {
    console.error('[API] Event context error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// GET /api/events/:eventId/predictions - Get or generate scenario prediction for an event
app.get('/api/events/:eventId/predictions', async (req, res) => {
  try {
    const eventId = req.params.eventId as string;
    const tier = (req.query.tier as string) || 'standard';
    if (!eventId) {
      return res.status(400).json({ success: false, error: 'eventId is required' });
    }
    const { generatePrediction } = await import('./services/prediction-engine.js');
    const tierVal = tier === 'fast' || tier === 'deep' ? tier : 'standard';
    const result = await generatePrediction({ event_id: eventId, tier: tierVal });
    if (!result.success) {
      const status = result.error?.includes('not found') ? 404 : 500;
      return res.status(status).json({
        success: false,
        error: result.error || 'Failed to load prediction',
      });
    }
    return res.json({
      success: true,
      prediction: result.prediction,
      from_cache: result.from_cache || false,
    });
  } catch (error: any) {
    console.error('[API] Event predictions GET error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// POST /api/events/:eventId/predictions - Force refresh scenario prediction
app.post('/api/events/:eventId/predictions', async (req, res) => {
  try {
    const eventId = req.params.eventId as string;
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const tier = (body.tier as string) || (req.query.tier as string) || 'standard';
    if (!eventId) {
      return res.status(400).json({ success: false, error: 'eventId is required' });
    }
    const { generatePrediction } = await import('./services/prediction-engine.js');
    const result = await generatePrediction({
      event_id: eventId,
      tier: tier as 'fast' | 'standard' | 'deep',
      force_refresh: true,
    });
    if (!result.success) {
      const status = result.error?.includes('not found') ? 404 : 500;
      return res.status(status).json({
        success: false,
        error: result.error || 'Failed to generate prediction',
      });
    }
    return res.json({
      success: true,
      prediction: result.prediction,
      from_cache: false,
    });
  } catch (error: any) {
    console.error('[API] Event predictions POST error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// ============================================
// Optional Endpoints - Signals
// ============================================

// GET /api/signals - List signals with filters
app.get('/api/signals', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
    const {
      dateFrom,
      dateTo,
      scope,
      horizon,
      min_impact,
      min_confidence,
      theme,
      sector,
      region,
      limit = 20,
      offset = 0,
    } = req.query;

    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'Supabase not configured',
      });
    }

    const supabaseUserId = userId ? await getSupabaseUserId(userId, supabase) : null;

    // Import Supabase functions
    const { getSignalsFromEvents } = await import('../lib/supabase.js');

    const options: any = {
      limit: parseInt(limit as string, 10),
    };

    if (dateFrom) options.dateFrom = dateFrom as string;
    if (dateTo) options.dateTo = dateTo as string;
    if (scope) options.scope = scope as string;
    if (horizon) options.horizon = horizon as string;
    if (min_impact) options.minImpact = parseFloat(min_impact as string);
    if (min_confidence) options.minConfidence = parseFloat(min_confidence as string);
    if (sector) options.sector = sector as string;
    if (region) options.region = region as string;

    const signals = await getSignalsFromEvents(options, supabaseUserId || undefined);

    // Apply offset manually
    const paginatedSignals = signals.slice(parseInt(offset as string, 10));

    res.json({
      success: true,
      data: {
        signals: paginatedSignals,
        total: signals.length,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      },
    });
  } catch (error: any) {
    console.error('[API] Signals list error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// GET /api/signals/:id - Signal detail
app.get('/api/signals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);

    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'Supabase not configured',
      });
    }

    const supabaseUserId = userId ? await getSupabaseUserId(userId, supabase) : null;

    // Import Supabase functions
    const { getSignalsFromEvents } = await import('../lib/supabase.js');

    // Get all signals and find the one with matching ID
    const signals = await getSignalsFromEvents({ limit: 1000 }, supabaseUserId || undefined);
    const signal = signals.find(s => s.id === id);

    if (!signal) {
      return res.status(404).json({
        success: false,
        error: 'Signal not found',
      });
    }

    // Get related events
    const { getNormalizedEvents } = await import('../lib/supabase.js');
    const relatedEvents = signal.related_event_ids 
      ? await Promise.all(
          signal.related_event_ids.map(eventId => 
            getNormalizedEvents({ limit: 1 }, supabaseUserId || undefined).then(events => 
              events.find(e => e.id === eventId)
            )
          )
        )
      : [];

    res.json({
      success: true,
      data: {
        ...signal,
        evidence_graph: {
          nodes: [
            ...(signal.related_event_ids || []).map(eid => ({ id: eid, type: 'event' })),
            ...(signal.related_assets || []).map(asset => ({ id: asset, type: 'asset' })),
          ],
          edges: (signal.related_event_ids || []).map(eid => ({
            from: eid,
            to: signal.id,
            type: 'linked_by',
          })),
        },
        market_validation: {
          assets: (signal.related_assets || []).map(asset => ({
            symbol: asset,
            correlation: 0.75, // Placeholder
            sparkline_data: Array.from({ length: 10 }, () => Math.random() * 100),
          })),
          note: 'validation based on price/volume changes, not causality',
        },
      },
    });
  } catch (error: any) {
    console.error('[API] Signal detail error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// ============================================
// Optional Endpoints - Impacts
// ============================================

// GET /api/impacts - List impacts with filters
app.get('/api/impacts', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
    const {
      probability_min,
      magnitude_min,
      timeframe,
      sector,
      region,
      limit = 20,
      offset = 0,
    } = req.query;

    // Note: Impacts are generated on-demand via POST /api/impacts
    // This endpoint returns a placeholder response
    res.json({
      success: true,
      data: {
        impacts: [],
        total: 0,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      },
      message: 'Impacts are generated on-demand. Use POST /api/impacts with signals to generate impacts.',
    });
  } catch (error: any) {
    console.error('[API] Impacts list error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// GET /api/impacts/:id - Impact detail
app.get('/api/impacts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Note: Impacts are generated on-demand via POST /api/impacts
    // This endpoint returns a placeholder response
    res.status(404).json({
      success: false,
      error: 'Impact not found. Impacts are generated on-demand. Use POST /api/impacts with signals to generate impacts.',
    });
  } catch (error: any) {
    console.error('[API] Impact detail error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// ============================================
// Optional Endpoints - Watchlists & Entities
// ============================================

// GET /api/watchlists - User watchlists
app.get('/api/watchlists', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || (req.headers['x-clerk-user-id'] as string);

    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'Supabase not configured',
      });
    }

    if (!userId) {
      return res.json({ success: true, data: [] });
    }

    const supabaseUserId = await getSupabaseUserId(userId, supabase);
    if (!supabaseUserId) {
      return res.json({ success: true, data: [] });
    }

    const { data: rows, error } = await supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', supabaseUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] Watchlists error:', error);
      return res.json({ success: true, data: [] });
    }

    res.json({ success: true, data: rows || [] });
  } catch (error: any) {
    console.error('[API] Watchlists error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// GET /api/entities - Entities
app.get('/api/entities', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
    const {
      type,
      search,
      limit = 20,
      offset = 0,
    } = req.query;

    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'Supabase not configured',
      });
    }

    const supabaseUserId = userId ? await getSupabaseUserId(userId, supabase) : null;

    // Get entities from events (actors)
    const { getNormalizedEvents } = await import('../lib/supabase.js');
    const events = await getNormalizedEvents({ limit: 100 }, supabaseUserId || undefined);

    // Extract unique entities from actors
    const entityMap = new Map<string, { name: string; type: string; last_mention: string; linked_assets: string[] }>();
    
    events.forEach(event => {
      event.actors?.forEach(actor => {
        if (!entityMap.has(actor)) {
          const isTicker = actor.length <= 5 && /^[A-Z]+$/.test(actor);
          entityMap.set(actor, {
            name: actor,
            type: isTicker ? 'asset' : 'company',
            last_mention: event.created_at,
            linked_assets: isTicker ? [actor] : [],
          });
        } else {
          const existing = entityMap.get(actor)!;
          if (new Date(event.created_at) > new Date(existing.last_mention)) {
            existing.last_mention = event.created_at;
          }
        }
      });
    });

    let entities = Array.from(entityMap.entries()).map(([name, data]) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name: data.name,
      type: data.type,
      last_mention: data.last_mention,
      linked_assets: data.linked_assets,
    }));

    // Apply filters
    if (type) {
      entities = entities.filter(e => e.type === type);
    }
    if (search) {
      const searchLower = (search as string).toLowerCase();
      entities = entities.filter(e => e.name.toLowerCase().includes(searchLower));
    }

    // Apply pagination
    const paginatedEntities = entities.slice(
      parseInt(offset as string, 10),
      parseInt(offset as string, 10) + parseInt(limit as string, 10)
    );

    res.json({
      success: true,
      data: {
        entities: paginatedEntities,
        total: entities.length,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      },
    });
  } catch (error: any) {
    console.error('[API] Entities error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// ============================================
// Optional Endpoints (for performance optimization)
// ============================================

/**
 * Helper function to filter events by date range
 */
function filterEventsByDateRange<T extends { created_at: string }>(
  events: T[],
  dateFrom?: string,
  dateTo?: string
): T[] {
  if (!dateFrom && !dateTo) {
    return events;
  }

  return events.filter((event) => {
    const eventDate = new Date(event.created_at);
    if (dateFrom && eventDate < new Date(dateFrom)) {
      return false;
    }
    if (dateTo && eventDate > new Date(dateTo)) {
      return false;
    }
    return true;
  });
}

// GET /api/overview/kpis - KPIs for Overview page
app.get('/api/overview/kpis', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || (req.body?.userId as string) || null;
    const supabaseUserId = userId ? await getSupabaseUserId(userId, supabase) : null;

    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase not configured',
      });
    }

    // Import functions dynamically
    const { getNormalizedEvents, getSignalsFromEvents } = await import('../lib/supabase.js');

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get events and signals (will filter by date after)
    const [allEvents24h, allSignals24h, allEventsPrev24h, allSignalsPrev24h] = await Promise.all([
      getNormalizedEvents({}, userId || undefined),
      getSignalsFromEvents({}, userId || undefined),
      getNormalizedEvents({}, userId || undefined),
      getSignalsFromEvents({}, userId || undefined),
    ]);

    // Filter by date range
    const events24h = filterEventsByDateRange(allEvents24h, last24h.toISOString(), now.toISOString());
    const signals24h = allSignals24h.filter((s: any) => {
      // Filter signals based on their related events' dates
      return true; // Signals don't have created_at, use all for now
    });
    const eventsPrev24h = filterEventsByDateRange(allEventsPrev24h, last48h.toISOString(), last24h.toISOString());
    const signalsPrev24h = allSignalsPrev24h; // Same as above

    // Calculate trends (last 7 days) - use all events and filter by date
    const allEventsForTrend = await getNormalizedEvents({}, userId || undefined);
    const trendDataEvents = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      const dayEvents = filterEventsByDateRange(allEventsForTrend, dayStart.toISOString(), dayEnd.toISOString());
      return dayEvents.length;
    });

    const allSignalsForTrend = await getSignalsFromEvents({}, userId || undefined);
    const trendDataSignals = Array.from({ length: 7 }, () => {
      // Signals don't have dates, use approximate count
      return Math.floor(allSignalsForTrend.length / 7);
    });

    // Get high-impact impacts (7d) - using signals with high impact as proxy
    const allSignals7d = await getSignalsFromEvents({}, userId || undefined);
    const impacts7d = allSignals7d.filter((s: any) => (s.impact_score || 0) >= 70);

    // Calculate deltas
    const deltaEvents = events24h.length > 0 && eventsPrev24h.length > 0
      ? ((events24h.length - eventsPrev24h.length) / eventsPrev24h.length) * 100
      : 0;

    const deltaSignals = signals24h.length > 0 && signalsPrev24h.length > 0
      ? ((signals24h.length - signalsPrev24h.length) / signalsPrev24h.length) * 100
      : 0;

    // Watchlist volatility (placeholder - TODO: implement when watchlist is ready)
    const watchlistVolatility = 0;

    res.json({
      success: true,
      data: {
        events_24h: {
          count: events24h.length,
          delta: deltaEvents,
          trend: trendDataEvents,
        },
        signals_24h: {
          count: signals24h.length,
          delta: deltaSignals,
          trend: trendDataSignals,
        },
        high_impact_impacts_7d: {
          count: impacts7d.length,
          delta: 0,
          trend: Array.from({ length: 7 }, () => Math.floor(Math.random() * 5)),
        },
        watchlist_volatility: {
          value: `${watchlistVolatility}%`,
          delta: 0,
          trend: Array.from({ length: 7 }, () => Math.floor(Math.random() * 25) + 10),
        },
      },
    });
  } catch (error: any) {
    console.error('[API] Overview KPIs error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// GET /api/overview/narrative - Narrative for Overview page
app.get('/api/overview/narrative', async (req, res) => {
  try {
    const range = (req.query.range as string) || '24h';
    const userId = (req.query.userId as string) || (req.body?.userId as string) || null;

    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase not configured',
      });
    }

    // Import functions dynamically
    const { getNormalizedEvents, getSignalsFromEvents } = await import('../lib/supabase.js');

    const now = new Date();
    const hours = range === '24h' ? 24 : range === '7d' ? 168 : 24;
    const dateFrom = new Date(now.getTime() - hours * 60 * 60 * 1000);

    // Get recent events and signals (filter by date after)
    const [allEvents, allSignals] = await Promise.all([
      getNormalizedEvents({}, userId || undefined),
      getSignalsFromEvents({}, userId || undefined),
    ]);

    // Filter by date range
    const events = filterEventsByDateRange(allEvents, dateFrom.toISOString(), now.toISOString());
    const signals = allSignals; // Signals don't have dates

    // Generate narrative bullets (factual aggregation)
    const bullets: string[] = [];
    if (events.length > 0) {
      const sectors = new Set(events.map(e => e.sector).filter(Boolean));
      if (sectors.size > 0) {
        bullets.push(`Multiple events detected across ${sectors.size} sector${sectors.size > 1 ? 's' : ''}.`);
      }
    }
    if (signals.length > 0) {
      bullets.push(`${signals.length} signal${signals.length > 1 ? 's' : ''} identified in the last ${range}.`);
    }

    // Get linked events (top 3)
    const linkedEvents = events.slice(0, 3).map(e => ({
      id: e.id,
      headline: e.headline || e.summary?.substring(0, 100) || 'Event',
    }));

    // Get linked tickers (from events with assets)
    const linkedTickers: Array<{ symbol: string; name: string }> = [];
    // TODO: Extract from events when asset linking is implemented

    // Get top signal
    const topSignal = signals.length > 0
      ? { id: signals[0].id, title: signals[0].title || 'Signal' }
      : null;

    res.json({
      success: true,
      data: {
        bullets: bullets.length > 0 ? bullets : ['No significant activity detected.'],
        linked_events: linkedEvents,
        linked_tickers: linkedTickers,
        linked_signal: topSignal,
      },
    });
  } catch (error: any) {
    console.error('[API] Overview narrative error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// GET /api/markets/movers - Market movers
app.get('/api/markets/movers', async (req, res) => {
  try {
    const range = (req.query.range as string) || '24h';
    const limit = parseInt((req.query.limit as string) || '8', 10);

    // Common symbols to track
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'SPY', 'QQQ'];

    const moversData = await Promise.all(
      symbols.slice(0, limit).map(async (symbol) => {
        try {
          const priceData = await getRealTimePrice(symbol);
          
          // Calculate start_date and end_date for timeseries
          const endDate = new Date();
          const startDate = new Date();
          if (range === '24h') {
            startDate.setDate(startDate.getDate() - 1);
          } else if (range === '7d') {
            startDate.setDate(startDate.getDate() - 7);
          } else {
            startDate.setDate(startDate.getDate() - 1);
          }
          
          const timeseriesData = await getTimeSeries(symbol, {
            interval: '1h',
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
          });

          let sparklineData: number[] = [];
          if (timeseriesData && timeseriesData.values) {
            sparklineData = timeseriesData.values
              .slice(-24) // Last 24 hours
              .map((point: any) => parseFloat(point.close || point.price || 0));
          }

          return {
            symbol,
            name: `${symbol} Inc.`, // TODO: Get real name from API
            change_percent: priceData.change_percent || 0,
            volume: priceData.volume || 0,
            sparkline_data: sparklineData.length > 0 ? sparklineData : [],
          };
        } catch (error: any) {
          console.warn(`[API] Failed to fetch data for ${symbol}:`, error.message);
          return null;
        }
      })
    );

    // Filter out nulls and sort by change_percent
    const movers = moversData
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .sort((a, b) => Math.abs(b.change_percent) - Math.abs(a.change_percent));

    res.json({
      success: true,
      data: {
        movers,
      },
    });
  } catch (error: any) {
    console.error('[API] Market movers error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// GET /api/alerts/triggered - Triggered alerts
app.get('/api/alerts/triggered', async (req, res) => {
  try {
    const range = (req.query.range as string) || '7d';
    const limit = parseInt((req.query.limit as string) || '8', 10);
    const userId = (req.query.userId as string) || (req.body?.userId as string) || null;

    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase not configured',
      });
    }

    const supabaseUserId = userId ? await getSupabaseUserId(userId, supabase) : null;

    const now = new Date();
    const days = range === '7d' ? 7 : range === '24h' ? 1 : 7;
    const dateFrom = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

    // Query user_alerts table
    let query = supabase
      .from('user_alerts')
      .select('id, alert_type, severity, message, related_event_id, related_signal_id, triggered_at, read_at')
      .gte('triggered_at', dateFrom)
      .order('triggered_at', { ascending: false })
      .limit(limit);

    if (supabaseUserId) {
      query = query.eq('user_id', supabaseUserId);
    }

    const { data: alerts, error } = await query;

    if (error) {
      throw new Error(error.message || 'Failed to fetch alerts');
    }

    res.json({
      success: true,
      data: {
        alerts: (alerts || []).map((alert: any) => ({
          id: alert.id,
          title: alert.message || 'Alert',
          severity: alert.severity || 'moderate',
          triggered_at: alert.triggered_at,
          related_event_id: alert.related_event_id,
          related_signal_id: alert.related_signal_id,
          read: !!alert.read_at,
        })),
      },
    });
  } catch (error: any) {
    console.error('[API] Triggered alerts error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// GET /api/events - List events with filters
app.get('/api/events', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || (req.body?.userId as string) || null;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;
    const region = req.query.region as string;
    const sector = req.query.sector as string;
    const eventType = req.query.eventType as string;
    const source_type = req.query.source_type as string;
    const confidence_min = req.query.confidence_min ? parseFloat(req.query.confidence_min as string) : undefined;
    const confidence_max = req.query.confidence_max ? parseFloat(req.query.confidence_max as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const search = req.query.search as string;

    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase not configured',
      });
    }

    // Import functions dynamically
    const { getNormalizedEvents } = await import('../lib/supabase.js');

    const options: any = {};
    if (region) options.regionFilter = [region];
    if (sector) options.sectorFilter = [sector];
    if (eventType) options.eventTypeFilter = [eventType];
    if (confidence_min !== undefined) options.minImpactScore = confidence_min;
    if (confidence_max !== undefined) options.minConfidenceScore = confidence_max;
    if (search) options.searchQuery = search;
    if (limit) options.limit = limit;
    if (offset) options.offset = offset;

    const allEvents = await getNormalizedEvents(options, userId || undefined);

    // Filter by date range if provided
    const events = filterEventsByDateRange(allEvents, dateFrom, dateTo);

    // Apply pagination
    const paginatedEvents = events.slice(offset || 0, (offset || 0) + (limit || 20));

    res.json({
      success: true,
      data: {
        events: paginatedEvents,
        total: events.length,
        limit,
        offset,
      },
    });
  } catch (error: any) {
    console.error('[API] Events list error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// GET /api/events/:id/context - Event context
app.get('/api/events/:id/context', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.query.userId as string) || (req.body?.userId as string) || null;

    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase not configured',
      });
    }

    // Import functions dynamically
    const { getNormalizedEventById, getSignalsFromEvents } = await import('../lib/supabase.js');

    const event = await getNormalizedEventById(id);

    // Get related events (same sector/region)
    const allRelatedEvents = await getNormalizedEvents(
      {
        sectorFilter: event.sectors && event.sectors.length > 0 ? event.sectors : undefined,
        regionFilter: event.region ? [event.region] : undefined,
      },
      userId || undefined
    );
    const relatedEvents = allRelatedEvents.filter((e: any) => e.id !== id).slice(0, 5);

    // Get related signals (from same events)
    const relatedSignals = await getSignalsFromEvents(
      {},
      userId || undefined
    ).then(signals => signals.filter(s => 
      s.related_event_ids?.includes(id)
    ).slice(0, 5));

    // Get related entities (from event actors)
    const relatedEntities: Array<{ id: string; name: string; type: string }> = [];
    if (event.actors && event.actors.length > 0) {
      event.actors.forEach((actor, index) => {
        relatedEntities.push({
          id: `entity_${index}`,
          name: actor,
          type: 'actor',
        });
      });
    }

    // Get related assets (placeholder - TODO: implement asset linking)
    const relatedAssets: Array<{ symbol: string; name: string }> = [];

    res.json({
      success: true,
      data: {
        related_entities: relatedEntities,
        related_assets: relatedAssets,
        similar_events: relatedEvents.map(e => ({
          id: e.id,
          headline: e.headline || e.summary?.substring(0, 100) || 'Event',
        })),
      },
    });
  } catch (error: any) {
    console.error('[API] Event context error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// GET /api/signals - List signals with filters
app.get('/api/signals', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || (req.body?.userId as string) || null;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;
    const scope = req.query.scope as string;
    const horizon = req.query.horizon as string;
    const min_impact = req.query.min_impact ? parseFloat(req.query.min_impact as string) : undefined;
    const min_confidence = req.query.min_confidence ? parseFloat(req.query.min_confidence as string) : undefined;
    const theme = req.query.theme as string;
    const sector = req.query.sector as string;
    const region = req.query.region as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase not configured',
      });
    }

    // Import functions dynamically
    const { getSignalsFromEvents } = await import('../lib/supabase.js');

    const options: any = {};
    if (sector) options.sectorFilter = [sector];
    if (region) options.regionFilter = [region];
    if (min_impact !== undefined) options.minImpactScore = min_impact;
    if (min_confidence !== undefined) options.minConfidenceScore = min_confidence;

    const allSignals = await getSignalsFromEvents(options, userId || undefined);
    // Note: Signals don't have dates, so we can't filter by dateFrom/dateTo
    const signals = allSignals;

    // Apply additional filters
    let filteredSignals = signals;
    if (scope) {
      filteredSignals = filteredSignals.filter(s => s.scope === scope);
    }
    if (horizon) {
      filteredSignals = filteredSignals.filter(s => s.horizon === horizon);
    }

    // Apply pagination
    const paginatedSignals = filteredSignals.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        signals: paginatedSignals,
        total: filteredSignals.length,
        limit,
        offset,
      },
    });
  } catch (error: any) {
    console.error('[API] Signals list error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// GET /api/signals/:id - Signal detail
app.get('/api/signals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.query.userId as string) || (req.body?.userId as string) || null;

    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase not configured',
      });
    }

    // Import functions dynamically
    const { getSignalsFromEvents, getNormalizedEventById } = await import('../lib/supabase.js');

    // Get all signals and find the one with matching ID
    const allSignals = await getSignalsFromEvents({}, userId || undefined);
    const signal = allSignals.find(s => s.id === id);

    if (!signal) {
      return res.status(404).json({
        success: false,
        error: 'Signal not found',
      });
    }

    // Get related events
    const relatedEvents = signal.related_event_ids
      ? await Promise.all(
          signal.related_event_ids.map(eventId => 
            getNormalizedEventById(eventId).catch(() => null)
          )
        ).then(events => events.filter(Boolean))
      : [];

    // Build evidence graph
    const evidenceGraph = {
      nodes: [
        ...relatedEvents.map((e: any) => ({ id: e.id, type: 'event' })),
        { id: signal.id, type: 'signal' },
      ],
      edges: relatedEvents.map((e: any) => ({
        from: e.id,
        to: signal.id,
        type: 'linked_by',
      })),
    };

    // Market validation (placeholder - TODO: implement real validation)
    const marketValidation = {
      assets: [],
      note: 'Validation based on price/volume changes, not causality',
    };

    res.json({
      success: true,
      data: {
        ...signal,
        evidence_graph: evidenceGraph,
        market_validation: marketValidation,
      },
    });
  } catch (error: any) {
    console.error('[API] Signal detail error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// GET /api/cron/track-perplexity - Vercel Cron Job endpoint (automatic tracking every 2 hours)
app.get('/api/cron/track-perplexity', async (req: express.Request, res: express.Response) => {
  try {
    // Verify cron secret (Vercel sends this header)
    const authHeader = req.headers['authorization'];
    const cronSecret = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // In production, require auth. In dev, allow for testing
      if (process.env.NODE_ENV === 'production' && !authHeader) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized - cron secret required',
        });
      }
    }

    console.log('[API Cron] Starting Perplexity Discover tracking...');
    const { trackPerplexityDiscover } = await import('./workers/perplexity-discover-tracker.js');
    const result = await trackPerplexityDiscover();
    
    console.log('[API Cron] Tracking complete:', result);
    
    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API Cron] Error tracking Perplexity:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to track Perplexity Discover',
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/admin/track-perplexity - Manually trigger Perplexity Discover tracking
app.post('/api/admin/track-perplexity', async (req: express.Request, res: express.Response) => {
  try {
    // TODO: Add admin authentication check here
    // For now, allow any authenticated user (can be restricted later)
    const { trackPerplexityDiscover } = await import('./workers/perplexity-discover-tracker.js');
    const result = await trackPerplexityDiscover();
    
    res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('[API] Error tracking Perplexity:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to track Perplexity Discover',
    });
  }
});

// GET /api/discover - Discover feed
// Also available as /discover (for Vite proxy which removes /api prefix)
const discoverHandler = async (req: any, res: any) => {
  try {
            const category = (req.query.category as string) || 'all';
            const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
            const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 12;
            const sortBy = (req.query.sortBy as string) || 'relevance';
            const timeRange = (req.query.timeRange as string) || 'all'; // Changed default from '7d' to 'all'
            const searchQuery = (req.query.search as string) || undefined;
            const userId = (req.query.userId as string) || undefined;

    console.log('[API] Discover request:', { category, offset, limit, sortBy, timeRange, searchQuery: searchQuery ? 'present' : 'none', userId: userId ? 'present' : 'none' });

    const { fetchDiscoverItems, calculatePersonalizationScore } = await import('./services/discover-service.js');
    
            // First page: enrich with Perplexity-sourced news (parallel with DB fetch)
            const isFirstPage = offset === 0 && !searchQuery && process.env.PERPLEXITY_API_KEY;
            let perplexityItems: any[] = [];
            if (isFirstPage) {
              try {
                const { fetchDiscoverNewsFromPerplexity } = await import('./services/discover-perplexity-feed.js');
                perplexityItems = await fetchDiscoverNewsFromPerplexity(category, Math.min(6, limit));
                if (perplexityItems.length > 0) {
                  console.log('[API] Discover Perplexity news:', perplexityItems.length);
                }
              } catch (e: any) {
                console.warn('[API] Discover Perplexity enrichment failed:', e?.message);
              }
            }

            // Parse advanced filters from query (optional)
            const advancedFilters: any = {};
            const tagsQ = req.query.tags as string | undefined;
            if (tagsQ && tagsQ.trim()) {
              advancedFilters.tags = tagsQ.split(',').map((s: string) => s.trim()).filter(Boolean);
            }
            const consensusQ = req.query.consensus as string | undefined;
            if (consensusQ && consensusQ.trim()) {
              advancedFilters.consensus = consensusQ.split(',').map((s: string) => s.trim()).filter(Boolean) as any;
            }
            const tierQ = req.query.tier as string | undefined;
            if (tierQ && tierQ.trim()) {
              advancedFilters.tier = tierQ.split(',').map((s: string) => s.trim()).filter(Boolean) as any;
            }
            const sectorsQ = req.query.sectors as string | undefined;
            if (sectorsQ && sectorsQ.trim()) {
              advancedFilters.sectors = sectorsQ.split(',').map((s: string) => s.trim()).filter(Boolean);
            }
            const regionsQ = req.query.regions as string | undefined;
            if (regionsQ && regionsQ.trim()) {
              advancedFilters.regions = regionsQ.split(',').map((s: string) => s.trim()).filter(Boolean);
            }
            const entitiesQ = req.query.entities as string | undefined;
            if (entitiesQ && entitiesQ.trim()) {
              advancedFilters.entities = entitiesQ.split(',').map((s: string) => s.trim()).filter(Boolean);
            }
            const minSourcesQ = req.query.minSources as string | undefined;
            if (minSourcesQ !== undefined && minSourcesQ !== '') {
              const n = parseInt(minSourcesQ, 10);
              if (!isNaN(n)) advancedFilters.minSources = n;
            }
            const maxSourcesQ = req.query.maxSources as string | undefined;
            if (maxSourcesQ !== undefined && maxSourcesQ !== '') {
              const n = parseInt(maxSourcesQ, 10);
              if (!isNaN(n)) advancedFilters.maxSources = n;
            }
            const minScoreQ = req.query.minScore as string | undefined;
            if (minScoreQ !== undefined && minScoreQ !== '') {
              const n = parseInt(minScoreQ, 10);
              if (!isNaN(n)) advancedFilters.minScore = n;
            }
            const maxScoreQ = req.query.maxScore as string | undefined;
            if (maxScoreQ !== undefined && maxScoreQ !== '') {
              const n = parseInt(maxScoreQ, 10);
              if (!isNaN(n)) advancedFilters.maxScore = n;
            }
            const hasAdvancedFilters = Object.keys(advancedFilters).length > 0;

            // Fetch items from events table (read-only)
            let items: any[] = [];
            try {
              items = await fetchDiscoverItems(
                category,
                { offset, limit },
                userId,
                searchQuery,
                timeRange,
                sortBy,
                hasAdvancedFilters ? advancedFilters : undefined
              );
      console.log('[API] Discover fetched items:', items.length);
    } catch (fetchError: any) {
      console.error('[API] Discover fetch error:', fetchError);
      console.error('[API] Discover fetch error stack:', fetchError.stack);
      // Return error message to help diagnose
      return res.status(500).json({
        success: false,
        error: fetchError.message || 'Failed to fetch discover items',
        details: process.env.NODE_ENV === 'development' ? fetchError.stack : undefined,
      });
    }

    // First page: merge Perplexity items at the top, then apply pagination
    if (offset === 0 && perplexityItems.length > 0) {
      items = [...perplexityItems, ...items];
      if (items.length > 0) {
        console.log('[API] Discover merged Perplexity + DB items:', items.length);
      }
    }

    // Get user preferences for personalization
    let userPreferences: any = null;
    if (userId && supabase) {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('preferred_sectors, preferred_regions, focus_areas')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (error) {
          console.warn('[Discover] Error fetching user preferences:', error);
        } else {
          userPreferences = data;
        }
      } catch (err: any) {
        console.warn('[Discover] Could not fetch user preferences:', err?.message || err);
      }
    }

    // Calculate personalization scores
    items.forEach(item => {
      try {
        item.personalization_score = calculatePersonalizationScore(item, userPreferences);
      } catch (err: any) {
        console.warn('[Discover] Error calculating personalization score:', err?.message || err);
        item.personalization_score = item.metadata.relevance_score || 50;
      }
    });

    // Sort items (already sorted by DB query, but apply personalization boost)
    try {
      items.sort((a, b) => {
        // Personalization score takes precedence if available
        const scoreA = a.personalization_score || a.metadata.relevance_score || 0;
        const scoreB = b.personalization_score || b.metadata.relevance_score || 0;
        return scoreB - scoreA;
      });
    } catch (sortError: any) {
      console.warn('[Discover] Error sorting items:', sortError?.message || sortError);
    }

    // Apply pagination: after merge (first page) we may have more than limit items
    const paginatedItems = items.slice(0, limit);
    const hasMore = items.length >= limit; // full page => possibly more

    console.log('[API] Discover response:', { items: paginatedItems.length, total: items.length, hasMore });

    res.json({
      success: true,
      items: paginatedItems,
      hasMore,
      total: items.length,
    });
  } catch (error: any) {
    console.error('[API] Discover error:', error);
    console.error('[API] Discover error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// Register both endpoints (with and without /api prefix for proxy compatibility)
app.get('/api/discover', discoverHandler);
app.get('/discover', discoverHandler);

// GET /api/market-outlook - Market outlook data (S&P, NASDAQ, Bitcoin, VIX)
app.get('/api/market-outlook', async (req, res) => {
  try {
    const { getMarketOutlook } = await import('./services/finnhub-service.js');
    const data = await getMarketOutlook();
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('[API] Market outlook error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/trending-companies - Trending companies data
app.get('/api/trending-companies', async (req, res) => {
  try {
    const { getTrendingCompanies } = await import('./services/finnhub-service.js');
    const data = await getTrendingCompanies();
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('[API] Trending companies error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// EventRegistry API endpoints
// GET /api/eventregistry/search-articles - Search articles
app.get('/api/eventregistry/search-articles', async (req, res) => {
  try {
    const { searchArticles } = await import('./services/eventregistry-service.js');
    const {
      keywords,
      category,
      lang,
      dateStart,
      dateEnd,
      sortBy,
      count = 20,
      page = 1,
    } = req.query;

    const options: any = {};
    if (keywords) options.keywords = String(keywords);
    if (category) options.categoryUri = String(category);
    if (lang) options.lang = String(lang);
    if (dateStart) options.dateStart = String(dateStart);
    if (dateEnd) options.dateEnd = String(dateEnd);
    if (sortBy) options.sortBy = String(sortBy) as any;
    options.articlesCount = parseInt(String(count)) || 20;
    options.articlesPage = parseInt(String(page)) || 1;

    const result = await searchArticles(options);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[API] EventRegistry search articles error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/eventregistry/search-events - Search events
app.get('/api/eventregistry/search-events', async (req, res) => {
  try {
    const { searchEvents } = await import('./services/eventregistry-service.js');
    const {
      keywords,
      category,
      lang,
      dateStart,
      dateEnd,
      sortBy,
      count = 20,
      page = 1,
    } = req.query;

    const options: any = {};
    if (keywords) options.keywords = String(keywords);
    if (category) options.categoryUri = String(category);
    if (lang) options.lang = String(lang);
    if (dateStart) options.dateStart = String(dateStart);
    if (dateEnd) options.dateEnd = String(dateEnd);
    if (sortBy) options.sortBy = String(sortBy) as any;
    options.eventsCount = parseInt(String(count)) || 20;
    options.eventsPage = parseInt(String(page)) || 1;

    const result = await searchEvents(options);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[API] EventRegistry search events error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/eventregistry/trending - Get trending concepts
app.get('/api/eventregistry/trending', async (req, res) => {
  try {
    const { getTrendingConcepts } = await import('./services/eventregistry-service.js');
    const {
      source = 'news',
      lang = 'eng',
      dateStart,
      dateEnd,
      conceptType,
      count = 20,
    } = req.query;

    const options: any = {
      source: String(source) as any,
      lang: String(lang),
      count: parseInt(String(count)) || 20,
    };
    if (dateStart) options.dateStart = String(dateStart);
    if (dateEnd) options.dateEnd = String(dateEnd);
    if (conceptType) options.conceptType = String(conceptType) as any;

    const result = await getTrendingConcepts(options);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[API] EventRegistry trending concepts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/eventregistry/health - Health check
app.get('/api/eventregistry/health', async (req, res) => {
  try {
    const { checkEventRegistryHealth } = await import('./services/eventregistry-service.js');
    const isHealthy = await checkEventRegistryHealth();
    res.json({
      success: true,
      healthy: isHealthy,
      configured: !!process.env.EVENTREGISTRY_API_KEY,
      message: isHealthy
        ? 'EventRegistry API is configured and working'
        : 'EventRegistry API is not configured or not responding',
    });
  } catch (error: any) {
    res.json({
      success: false,
      healthy: false,
      configured: !!process.env.EVENTREGISTRY_API_KEY,
      error: error.message || 'EventRegistry API check failed',
    });
  }
});

// POST /api/discover/page-context - Generate AI page context for Discover/Globe (OpenAI)
app.post('/api/discover/page-context', async (req, res) => {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(503).json({
        success: false,
        error: 'OPENAI_API_KEY not configured. Configure it in .env to use page context.',
      });
    }
    const body = req.body || {};
    const timeRange = (body.timeRange as string) || '7d';
    const eventSummaries = Array.isArray(body.eventSummaries) ? body.eventSummaries : [];
    const summariesText =
      eventSummaries.length > 0
        ? eventSummaries
            .slice(0, 80)
            .map(
              (s: { headline?: string; category?: string; region?: string }) =>
                `- ${[s.headline || '', s.category || '', s.region || ''].filter(Boolean).join(' · ')}`
            )
            .join('\n')
        : 'Aucun événement fourni pour cette période.';

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: openaiApiKey });
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Tu es un analyste en veille stratégique. Tu synthétises en 2 à 4 phrases courtes le contexte géopolitique et économique de la période, sans inventer de faits. Réponds uniquement en français, ton professionnel et factuel.',
        },
        {
          role: 'user',
          content: `Période : ${timeRange}. Événements sur la carte :\n${summariesText}\n\nGénère un paragraphe de contexte stratégique pour cette vue (tendances, zones de tension, points d'attention).`,
        },
      ],
      max_tokens: 400,
      temperature: 0.4,
    });
    const context =
      response.choices?.[0]?.message?.content?.trim() ||
      'Impossible de générer le contexte pour le moment.';
    res.json({ success: true, context });
  } catch (error: any) {
    console.error('[API] Discover page-context error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate page context',
    });
  }
});

// POST /api/stock-digest — Stock Portfolio Researcher (Tavily + OpenAI), inspired by tavily-ai/market-researcher
app.post('/api/stock-digest', async (req, res) => {
  try {
    const body = req.body || {};
    const tickers = Array.isArray(body.tickers) ? body.tickers : [];
    if (tickers.length === 0) {
      return res.status(400).json({ success: false, error: 'tickers must be a non-empty array (e.g. ["AAPL", "GOOGL"])' });
    }
    const { generateStockDigest } = await import('./services/stock-digest-service.js');
    const result = await generateStockDigest(tickers);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[API] Stock digest error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate stock digest',
    });
  }
});

// POST /api/meeting-brief — Meeting/company brief (Tavily + OpenAI), inspiration: meeting-prep-agent
app.post('/api/meeting-brief', async (req, res) => {
  try {
    const body = req.body || {};
    const company = (body.company as string) || '';
    if (!company.trim()) {
      return res.status(400).json({ success: false, error: 'body.company is required' });
    }
    const { generateMeetingBrief } = await import('./services/meeting-brief-service.js');
    const result = await generateMeetingBrief({
      company: company.trim(),
      ticker: body.ticker ? String(body.ticker).trim() : undefined,
      meetingType: body.meetingType ? String(body.meetingType).trim() : undefined,
      date: body.date ? String(body.date).trim() : undefined,
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[API] Meeting brief error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate meeting brief',
    });
  }
});

// POST /api/esg/extract-from-document — Extract ESG indicators from text or PDF (base64)
app.post('/api/esg/extract-from-document', async (req, res) => {
  try {
    const body = req.body || {};
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    let pdfBuffer: Buffer | undefined;
    if (typeof body.pdfBase64 === 'string' && body.pdfBase64.length > 0) {
      try {
        pdfBuffer = Buffer.from(body.pdfBase64, 'base64');
      } catch {
        return res.status(400).json({ success: false, error: 'Invalid pdfBase64' });
      }
    }
    if (!text && !pdfBuffer?.length) {
      return res.status(400).json({
        success: false,
        error: 'Provide either body.text (document text) or body.pdfBase64 (PDF file as base64)',
      });
    }
    const { extractESGFromDocument } = await import('./services/esg-extract-service.js');
    const result = await extractESGFromDocument({ text: text || undefined, pdfBuffer });
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[API] ESG extract error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract ESG from document',
    });
  }
});

// GET /api/discover/saved - List saved (library) items for user
app.get('/api/discover/saved', async (req, res) => {
  try {
    const clerkUserId = (req.headers['x-clerk-user-id'] as string) || (req.query.userId as string);
    if (!clerkUserId) {
      return res.status(401).json({ success: false, error: 'User ID required (x-clerk-user-id header or userId query)' });
    }
    if (!supabase) {
      return res.status(503).json({ success: false, error: 'Database not configured' });
    }
    const userId = await getSupabaseUserId(clerkUserId, supabase);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    const { data: rows, error } = await supabase
      .from('user_engagement')
      .select('event_id')
      .eq('user_id', userId)
      .eq('engagement_type', 'save')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[API] Discover saved list error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    const ids = (rows || []).map((r: any) => r.event_id).filter(Boolean);
    const { getDiscoverItemsByIds } = await import('./services/discover-service.js');
    const items = await getDiscoverItemsByIds(ids);
    res.json({ success: true, items });
  } catch (error: any) {
    console.error('[API] Discover saved error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// POST /api/discover/:id/save - Save item to library
app.post('/api/discover/:id/save', async (req, res) => {
  try {
    const { id } = req.params;
    const clerkUserId = (req.headers['x-clerk-user-id'] as string) || (req.query.userId as string) || (req.body?.userId as string);

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        error: 'User ID required (x-clerk-user-id header or userId)',
      });
    }

    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'Database not configured',
      });
    }

    const userId = await getSupabaseUserId(clerkUserId, supabase);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    // Track engagement (only UUID event ids are stored; Perplexity ids may fail silently)
    try {
      const { trackEngagement } = await import('./services/engagement-service.js');
      await trackEngagement(userId, id, 'save');
    } catch (trackError: any) {
      console.warn('[API] Failed to track save engagement:', trackError);
      // Don't fail the request if tracking fails
    }

    res.json({
      success: true,
      message: 'Item saved to library',
    });
  } catch (error: any) {
    console.error('[API] Save item error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// DELETE /api/discover/:id/save - Remove item from library
app.delete('/api/discover/:id/save', async (req, res) => {
  try {
    const { id } = req.params;
    const clerkUserId = (req.headers['x-clerk-user-id'] as string) || (req.query.userId as string) || (req.body?.userId as string);
    if (!clerkUserId) {
      return res.status(401).json({ success: false, error: 'User ID required (x-clerk-user-id header or userId)' });
    }
    if (!supabase) {
      return res.status(503).json({ success: false, error: 'Database not configured' });
    }
    const userId = await getSupabaseUserId(clerkUserId, supabase);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    const { error } = await supabase
      .from('user_engagement')
      .delete()
      .eq('user_id', userId)
      .eq('event_id', id)
      .eq('engagement_type', 'save');
    if (error) {
      console.error('[API] Discover unsave error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    res.json({ success: true, message: 'Removed from library' });
  } catch (error: any) {
    console.error('[API] Unsave item error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// POST /api/newsletter - Subscribe email to newsletter
app.post('/api/newsletter', async (req, res) => {
  try {
    const { email } = req.body || {};
    const raw = typeof email === 'string' ? email.trim() : '';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!raw || !re.test(raw)) {
      return res.status(400).json({ success: false, error: 'Valid email is required' });
    }
    if (!supabase) {
      return res.status(503).json({ success: false, error: 'Database not configured' });
    }
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: raw });
    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ success: false, error: 'Already subscribed' });
      }
      console.error('[API] Newsletter subscribe error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Subscription failed' });
    }
    res.status(201).json({ success: true, message: 'Subscribed' });
  } catch (error: any) {
    console.error('[API] Newsletter error:', error);
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

// GET /api/intelligence/claims/saved - List saved claim IDs for user
app.get('/api/intelligence/claims/saved', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }
    if (!supabase) {
      return res.status(503).json({ success: false, error: 'Database not configured' });
    }
    const supabaseUserId = await getSupabaseUserId(userId, supabase);
    if (!supabaseUserId) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }
    const { data: rows, error } = await supabase
      .from('user_saved_claims')
      .select('claim_id')
      .eq('user_id', supabaseUserId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[API] Claims saved list error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    const claimIds = (rows || []).map((r: { claim_id: string }) => r.claim_id).filter(Boolean);
    res.json({ success: true, claimIds });
  } catch (error: any) {
    console.error('[API] Claims saved error:', error);
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

// POST /api/intelligence/claims/save - Save a claim (bookmark)
app.post('/api/intelligence/claims/save', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || (req.body?.userId as string) || (req.headers['x-user-id'] as string);
    const claimId = (req.query.claimId as string) || (req.body?.claimId as string);
    const variant = (req.body?.variant as string) || undefined;
    if (!userId || !claimId) {
      return res.status(400).json({ success: false, error: 'userId and claimId required' });
    }
    if (!supabase) {
      return res.status(503).json({ success: false, error: 'Database not configured' });
    }
    const supabaseUserId = await getSupabaseUserId(userId, supabase);
    if (!supabaseUserId) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }
    const { error } = await supabase
      .from('user_saved_claims')
      .upsert({ user_id: supabaseUserId, claim_id: claimId, variant: variant || null }, { onConflict: 'user_id,claim_id' });
    if (error) {
      if (error.code === '23505') return res.json({ success: true, message: 'Already saved' });
      console.error('[API] Claim save error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    res.json({ success: true, message: 'Saved' });
  } catch (error: any) {
    console.error('[API] Claim save error:', error);
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

// DELETE /api/intelligence/claims/save - Unsave a claim
app.delete('/api/intelligence/claims/save', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
    const claimId = req.query.claimId as string;
    if (!userId || !claimId) {
      return res.status(400).json({ success: false, error: 'userId and claimId required' });
    }
    if (!supabase) {
      return res.status(503).json({ success: false, error: 'Database not configured' });
    }
    const supabaseUserId = await getSupabaseUserId(userId, supabase);
    if (!supabaseUserId) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }
    const { error } = await supabase
      .from('user_saved_claims')
      .delete()
      .eq('user_id', supabaseUserId)
      .eq('claim_id', claimId);
    if (error) {
      console.error('[API] Claim unsave error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    res.json({ success: true, message: 'Removed' });
  } catch (error: any) {
    console.error('[API] Claim unsave error:', error);
    res.status(500).json({ success: false, error: error?.message || 'Internal server error' });
  }
});

// POST /api/discover/:id/engage - Track engagement (view, click, share, read_time)
app.post('/api/discover/:id/engage', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, type, metadata } = req.body;

    if (!userId || !type) {
      return res.status(400).json({
        success: false,
        error: 'userId and type are required',
      });
    }

    const validTypes = ['view', 'save', 'click', 'share', 'read_time'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid engagement type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    const { trackEngagement } = await import('./services/engagement-service.js');
    const result = await trackEngagement(userId, id, type, metadata);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to track engagement',
      });
    }

    res.json({
      success: true,
      message: 'Engagement tracked',
    });
  } catch (error: any) {
    console.error('[API] Track engagement error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// GET /api/discover/:id/stats - Get engagement stats for an item
app.get('/api/discover/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const { getEventEngagementStats } = await import('./services/engagement-service.js');
    const stats = await getEventEngagementStats(id);

    if (!stats) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get engagement stats',
      });
    }

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('[API] Get engagement stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// POST /api/analytics - Track analytics events
app.post('/api/analytics', async (req, res) => {
  try {
    const { event, properties, timestamp } = req.body;

    // Log analytics event (in production, send to analytics service)
    console.log('[Analytics]', event, properties);

    // Store in database if needed (optional)
    // For now, just acknowledge receipt
    res.json({
      success: true,
      message: 'Event tracked',
    });
  } catch (error: any) {
    console.error('[API] Analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// GET /api/impacts - List impacts with filters
app.get('/api/impacts', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || (req.body?.userId as string) || null;
    const probability_min = req.query.probability_min ? parseFloat(req.query.probability_min as string) : undefined;
    const magnitude_min = req.query.magnitude_min ? parseFloat(req.query.magnitude_min as string) : undefined;
    const timeframe = req.query.timeframe as string;
    const sector = req.query.sector as string;
    const region = req.query.region as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    // Get signals first (impacts are generated from signals)
    const { getSignalsFromEvents } = await import('../lib/supabase.js');
    const signals = await getSignalsFromEvents({}, userId || undefined);

    if (signals.length === 0) {
      return res.json({
        success: true,
        data: {
          impacts: [],
          total: 0,
          limit,
          offset,
        },
      });
    }

    // Generate impacts from signals
    const { impactAgent } = await import('./agents/impact-agent.js');
    const response = await impactAgent.generateImpacts({
      signals,
      user_preferences: null,
    });

    if (response.error) {
      throw new Error(response.error);
    }

    let impacts = response.data || [];

    // Apply filters
    if (probability_min !== undefined) {
      impacts = impacts.filter((i: any) => (i.probability || 0) >= probability_min);
    }
    if (magnitude_min !== undefined) {
      impacts = impacts.filter((i: any) => (i.magnitude || 0) >= magnitude_min);
    }
    if (timeframe) {
      impacts = impacts.filter((i: any) => i.timeframe === timeframe);
    }

    // Apply pagination
    const paginatedImpacts = impacts.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        impacts: paginatedImpacts,
        total: impacts.length,
        limit,
        offset,
      },
    });
  } catch (error: any) {
    console.error('[API] Impacts list error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// GET /api/impacts/:id - Impact detail
app.get('/api/impacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.query.userId as string) || (req.body?.userId as string) || null;

    // Get signals first
    const { getSignalsFromEvents } = await import('../lib/supabase.js');
    const signals = await getSignalsFromEvents({}, userId || undefined);

    if (signals.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Impact not found',
      });
    }

    // Generate impacts from signals
    const { impactAgent } = await import('./agents/impact-agent.js');
    const response = await impactAgent.generateImpacts({
      signals,
      user_preferences: null,
    });

    if (response.error) {
      throw new Error(response.error);
    }

    const impacts = response.data || [];
    const impact = impacts.find((i: any) => i.id === id);

    if (!impact) {
      return res.status(404).json({
        success: false,
        error: 'Impact not found',
      });
    }

    res.json({
      success: true,
      data: impact,
    });
  } catch (error: any) {
    console.error('[API] Impact detail error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// POST /api/search - Advanced search with knowledge graph (legacy, kept for compatibility)
app.post('/api/search', async (req, res) => {
  try {
    const { query, mode = 'standard', filters = {} } = req.body;
    const clerkUserId = req.headers['x-clerk-user-id'] as string || null;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    // Extract Supabase user ID if available
    let userId = null;
    if (clerkUserId && supabase) {
      try {
        userId = await getSupabaseUserId(clerkUserId, supabase);
      } catch {
        // Continue without userId if extraction fails
      }
    }

    console.log(`[API] Search request: "${query}" (mode: ${mode})`);

    const { search } = await import('./services/search-orchestrator.js');
    const result = await search(query.trim(), mode, filters, userId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[API] Search error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// POST /api/search/session - Create new search session
app.post('/api/search/session', async (req, res) => {
  // #region agent log
  // #endregion

  try {
    const { query, inputType = 'text' } = req.body;
    // Extract Clerk user ID from headers (set by frontend)
    const clerkUserId = req.headers['x-clerk-user-id'] as string || null;

    // #region agent log
    // #endregion

    let userId = null;
    if (clerkUserId && supabase) {
      try {
        userId = await getSupabaseUserId(clerkUserId, supabase);
        // #region agent log
        // #endregion
      } catch (userIdError: any) {
        // #region agent log
        // #endregion
        // Continue without userId if extraction fails
      }
    }

    if (!query || typeof query !== 'string' || !query.trim()) {
      // #region agent log
      // #endregion
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    console.log(`[API] Creating search session: "${query}" (type: ${inputType})`);

    // #region agent log
    // #endregion

    // Generate session ID
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    let searchResult;
    
    if (inputType === 'url') {
      // #region agent log
      // #endregion

      // Validate and clean URL
      let cleanUrl = query.trim();
      try {
        // Try to parse as URL to validate
        const testUrl = new URL(cleanUrl);
        cleanUrl = testUrl.href; // Normalize URL
      } catch (urlError: any) {
        // #region agent log
        // #endregion
        throw new Error(`Invalid URL format: ${urlError.message}`);
      }

      try {
        // Process URL: Tavily context + Firecrawl extraction
        const { processLink } = await import('./services/link-intelligence.js');
        // #region agent log
        // #endregion
        const linkResult = await processLink(cleanUrl, undefined, { permissive: true });
        // #region agent log
        // #endregion
        
        // Also search Tavily for context around the URL
        const { searchTavily } = await import('./services/tavily-unified-service.js');
        const domain = new URL(cleanUrl).hostname;
        // #region agent log
        // #endregion
        const tavilyContext = await searchTavily(domain, 'news', {
          searchDepth: 'advanced',
          maxResults: 10,
          includeRawContent: true,
        });
        // #region agent log
        // #endregion

      // Combine results
      searchResult = {
        results: [
          linkResult.result,
          ...tavilyContext.articles.map((article: any, idx: number) => ({
            id: `context-${idx}`,
            type: 'article' as const,
            title: article.title || '',
            summary: article.content?.substring(0, 200) || '',
            url: article.url || '',
            source: article.author || new URL(article.url || '').hostname,
            publishedAt: article.publishedDate || new Date().toISOString(),
            relevanceScore: article.score || 0.5,
            sourceScore: 0.7,
            entities: [],
            tags: [],
            content: article.content,
          })),
        ],
        buckets: {
          events: [],
          actors: linkResult.entities.filter((e: any) => e.type === 'company' || e.type === 'organization'),
          assets: linkResult.entities.filter((e: any) => e.type === 'commodity'),
          sources: [{ id: domain, name: domain }],
        },
        graph: linkResult.graph,
        meta: {
          fromCache: false,
          latencyMs: 0,
          mode: 'deep' as const,
          firecrawlUsed: !linkResult.fallbackUsed,
        },
      };
      } catch (urlError: any) {
        // #region agent log
        // #endregion
        console.error('[API] URL processing error:', urlError);
        throw urlError;
      }
    } else {
      // #region agent log
      // #endregion

      try {
        // Text search: use search orchestrator
        const { search } = await import('./services/search-orchestrator.js');
        // #region agent log
        // #endregion
        searchResult = await search(query.trim(), 'standard', {}, userId);
        // #region agent log
        // #endregion
      } catch (textError: any) {
        // #region agent log
        // #endregion
        throw textError;
      }
    }

    // Store session (in-memory for now, can be moved to DB later)
    // TODO: Store in database for persistence
    const session = {
      id: sessionId,
      query: query.trim(),
      inputType,
      results: searchResult.results,
      buckets: searchResult.buckets,
      graph: searchResult.graph,
      meta: searchResult.meta,
      createdAt: new Date().toISOString(),
      followups: [],
      userId: userId || null,
    };

    // Persist to search_history for logged-in users (ChatGPT-style history)
    if (userId && supabase) {
      try {
        const title = query.trim().length > 80 ? query.trim().slice(0, 77) + '...' : query.trim();
        await supabase.from('search_history').upsert(
          {
            user_id: userId,
            session_id: sessionId,
            query: session.query,
            title: title || null,
            input_type: session.inputType || 'text',
            session_snapshot: session,
          },
          { onConflict: 'user_id,session_id' }
        );
      } catch (historyErr: any) {
        console.error('[API] Failed to save search history:', historyErr?.message || historyErr);
      }
    }

    // #region agent log
    // #endregion

    res.json({
      success: true,
      sessionId,
      session,
    });

    // #region agent log
    // #endregion
  } catch (error: any) {
    // #region agent log
    const errorDetails = {
      errorName: error?.name,
      errorMessage: error?.message,
      errorStack: error?.stack?.substring(0,500),
      errorCode: error?.code,
      errorType: error?.errorType,
      errorString: String(error),
      errorKeys: error ? Object.keys(error) : [],
    };
    // #endregion
    console.error('[API] Create session error:', error);
    console.error('[API] Error details:', errorDetails);
    res.status(500).json({
      success: false,
      error: error?.message || error?.error || 'Internal server error',
    });
  }
});

// GET /api/search/session/:id - Get search session (from DB if user has history)
app.get('/api/search/session/:id', async (req, res) => {
  // #region agent log
  const entryPayload = { location: 'api-server.ts:GET session entry', message: 'GET search session', data: { id: req.params?.id, hasClerk: !!(req.headers['x-clerk-user-id']), hasSupabase: !!supabase }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'H1,H2' };
  debugLog(entryPayload);
  // #endregion
  try {
    const { id } = req.params;
    const clerkUserId = req.headers['x-clerk-user-id'] as string || null;
    if (!clerkUserId || !supabase) {
      // #region agent log
      const p404 = { location: 'api-server.ts:GET session 404 no clerk/supabase', message: 'Early 404', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'H1' };
      debugLog(p404);
      // #endregion
      return res.status(404).json({
        success: false,
        error: 'Session not found.',
      });
    }
    const userId = await getSupabaseUserId(clerkUserId, supabase);
    if (!userId) {
      // #region agent log
      const p404u = { location: 'api-server.ts:GET session 404 no userId', message: 'No supabase userId', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'H1' };
      debugLog(p404u);
      // #endregion
      return res.status(404).json({
        success: false,
        error: 'Session not found.',
      });
    }
    const { data: row, error } = await supabase
      .from('search_history')
      .select('session_snapshot')
      .eq('user_id', userId)
      .eq('session_id', id)
      .maybeSingle();
    // #region agent log
    const qPayload = { location: 'api-server.ts:GET session query', message: 'Supabase query result', data: { hasRow: !!row, hasSnapshot: !!row?.session_snapshot, dbError: error?.message }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'H2,H3' };
    debugLog(qPayload);
    // #endregion
    if (error || !row?.session_snapshot) {
      return res.status(404).json({
        success: false,
        error: 'Session not found.',
      });
    }
    res.json({
      success: true,
      session: row.session_snapshot,
    });
  } catch (error: any) {
    // #region agent log
    const catchPayload = { location: 'api-server.ts:GET session catch', message: 'Exception', data: { err: error?.message }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'H2' };
    debugLog(catchPayload);
    // #endregion
    console.error('[API] Get session error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// POST /api/search/session/:sessionId/playground — Create or get investigation playground for this search session
app.post('/api/search/session/:sessionId/playground', async (req, res) => {
  // #region agent log
  const sessionIdParam = req.params.sessionId?.trim();
  // #endregion
  try {
    const sessionId = sessionIdParam;
    const clerkUserId = req.headers['x-clerk-user-id'] as string || null;
    if (!sessionId || !clerkUserId || !supabase) {
      return res.status(400).json({ success: false, error: 'Session ID and user required' });
    }
    const userId = await getSupabaseUserId(clerkUserId, supabase);
    if (!userId) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const { data: row, error } = await supabase
      .from('search_history')
      .select('session_snapshot')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .maybeSingle();
    // #region agent log
    // #endregion
    if (error || !row?.session_snapshot) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    const session = row.session_snapshot as { query?: string; results?: Array<{ title?: string; summary?: string; url?: string }>; investigationThreadId?: string };
    const existingThreadId = session.investigationThreadId;
    if (existingThreadId) {
      return res.json({ success: true, threadId: existingThreadId, graph: null });
    }
    const query = (session.query || '').trim();
    if (!query) {
      return res.status(400).json({ success: false, error: 'Session has no query' });
    }
    const titleVal = query.length > 80 ? query.slice(0, 77) + '...' : query;
    const { data: thread, error: insertError } = await supabase
      .from('investigation_threads')
      .insert({
        user_id: userId,
        title: titleVal,
        initial_hypothesis: query,
        scope: 'geopolitics',
        status: 'active',
        confidence_score: null,
        investigative_axes: [],
        blind_spots: [],
      })
      .select()
      .single();
    if (insertError || !thread) {
      console.error('[API] Playground thread create error:', insertError);
      return res.status(500).json({ success: false, error: insertError?.message || 'Failed to create investigation' });
    }
    const threadId = thread.id;
    const rawTextChunks = (session.results || []).map((r: { title?: string; summary?: string; url?: string }) => ({
      text: ((r.title || '') + '\n' + (r.summary || '')).trim() || (r.title || ''),
      sourceUrl: r.url,
      sourceName: r.title || undefined,
    })).filter((c: { text: string }) => c.text.length > 0);
    setImmediate(async () => {
      try {
        const { getOrCreateDetectiveInvestigation } = await import('./services/detective-graph-persistence.js');
        const { runDetectiveIngestion } = await import('./services/detective-ingestion-pipeline.js');
        await getOrCreateDetectiveInvestigation(supabase, threadId, { title: titleVal, hypothesis: query });
        await runDetectiveIngestion({
          investigationId: threadId,
          hypothesis: query,
          skipTavily: false,
          maxTavilyResults: 15,
          maxScrapeUrls: 8,
          runGraphRebuild: true,
          useSearchGraph: true, // même Knowledge Graph que Search ; requête utilisateur → Tavily → buildGraph
          supabase,
          rawTextChunks,
        });
        console.log('[API] Playground ingestion done for session', sessionId, 'thread', threadId);
      } catch (e: any) {
        console.error('[API] Playground ingestion:', e?.message);
      }
    });
    const updatedSnapshot = { ...session, investigationThreadId: threadId };
    const { error: updateError } = await supabase
      .from('search_history')
      .update({ session_snapshot: updatedSnapshot })
      .eq('user_id', userId)
      .eq('session_id', sessionId);
    if (updateError) {
      console.error('[API] Playground snapshot update error:', updateError);
      // Still return threadId so client can poll
    }
    // #region agent log
    // #endregion
    res.json({ success: true, threadId, graph: null });
  } catch (err: any) {
    console.error('[API] Playground create:', err);
    res.status(500).json({ success: false, error: err?.message || 'Internal server error' });
  }
});

// GET /api/search/history - List current user's search history (ChatGPT-style)
app.get('/api/search/history', async (req, res) => {
  try {
    const clerkUserId = req.headers['x-clerk-user-id'] as string || null;
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    if (!clerkUserId || !supabase) {
      return res.json({ success: true, history: [] });
    }
    const userId = await getSupabaseUserId(clerkUserId, supabase);
    if (!userId) {
      return res.json({ success: true, history: [] });
    }
    const { data: rows, error } = await supabase
      .from('search_history')
      .select('id, session_id, query, title, input_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('[API] Search history list error:', error);
      return res.json({ success: true, history: [] });
    }
    res.json({
      success: true,
      history: (rows || []).map((r) => ({
        id: r.id,
        sessionId: r.session_id,
        query: r.query,
        title: r.title || r.query,
        inputType: r.input_type,
        createdAt: r.created_at,
      })),
    });
  } catch (error: any) {
    console.error('[API] Search history error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// DELETE /api/search/history/:sessionId - Remove one search session from user's history
app.delete('/api/search/history/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId?.trim();
    const clerkUserId = req.headers['x-clerk-user-id'] as string || null;
    if (!sessionId || !clerkUserId || !supabase) {
      return res.status(400).json({ success: false, error: 'Missing session or user' });
    }
    const userId = await getSupabaseUserId(clerkUserId, supabase);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    let error = (await supabase.rpc('delete_search_history', {
      p_user_id: userId,
      p_session_id: sessionId,
    })).error;
    if (error && (error.message?.includes('does not exist') || error.code === '42883')) {
      const direct = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', userId)
        .eq('session_id', sessionId);
      error = direct.error;
    }
    if (error) {
      console.error('[API] Search history delete error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Delete failed' });
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error('[API] Search history delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// POST /api/search/session/:id/followup - Add followup search to session
app.post('/api/search/session/:id/followup', async (req, res) => {
  try {
    const { id } = req.params;
    const { query } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    // Extract Supabase user ID if available
    const clerkUserId = req.headers['x-clerk-user-id'] as string || null;
    let userId = null;
    if (clerkUserId && supabase) {
      try {
        userId = await getSupabaseUserId(clerkUserId, supabase);
      } catch {
        // Continue without userId if extraction fails
      }
    }

    console.log(`[API] Followup search in session ${id}: "${query}"`);

    // Perform search
    const { search } = await import('./services/search-orchestrator.js');
    const searchResult = await search(query.trim(), 'standard', {}, userId);

    // Generate followup ID
    const followupId = `followup-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    res.json({
      success: true,
      followupId,
      results: searchResult.results,
      graph: searchResult.graph,
      buckets: searchResult.buckets,
    });
  } catch (error: any) {
    console.error('[API] Followup error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// POST /api/search/session/questions - Generate suggested questions
app.post('/api/search/session/questions', async (req, res) => {
  try {
    const { query, inputType, resultsCount, entities } = req.body;

    // Generate questions using OpenAI
    const { callOpenAI } = await import('./services/openai-optimizer.js');

    const systemPrompt = `You are an expert at generating insightful follow-up questions for intelligence research.
Generate 4-6 questions that help users explore deeper into a topic, verify information, find contradictions, assess impacts, make predictions, or identify exposures.

Question types:
- Similar/Related: Find similar articles or related topics
- Verify: Confirm information with other sources
- Contradict: Find misleading or false information
- Impact: Assess economic or sector impacts
- Prediction: Predict what might happen next
- Exposure: Identify which sectors/companies are exposed

Return ONLY a JSON array of question strings.`;

    const userPrompt = `Generate follow-up questions for this search:

Query: ${query}
Input Type: ${inputType}
Results Found: ${resultsCount}
Key Entities: ${entities?.join(', ') || 'None'}

Return 4-6 questions as a JSON array of strings.`;

    try {
      // Request questions as JSON object with questions array
      const promptWithFormat = `${userPrompt}

Return the questions in this JSON format:
{
  "questions": ["question1", "question2", ...]
}`;

      const response = await callOpenAI<{ questions: string[] }>(promptWithFormat, systemPrompt, {
        taskType: 'data-extraction',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 500,
      });

      if (response.data && response.data.questions && Array.isArray(response.data.questions)) {
        res.json({
          success: true,
          questions: response.data.questions,
        });
      } else {
        // Fallback to default questions
        throw new Error('Invalid response format');
      }
    } catch (openaiError: any) {
      console.error('[API] OpenAI question generation error:', openaiError);
      // Fallback to default questions
      const defaultQuestions = inputType === 'url'
        ? [
            'Find similar articles',
            'Is this information confirmed by other sources?',
            'What could be misleading or false here?',
            'What are the potential economic impacts?',
            'What could happen next if this escalates?',
            'Which sectors or companies are exposed?',
          ]
        : [
            `Find more recent updates about ${query}`,
            `What are the key actors involved in ${query}?`,
            `What are the potential risks related to ${query}?`,
            `Which sectors are affected by ${query}?`,
          ];

      res.json({
        success: true,
        questions: defaultQuestions,
      });
    }
  } catch (error: any) {
    console.error('[API] Generate questions error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// POST /api/search/validate-claim - Validate a claim using Tavily follow-up
app.post('/api/search/validate-claim', async (req, res) => {
  try {
    const { claim, timeRange = '7d' } = req.body;

    if (!claim || typeof claim !== 'string' || !claim.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Claim is required',
      });
    }

    console.log(`[API] Validating claim: "${claim.substring(0, 100)}..."`);

    try {
      const { validateClaim } = await import('./services/tavily-followup.js');
      console.log('[API] validateClaim imported successfully');
      
      const result = await validateClaim(claim.trim(), timeRange);
      console.log('[API] Validation result:', {
        validated: result.validated,
        confidence: result.confidence,
        supportingSources: result.supportingSources,
        contradictingSources: result.contradictingSources,
        evidenceCount: result.evidence.length,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (importError: any) {
      console.error('[API] Import or validation error:', importError);
      throw importError;
    }
  } catch (error: any) {
    console.error('[API] Validate claim error:', error);
    console.error('[API] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// POST /api/search/check-updates - Check for updates to an event
app.post('/api/search/check-updates', async (req, res) => {
  try {
    const { eventTitle, originalDate, timeRange = '7d' } = req.body;

    if (!eventTitle || !originalDate) {
      return res.status(400).json({
        success: false,
        error: 'eventTitle and originalDate are required',
      });
    }

    console.log(`[API] Checking updates for: "${eventTitle}" since ${originalDate}`);

    try {
      const { findUpdates } = await import('./services/tavily-followup.js');
      console.log('[API] findUpdates imported successfully');
      
      const result = await findUpdates(eventTitle, originalDate, timeRange);
      console.log('[API] Updates result:', {
        totalUpdates: result.totalUpdates,
        timeRange: result.timeRange,
        updatesCount: result.updates.length,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (importError: any) {
      console.error('[API] Import or updates error:', importError);
      throw importError;
    }
  } catch (error: any) {
    console.error('[API] Check updates error:', error);
    console.error('[API] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// POST /api/enrich - Enrich a result or URL
app.post('/api/enrich', async (req, res) => {
  try {
    const { url, resultId, results, existingGraph } = req.body;

    if (!url && !resultId) {
      return res.status(400).json({
        success: false,
        error: 'Either url or resultId is required',
        errorType: 'validation',
        fallbackUsed: false,
      });
    }

    console.log(`[API] Enrich request: ${url ? `url: ${url}` : `resultId: ${resultId}`}`);

    if (url) {
      // Process pasted link
      const { processLink } = await import('./services/link-intelligence.js');
      
      try {
        // Use permissive mode for user-pasted URLs (bypasses whitelist)
        const result = await processLink(url, existingGraph, { permissive: true });

        res.json({
          success: true,
          enrichedData: result.result,
          updatedGraph: result.graph,
          entities: result.entities,
          keyFacts: result.keyFacts,
          summary: result.summary,
          fallbackUsed: result.fallbackUsed || false,
          message: result.fallbackUsed 
            ? 'URL processed using fallback method (Tavily). Some features may be limited.'
            : 'URL processed successfully with Firecrawl.',
        });
      } catch (linkError: any) {
        // Handle LinkIntelligenceError
        if (linkError.errorType) {
          const errorType = linkError.errorType;
          const fallbackUsed = linkError.fallbackUsed || false;
          
          // Determine HTTP status based on error type
          let statusCode = 500;
          if (errorType === 'whitelist') {
            statusCode = 403; // Forbidden
          } else if (errorType === 'timeout') {
            statusCode = 504; // Gateway Timeout
          } else if (errorType === 'network') {
            statusCode = 503; // Service Unavailable
          }

          console.error(`[API] Enrich error (${errorType}):`, linkError.error);

          // Return error with partial data if available
          if (linkError.partialData) {
            return res.status(statusCode).json({
              success: false,
              error: linkError.error,
              errorType,
              fallbackUsed,
              partialData: linkError.partialData,
              message: getErrorMessage(errorType, fallbackUsed),
            });
          }

          return res.status(statusCode).json({
            success: false,
            error: linkError.error,
            errorType,
            fallbackUsed,
            message: getErrorMessage(errorType, fallbackUsed),
          });
        }

        // Generic error
        throw linkError;
      }
    } else if (resultId && results) {
      // Enrich existing result
      const { enrichResult } = await import('./services/search-orchestrator.js');
      const result = await enrichResult(resultId, results);

      res.json({
        success: true,
        enrichedData: result.enrichedResult,
        updatedGraph: result.updatedGraph,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: resultId requires results array',
        errorType: 'validation',
        fallbackUsed: false,
      });
    }
  } catch (error: any) {
    console.error('[API] Enrich error:', error);
    
    // Determine error type from error message
    let errorType = 'unknown';
    if (error.message?.includes('whitelist')) {
      errorType = 'whitelist';
    } else if (error.message?.includes('timeout')) {
      errorType = 'timeout';
    } else if (error.message?.includes('network') || error.message?.includes('rate limit')) {
      errorType = 'network';
    } else if (error.message?.includes('not available') || error.message?.includes('unavailable')) {
      errorType = 'unavailable';
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      errorType,
      fallbackUsed: false,
      message: getErrorMessage(errorType, false),
    });
  }
});

/**
 * Get user-friendly error message
 */
function getErrorMessage(errorType: string, fallbackUsed: boolean): string {
  if (fallbackUsed) {
    return 'URL processed using fallback method. Some features may be limited.';
  }

  switch (errorType) {
    case 'whitelist':
      return 'URL is not in the whitelist. Trying fallback method...';
    case 'timeout':
      return 'Request timed out. Please try again.';
    case 'network':
      return 'Network error occurred. Please check your connection and try again.';
    case 'unavailable':
      return 'Service is currently unavailable. Please try again later.';
    default:
      return 'An error occurred while processing the URL. Please try again.';
  }
}

// POST /api/save-search - Save a search query
app.post('/api/save-search', async (req, res) => {
  try {
    const { query, filters, userId } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    console.log(`[API] Save search request: "${query}" (userId: ${userId})`);

    // Check if saved_searches table exists, if not create it
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Database not configured',
      });
    }

    const { data, error } = await supabase
      .from('saved_searches')
      .insert({
        user_id: userId,
        query: query.trim(),
        filters: filters || {},
      })
      .select()
      .single();

    if (error) {
      // Table might not exist, try to create it
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('[API] Creating saved_searches table...');
        // Note: In production, this should be a migration
        // For now, we'll just return an error asking to create the table
        return res.status(500).json({
          success: false,
          error: 'saved_searches table does not exist. Please run migration.',
        });
      }
      throw error;
    }

    res.json({
      success: true,
      searchId: data.id,
    });
  } catch (error: any) {
    console.error('[API] Save search error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// Account management endpoints
// POST /api/account/change-password - Change user password (validation only, actual change via Clerk)
app.post('/api/account/change-password',
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user?.id || req.headers['x-user-id'] || null;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'New password must be at least 8 characters',
      });
    }

    // Log password change request
    await logAuditEventManual(
      userId,
      'password_change_requested',
      'account',
      userId,
      { timestamp: new Date().toISOString() },
      req.ip,
      req.headers['user-agent'] as string,
      req.path,
      req.method
    ).catch(() => {});

    res.json({
      success: true,
      message: 'Password change should be handled via Clerk on the frontend',
    });
  }, {
    timeout: 5000,
    context: (req) => ({ endpoint: '/api/account/change-password' }),
  })
);

// POST /api/account/change-email - Request email change (validation only, actual change via Clerk)
app.post('/api/account/change-email',
  asyncHandler(async (req, res) => {
    const { newEmail } = req.body;
    const userId = (req as any).user?.id || req.headers['x-user-id'] || null;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    if (!newEmail || typeof newEmail !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'New email is required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid email format',
      });
    }

    // Log email change request
    await logAuditEventManual(
      userId,
      'email_change_requested',
      'account',
      userId,
      { newEmail, timestamp: new Date().toISOString() },
      req.ip,
      req.headers['user-agent'] as string,
      req.path,
      req.method
    ).catch(() => {});

    res.json({
      success: true,
      message: 'Email change should be handled via Clerk on the frontend',
    });
  }, {
    timeout: 5000,
    context: (req) => ({ endpoint: '/api/account/change-email' }),
  })
);

// GET /api/account/sessions - Get active sessions
app.get('/api/account/sessions',
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.id || req.headers['x-user-id'] || null;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'SERVICE_UNAVAILABLE',
        message: 'Database not configured',
      });
    }

    // Get recent sessions from audit logs (last 30 days)
    const { data: sessions } = await supabase
      .from('audit_trail')
      .select('source_ip, user_agent, created_at, request_path')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    // Group by IP and user agent to identify unique sessions
    const uniqueSessions = new Map<string, any>();
    if (sessions) {
      sessions.forEach((session: any) => {
        const key = `${session.source_ip}-${session.user_agent}`;
        if (!uniqueSessions.has(key)) {
          uniqueSessions.set(key, {
            ip: session.source_ip,
            userAgent: session.user_agent,
            firstSeen: session.created_at,
            lastSeen: session.created_at,
            requestCount: 1,
          });
        } else {
          const existing = uniqueSessions.get(key)!;
          existing.lastSeen = session.created_at;
          existing.requestCount++;
        }
      });
    }

    res.json({
      success: true,
      data: Array.from(uniqueSessions.values()),
    });
  }, {
    timeout: 10000,
    context: (req) => ({ endpoint: '/api/account/sessions' }),
  })
);

// POST /api/account/delete - Request account deletion
app.post('/api/account/delete',
  asyncHandler(async (req, res) => {
    const { confirmation } = req.body;
    const userId = (req as any).user?.id || req.headers['x-user-id'] || null;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    if (confirmation !== 'DELETE') {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Please type DELETE to confirm account deletion',
      });
    }

    // Log deletion request
    await logAuditEventManual(
      userId,
      'account_deletion_requested',
      'account',
      userId,
      { timestamp: new Date().toISOString() },
      req.ip,
      req.headers['user-agent'] as string,
      req.path,
      req.method
    ).catch(() => {});

    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'SERVICE_UNAVAILABLE',
        message: 'Database not configured',
      });
    }

    // Mark user for deletion (soft delete)
    const { error } = await supabase
      .from('users')
      .update({ 
        email: `deleted_${Date.now()}@deleted.local`,
        name: 'Deleted User',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to mark account for deletion: ${error.message}`);
    }

    res.json({
      success: true,
      message: 'Account marked for deletion. Please contact support to complete the process.',
    });
  }, {
    timeout: 10000,
    context: (req) => ({ endpoint: '/api/account/delete' }),
  })
);

// GET /api/account/export - Export user data (GDPR)
app.get('/api/account/export',
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.id || req.headers['x-user-id'] || null;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'SERVICE_UNAVAILABLE',
        message: 'Database not configured',
      });
    }

    // Collect all user data
    const [userProfile, preferences, alerts, auditLogs] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).maybeSingle(),
      supabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('user_alerts').select('*').eq('user_id', userId).limit(1000),
      supabase.from('audit_trail').select('*').eq('user_id', userId).limit(1000),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      userId,
      profile: userProfile.data || null,
      preferences: preferences.data || null,
      alerts: alerts.data || [],
      auditLogs: auditLogs.data || [],
    };

    // Log export request
    await logAuditEventManual(
      userId,
      'data_export_requested',
      'account',
      userId,
      { timestamp: new Date().toISOString() },
      req.ip,
      req.headers['user-agent'] as string,
      req.path,
      req.method
    ).catch(() => {});

    res.json({
      success: true,
      data: exportData,
    });
  }, {
    timeout: 30000,
    context: (req) => ({ endpoint: '/api/account/export' }),
  })
);

// ============================================
// ESG (Open Sustainability Index)
// ============================================

// GET /api/esg/scores - ESG scores by company name (Open Sustainability Index)
app.get('/api/esg/scores', async (req, res) => {
  try {
    const company = (req.query.company as string) || (req.query.name as string) || '';
    if (!company.trim()) {
      return res.status(400).json({ success: false, error: 'Query parameter "company" or "name" is required' });
    }
    const { fetchESGScores } = await import('./services/open-sustainability-service.js');
    const scores = await fetchESGScores(company);
    if (!scores) {
      return res.json({ success: true, data: null, message: 'No ESG data available for this company' });
    }
    res.json({ success: true, data: scores });
  } catch (error: any) {
    console.error('[API] ESG scores error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch ESG scores' });
  }
});

// ============================================
// Corporate Impact Endpoints
// ============================================

// GET /api/corporate-impact/signals - Get market signals with filters
app.get('/api/corporate-impact/signals', async (req, res) => {
  try {
    const type = req.query.type as string; // 'all', 'opportunity', 'risk'
    const sector = req.query.sector as string;
    const sectorsParam = req.query.sectors as string; // comma-separated industries for multi-filter
    const category = req.query.category as string; // 'geopolitics', 'finance', 'energy', 'supply-chain'
    const search = req.query.search as string; // Search by company name
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const sectorsArray = sectorsParam
      ? sectorsParam.split(',').map((s) => s.trim()).filter(Boolean)
      : sector && sector !== 'all'
        ? [sector]
        : null;

    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'Supabase not configured',
      });
    }

    // First, get event IDs if filtering by category
    let eventIdsForCategory: string[] = [];
    if (category && category !== 'all') {
      const { data: events } = await supabase
        .from('events')
        .select('id')
        .eq('discover_category', category);
      eventIdsForCategory = (events || []).map((e: any) => e.id);
      if (eventIdsForCategory.length === 0) {
        // No events with this category, return empty
        return res.json({
          success: true,
          data: {
            signals: [],
            total: 0,
            stats: {
              total_signals: 0,
              opportunities: 0,
              risks: 0,
              avg_confidence: 'Medium-High',
            },
            available_sectors: [],
            available_categories: [],
          },
        });
      }
    }

    // Build query
    let query = supabase
      .from('market_signals')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('generated_at', { ascending: false });

    // Apply filters
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }
    if (sectorsArray && sectorsArray.length > 0) {
      query = query.in('company_sector', sectorsArray);
    } else if (sector && sector !== 'all') {
      query = query.eq('company_sector', sector);
    }
    if (category && category !== 'all' && eventIdsForCategory.length > 0) {
      query = query.in('event_id', eventIdsForCategory);
    }
    if (search) {
      query = query.ilike('company_name', `%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: signals, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Calculate stats (global) and filtered stats when sector(s) filter is applied
    const { data: allSignals } = await supabase
      .from('market_signals')
      .select('type, company_sector, event_id')
      .eq('is_active', true);

    let opportunities = allSignals?.filter((s: any) => s.type === 'opportunity').length || 0;
    let risks = allSignals?.filter((s: any) => s.type === 'risk').length || 0;
    let filteredStats: { total_signals: number; opportunities: number; risks: number } | null = null;
    if (sectorsArray && sectorsArray.length > 0) {
      const filtered = (allSignals || []).filter((s: any) => s.company_sector && sectorsArray.includes(s.company_sector));
      filteredStats = {
        total_signals: filtered.length,
        opportunities: filtered.filter((s: any) => s.type === 'opportunity').length,
        risks: filtered.filter((s: any) => s.type === 'risk').length,
      };
    } else if (sector && sector !== 'all') {
      const filtered = (allSignals || []).filter((s: any) => s.company_sector === sector);
      filteredStats = {
        total_signals: filtered.length,
        opportunities: filtered.filter((s: any) => s.type === 'opportunity').length,
        risks: filtered.filter((s: any) => s.type === 'risk').length,
      };
    }

    // Get unique sectors
    const uniqueSectors = [...new Set((allSignals || []).map((s: any) => s.company_sector).filter(Boolean))];

    // Get unique categories from events
    const eventIds = [...new Set((allSignals || []).map((s: any) => s.event_id).filter(Boolean))];
    let uniqueCategories: string[] = [];
    if (eventIds.length > 0) {
      const { data: events } = await supabase
        .from('events')
        .select('discover_category')
        .in('id', eventIds.slice(0, 100)); // Limit to avoid too many queries
      uniqueCategories = [...new Set((events || []).map((e: any) => e.discover_category).filter(Boolean))];
    }

    // Last update (max generated_at) for "Last update: X ago"
    let last_update: string | null = null;
    const { data: lastRow } = await supabase
      .from('market_signals')
      .select('generated_at')
      .eq('is_active', true)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastRow && (lastRow as any).generated_at) {
      last_update = (lastRow as any).generated_at;
    }

    // Get event categories for signals
    const signalEventIds = [...new Set((signals || []).map((s: any) => s.event_id).filter(Boolean))];
    let eventCategoriesMap: Record<string, string> = {};
    if (signalEventIds.length > 0) {
      const { data: events } = await supabase
        .from('events')
        .select('id, discover_category')
        .in('id', signalEventIds);
      eventCategoriesMap = (events || []).reduce((acc: Record<string, string>, e: any) => {
        if (e.id && e.discover_category) {
          acc[e.id] = e.discover_category;
        }
        return acc;
      }, {});
    }

    // Transform to MarketSignal format
    const transformedSignals = await Promise.all((signals || []).map(async (signal: any) => {
      // Extract event category if available
      const eventCategory = signal.event_id ? eventCategoriesMap[signal.event_id] || null : null;
      // Get trade impact data from signal (already stored in trade_impact column)
      let tradeImpact = null;
      if (signal.trade_impact) {
        try {
          // Parse trade_impact JSONB if it's a string
          tradeImpact = typeof signal.trade_impact === 'string' 
            ? JSON.parse(signal.trade_impact) 
            : signal.trade_impact;
        } catch (error: any) {
          console.warn(`[Corporate Impact API] Failed to parse trade_impact for signal ${signal.id}:`, error.message);
        }
      }
      
      return {
        id: signal.id,
        type: signal.type,
        company: {
          name: signal.company_name,
          ticker: signal.company_ticker,
          sector: signal.company_sector,
          market_cap: signal.company_market_cap,
          current_price: signal.company_current_price,
          exchange: signal.company_exchange,
        },
        prediction: {
          direction: signal.prediction_direction,
          magnitude: signal.prediction_magnitude,
          timeframe: signal.prediction_timeframe,
          confidence: signal.prediction_confidence,
          target_price: signal.prediction_target_price,
        },
        catalyst_event: {
          title: signal.catalyst_event_title,
          event_id: signal.event_id,
          tier: signal.catalyst_event_tier,
          category: eventCategory,
          published: signal.generated_at ? new Date(signal.generated_at).toISOString() : new Date().toISOString(),
        },
        reasoning: {
          summary: signal.reasoning_summary,
          key_factors: signal.reasoning_key_factors || [],
          risks: signal.reasoning_risks || [],
        },
        market_data: signal.market_data || {},
        sources: Array.isArray(signal.sources) ? signal.sources : (signal.sources ? [signal.sources] : []),
        ...(tradeImpact ? { trade_impact: tradeImpact } : {}),
      };
    }));

    res.json({
      success: true,
      data: {
        signals: transformedSignals,
        total: count || 0,
        last_update: last_update || undefined,
        stats: {
          total_signals: allSignals?.length || 0,
          opportunities,
          risks,
          avg_confidence: 'Medium-High',
        },
        filtered_stats: filteredStats || undefined,
        available_sectors: uniqueSectors,
        available_categories: uniqueCategories,
      },
    });
  } catch (error: any) {
    console.error('[API] Corporate Impact signals error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// GET /api/corporate-impact/event-analysis/:eventId - Event-level causal analysis (event_impact_analyses)
app.get('/api/corporate-impact/event-analysis/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId as string;
    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'eventId is required',
      });
    }
    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'Supabase not configured',
      });
    }
    const { data, error } = await supabase
      .from('event_impact_analyses')
      .select('*')
      .eq('event_id', eventId)
      .maybeSingle();

    if (error) {
      console.error('[API] Event impact analysis error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch event analysis',
      });
    }
    if (!data) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No analysis yet for this event',
      });
    }
    res.status(200).json({
      success: true,
      data: {
        id: data.id,
        event_id: data.event_id,
        event_type: data.event_type,
        event_scope: data.event_scope,
        affected_sectors: data.affected_sectors || [],
        causal_chain: data.causal_chain || [],
        exposure_channels: data.exposure_channels || [],
        impact_assessment: data.impact_assessment || {},
        confidence_level: data.confidence_level,
        confidence_rationale: data.confidence_rationale,
        impact_score: data.impact_score,
        created_at: data.created_at,
      },
    });
  } catch (err: any) {
    console.error('[API] Event impact analysis error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Internal server error',
    });
  }
});

// POST /api/corporate-impact/event-analysis - Generate only event-level analysis (no signals)
app.post('/api/corporate-impact/event-analysis', async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ success: false, error: 'eventId is required' });
    }
    if (!supabase) {
      return res.status(503).json({ success: false, error: 'Supabase not configured' });
    }
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, published_at, description, content, region, sector, discover_category')
      .eq('id', eventId)
      .single();
    if (eventError || !event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    const { runEventImpactAnalysis } = await import('./services/corporate-impact-engine.js');
    const analysisId = await runEventImpactAnalysis({
      id: event.id,
      title: event.title,
      published_at: event.published_at,
      description: event.description,
      content: event.content,
      region: event.region,
      sector: event.sector,
      discover_category: event.discover_category,
    });
    if (!analysisId) {
      return res.status(500).json({ success: false, error: 'Analysis generation failed (check OPENAI_API_KEY)' });
    }
    const { data: analysis } = await supabase
      .from('event_impact_analyses')
      .select('*')
      .eq('event_id', eventId)
      .single();
    return res.status(200).json({
      success: true,
      data: analysis
        ? {
            id: analysis.id,
            event_id: analysis.event_id,
            event_type: analysis.event_type,
            event_scope: analysis.event_scope,
            affected_sectors: analysis.affected_sectors || [],
            causal_chain: analysis.causal_chain || [],
            exposure_channels: analysis.exposure_channels || [],
            impact_assessment: analysis.impact_assessment || {},
            confidence_level: analysis.confidence_level,
            confidence_rationale: analysis.confidence_rationale,
            impact_score: analysis.impact_score,
            created_at: analysis.created_at,
          }
        : null,
    });
  } catch (err: any) {
    console.error('[API] Event analysis generation error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal server error' });
  }
});

// POST /api/corporate-impact/generate - Generate signals for a specific event (admin only)
app.post('/api/corporate-impact/generate', async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'eventId is required',
      });
    }

    const { generateMarketSignalsFromEvent } = await import('./workers/corporate-impact-worker.js');
    const count = await generateMarketSignalsFromEvent(eventId);

    res.json({
      success: true,
      data: {
        signalsGenerated: count,
        eventId,
      },
    });
  } catch (error: any) {
    console.error('[API] Corporate Impact generate error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// POST /api/corporate-impact/perplexity-query - Real-time Corporate Impact query via Perplexity
app.post('/api/corporate-impact/perplexity-query', async (req, res) => {
  try {
    const { industries, query } = req.body;
    const userQuery = typeof query === 'string' ? query.trim() : '';
    if (!userQuery) {
      return res.status(400).json({ success: false, error: 'query is required' });
    }
    const industryList = Array.isArray(industries)
      ? industries.filter((i: unknown) => typeof i === 'string').map((i: string) => i.trim()).filter(Boolean)
      : [];
    const industryContext =
      industryList.length > 0
        ? `Focus your answer on these industries/sectors: ${industryList.join(', ')}. `
        : '';

    const { chatCompletions } = await import('./services/perplexity-service.js');
    const response = await chatCompletions({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: `You are a corporate impact and geopolitical risk analyst. ${industryContext}Answer the user's question with a focus on how events affect companies, sectors, and supply chains. Cite sources. Be concise and factual. Do not give investment advice or buy/sell recommendations.`,
        },
        { role: 'user', content: userQuery },
      ],
      return_citations: true,
      return_related_questions: true,
    });

    const content = response.choices?.[0]?.message?.content || '';
    const citations = response.choices?.[0]?.message?.citations || response.citations || [];
    const relatedQuestions = response.related_questions || [];

    res.status(200).json({
      success: true,
      data: { answer: content, citations, related_questions: relatedQuestions },
    });
  } catch (error: any) {
    console.error('[API] Corporate Impact Perplexity query error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Perplexity query failed (check PERPLEXITY_API_KEY)',
    });
  }
});

// POST /api/corporate-impact/trigger - Manually trigger signal generation (admin/dev)
app.post('/api/corporate-impact/trigger', async (req, res) => {
  try {
    const limit = req.body.limit ? parseInt(req.body.limit as string, 10) : 20;

    console.log('[API] Manually triggering Corporate Impact signal generation...');

    const { processCorporateImpactSignals } = await import('./workers/corporate-impact-worker.js');
    const result = await processCorporateImpactSignals(limit);

    console.log('[API] Corporate Impact generation complete:', result);

    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API] Error generating Corporate Impact signals:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate Corporate Impact signals',
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/corporate-impact/brief - Generate impact brief for tickers and/or industries (mini or pro)
app.post('/api/corporate-impact/brief', async (req, res) => {
  try {
    const body = req.body || {};
    const tickers = Array.isArray(body.tickers) ? body.tickers.map((t: unknown) => String(t).trim().toUpperCase()).filter(Boolean) : [];
    const industries = Array.isArray(body.industries) ? body.industries.map((i: unknown) => String(i).trim()).filter(Boolean) : [];
    const briefType = body.briefType === 'pro' ? 'pro' : 'mini';

    if (tickers.length === 0 && industries.length === 0) {
      return res.status(400).json({ success: false, error: 'Provide tickers (e.g. ["AAPL"]) and/or industries (e.g. ["Energy", "Materials"])' });
    }
    if (!supabase) {
      return res.status(503).json({ success: false, error: 'Supabase not configured' });
    }

    const { generateImpactBrief } = await import('./services/corporate-impact-brief-service.js');
    const result = await generateImpactBrief(supabase, tickers, briefType, industries.length > 0 ? industries : undefined);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[API] Corporate Impact brief error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate impact brief',
    });
  }
});

// GET /api/corporate-impact/status - Last update and counts (for UI "Last update: X ago")
app.get('/api/corporate-impact/status', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ success: false, error: 'Supabase not configured' });
    }
    const { data: lastRow } = await supabase
      .from('market_signals')
      .select('generated_at')
      .eq('is_active', true)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const { count } = await supabase
      .from('market_signals')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    res.json({
      success: true,
      data: {
        last_update: lastRow && (lastRow as any).generated_at ? (lastRow as any).generated_at : null,
        signals_count: count ?? 0,
      },
    });
  } catch (error: any) {
    console.error('[API] Corporate Impact status error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to get status' });
  }
});

// GET /api/corporate-impact/dashboard - Causal drivers, impact score summary, decision points (for teaser cards)
app.get('/api/corporate-impact/dashboard', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ success: false, error: 'Supabase not configured' });
    }

    const limit = 20;

    // Causal drivers: recent event_impact_analyses → event_type + first step of causal_chain
    const { data: analyses } = await supabase
      .from('event_impact_analyses')
      .select('event_type, causal_chain, impact_score')
      .order('updated_at', { ascending: false })
      .limit(limit);

    const causalDrivers: string[] = [];
    const seen = new Set<string>();
    for (const a of analyses || []) {
      const type = (a as any).event_type || 'Event';
      if (!seen.has(type)) {
        seen.add(type);
        causalDrivers.push(type);
      }
      const chain = (a as any).causal_chain;
      if (Array.isArray(chain) && chain[0]) {
        const first = String(chain[0]).slice(0, 60);
        if (first && !seen.has(first)) {
          seen.add(first);
          causalDrivers.push(first);
        }
      }
      if (causalDrivers.length >= 8) break;
    }

    // Impact score: average and distribution from analyses
    const scores = (analyses || []).map((a: any) => a.impact_score).filter((n) => typeof n === 'number');
    const avgScore = scores.length ? scores.reduce((s, n) => s + n, 0) / scores.length : null;
    const impactScoreSummary = avgScore !== null
      ? { average: Math.round(avgScore), count: scores.length, trend: 'neutral' as const }
      : null;

    // Decision points: from market_signals (opportunity → Accumulate, risk + high magnitude → Hedge/Exit)
    const { data: recentSignals } = await supabase
      .from('market_signals')
      .select('type, prediction_magnitude, prediction_confidence, company_name')
      .eq('is_active', true)
      .order('generated_at', { ascending: false })
      .limit(50);

    const decisionPoints: Array<{ label: string; reason: string; company?: string }> = [];
    for (const s of recentSignals || []) {
      const type = (s as any).type;
      const mag = (s as any).prediction_magnitude || '';
      const conf = (s as any).prediction_confidence || '';
      const name = (s as any).company_name || 'Company';
      if (type === 'opportunity' && (conf === 'high' || conf === 'medium-high')) {
        if (decisionPoints.every((d) => d.label !== 'Accumulate')) {
          decisionPoints.push({ label: 'Accumulate', reason: 'High-confidence opportunity signal', company: name });
        }
      } else if (type === 'risk') {
        if (mag && /high|critical|20%|25%|30%/.test(mag.toLowerCase()) && decisionPoints.every((d) => d.label !== 'Hedge')) {
          decisionPoints.push({ label: 'Hedge', reason: `Risk signal: ${mag}`, company: name });
        }
      }
      if (decisionPoints.length >= 5) break;
    }
    if (decisionPoints.length === 0 && (recentSignals || []).length > 0) {
      decisionPoints.push(
        { label: 'Hold', reason: 'Monitor event-driven exposure', company: (recentSignals as any[])[0]?.company_name }
      );
    }

    res.json({
      success: true,
      data: {
        causal_drivers: causalDrivers.slice(0, 8),
        impact_score: impactScoreSummary,
        decision_points: decisionPoints.slice(0, 5),
      },
    });
  } catch (error: any) {
    console.error('[API] Corporate Impact dashboard error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to get dashboard' });
  }
});

// GET /api/corporate-impact/comparable-events - Get comparable historical events
app.get('/api/corporate-impact/comparable-events', async (req, res) => {
  try {
    const eventId = req.query.event_id as string;
    const company = req.query.company as string;
    const type = req.query.type as string;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'event_id is required',
      });
    }

    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'Supabase not configured',
      });
    }

    // Get current event
    const { data: currentEvent, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !currentEvent) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    // Get historical events (events before current event)
    const { data: historicalEvents, error: historicalError } = await supabase
      .from('events')
      .select('id, title, description, content, published_at, discover_category, discover_tier')
      .neq('id', eventId)
      .lt('published_at', currentEvent.published_at || new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(20);

    if (historicalError) {
      throw new Error(historicalError.message);
    }

    if (!historicalEvents || historicalEvents.length === 0) {
      return res.json({
        success: true,
        data: { events: [] },
      });
    }

    // Use OpenAI to find similar events
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.json({
        success: true,
        data: { events: historicalEvents.slice(0, 5).map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          published_at: e.published_at,
          discover_category: e.discover_category,
          discover_tier: e.discover_tier,
        })) },
      });
    }

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: openaiApiKey });

    const historicalContext = historicalEvents.map((e: any, idx: number) => 
      `[Historical Event ${idx + 1}]
ID: ${e.id}
Title: ${e.title}
${e.description ? `Description: ${e.description.substring(0, 200)}` : ''}
Category: ${e.discover_category || 'N/A'}
Tier: ${e.discover_tier || 'N/A'}
Published: ${e.published_at}`
    ).join('\n\n');

    const prompt = `Compare this current event with historical events to find similar patterns.

CURRENT EVENT:
Title: ${currentEvent.title}
${currentEvent.description ? `Description: ${currentEvent.description.substring(0, 300)}` : ''}
Category: ${currentEvent.discover_category || 'N/A'}
Tier: ${currentEvent.discover_tier || 'N/A'}
Company: ${company || 'N/A'}
Signal Type: ${type || 'N/A'}

HISTORICAL EVENTS:
${historicalContext}

Find events that are similar in:
- Category/type
- Sector/region impact
- Event characteristics
- Potential market impact

For each similar event (similarity >= 0.6), return:
- similarity_score (0-1)
- similarity_factors (array of strings like ['category', 'sector', 'region'])
- comparison_insights (2-3 sentences)
- outcome_differences (2-3 sentences about what happened)
- lessons_learned (2-3 sentences)

Return JSON object with "comparisons" array (max 5 events, sorted by similarity_score descending):
{
  "comparisons": [
    {
      "id": "event-id",
      "similarity_score": 0.85,
      "similarity_factors": ["category", "sector"],
      "comparison_insights": "...",
      "outcome_differences": "...",
      "lessons_learned": "..."
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a financial historian specializing in identifying similar historical events. Return only valid JSON object with "comparisons" array.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return res.json({
        success: true,
        data: { events: historicalEvents.slice(0, 5).map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          published_at: e.published_at,
          discover_category: e.discover_category,
          discover_tier: e.discover_tier,
        })) },
      });
    }

    const parsed = JSON.parse(content);
    const comparisons = parsed.comparisons || [];

    // Merge with event data
    const eventsMap = new Map(historicalEvents.map((e: any) => [e.id, e]));
    const comparableEvents = comparisons
      .filter((c: any) => eventsMap.has(c.id))
      .map((c: any) => {
        const event = eventsMap.get(c.id);
        return {
          id: event.id,
          title: event.title,
          description: event.description,
          published_at: event.published_at,
          discover_category: event.discover_category,
          discover_tier: event.discover_tier,
          similarity_score: c.similarity_score,
          similarity_factors: c.similarity_factors || [],
          comparison_insights: c.comparison_insights,
          outcome_differences: c.outcome_differences,
          lessons_learned: c.lessons_learned,
        };
      })
      .slice(0, 5);

    res.json({
      success: true,
      data: { events: comparableEvents },
    });
  } catch (error: any) {
    console.error('[API] Comparable events error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// ============================================
// Watchlist Endpoints (MVP)
// ============================================

// GET /api/watchlists - Get user's watchlist
app.get('/api/watchlists', asyncHandler(async (req: express.Request, res: express.Response) => {
  if (!supabase) {
    return res.status(503).json({
      success: false,
      error: 'Supabase not configured',
    });
  }

  const clerkUserId = req.headers['x-clerk-user-id'] as string;
  const supabaseUserId = await getSupabaseUserId(clerkUserId || null, supabase);

  if (!supabaseUserId) {
    return res.status(401).json({
      success: false,
      error: 'User not authenticated',
    });
  }

  const { data, error } = await supabase
    .from('watchlists')
    .select('*')
    .eq('user_id', supabaseUserId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Watchlist] Error fetching watchlist:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }

  res.json({
    success: true,
    data: data || [],
  });
}));

// POST /api/watchlists - Add entity to watchlist
app.post('/api/watchlists', asyncHandler(async (req: express.Request, res: express.Response) => {
  if (!supabase) {
    return res.status(503).json({
      success: false,
      error: 'Supabase not configured',
    });
  }

  const clerkUserId = req.headers['x-clerk-user-id'] as string;
  const supabaseUserId = await getSupabaseUserId(clerkUserId || null, supabase);

  if (!supabaseUserId) {
    return res.status(401).json({
      success: false,
      error: 'User not authenticated',
    });
  }

  const { entity_type, entity_id, entity_name, entity_metadata, notify_on_signal, notify_on_event, notify_on_scenario } = req.body;

  if (!entity_type || !entity_id || !entity_name) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: entity_type, entity_id, entity_name',
    });
  }

  const { data, error } = await supabase
    .from('watchlists')
    .insert({
      user_id: supabaseUserId,
      entity_type,
      entity_id,
      entity_name,
      entity_metadata: entity_metadata || {},
      notify_on_signal: notify_on_signal !== undefined ? notify_on_signal : true,
      notify_on_event: notify_on_event !== undefined ? notify_on_event : true,
      notify_on_scenario: notify_on_scenario !== undefined ? notify_on_scenario : false,
    })
    .select()
    .single();

  if (error) {
    // If duplicate, return existing entry
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('watchlists')
        .select('*')
        .eq('user_id', supabaseUserId)
        .eq('entity_type', entity_type)
        .eq('entity_id', entity_id)
        .single();

      return res.json({
        success: true,
        data: existing,
        message: 'Entity already in watchlist',
      });
    }

    console.error('[Watchlist] Error adding to watchlist:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }

  res.json({
    success: true,
    data,
  });
}));

// DELETE /api/watchlists/:id - Remove entity from watchlist
app.delete('/api/watchlists/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  if (!supabase) {
    return res.status(503).json({
      success: false,
      error: 'Supabase not configured',
    });
  }

  const clerkUserId = req.headers['x-clerk-user-id'] as string;
  const supabaseUserId = await getSupabaseUserId(clerkUserId || null, supabase);

  if (!supabaseUserId) {
    return res.status(401).json({
      success: false,
      error: 'User not authenticated',
    });
  }

  const { id } = req.params;

  const { error } = await supabase
    .from('watchlists')
    .delete()
    .eq('id', id)
    .eq('user_id', supabaseUserId); // Ensure user can only delete their own

  if (error) {
    console.error('[Watchlist] Error removing from watchlist:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }

  res.json({
    success: true,
    message: 'Entity removed from watchlist',
  });
}));

// DELETE /api/watchlists - Remove by entity_type and entity_id
app.delete('/api/watchlists', asyncHandler(async (req: express.Request, res: express.Response) => {
  if (!supabase) {
    return res.status(503).json({
      success: false,
      error: 'Supabase not configured',
    });
  }

  const clerkUserId = req.headers['x-clerk-user-id'] as string;
  const supabaseUserId = await getSupabaseUserId(clerkUserId || null, supabase);

  if (!supabaseUserId) {
    return res.status(401).json({
      success: false,
      error: 'User not authenticated',
    });
  }

  const { entity_type, entity_id } = req.query;

  if (!entity_type || !entity_id) {
    return res.status(400).json({
      success: false,
      error: 'Missing required query params: entity_type, entity_id',
    });
  }

  const { error } = await supabase
    .from('watchlists')
    .delete()
    .eq('user_id', supabaseUserId)
    .eq('entity_type', entity_type as string)
    .eq('entity_id', entity_id as string);

  if (error) {
    console.error('[Watchlist] Error removing from watchlist:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }

  res.json({
    success: true,
    message: 'Entity removed from watchlist',
  });
}));

// GET /api/watchlists/check - Check if entity is in watchlist
app.get('/api/watchlists/check', asyncHandler(async (req: express.Request, res: express.Response) => {
  if (!supabase) {
    return res.status(503).json({
      success: false,
      error: 'Supabase not configured',
    });
  }

  const clerkUserId = req.headers['x-clerk-user-id'] as string;
  const supabaseUserId = await getSupabaseUserId(clerkUserId || null, supabase);

  if (!supabaseUserId) {
    return res.status(401).json({
      success: false,
      error: 'User not authenticated',
    });
  }

  const { entity_type, entity_id } = req.query;

  if (!entity_type || !entity_id) {
    return res.status(400).json({
      success: false,
      error: 'Missing required query params: entity_type, entity_id',
    });
  }

  const { data, error } = await supabase
    .from('watchlists')
    .select('*')
    .eq('user_id', supabaseUserId)
    .eq('entity_type', entity_type as string)
    .eq('entity_id', entity_id as string)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('[Watchlist] Error checking watchlist:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }

  res.json({
    success: true,
    data: {
      is_watched: !!data,
      watchlist_item: data || null,
    },
  });
}));

// ============================================
// Decision Points Endpoints
// ============================================

// GET /api/decision-points - Get decision points for scenarios/signals
app.get('/api/decision-points', asyncHandler(async (req: express.Request, res: express.Response) => {
  if (!supabase) {
    return res.status(503).json({
      success: false,
      error: 'Supabase not configured',
    });
  }

  const { scenario_id, signal_id, event_id, type, priority, status } = req.query;

  let query = supabase
    .from('decision_points')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (scenario_id) {
    query = query.eq('scenario_id', scenario_id as string);
  }
  if (signal_id) {
    query = query.eq('signal_id', signal_id as string);
  }
  if (event_id) {
    query = query.eq('event_id', event_id as string);
  }
  if (type) {
    query = query.eq('type', type as string);
  }
  if (priority) {
    query = query.eq('priority', priority as string);
  }
  if (status) {
    query = query.eq('status', status as string);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Decision Points] Error fetching decision points:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }

  res.json({
    success: true,
    data: data || [],
  });
}));

// ============================================
// Watchlist Changes Analysis Endpoints
// ============================================

// GET /api/watchlists/changes - Get changes for watchlist entities
app.get('/api/watchlists/changes', asyncHandler(async (req: express.Request, res: express.Response) => {
  if (!supabase) {
    return res.status(503).json({
      success: false,
      error: 'Supabase not configured',
    });
  }

  const clerkUserId = req.headers['x-clerk-user-id'] as string;
  const supabaseUserId = await getSupabaseUserId(clerkUserId || null, supabase);

  if (!supabaseUserId) {
    return res.status(401).json({
      success: false,
      error: 'User not authenticated',
    });
  }

  // Get user's watchlist
  const { data: watchlist, error: watchlistError } = await supabase
    .from('watchlists')
    .select('*')
    .eq('user_id', supabaseUserId)
    .order('created_at', { ascending: false });

  if (watchlistError) {
    console.error('[Watchlist Changes] Error fetching watchlist:', watchlistError);
    return res.status(500).json({
      success: false,
      error: watchlistError.message,
    });
  }

  if (!watchlist || watchlist.length === 0) {
    return res.json({
      success: true,
      data: [],
      message: 'No items in watchlist',
    });
  }

  // Analyze changes for each watchlist item
  const changes: any[] = [];
  const limit = parseInt(req.query.limit as string) || 10;
  const hoursBack = parseInt(req.query.hours_back as string) || 24;

  for (const item of watchlist.slice(0, limit)) {
    try {
      // Find recent signals/events related to this entity
      let relatedSignals: any[] = [];
      let relatedEvents: any[] = [];

      if (item.entity_type === 'company') {
        // Search for signals/events mentioning this company
        const { data: signals } = await supabase
          .from('market_signals')
          .select('*')
          .or(`title.ilike.%${item.entity_name}%,summary.ilike.%${item.entity_name}%`)
          .gte('created_at', new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString())
          .limit(3);

        relatedSignals = signals || [];
      } else if (item.entity_type === 'country' || item.entity_type === 'sector') {
        // Search for events in this country/sector
        const { data: events } = await supabase
          .from('nucigen_events')
          .select('*')
          .or(`country.ilike.%${item.entity_name}%,sector.ilike.%${item.entity_name}%,region.ilike.%${item.entity_name}%`)
          .gte('created_at', new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString())
          .limit(3);

        relatedEvents = events || [];
      }

      // Create change entry if there are related items
      if (relatedSignals.length > 0 || relatedEvents.length > 0) {
        const latestItem = relatedSignals[0] || relatedEvents[0];
        const impactScore = latestItem?.impact_score || latestItem?.confidence || 50;

        changes.push({
          id: `change-${item.id}`,
          watchlist_item_id: item.id,
          entity_type: item.entity_type,
          entity_name: item.entity_name,
          change_type: impactScore > 70 ? 'positive' : impactScore < 40 ? 'negative' : 'neutral',
          change_description: latestItem?.summary || latestItem?.title || `Recent activity detected for ${item.entity_name}`,
          impact_score: Math.round(impactScore),
          related_signal_id: relatedSignals[0]?.id,
          related_event_id: relatedEvents[0]?.id,
          timestamp: latestItem?.created_at || new Date().toISOString(),
        });
      }
    } catch (error: any) {
      console.error(`[Watchlist Changes] Error analyzing changes for ${item.entity_name}:`, error);
      // Continue with other items
    }
  }

  res.json({
    success: true,
    data: changes,
    watchlist_count: watchlist.length,
  });
}));

// ============================================
// Watchlist Notifications Endpoints
// ============================================

// GET /api/watchlists/notifications - Get user's watchlist notifications
app.get('/api/watchlists/notifications', asyncHandler(async (req: express.Request, res: express.Response) => {
  if (!supabase) {
    return res.status(503).json({
      success: false,
      error: 'Supabase not configured',
    });
  }

  const clerkUserId = req.headers['x-clerk-user-id'] as string;
  const supabaseUserId = await getSupabaseUserId(clerkUserId || null, supabase);

  if (!supabaseUserId) {
    return res.status(401).json({
      success: false,
      error: 'User not authenticated',
    });
  }

  const { unread_only, limit } = req.query;
  const limitNum = limit ? parseInt(limit as string) : 50;

  let query = supabase
    .from('watchlist_notifications')
    .select('*')
    .eq('user_id', supabaseUserId)
    .order('created_at', { ascending: false })
    .limit(limitNum);

  if (unread_only === 'true') {
    query = query.eq('read', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Watchlist Notifications] Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }

  res.json({
    success: true,
    data: data || [],
    unread_count: data?.filter((n: any) => !n.read).length || 0,
  });
}));

// POST /api/watchlists/notifications/:id/read - Mark notification as read
app.post('/api/watchlists/notifications/:id/read', asyncHandler(async (req: express.Request, res: express.Response) => {
  if (!supabase) {
    return res.status(503).json({
      success: false,
      error: 'Supabase not configured',
    });
  }

  const clerkUserId = req.headers['x-clerk-user-id'] as string;
  const supabaseUserId = await getSupabaseUserId(clerkUserId || null, supabase);

  if (!supabaseUserId) {
    return res.status(401).json({
      success: false,
      error: 'User not authenticated',
    });
  }

  const { id } = req.params;

  const { error } = await supabase
    .from('watchlist_notifications')
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', supabaseUserId); // Ensure user can only update their own

  if (error) {
    console.error('[Watchlist Notifications] Error marking as read:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }

  res.json({
    success: true,
    message: 'Notification marked as read',
  });
}));

// POST /api/watchlists/notifications/read-all - Mark all notifications as read
app.post('/api/watchlists/notifications/read-all', asyncHandler(async (req: express.Request, res: express.Response) => {
  if (!supabase) {
    return res.status(503).json({
      success: false,
      error: 'Supabase not configured',
    });
  }

  const clerkUserId = req.headers['x-clerk-user-id'] as string;
  const supabaseUserId = await getSupabaseUserId(clerkUserId || null, supabase);

  if (!supabaseUserId) {
    return res.status(401).json({
      success: false,
      error: 'User not authenticated',
    });
  }

  const { error } = await supabase
    .from('watchlist_notifications')
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('user_id', supabaseUserId)
    .eq('read', false);

  if (error) {
    console.error('[Watchlist Notifications] Error marking all as read:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }

  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
}));

// GET /api/cron/decision-points - Vercel Cron Job endpoint (automatic decision points generation)
app.get('/api/cron/decision-points', async (req: express.Request, res: express.Response) => {
  try {
    // Verify cron secret (Vercel sends this header)
    const authHeader = req.headers['authorization'];
    const cronSecret = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      if (process.env.NODE_ENV === 'production' && !authHeader) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized - cron secret required',
          timestamp: new Date().toISOString(),
        });
      }
    }

    console.log('[API Cron] Starting Decision Points generation...');

    const { processDecisionPoints } = await import('./workers/decision-points-worker.js');
    const result = await processDecisionPoints(20); // Process top 20 scenarios

    console.log('[API Cron] Decision Points generation complete:', result);

    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API Cron] Error generating Decision Points:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate Decision Points',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/cron/watchlist-notifications - Vercel Cron Job endpoint (automatic watchlist notifications)
app.get('/api/cron/watchlist-notifications', async (req: express.Request, res: express.Response) => {
  try {
    // Verify cron secret (Vercel sends this header)
    const authHeader = req.headers['authorization'];
    const cronSecret = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      if (process.env.NODE_ENV === 'production' && !authHeader) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized - cron secret required',
          timestamp: new Date().toISOString(),
        });
      }
    }

    console.log('[API Cron] Starting Watchlist Notifications generation...');

    const { processWatchlistNotifications } = await import('./workers/watchlist-notifications-worker.js');
    const hoursBack = parseInt(req.query.hours_back as string) || 24;
    const result = await processWatchlistNotifications(hoursBack);

    console.log('[API Cron] Watchlist Notifications generation complete:', result);

    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API Cron] Error generating Watchlist Notifications:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate Watchlist Notifications',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/cron/corporate-impact - Vercel Cron Job endpoint (automatic signal generation every hour)
app.get('/api/cron/corporate-impact', async (req: express.Request, res: express.Response) => {
  try {
    // Verify cron secret (Vercel sends this header)
    const authHeader = req.headers['authorization'];
    const cronSecret = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      if (process.env.NODE_ENV === 'production' && !authHeader) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized - cron secret required',
          timestamp: new Date().toISOString(),
        });
      }
    }

    console.log('[API Cron] Starting Corporate Impact signal generation...');

    const { processCorporateImpactSignals } = await import('./workers/corporate-impact-worker.js');
    const result = await processCorporateImpactSignals(20); // Process top 20 events (increased from 5)

    console.log('[API Cron] Corporate Impact generation complete:', result);

    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API Cron] Error generating Corporate Impact signals:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate Corporate Impact signals',
      timestamp: new Date().toISOString(),
    });
  }
});

const server = app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Live Search: POST http://localhost:${PORT}/live-search`);
  console.log(`   Deep Research: POST http://localhost:${PORT}/deep-research`);
  console.log(`   Process Event: POST http://localhost:${PORT}/process-event`);
  console.log(`   Search: POST http://localhost:${PORT}/api/search`);
  console.log(`   Enrich: POST http://localhost:${PORT}/api/enrich`);
  console.log(`   Save Search: POST http://localhost:${PORT}/api/save-search`);
  console.log(`   Personalized Collect: POST http://localhost:${PORT}/personalized-collect`);
  console.log(`   Predict Relevance: POST http://localhost:${PORT}/api/predict-relevance`);
  console.log(`   Generate Signals: POST http://localhost:${PORT}/api/signals`);
  console.log(`   Generate Impacts: POST http://localhost:${PORT}/api/impacts`);
  console.log(`   Market Data: GET http://localhost:${PORT}/api/market-data/:symbol`);
  console.log(`   Time Series: GET http://localhost:${PORT}/api/market-data/:symbol/timeseries`);
  console.log(`\n   Optional Endpoints (for performance):`);
  console.log(`   Overview KPIs: GET http://localhost:${PORT}/api/overview/kpis`);
  console.log(`   Overview Map: GET http://localhost:${PORT}/api/overview/map`);
  console.log(`   Overview Narrative: GET http://localhost:${PORT}/api/overview/narrative`);
  console.log(`   Triggered Alerts: GET http://localhost:${PORT}/api/alerts/triggered`);
  console.log(`   Events List: GET http://localhost:${PORT}/api/events`);
  console.log(`   Event Context: GET http://localhost:${PORT}/api/events/:id/context`);
  console.log(`   Event Predictions: GET http://localhost:${PORT}/api/events/:eventId/predictions`);
  console.log(`   Signals List: GET http://localhost:${PORT}/api/signals`);
  console.log(`   Signal Detail: GET http://localhost:${PORT}/api/signals/:id`);
  console.log(`   Impacts List: GET http://localhost:${PORT}/api/impacts`);
  console.log(`   Impact Detail: GET http://localhost:${PORT}/api/impacts/:id`);
  console.log(`   Discover Feed: GET http://localhost:${PORT}/api/discover`);
  console.log(`   Corporate Impact Signals: GET http://localhost:${PORT}/api/corporate-impact/signals`);
  console.log(`   Corporate Impact Generate: POST http://localhost:${PORT}/api/corporate-impact/generate`);
  console.log(`   Corporate Impact Trigger: POST http://localhost:${PORT}/api/corporate-impact/trigger`);
  console.log(`   Corporate Impact Comparable Events: GET http://localhost:${PORT}/api/corporate-impact/comparable-events`);
  console.log(`   Corporate Impact Cron: GET http://localhost:${PORT}/api/cron/corporate-impact`);
  console.log(`   EventRegistry Search Articles: GET http://localhost:${PORT}/api/eventregistry/search-articles`);
  console.log(`   EventRegistry Search Events: GET http://localhost:${PORT}/api/eventregistry/search-events`);
  console.log(`   EventRegistry Trending: GET http://localhost:${PORT}/api/eventregistry/trending`);
  console.log(`\n   Server is ready to accept requests. Press Ctrl+C to stop.\n`);
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\n\n[API Server] Received SIGINT. Shutting down gracefully...');
  server.close(() => {
    console.log('[API Server] Server closed. Goodbye!');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('[API Server] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

process.on('SIGTERM', () => {
  console.log('\n\n[API Server] Received SIGTERM. Shutting down gracefully...');
  server.close(() => {
    console.log('[API Server] Server closed. Goodbye!');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('[API Server] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('[API Server] Uncaught Exception:', error);
  server.close(() => {
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[API Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

