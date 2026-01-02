/**
 * PHASE 2B: Validation Script
 * 
 * Teste l'extraction de chaînes causales sur les nucigen_events existants
 * et génère un rapport de validation
 */

import { extractCausalChain, extractBatchCausalChains } from './causal-extractor';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ValidationResult {
  eventId: string;
  eventTitle: string;
  status: 'success' | 'failed';
  errors: string[];
  chain?: any;
  logicalCoherence?: 'coherent' | 'incoherent' | 'uncertain';
}

/**
 * Valide qu'une chaîne causale respecte le schéma
 */
function validateCausalChainSchema(chain: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Vérifier les champs requis
  const requiredFields = ['cause', 'first_order_effect', 'time_horizon', 'confidence'];
  for (const field of requiredFields) {
    if (!(field in chain)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Vérifier time_horizon
  const validTimeHorizons = ['hours', 'days', 'weeks'];
  if (!validTimeHorizons.includes(chain.time_horizon)) {
    errors.push(`Invalid time_horizon: ${chain.time_horizon}. Must be one of: ${validTimeHorizons.join(', ')}`);
  }

  // Vérifier les types
  if (typeof chain.cause !== 'string' || chain.cause.length === 0) {
    errors.push('cause must be a non-empty string');
  }

  if (typeof chain.first_order_effect !== 'string' || chain.first_order_effect.length === 0) {
    errors.push('first_order_effect must be a non-empty string');
  }

  if (chain.second_order_effect !== null && typeof chain.second_order_effect !== 'string') {
    errors.push('second_order_effect must be null or a string');
  }

  if (!Array.isArray(chain.affected_sectors)) {
    errors.push('affected_sectors must be an array');
  }

  if (!Array.isArray(chain.affected_regions)) {
    errors.push('affected_regions must be an array');
  }

  // Vérifier confidence
  if (typeof chain.confidence !== 'number') {
    errors.push(`confidence must be a number, got: ${typeof chain.confidence}`);
  } else if (chain.confidence < 0 || chain.confidence > 1) {
    errors.push(`confidence must be between 0 and 1, got: ${chain.confidence}`);
  }

  // Vérifier les mots interdits
  const forbiddenWords = ['could', 'might', 'possibly', 'may'];
  const textToCheck = `${chain.cause} ${chain.first_order_effect} ${chain.second_order_effect || ''}`.toLowerCase();
  for (const word of forbiddenWords) {
    if (textToCheck.includes(word)) {
      errors.push(`Forbidden word "${word}" found. Must be deterministic.`);
    }
  }

  // Vérifier qu'il n'y a pas de champs inventés (exclure les champs de la DB)
  const allowedFields = [
    'cause',
    'first_order_effect',
    'second_order_effect',
    'affected_sectors',
    'affected_regions',
    'time_horizon',
    'confidence',
    // Champs de la DB (ignorés lors de la validation)
    'id',
    'nucigen_event_id',
    'created_at',
  ];
  const extraFields = Object.keys(chain).filter((key) => !allowedFields.includes(key));
  if (extraFields.length > 0) {
    errors.push(`Unexpected fields: ${extraFields.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Évalue la cohérence logique d'une chaîne causale
 */
function evaluateLogicalCoherence(chain: any, event: any): 'coherent' | 'incoherent' | 'uncertain' {
  // Vérifier que la cause est liée à l'événement
  const eventText = `${event.summary} ${event.why_it_matters}`.toLowerCase();
  const causeLower = chain.cause.toLowerCase();
  
  // Vérifier que les secteurs/régions sont cohérents avec l'événement
  const eventSector = event.sector?.toLowerCase() || '';
  const eventRegion = event.region?.toLowerCase() || '';
  const eventCountry = event.country?.toLowerCase() || '';
  
  const sectorsMatch = chain.affected_sectors.length === 0 || 
    chain.affected_sectors.some((s: string) => eventSector.includes(s.toLowerCase()) || s.toLowerCase().includes(eventSector));
  
  const regionsMatch = chain.affected_regions.length === 0 ||
    chain.affected_regions.some((r: string) => 
      eventRegion.includes(r.toLowerCase()) || 
      r.toLowerCase().includes(eventRegion) ||
      eventCountry.includes(r.toLowerCase()) ||
      r.toLowerCase().includes(eventCountry)
    );

  // Vérifier que first_order_effect est logiquement lié à la cause
  const firstOrderLower = chain.first_order_effect.toLowerCase();
  const hasLogicalLink = causeLower.split(' ').some(word => 
    firstOrderLower.includes(word) || 
    firstOrderLower.includes('disrupt') || 
    firstOrderLower.includes('impact') ||
    firstOrderLower.includes('affect')
  );

  // Vérifier que second_order_effect (si présent) est logiquement lié à first_order
  let secondOrderCoherent = true;
  if (chain.second_order_effect) {
    const secondOrderLower = chain.second_order_effect.toLowerCase();
    secondOrderCoherent = firstOrderLower.split(' ').some(word => 
      secondOrderLower.includes(word) ||
      secondOrderLower.includes('consequence') ||
      secondOrderLower.includes('result')
    );
  }

  // Score de cohérence
  let coherenceScore = 0;
  if (sectorsMatch) coherenceScore += 0.3;
  if (regionsMatch) coherenceScore += 0.3;
  if (hasLogicalLink) coherenceScore += 0.2;
  if (secondOrderCoherent || !chain.second_order_effect) coherenceScore += 0.2;

  if (coherenceScore >= 0.7) return 'coherent';
  if (coherenceScore >= 0.4) return 'uncertain';
  return 'incoherent';
}

/**
 * Valide l'extraction de chaînes causales
 */
async function validatePhase2B(): Promise<void> {
  console.log('='.repeat(60));
  console.log('PHASE 2B VALIDATION');
  console.log('='.repeat(60));
  console.log('\nTesting causal chain extraction on nucigen_events...\n');

  // Récupérer tous les nucigen_events
  const { data: events, error } = await supabase
    .from('nucigen_events')
    .select('id, summary, event_type, sector, region, country')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error fetching events:', error);
    process.exit(1);
  }

  if (!events || events.length === 0) {
    console.error('❌ No nucigen_events found. Please run Phase 1 first.');
    process.exit(1);
  }

  console.log(`Found ${events.length} events to process\n`);

  const results: ValidationResult[] = [];

  // Extraire les chaînes causales
  console.log('Extracting causal chains...\n');
  for (const event of events) {
    console.log(`Processing: ${event.summary.substring(0, 60)}...`);
    try {
      const extracted = await extractCausalChain(event.id);
      
      if (!extracted) {
        // Déjà existant, récupérer l'existant
        const { data: existing } = await supabase
          .from('nucigen_causal_chains')
          .select('*')
          .eq('nucigen_event_id', event.id)
          .single();
        
        if (existing) {
          const validation = validateCausalChainSchema(existing);
          const coherence = evaluateLogicalCoherence(existing, event);

          if (validation.valid && coherence === 'coherent') {
            results.push({
              eventId: event.id,
              eventTitle: event.summary,
              status: 'success',
              errors: [],
              chain: existing,
              logicalCoherence: coherence,
            });
            console.log('  ✅ Success (already existed)\n');
          } else {
            results.push({
              eventId: event.id,
              eventTitle: event.summary,
              status: 'failed',
              errors: [...validation.errors, coherence !== 'coherent' ? `Logical coherence: ${coherence}` : ''],
              chain: existing,
              logicalCoherence: coherence,
            });
            console.log(`  ❌ Validation failed: ${validation.errors.join(', ')}\n`);
          }
        }
        continue;
      }

      const validation = validateCausalChainSchema(extracted);
      const coherence = evaluateLogicalCoherence(extracted, event);

      if (validation.valid && coherence === 'coherent') {
        results.push({
          eventId: event.id,
          eventTitle: event.summary,
          status: 'success',
          errors: [],
          chain: extracted,
          logicalCoherence: coherence,
        });
        console.log('  ✅ Success\n');
      } else {
        results.push({
          eventId: event.id,
          eventTitle: event.summary,
          status: 'failed',
          errors: [...validation.errors, coherence !== 'coherent' ? `Logical coherence: ${coherence}` : ''],
          chain: extracted,
          logicalCoherence: coherence,
        });
        console.log(`  ❌ Validation failed: ${validation.errors.join(', ')}\n`);
      }
    } catch (error) {
      results.push({
        eventId: event.id,
        eventTitle: event.summary,
        status: 'failed',
        errors: [error instanceof Error ? error.message : String(error)],
      });
      console.log(`  ❌ Extraction failed: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  // Générer le rapport
  console.log('\n' + '='.repeat(60));
  console.log('VALIDATION REPORT');
  console.log('='.repeat(60));

  const successCount = results.filter((r) => r.status === 'success').length;
  const failedCount = results.filter((r) => r.status === 'failed').length;
  const successRate = (successCount / results.length) * 100;

  console.log(`\nTotal events tested: ${results.length}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`Success rate: ${successRate.toFixed(1)}%\n`);

  // Statistiques sur les scores
  const successful = results.filter((r) => r.status === 'success' && r.chain);
  if (successful.length > 0) {
    const avgConfidence =
      successful.reduce((sum, r) => sum + (r.chain?.confidence || 0), 0) / successful.length;

    console.log('Statistics:');
    console.log(`  Average confidence: ${avgConfidence.toFixed(3)}\n`);

    // Distribution des time_horizons
    const timeHorizons: Record<string, number> = {};
    successful.forEach((r) => {
      const th = r.chain?.time_horizon || 'unknown';
      timeHorizons[th] = (timeHorizons[th] || 0) + 1;
    });
    console.log('Time horizon distribution:');
    Object.entries(timeHorizons).forEach(([th, count]) => {
      console.log(`  ${th}: ${count}`);
    });
    console.log();
  }

  // Détails des erreurs
  const failed = results.filter((r) => r.status === 'failed');
  if (failed.length > 0) {
    console.log('Failed events:');
    for (const result of failed) {
      console.log(`\n  ❌ ${result.eventTitle.substring(0, 60)}`);
      for (const error of result.errors.filter((e) => e)) {
        console.log(`     - ${error}`);
      }
      if (result.logicalCoherence && result.logicalCoherence !== 'coherent') {
        console.log(`     - Logical coherence: ${result.logicalCoherence}`);
      }
    }
  }

  // Exemples de succès
  const examples = successful.slice(0, 2);
  if (examples.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('EXAMPLE CAUSAL CHAINS (first 2)');
    console.log('='.repeat(60));
    for (const example of examples) {
      console.log(`\n📰 ${example.eventTitle.substring(0, 60)}...`);
      console.log(JSON.stringify(example.chain, null, 2));
    }
  }

  console.log('\n' + '='.repeat(60));
  if (successRate >= 80) {
    console.log('✅ PHASE 2B VALIDATION PASSED (>= 80% success rate)');
  } else {
    console.log('❌ PHASE 2B VALIDATION FAILED (< 80% success rate)');
    console.log('Please review errors and improve extraction before proceeding.');
  }
  console.log('='.repeat(60) + '\n');
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('phase2b_validate')) {
  validatePhase2B()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { validatePhase2B };

