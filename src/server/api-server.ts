/**
 * Simple API Server for Live Search
 * 
 * Run with: npx tsx src/server/api-server.ts
 * Or: npm run api:server
 */

import express from 'express';
import cors from 'cors';
import { searchAndCreateLiveEvent } from './services/live-event-creator.js';
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

app.use(cors());
app.use(express.json());

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
    console.error('[API] Error:', error);
    // Ensure we always send valid JSON
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Live Search: POST http://localhost:${PORT}/live-search`);
});

