/**
 * PHASE 3B: Quality Metrics Calculator
 * 
 * Script to calculate and store quality metrics daily
 * Can be run as a cron job
 */

import { calculateQualityMetrics, getQualityMetrics } from './quality-service';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

/**
 * Calculate metrics for today
 */
async function calculateTodayMetrics() {
  console.log('='.repeat(60));
  console.log('QUALITY METRICS CALCULATOR');
  console.log('='.repeat(60));
  console.log(`Calculating metrics for ${new Date().toISOString().split('T')[0]}...\n`);

  try {
    const metrics = await calculateQualityMetrics();
    
    console.log('Metrics calculated successfully:');
    console.log(`  Overall Quality Score: ${metrics.overall_quality_score ? (metrics.overall_quality_score * 100).toFixed(1) + '%' : 'N/A'}`);
    console.log(`  Phase 1 Events: ${metrics.phase1_total_events} (${metrics.phase1_approved_count} approved, ${metrics.phase1_rejected_count} rejected)`);
    console.log(`  Phase 2B Chains: ${metrics.phase2b_total_chains} (${metrics.phase2b_approved_count} approved, ${metrics.phase2b_rejected_count} rejected)`);
    console.log('='.repeat(60));
    
    return metrics;
  } catch (error: any) {
    console.error('Error calculating metrics:', error);
    throw error;
  }
}

/**
 * Calculate metrics for a date range
 */
async function calculateDateRangeMetrics(startDate: Date, endDate: Date) {
  console.log('='.repeat(60));
  console.log('QUALITY METRICS CALCULATOR - DATE RANGE');
  console.log('='.repeat(60));
  console.log(`Calculating metrics from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}...\n`);

  const currentDate = new Date(startDate);
  const results = [];

  while (currentDate <= endDate) {
    try {
      const metrics = await calculateQualityMetrics(new Date(currentDate));
      results.push(metrics);
      console.log(`✓ ${currentDate.toISOString().split('T')[0]}: ${metrics.phase1_total_events + metrics.phase2b_total_chains} validations`);
    } catch (error) {
      console.error(`✗ ${currentDate.toISOString().split('T')[0]}: Error`, error);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(`\nCompleted: ${results.length} days processed`);
  console.log('='.repeat(60));

  return results;
}

// Run if called directly
if (process.argv[1] && process.argv[1].includes('quality-metrics-calculator')) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'range' && args[1] && args[2]) {
    // Calculate for date range
    const startDate = new Date(args[1]);
    const endDate = new Date(args[2]);
    calculateDateRangeMetrics(startDate, endDate)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
      });
  } else {
    // Calculate for today
    calculateTodayMetrics()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
      });
  }
}

export { calculateTodayMetrics, calculateDateRangeMetrics };

