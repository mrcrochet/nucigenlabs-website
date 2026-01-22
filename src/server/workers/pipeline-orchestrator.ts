/**
 * PHASE 3A: Pipeline Orchestrator
 * 
 * Main orchestrator that coordinates:
 * 1. Data collection (collectNewsEvents)
 * 2. Event processing (processPendingEvents)
 * 
 * Runs in a loop with configurable intervals
 */

import { collectNewsEvents, runDataCollector } from './data-collector';
import { processPendingEvents } from './event-processor';
import { runAlertsGenerator } from './alerts-generator';
import { collectPersonalizedEventsForAllUsers } from './tavily-personalized-collector';
import { enrichPendingEvents as enrichWithFirecrawl } from '../services/firecrawl-ecosystem';
import { trainRelevanceModel } from '../ml/relevance-predictor.js';
import { trainQueryOptimizerModel } from '../ml/query-optimizer.js';
import { autoTuneComponent } from '../optimization/parameter-tuner.js';
import { analyzeMetrics } from '../optimization/metrics-analyzer.js';
import { collectDiscoverItems } from './discover-collector.js';
import { enrichCriticalEvents, enrichStrategicEvents } from './discover-enricher.js';

interface OrchestratorConfig {
  collectionInterval: number; // milliseconds
  processingInterval: number; // milliseconds
  processingBatchSize: number;
  mlTrainingInterval: number; // milliseconds (for periodic ML training)
  autoOptimizationInterval: number; // milliseconds (for auto-optimization)
  runOnce?: boolean; // If true, run once and exit
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  collectionInterval: 5 * 60 * 1000, // 5 minutes (optimized: was 1 hour)
  processingInterval: 2 * 60 * 1000, // 2 minutes (optimized: was 15 minutes)
  processingBatchSize: 100, // 100 (optimized: was 10)
  mlTrainingInterval: 24 * 60 * 60 * 1000, // 24 hours (daily ML training)
  autoOptimizationInterval: 6 * 60 * 60 * 1000, // 6 hours (auto-optimization)
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
    // Step 1: Collect new events (Tavily + RSS, NewsAPI disabled by default)
    console.log('\n[Orchestrator] Step 1: Collecting new events (Tavily + RSS)...');
    const collectionResult = await runDataCollector(); // Tavily (primary) + RSS (complementary)
    console.log(`[Orchestrator] Collection: ${collectionResult.inserted} inserted, ${collectionResult.skipped} skipped`);
    
    // Step 1B: Collect personalized events for all users (based on preferences)
    console.log('\n[Orchestrator] Step 1B: Collecting personalized events for users...');
    try {
      const personalizedResult = await collectPersonalizedEventsForAllUsers();
      console.log(`[Orchestrator] Personalized: ${personalizedResult.totalInserted} inserted for ${personalizedResult.usersProcessed} users`);
    } catch (error: any) {
      console.warn('[Orchestrator] Personalized collection failed:', error.message);
      // Don't fail the whole cycle if personalized collection fails
    }

    // Step 1C: Collect Discover items from EventRegistry
    console.log('\n[Orchestrator] Step 1C: Collecting Discover items from EventRegistry...');
    try {
      const discoverResult = await collectDiscoverItems(['all', 'tech', 'finance', 'geopolitics', 'energy', 'supply-chain']);
      console.log(`[Orchestrator] Discover: ${discoverResult.collected} collected, ${discoverResult.inserted} inserted, ${discoverResult.skipped} skipped, ${discoverResult.filtered || 0} filtered`);
    } catch (error: any) {
      console.warn('[Orchestrator] Discover collection failed:', error.message);
      // Don't fail the whole cycle if Discover collection fails
    }

    // Step 1D: Track Perplexity Discover
    console.log('\n[Orchestrator] Step 1D: Tracking Perplexity Discover...');
    try {
      const { trackPerplexityDiscover } = await import('./perplexity-discover-tracker.js');
      const perplexityResult = await trackPerplexityDiscover();
      console.log(`[Orchestrator] Perplexity: ${perplexityResult.topicsFound} topics found, ${perplexityResult.inserted} inserted, ${perplexityResult.skipped} skipped`);
    } catch (error: any) {
      console.warn('[Orchestrator] Perplexity tracking failed:', error.message);
      // Don't fail the whole cycle if Perplexity tracking fails
    }

    // Step 2: Process pending events
    console.log('\n[Orchestrator] Step 2: Processing pending events...');
    const processingResult = await processPendingEvents(config.processingBatchSize);
    console.log(`[Orchestrator] Processing: ${processingResult.phase1Success} Phase 1 success, ${processingResult.phase2bSuccess} Phase 2B success`);

    // Step 2B: Enrich events with Firecrawl (automatic URL enrichment, data extraction, validation)
    console.log('\n[Orchestrator] Step 2B: Enriching events with Firecrawl...');
    try {
      const firecrawlResult = await enrichWithFirecrawl(20, {
        enableUrlEnrichment: true,
        enableDataExtraction: true,
        enableDeepLinking: false, // Disabled in batch mode (too expensive)
        enableValidation: true,
        parallelize: true,
      });
      
      console.log(`[Orchestrator] Firecrawl: ${firecrawlResult.urlEnrichment?.enriched || 0} URLs enriched, ${firecrawlResult.dataExtraction?.extracted || 0} structured data extracted, ${firecrawlResult.validation?.validated || 0} events validated`);
    } catch (error: any) {
      console.warn('[Orchestrator] Firecrawl enrichment failed:', error.message);
      // Don't fail the whole cycle if Firecrawl enrichment fails
    }

    // Step 2C: Enrich Discover items with Perplexity (batch, not in user request flow)
    console.log('\n[Orchestrator] Step 2C: Enriching Discover items with Perplexity...');
    try {
      // Enrich critical events (Tier 1) - more frequent
      const criticalResult = await enrichCriticalEvents();
      console.log(`[Orchestrator] Discover Critical: ${criticalResult.enriched} enriched, ${criticalResult.errors} errors`);
      
      // Enrich strategic events (Tier 2) - less frequent
      const strategicResult = await enrichStrategicEvents();
      console.log(`[Orchestrator] Discover Strategic: ${strategicResult.enriched} enriched, ${strategicResult.errors} errors`);
    } catch (error: any) {
      console.warn('[Orchestrator] Discover enrichment failed:', error.message);
      // Don't fail the whole cycle if Discover enrichment fails
    }

    // Step 3: Generate alerts for new events
    console.log('\n[Orchestrator] Step 3: Generating alerts...');
    const alertsResult = await runAlertsGenerator(50); // Limit to avoid overload
    console.log(`[Orchestrator] Alerts: ${alertsResult.generated} generated, ${alertsResult.skipped} skipped`);

    // Step 4: ML Training (periodic, not every cycle)
    const lastMLTraining = (global as any).lastMLTraining || 0;
    const timeSinceLastTraining = Date.now() - lastMLTraining;
    if (timeSinceLastTraining >= config.mlTrainingInterval) {
      console.log('\n[Orchestrator] Step 4: Training ML models...');
      try {
        const [relevanceResult, queryResult] = await Promise.all([
          trainRelevanceModel(),
          trainQueryOptimizerModel(),
        ]);
        console.log(`[Orchestrator] ML Training: Relevance model ${relevanceResult.success ? 'trained' : 'failed'}, Query optimizer ${queryResult.success ? 'trained' : 'failed'}`);
        (global as any).lastMLTraining = Date.now();
      } catch (error: any) {
        console.warn('[Orchestrator] ML training failed:', error.message);
      }
    }

    // Step 5: Auto-optimization (periodic)
    const lastAutoOptimization = (global as any).lastAutoOptimization || 0;
    const timeSinceLastOptimization = Date.now() - lastAutoOptimization;
    if (timeSinceLastOptimization >= config.autoOptimizationInterval) {
      console.log('\n[Orchestrator] Step 5: Auto-optimization...');
      try {
        // Analyze metrics and auto-tune parameters
        const analysis = await analyzeMetrics('openai_optimizer', 24);
        if (analysis.issues.length > 0) {
          const tuningResult = await autoTuneComponent('openai_optimizer', 24);
          console.log(`[Orchestrator] Auto-optimization: ${tuningResult.applied.length} optimizations applied`);
        }
        (global as any).lastAutoOptimization = Date.now();
      } catch (error: any) {
        console.warn('[Orchestrator] Auto-optimization failed:', error.message);
      }
    }

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

  // Schedule collection (NewsAPI + RSS)
  const collectionInterval = setInterval(async () => {
    try {
      const { runDataCollector } = await import('./data-collector');
      await runDataCollector();
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

