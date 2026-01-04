/**
 * PHASE 8: Auto-Learning Orchestrator
 * 
 * Orchestrateur qui exécute l'amélioration automatique des prompts
 * basée sur les feedbacks utilisateurs
 */

import { processAutoLearning, ComponentType } from '../phase8/model-improver.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const COMPONENT_TYPES: ComponentType[] = [
  'event_extraction',
  'causal_chain',
  'scenario',
  'recommendation',
  'relationship',
  'historical_comparison',
];

const MIN_FEEDBACK_COUNT = parseInt(process.env.AUTO_LEARNING_MIN_FEEDBACK || '5', 10);
const INTERVAL_MINUTES = parseInt(process.env.AUTO_LEARNING_INTERVAL || '1440', 10); // Default: daily

/**
 * Exécute l'auto-learning pour tous les composants
 */
async function runAutoLearning(): Promise<void> {
  console.log('\n🚀 Starting Auto-Learning Orchestration...');
  console.log(`   Min feedback count: ${MIN_FEEDBACK_COUNT}`);
  console.log(`   Components: ${COMPONENT_TYPES.join(', ')}\n`);

  const results: Array<{
    component: ComponentType;
    analyzed: number;
    improved: boolean;
    newVersionId: string | null;
    improvements: string[];
  }> = [];

  for (const componentType of COMPONENT_TYPES) {
    try {
      const result = await processAutoLearning(componentType, MIN_FEEDBACK_COUNT);
      results.push({
        component: componentType,
        ...result,
      });
    } catch (error) {
      console.error(`❌ Error processing ${componentType}:`, error);
      results.push({
        component: componentType,
        analyzed: 0,
        improved: false,
        newVersionId: null,
        improvements: [],
      });
    }
  }

  // Résumé
  console.log('\n📊 Auto-Learning Summary:');
  console.log('==================================================');
  
  let totalAnalyzed = 0;
  let totalImproved = 0;
  
  results.forEach(result => {
    totalAnalyzed += result.analyzed;
    if (result.improved) {
      totalImproved++;
      console.log(`✅ ${result.component}:`);
      console.log(`   - Analyzed: ${result.analyzed} feedbacks`);
      console.log(`   - New version: ${result.newVersionId}`);
      console.log(`   - Improvements: ${result.improvements.join(', ')}`);
    } else if (result.analyzed > 0) {
      console.log(`⚠️  ${result.component}:`);
      console.log(`   - Analyzed: ${result.analyzed} feedbacks (not enough for improvement)`);
    } else {
      console.log(`⚪ ${result.component}: No feedback to process`);
    }
  });

  console.log('==================================================');
  console.log(`Total feedbacks analyzed: ${totalAnalyzed}`);
  console.log(`Components improved: ${totalImproved}/${COMPONENT_TYPES.length}`);
  console.log('\n✅ Auto-Learning orchestration completed\n');
}

/**
 * Mode "run once"
 */
async function runOnce(): Promise<void> {
  await runAutoLearning();
  process.exit(0);
}

/**
 * Mode continu (avec intervalle)
 */
async function runContinuous(): Promise<void> {
  console.log(`🔄 Starting continuous auto-learning (interval: ${INTERVAL_MINUTES} minutes)`);
  
  // Exécuter immédiatement
  await runAutoLearning();

  // Puis exécuter périodiquement
  setInterval(async () => {
    await runAutoLearning();
  }, INTERVAL_MINUTES * 60 * 1000);
}

// Main
const mode = process.argv[2] || 'once';

if (mode === 'continuous') {
  runContinuous();
} else {
  runOnce();
}

