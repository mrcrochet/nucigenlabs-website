/**
 * PHASE 3A: Pipeline Orchestrator
 * 
 * Main orchestrator that coordinates:
 * 1. Data collection (collectNewsEvents)
 * 2. Event processing (processPendingEvents)
 * 
 * Runs in a loop with configurable intervals
 */

import { collectNewsEvents } from './data-collector';
import { processPendingEvents } from './event-processor';
import { runAlertsGenerator } from './alerts-generator';

interface OrchestratorConfig {
  collectionInterval: number; // milliseconds
  processingInterval: number; // milliseconds
  processingBatchSize: number;
  runOnce?: boolean; // If true, run once and exit
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  collectionInterval: 60 * 60 * 1000, // 1 hour
  processingInterval: 15 * 60 * 1000, // 15 minutes
  processingBatchSize: 10,
};

/**
 * Run one complete cycle of collection + processing
 */
async function runCycle(config: OrchestratorConfig) {
  const startTime = Date.now();
  console.log('\n' + '='.repeat(60));
  console.log(`PIPELINE CYCLE - ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  try {
    // Step 1: Collect new events
    console.log('\n[Orchestrator] Step 1: Collecting new events...');
    const collectionResult = await collectNewsEvents();
    console.log(`[Orchestrator] Collection: ${collectionResult.inserted} inserted, ${collectionResult.skipped} skipped`);

    // Step 2: Process pending events
    console.log('\n[Orchestrator] Step 2: Processing pending events...');
    const processingResult = await processPendingEvents(config.processingBatchSize);
    console.log(`[Orchestrator] Processing: ${processingResult.phase1Success} Phase 1 success, ${processingResult.phase2bSuccess} Phase 2B success`);

    // Step 3: Generate alerts for new events
    console.log('\n[Orchestrator] Step 3: Generating alerts...');
    const alertsResult = await runAlertsGenerator(50); // Limit to avoid overload
    console.log(`[Orchestrator] Alerts: ${alertsResult.generated} generated, ${alertsResult.skipped} skipped`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n[Orchestrator] Cycle complete in ${duration}s`);
    console.log('='.repeat(60));

    return {
      collection: collectionResult,
      processing: processingResult,
      alerts: alertsResult,
      duration: Date.now() - startTime,
    };
  } catch (error: any) {
    console.error('[Orchestrator] Cycle error:', error);
    throw error;
  }
}

/**
 * Start the orchestrator with scheduled runs
 */
export async function startOrchestrator(config: Partial<OrchestratorConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  console.log('\n' + '='.repeat(60));
  console.log('NUCIGEN PIPELINE ORCHESTRATOR');
  console.log('='.repeat(60));
  console.log(`Collection interval: ${finalConfig.collectionInterval / 1000 / 60} minutes`);
  console.log(`Processing interval: ${finalConfig.processingInterval / 1000 / 60} minutes`);
  console.log(`Processing batch size: ${finalConfig.processingBatchSize}`);
  console.log('='.repeat(60) + '\n');

  // Run immediately
  await runCycle(finalConfig);

  if (finalConfig.runOnce) {
    console.log('[Orchestrator] Run once mode - exiting');
    return;
  }

  // Schedule collection
  const collectionInterval = setInterval(async () => {
    try {
      await collectNewsEvents();
    } catch (error) {
      console.error('[Orchestrator] Collection error:', error);
    }
  }, finalConfig.collectionInterval);

  // Schedule processing
  const processingInterval = setInterval(async () => {
    try {
      await processPendingEvents(finalConfig.processingBatchSize);
    } catch (error) {
      console.error('[Orchestrator] Processing error:', error);
    }
  }, finalConfig.processingInterval);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[Orchestrator] Shutting down...');
    clearInterval(collectionInterval);
    clearInterval(processingInterval);
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n[Orchestrator] Shutting down...');
    clearInterval(collectionInterval);
    clearInterval(processingInterval);
    process.exit(0);
  });

  console.log('[Orchestrator] Running... (Press Ctrl+C to stop)');
}

/**
 * Main function
 */
export async function runOrchestrator() {
  const runOnce = process.env.RUN_ONCE === 'true';
  const collectionInterval = process.env.COLLECTION_INTERVAL 
    ? parseInt(process.env.COLLECTION_INTERVAL, 10) 
    : undefined;
  const processingInterval = process.env.PROCESSING_INTERVAL 
    ? parseInt(process.env.PROCESSING_INTERVAL, 10) 
    : undefined;
  const batchSize = process.env.PROCESSING_BATCH_SIZE 
    ? parseInt(process.env.PROCESSING_BATCH_SIZE, 10) 
    : undefined;

  await startOrchestrator({
    runOnce,
    collectionInterval,
    processingInterval,
    processingBatchSize: batchSize,
  });
}

// Run if called directly (check if this file is the main module)
if (process.argv[1] && process.argv[1].includes('pipeline-orchestrator')) {
  runOrchestrator()
    .then(() => {
      if (process.env.RUN_ONCE === 'true') {
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

