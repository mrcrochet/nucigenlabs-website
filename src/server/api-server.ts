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
import { createClient } from '@supabase/supabase-js';
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
import { auditMiddleware } from './middleware/audit-middleware.js';
app.use(auditMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
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

const server = app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Live Search: POST http://localhost:${PORT}/live-search`);
  console.log(`   Personalized Collect: POST http://localhost:${PORT}/personalized-collect`);
  console.log(`   Predict Relevance: POST http://localhost:${PORT}/api/predict-relevance`);
  console.log(`   Generate Signals: POST http://localhost:${PORT}/api/signals`);
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

