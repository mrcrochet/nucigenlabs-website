/**
 * PHASE 7: Orchestrator for Advanced Features
 * 
 * Orchestrates the execution of:
 * - Relationship extraction (Knowledge Graph)
 * - Historical comparisons
 * - Scenario predictions
 * - Recommendations generation
 */

import { processPendingRelationships } from '../phase7/relationship-extractor';
import { processHistoricalComparison } from '../phase7/historical-analyzer';
import { processEventScenarios } from '../phase7/scenario-predictor';
import { processAllRecommendations } from '../phase7/recommendation-engine';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface OrchestrationResult {
  relationships: { processed: number; created: number; errors: string[] };
  historical: { processed: number; created: number; errors: string[] };
  scenarios: { processed: number; created: number; errors: string[] };
  recommendations: { processed: number; created: number; errors: string[] };
}

/**
 * Run Phase 7 orchestration
 */
export async function runPhase7Orchestration(): Promise<OrchestrationResult> {
  console.log('🚀 Starting Phase 7 orchestration...\n');

  const result: OrchestrationResult = {
    relationships: { processed: 0, created: 0, errors: [] },
    historical: { processed: 0, created: 0, errors: [] },
    scenarios: { processed: 0, created: 0, errors: [] },
    recommendations: { processed: 0, created: 0, errors: [] },
  };

  try {
    // Step 1: Extract relationships (Knowledge Graph)
    console.log('📊 Step 1: Extracting relationships...');
    try {
      const relResult = await processPendingRelationships();
      result.relationships = relResult;
      console.log(`✅ Relationships: ${relResult.created} created from ${relResult.processed} events\n`);
    } catch (error: any) {
      result.relationships.errors.push(error.message);
      console.error(`❌ Relationships error: ${error.message}\n`);
    }

    // Step 2: Historical comparisons
    console.log('📚 Step 2: Finding historical comparisons...');
    try {
      // Get events without historical comparisons
      const { data: eventsWithoutHistorical } = await supabase
        .from('nucigen_events')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(10);

      if (eventsWithoutHistorical && eventsWithoutHistorical.length > 0) {
        let totalCreated = 0;
        for (const event of eventsWithoutHistorical) {
          try {
            const count = await processHistoricalComparison(event.id);
            totalCreated += count;
          } catch (error: any) {
            result.historical.errors.push(`Event ${event.id}: ${error.message}`);
          }
        }
        result.historical.processed = eventsWithoutHistorical.length;
        result.historical.created = totalCreated;
        console.log(`✅ Historical: ${totalCreated} comparisons created for ${eventsWithoutHistorical.length} events\n`);
      }
    } catch (error: any) {
      result.historical.errors.push(error.message);
      console.error(`❌ Historical error: ${error.message}\n`);
    }

    // Step 3: Scenario predictions
    console.log('🔮 Step 3: Generating scenario predictions...');
    try {
      // Get events without scenarios
      const { data: eventsWithoutScenarios } = await supabase
        .from('nucigen_events')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(10);

      if (eventsWithoutScenarios && eventsWithoutScenarios.length > 0) {
        let totalCreated = 0;
        for (const event of eventsWithoutScenarios) {
          try {
            const count = await processEventScenarios(event.id);
            totalCreated += count;
          } catch (error: any) {
            result.scenarios.errors.push(`Event ${event.id}: ${error.message}`);
          }
        }
        result.scenarios.processed = eventsWithoutScenarios.length;
        result.scenarios.created = totalCreated;
        console.log(`✅ Scenarios: ${totalCreated} scenarios created for ${eventsWithoutScenarios.length} events\n`);
      }
    } catch (error: any) {
      result.scenarios.errors.push(error.message);
      console.error(`❌ Scenarios error: ${error.message}\n`);
    }

    // Step 4: Recommendations
    console.log('🎯 Step 4: Generating recommendations...');
    try {
      const recResult = await processAllRecommendations();
      result.recommendations = recResult;
      console.log(`✅ Recommendations: ${recResult.created} created for ${recResult.processed} users\n`);
    } catch (error: any) {
      result.recommendations.errors.push(error.message);
      console.error(`❌ Recommendations error: ${error.message}\n`);
    }

    // Summary
    console.log('📊 Phase 7 Orchestration Summary:');
    console.log('='.repeat(50));
    console.log(`Relationships: ${result.relationships.created} created`);
    console.log(`Historical: ${result.historical.created} created`);
    console.log(`Scenarios: ${result.scenarios.created} created`);
    console.log(`Recommendations: ${result.recommendations.created} created`);
    
    const totalErrors = 
      result.relationships.errors.length +
      result.historical.errors.length +
      result.scenarios.errors.length +
      result.recommendations.errors.length;
    
    if (totalErrors > 0) {
      console.log(`\n⚠️  ${totalErrors} errors occurred (see details above)`);
    } else {
      console.log('\n✅ All steps completed successfully');
    }

    return result;
  } catch (error: any) {
    console.error('❌ Phase 7 orchestration error:', error);
    throw error;
  }
}

// Direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runPhase7Orchestration()
    .then(() => {
      console.log('\n✅ Phase 7 orchestration completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

