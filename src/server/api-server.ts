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
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Try multiple paths for .env file
dotenv.config({ path: join(__dirname, '../../.env') });
dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config(); // Also try default .env in current directory

const app = express();
const PORT = process.env.API_PORT || 3001;

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

// Deep Research endpoint - comprehensive analysis in seconds (like ChatGPT Deep Research)
app.post('/deep-research', async (req, res) => {
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
    
    // Provide more detailed error messages
    let errorMessage = error.message || 'Failed to conduct research';
    
    // Check for common issues
    if (error.message?.includes('API key') || error.message?.includes('required')) {
      errorMessage = `Configuration error: ${error.message}. Please check your .env file for OPENAI_API_KEY and TAVILY_API_KEY.`;
    } else if (error.message?.includes('Tavily')) {
      errorMessage = `Tavily API error: ${error.message}. Please check your TAVILY_API_KEY.`;
    } else if (error.message?.includes('OpenAI')) {
      errorMessage = `OpenAI API error: ${error.message}. Please check your OPENAI_API_KEY.`;
    } else if (error.message?.includes('Supabase')) {
      errorMessage = `Database error: ${error.message}. Please check your Supabase configuration.`;
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

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

// Market Disconnect endpoint
app.post('/api/markets/disconnect', async (req, res) => {
  try {
    const { signal, marketData } = req.body;

    if (!signal) {
      return res.status(400).json({
        success: false,
        error: 'signal is required',
      });
    }

    const { MarketDisconnectAgent } = await import('./agents/market-disconnect-agent.js');
    const agent = new MarketDisconnectAgent();
    const disconnect = await agent.detectDisconnect({
      signal,
      marketData: marketData || {},
    });

    res.json({
      success: true,
      data: disconnect,
    });
  } catch (error: any) {
    console.error('[API] Market disconnect error:', error);
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

// GET /api/markets/movers - Market movers
app.get('/api/markets/movers', async (req, res) => {
  try {
    const range = (req.query.range as string) || '24h';
    const limit = parseInt((req.query.limit as string) || '8', 10);

    // Common symbols to track
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'JPM', 'BAC'];

    const movers = await Promise.all(
      symbols.slice(0, limit).map(async (symbol) => {
        try {
          const priceData = await getRealTimePrice(symbol);
          
          // Get timeseries for sparkline
          let sparklineData: number[] = [];
          try {
            const tsData = await getTimeSeries(symbol, { interval: '1h', days: 1 });
            if (tsData && tsData.values) {
              sparklineData = tsData.values.map((point: any) => parseFloat(point.close || point.price || 0));
            }
          } catch (tsError) {
            // Ignore timeseries errors
          }

          return {
            symbol,
            name: `${symbol} Inc.`, // TODO: Get real name from API
            change_percent: parseFloat(priceData.percent_change || '0'),
            volume: parseInt(priceData.volume || '0'),
            sparkline_data: sparklineData.length > 0 ? sparklineData : Array.from({ length: 10 }, () => Math.random() * 100),
          };
        } catch (error) {
          console.warn(`[API] Failed to fetch data for ${symbol}:`, error);
          return null;
        }
      })
    );

    const validMovers = movers.filter(m => m !== null);
    
    // Sort by change_percent (absolute value)
    validMovers.sort((a, b) => Math.abs(b!.change_percent) - Math.abs(a!.change_percent));

    res.json({
      success: true,
      data: {
        movers: validMovers,
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
// Optional Endpoints - Markets
// ============================================

// GET /api/markets/overview - Markets overview
app.get('/api/markets/overview', async (req, res) => {
  try {
    // Get indices data
    const indices = ['SPX', 'DJI', 'IXIC'].map(symbol => ({
      symbol,
      name: symbol === 'SPX' ? 'S&P 500' : symbol === 'DJI' ? 'Dow Jones' : 'NASDAQ',
      price: 0,
      change_percent: 0,
    }));

    // Get watchlist heatmap data (placeholder)
    const heatmap = {
      watchlist: 'default',
      data: [] as any[],
    };

    res.json({
      success: true,
      data: {
        indices,
        heatmap,
      },
    });
  } catch (error: any) {
    console.error('[API] Markets overview error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// GET /api/markets/asset/:symbol/attribution - Asset attribution
app.get('/api/markets/asset/:symbol/attribution', async (req, res) => {
  try {
    const { symbol } = req.params;
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);

    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'Supabase not configured',
      });
    }

    const supabaseUserId = userId ? await getSupabaseUserId(userId, supabase) : null;

    // Get timeseries for the asset
    const tsData = await getTimeSeries(symbol, { interval: '1h', days: 7 });
    
    if (!tsData || !tsData.values || tsData.values.length === 0) {
      return res.json({
        success: true,
        data: {
          symbol,
          attributions: [],
          note: 'Temporal proximity, not causality',
        },
      });
    }

    // Get events that might be related (same sector or region)
    const { getNormalizedEvents } = await import('../lib/supabase.js');
    const recentEvents = await getNormalizedEvents({
      dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      dateTo: new Date().toISOString(),
      limit: 50,
    }, supabaseUserId || undefined);

    // Calculate price changes and match with events
    const attributions: any[] = [];
    const prices = tsData.values.map((v: any) => ({
      timestamp: new Date(v.datetime),
      price: parseFloat(v.close || v.price || 0),
    }));

    for (let i = 1; i < prices.length; i++) {
      const delta = ((prices[i].price - prices[i - 1].price) / prices[i - 1].price) * 100;
      
      if (Math.abs(delta) > 1) { // Significant change (>1%)
        // Find events within 24h of this price change
        const eventTime = prices[i].timestamp;
        const nearbyEvents = recentEvents.filter(e => {
          const eventDate = new Date(e.created_at);
          const diffHours = Math.abs(eventTime.getTime() - eventDate.getTime()) / (1000 * 60 * 60);
          return diffHours <= 24;
        });

        if (nearbyEvents.length > 0) {
          attributions.push({
            event_id: nearbyEvents[0].id,
            event_headline: nearbyEvents[0].summary || 'Event',
            timestamp: eventTime.toISOString(),
            delta_percent: delta,
            temporal_proximity: 'within 24h',
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        symbol,
        attributions: attributions.slice(0, 10), // Limit to 10
        note: 'Temporal proximity, not causality',
      },
    });
  } catch (error: any) {
    console.error('[API] Asset attribution error:', error);
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
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);

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

    // Note: Watchlists table may not exist yet
    // Return placeholder response
    res.json({
      success: true,
      data: {
        watchlists: [],
      },
      message: 'Watchlists feature not yet implemented.',
    });
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

// GET /api/markets/overview - Markets overview
app.get('/api/markets/overview', async (req, res) => {
  try {
    // Common indices and symbols
    const indices = [
      { symbol: 'SPX', name: 'S&P 500' },
      { symbol: 'DJI', name: 'Dow Jones' },
      { symbol: 'IXIC', name: 'NASDAQ' },
    ];

    const indicesData = await Promise.all(
      indices.map(async (index) => {
        try {
          const priceData = await getRealTimePrice(index.symbol);
          return {
            symbol: index.symbol,
            name: index.name,
            price: priceData.price || 0,
            change_percent: priceData.change_percent || 0,
          };
        } catch (error: any) {
          console.warn(`[API] Failed to fetch ${index.symbol}:`, error.message);
          return null;
        }
      })
    );

    // Heatmap data (placeholder - TODO: implement watchlist-based heatmap)
    const heatmap = {
      watchlist: 'default',
      data: [],
    };

    res.json({
      success: true,
      data: {
        indices: indicesData.filter((i): i is NonNullable<typeof i> => i !== null),
        heatmap,
      },
    });
  } catch (error: any) {
    console.error('[API] Markets overview error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// GET /api/markets/asset/:symbol/attribution - Asset attribution (temporal proximity)
app.get('/api/markets/asset/:symbol/attribution', async (req, res) => {
  try {
    const { symbol } = req.params;
    const userId = (req.query.userId as string) || (req.body?.userId as string) || null;
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;

    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase not configured',
      });
    }

    // Import functions dynamically
    const { getNormalizedEvents } = await import('../lib/supabase.js');

    // Get price history to find significant moves
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const timeseries = await getTimeSeries(symbol, {
      interval: '1day',
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    });

    if (!timeseries || !timeseries.values || timeseries.values.length === 0) {
      return res.json({
        success: true,
        data: {
          symbol,
          attributions: [],
          note: 'Temporal proximity, not causality',
        },
      });
    }

    // Find significant price moves (> 2%)
    const significantMoves: Array<{ timestamp: string; delta_percent: number }> = [];
    for (let i = 1; i < timeseries.values.length; i++) {
            const prev = parseFloat(timeseries.values[i - 1].close || '0');
            const curr = parseFloat(timeseries.values[i].close || '0');
      const delta = ((curr - prev) / prev) * 100;
      
      if (Math.abs(delta) > 2) {
        significantMoves.push({
          timestamp: timeseries.values[i].datetime,
          delta_percent: delta,
        });
      }
    }

    // Get events within 24h of significant moves
    const attributions = await Promise.all(
      significantMoves.map(async (move) => {
        const moveDate = new Date(move.timestamp);
        const eventStart = new Date(moveDate.getTime() - 24 * 60 * 60 * 1000);
        const eventEnd = new Date(moveDate.getTime() + 24 * 60 * 60 * 1000);

        const allEvents = await getNormalizedEvents({}, userId || undefined);
        const events = filterEventsByDateRange(allEvents, eventStart.toISOString(), eventEnd.toISOString());

        return events.map((event: any) => ({
          event_id: event.id,
          event_headline: event.headline || event.description?.substring(0, 100) || 'Event',
          timestamp: move.timestamp,
          delta_percent: move.delta_percent,
          temporal_proximity: 'within 24h',
        }));
      })
    ).then(results => results.flat());

    res.json({
      success: true,
      data: {
        symbol,
        attributions: attributions.slice(0, 10), // Limit to 10
        note: 'Temporal proximity, not causality',
      },
    });
  } catch (error: any) {
    console.error('[API] Asset attribution error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
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
    
            // Fetch items from events table (read-only, no Perplexity calls)
            let items: any[] = [];
            try {
              items = await fetchDiscoverItems(
                category,
                { offset, limit },
                userId,
                searchQuery,
                timeRange,
                sortBy
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

    // Get user preferences for personalization
    let userPreferences: any = null;
    if (userId && supabase) {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('preferred_sectors, preferred_regions')
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

    // Items are already filtered and paginated by DB query
    const paginatedItems = items;
    const hasMore = items.length === limit; // If we got full limit, there might be more

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

// POST /api/discover/:id/save - Save item to library
app.post('/api/discover/:id/save', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req.query.userId as string) || (req.body?.userId as string);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID required',
      });
    }

    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: 'Database not configured',
      });
    }

    // Track engagement
    try {
      const { trackEngagement } = await import('./services/engagement-service.js');
      await trackEngagement(userId, id, 'save');
    } catch (trackError: any) {
      console.warn('[API] Failed to track save engagement:', trackError);
      // Don't fail the request if tracking fails
    }

    // For now, just return success (library feature to be implemented)
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

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    console.log(`[API] Search request: "${query}" (mode: ${mode})`);

    const { search } = await import('./services/search-orchestrator.js');
    const result = await search(query.trim(), mode, filters);

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
  fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-server.ts:3225',message:'Endpoint entry',data:{body:req.body,headers:Object.keys(req.headers),hasSupabase:!!supabase},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,C'})}).catch(()=>{});
  // #endregion

  try {
    const { query, inputType = 'text' } = req.body;
    // Extract Clerk user ID from headers (set by frontend)
    const clerkUserId = req.headers['x-clerk-user-id'] as string || null;

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-server.ts:3230',message:'Before userId extraction',data:{query,inputType,clerkUserId,hasSupabase:!!supabase},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,D'})}).catch(()=>{});
    // #endregion

    let userId = null;
    if (clerkUserId && supabase) {
      try {
        userId = await getSupabaseUserId(clerkUserId, supabase);
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-server.ts:3236',message:'After userId extraction',data:{userId,clerkUserId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      } catch (userIdError: any) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-server.ts:3240',message:'UserId extraction error',data:{error:userIdError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        // Continue without userId if extraction fails
      }
    }

    if (!query || typeof query !== 'string' || !query.trim()) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-server.ts:3248',message:'Query validation failed',data:{query,queryType:typeof query},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    console.log(`[API] Creating search session: "${query}" (type: ${inputType})`);

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-server.ts:3256',message:'Before search execution',data:{query,inputType,sessionId:`session-${Date.now()}-${Math.random().toString(36).substring(7)}`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // Generate session ID
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    let searchResult;
    
    if (inputType === 'url') {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-server.ts:3262',message:'URL processing branch',data:{query:query.trim(),queryLength:query.trim().length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      // Validate and clean URL
      let cleanUrl = query.trim();
      try {
        // Try to parse as URL to validate
        const testUrl = new URL(cleanUrl);
        cleanUrl = testUrl.href; // Normalize URL
      } catch (urlError: any) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-server.ts:3268',message:'Invalid URL format',data:{query:cleanUrl,error:urlError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        throw new Error(`Invalid URL format: ${urlError.message}`);
      }

      try {
        // Process URL: Tavily context + Firecrawl extraction
        const { processLink } = await import('./services/link-intelligence.js');
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-server.ts:3277',message:'Before processLink',data:{cleanUrl,urlLength:cleanUrl.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        const linkResult = await processLink(cleanUrl, undefined, { permissive: true });
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-server.ts:3271',message:'After processLink',data:{hasResult:!!linkResult.result,hasGraph:!!linkResult.graph,fallbackUsed:linkResult.fallbackUsed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        // Also search Tavily for context around the URL
        const { searchTavily } = await import('./services/tavily-unified-service.js');
        const domain = new URL(cleanUrl).hostname;
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-server.ts:3276',message:'Before searchTavily',data:{domain},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        const tavilyContext = await searchTavily(domain, 'news', {
          searchDepth: 'advanced',
          maxResults: 10,
          includeRawContent: true,
        });
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-server.ts:3283',message:'After searchTavily',data:{articlesCount:tavilyContext.articles?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
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
        fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-server.ts:3288',message:'URL processing error',data:{errorName:urlError?.name,errorMessage:urlError?.message,errorStack:urlError?.stack?.substring(0,500),errorCode:urlError?.code,errorType:urlError?.errorType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        console.error('[API] URL processing error:', urlError);
        throw urlError;
      }
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-server.ts:3294',message:'Text search branch',data:{query:query.trim()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      try {
        // Text search: use search orchestrator
        const { search } = await import('./services/search-orchestrator.js');
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-server.ts:3298',message:'Before search orchestrator',data:{query:query.trim()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        searchResult = await search(query.trim(), 'standard', {});
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-server.ts:3301',message:'After search orchestrator',data:{resultsCount:searchResult?.results?.length||0,hasGraph:!!searchResult?.graph},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      } catch (textError: any) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-server.ts:3305',message:'Text search error',data:{error:textError?.message,stack:textError?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
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

    // In a real implementation, store in database
    // For now, we'll return it and the frontend will manage state

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-server.ts:3317',message:'Before response',data:{sessionId,resultsCount:session.results?.length||0,hasGraph:!!session.graph},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    res.json({
      success: true,
      sessionId,
      session,
    });

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-server.ts:3325',message:'Response sent',data:{success:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
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
    fetch('http://127.0.0.1:7243/ingest/d5287a41-fd4f-411d-9c06-41570ed77474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api-server.ts:3330',message:'Error caught in endpoint',data:errorDetails,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    console.error('[API] Create session error:', error);
    console.error('[API] Error details:', errorDetails);
    res.status(500).json({
      success: false,
      error: error?.message || error?.error || 'Internal server error',
    });
  }
});

// GET /api/search/session/:id - Get search session
app.get('/api/search/session/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getSupabaseUserId(req);

    // TODO: Load from database
    // For now, return error (session should be managed by frontend state)
    // In production, store sessions in database
    
    res.status(404).json({
      success: false,
      error: 'Session not found. Sessions are currently managed client-side.',
    });
  } catch (error: any) {
    console.error('[API] Get session error:', error);
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

    console.log(`[API] Followup search in session ${id}: "${query}"`);

    // Perform search
    const { search } = await import('./services/search-orchestrator.js');
    const searchResult = await search(query.trim(), 'standard', {});

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
  console.log(`   Overview Narrative: GET http://localhost:${PORT}/api/overview/narrative`);
  console.log(`   Market Movers: GET http://localhost:${PORT}/api/markets/movers`);
  console.log(`   Triggered Alerts: GET http://localhost:${PORT}/api/alerts/triggered`);
  console.log(`   Events List: GET http://localhost:${PORT}/api/events`);
  console.log(`   Event Context: GET http://localhost:${PORT}/api/events/:id/context`);
  console.log(`   Signals List: GET http://localhost:${PORT}/api/signals`);
  console.log(`   Signal Detail: GET http://localhost:${PORT}/api/signals/:id`);
  console.log(`   Markets Overview: GET http://localhost:${PORT}/api/markets/overview`);
  console.log(`   Asset Attribution: GET http://localhost:${PORT}/api/markets/asset/:symbol/attribution`);
  console.log(`   Impacts List: GET http://localhost:${PORT}/api/impacts`);
  console.log(`   Impact Detail: GET http://localhost:${PORT}/api/impacts/:id`);
  console.log(`   Discover Feed: GET http://localhost:${PORT}/api/discover`);
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

