/**
 * PHASE 6: Data Quality Validation Script
 * 
 * Validates the quality of extracted events and causal chains
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface QualityIssue {
  type: string;
  severity: 'error' | 'warning';
  message: string;
  eventId?: string;
  chainId?: string;
}

const issues: QualityIssue[] = [];

function addIssue(type: string, severity: 'error' | 'warning', message: string, eventId?: string, chainId?: string) {
  issues.push({ type, severity, message, eventId, chainId });
}

async function validateDataQuality() {
  console.log('🔍 Starting data quality validation...\n');

  // 1. Validate events
  console.log('📋 Validating events...');
  const { data: events, error: eventsError } = await supabase
    .from('nucigen_events')
    .select('*')
    .limit(50);

  if (eventsError) {
    console.error('❌ Cannot fetch events:', eventsError.message);
    process.exit(1);
  }

  if (!events || events.length === 0) {
    console.log('⚠️  No events found');
    return;
  }

  console.log(`   Checking ${events.length} events...`);

  events.forEach((event: any) => {
    // Required fields
    if (!event.summary || event.summary.trim().length === 0) {
      addIssue('Missing Summary', 'error', 'Event has no summary', event.id);
    }
    if (!event.why_it_matters || event.why_it_matters.trim().length === 0) {
      addIssue('Missing Why It Matters', 'error', 'Event has no why_it_matters', event.id);
    }

    // Summary length
    if (event.summary && event.summary.length < 20) {
      addIssue('Short Summary', 'warning', `Summary is very short (${event.summary.length} chars)`, event.id);
    }
    if (event.summary && event.summary.length > 500) {
      addIssue('Long Summary', 'warning', `Summary is very long (${event.summary.length} chars)`, event.id);
    }

    // Scores
    if (event.impact_score === null || event.impact_score === undefined) {
      addIssue('Missing Impact Score', 'error', 'Event has no impact_score', event.id);
    } else if (event.impact_score < 0 || event.impact_score > 1) {
      addIssue('Invalid Impact Score', 'error', `Impact score out of range: ${event.impact_score}`, event.id);
    }

    if (event.confidence === null || event.confidence === undefined) {
      addIssue('Missing Confidence', 'error', 'Event has no confidence', event.id);
    } else if (event.confidence < 0 || event.confidence > 1) {
      addIssue('Invalid Confidence', 'error', `Confidence out of range: ${event.confidence}`, event.id);
    }

    // Event type
    const validEventTypes = ['Geopolitical', 'Industrial', 'SupplyChain', 'Regulatory', 'Security', 'Market'];
    if (event.event_type && !validEventTypes.includes(event.event_type)) {
      addIssue('Invalid Event Type', 'warning', `Unknown event type: ${event.event_type}`, event.id);
    }

    // Arrays
    if (event.actors && !Array.isArray(event.actors)) {
      addIssue('Invalid Actors', 'error', 'Actors must be an array', event.id);
    }
  });

  // 2. Validate causal chains
  console.log('\n🔗 Validating causal chains...');
  const { data: chains, error: chainsError } = await supabase
    .from('nucigen_causal_chains')
    .select('*')
    .limit(50);

  if (chainsError) {
    console.error('❌ Cannot fetch causal chains:', chainsError.message);
  } else if (chains && chains.length > 0) {
    console.log(`   Checking ${chains.length} causal chains...`);

    chains.forEach((chain: any) => {
      // Required fields
      if (!chain.cause || chain.cause.trim().length === 0) {
        addIssue('Missing Cause', 'error', 'Causal chain has no cause', undefined, chain.id);
      }
      if (!chain.first_order_effect || chain.first_order_effect.trim().length === 0) {
        addIssue('Missing First Order Effect', 'error', 'Causal chain has no first_order_effect', undefined, chain.id);
      }

      // Cause length
      if (chain.cause && chain.cause.length < 10) {
        addIssue('Short Cause', 'warning', `Cause is very short (${chain.cause.length} chars)`, undefined, chain.id);
      }

      // Time horizon
      const validHorizons = ['hours', 'days', 'weeks'];
      if (!chain.time_horizon || !validHorizons.includes(chain.time_horizon)) {
        addIssue('Invalid Time Horizon', 'error', `Invalid time_horizon: ${chain.time_horizon}`, undefined, chain.id);
      }

      // Confidence
      if (chain.confidence === null || chain.confidence === undefined) {
        addIssue('Missing Chain Confidence', 'error', 'Causal chain has no confidence', undefined, chain.id);
      } else if (chain.confidence < 0 || chain.confidence > 1) {
        addIssue('Invalid Chain Confidence', 'error', `Confidence out of range: ${chain.confidence}`, undefined, chain.id);
      }

      // Arrays
      if (chain.affected_sectors && !Array.isArray(chain.affected_sectors)) {
        addIssue('Invalid Affected Sectors', 'error', 'affected_sectors must be an array', undefined, chain.id);
      }
      if (chain.affected_regions && !Array.isArray(chain.affected_regions)) {
        addIssue('Invalid Affected Regions', 'error', 'affected_regions must be an array', undefined, chain.id);
      }

      // Check for forbidden words (price predictions, financial figures)
      const forbiddenPatterns = [
        /\$\d+/, // Dollar amounts
        /\d+% (increase|decrease|gain|loss)/i,
        /price (will|is expected to|may)/i,
        /stock (price|value)/i,
        /market (cap|value)/i,
      ];

      const textToCheck = `${chain.cause} ${chain.first_order_effect} ${chain.second_order_effect || ''}`;
      forbiddenPatterns.forEach(pattern => {
        if (pattern.test(textToCheck)) {
          addIssue('Forbidden Content', 'error', 'Causal chain contains price predictions or financial figures', undefined, chain.id);
        }
      });
    });
  }

  // 3. Summary
  console.log('\n📊 Quality Validation Summary:');
  console.log('='.repeat(50));

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  console.log(`❌ Errors: ${errors.length}`);
  console.log(`⚠️  Warnings: ${warnings.length}`);
  console.log(`📋 Total Issues: ${issues.length}`);

  if (errors.length > 0) {
    console.log('\n❌ ERRORS:');
    errors.forEach(issue => {
      console.log(`   [${issue.type}] ${issue.message}`);
      if (issue.eventId) console.log(`      Event ID: ${issue.eventId}`);
      if (issue.chainId) console.log(`      Chain ID: ${issue.chainId}`);
    });
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.slice(0, 10).forEach(issue => {
      console.log(`   [${issue.type}] ${issue.message}`);
      if (issue.eventId) console.log(`      Event ID: ${issue.eventId}`);
      if (issue.chainId) console.log(`      Chain ID: ${issue.chainId}`);
    });
    if (warnings.length > 10) {
      console.log(`   ... and ${warnings.length - 10} more warnings`);
    }
  }

  // Group by type
  const issuesByType: Record<string, number> = {};
  issues.forEach(issue => {
    issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
  });

  console.log('\n📊 Issues by Type:');
  Object.entries(issuesByType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

  if (errors.length > 0) {
    console.log('\n❌ Quality validation FAILED - Please fix the errors above');
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log('\n⚠️  Quality validation PASSED with warnings - Review warnings above');
    process.exit(0);
  } else {
    console.log('\n✅ Quality validation PASSED - No issues found');
    process.exit(0);
  }
}

// Run validation
validateDataQuality().catch(error => {
  console.error('❌ Validation error:', error);
  process.exit(1);
});

