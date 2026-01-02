# PHASE 3A: Pipeline Automation Workers

## Overview

Automated pipeline for collecting and processing events without manual intervention.

## Workers

### 1. Data Collector (`data-collector.ts`)

Collects news articles from NewsAPI and inserts them into the `events` table.

**Features:**
- Fetches from multiple categories (business, technology, general)
- Automatic deduplication
- Error handling and logging

**Usage:**
```bash
npm run pipeline:collect
```

### 2. Event Processor (`event-processor.ts`)

Processes pending events through Phase 1 (extraction) and Phase 2B (causal chains).

**Features:**
- Processes events in batches (default: 10)
- Sequential processing to avoid rate limits
- Error handling with status updates
- Automatic retry on transient errors

**Usage:**
```bash
# Process 10 events (default)
npm run pipeline:process

# Process custom number
npx tsx src/server/workers/event-processor.ts 20
```

### 3. Pipeline Orchestrator (`pipeline-orchestrator.ts`)

Coordinates collection and processing with configurable intervals.

**Features:**
- Runs collection and processing cycles
- Configurable intervals
- Run once or continuous mode
- Graceful shutdown handling

**Usage:**
```bash
# Run once
npm run pipeline:run-once

# Run continuously
npm run pipeline:run
```

## Environment Variables

Required:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

Optional:
- `NEWS_API_KEY` (for data collection)
- `COLLECTION_INTERVAL` (default: 3600000ms = 1 hour)
- `PROCESSING_INTERVAL` (default: 900000ms = 15 minutes)
- `PROCESSING_BATCH_SIZE` (default: 10)
- `RUN_ONCE` (set to "true" for one-time execution)

## Deployment

See `PHASE3A_SETUP.md` for detailed deployment instructions.

