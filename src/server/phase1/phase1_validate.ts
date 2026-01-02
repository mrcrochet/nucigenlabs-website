/**
 * PHASE 1: Validation Script
 * 
 * Teste l'extraction sur 10 articles et génère un rapport de validation
 */

import { extractNucigenEvent, extractBatch } from './event-extractor';
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
  title: string;
  status: 'success' | 'failed';
  errors: string[];
  extracted?: any;
}

/**
 * Valide qu'un événement extrait respecte le schéma
 */
function validateExtractedEvent(event: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Vérifier les champs requis
  const requiredFields = ['event_type', 'summary', 'why_it_matters', 'impact_score', 'confidence'];
  for (const field of requiredFields) {
    if (!(field in event)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Vérifier event_type
  const validTypes = ['Geopolitical', 'Industrial', 'SupplyChain', 'Regulatory', 'Security', 'Market'];
  if (!validTypes.includes(event.event_type)) {
    errors.push(`Invalid event_type: ${event.event_type}. Must be one of: ${validTypes.join(', ')}`);
  }

  // Vérifier les types
  if (typeof event.summary !== 'string' || event.summary.length === 0) {
    errors.push('summary must be a non-empty string');
  }

  if (typeof event.why_it_matters !== 'string' || event.why_it_matters.length === 0) {
    errors.push('why_it_matters must be a non-empty string');
  }

  if (!Array.isArray(event.actors)) {
    errors.push('actors must be an array');
  }

  // Vérifier les scores
  if (typeof event.impact_score !== 'number') {
    errors.push(`impact_score must be a number, got: ${typeof event.impact_score}`);
  } else if (event.impact_score < 0 || event.impact_score > 1) {
    errors.push(`impact_score must be between 0 and 1, got: ${event.impact_score}`);
  }

  if (typeof event.confidence !== 'number') {
    errors.push(`confidence must be a number, got: ${typeof event.confidence}`);
  } else if (event.confidence < 0 || event.confidence > 1) {
    errors.push(`confidence must be between 0 and 1, got: ${event.confidence}`);
  }

  // Vérifier les champs optionnels (doivent être null ou string)
  const optionalStringFields = ['event_subtype', 'country', 'region', 'sector', 'first_order_effect', 'second_order_effect'];
  for (const field of optionalStringFields) {
    if (event[field] !== null && typeof event[field] !== 'string') {
      errors.push(`${field} must be null or string, got: ${typeof event[field]}`);
    }
  }

  // Vérifier qu'il n'y a pas de champs inventés (whitelist)
  const allowedFields = [
    'event_type',
    'event_subtype',
    'summary',
    'country',
    'region',
    'sector',
    'actors',
    'why_it_matters',
    'first_order_effect',
    'second_order_effect',
    'impact_score',
    'confidence',
  ];
  const extraFields = Object.keys(event).filter((key) => !allowedFields.includes(key));
  if (extraFields.length > 0) {
    errors.push(`Unexpected fields: ${extraFields.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valide l'extraction sur plusieurs événements
 */
async function validatePhase1(numEvents: number = 10): Promise<void> {
  console.log('='.repeat(60));
  console.log('PHASE 1 VALIDATION');
  console.log('='.repeat(60));
  console.log(`\nTesting extraction on ${numEvents} events...\n`);

  // Récupérer des événements qui n'ont pas encore été extraits dans nucigen_events
  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, status')
    .not('status', 'eq', 'error')
    .limit(numEvents * 2); // Prendre plus pour avoir assez après filtrage

  if (!error && events) {
    // Filtrer pour ne garder que ceux qui n'ont pas encore été extraits
    const { data: existing } = await supabase
      .from('nucigen_events')
      .select('source_event_id');

    const existingIds = new Set(existing?.map((e) => e.source_event_id) || []);
    const filteredEvents = events.filter((e) => !existingIds.has(e.id)).slice(0, numEvents);
    
    // Utiliser les événements filtrés
    const eventsToUse = filteredEvents.length > 0 ? filteredEvents : events.slice(0, numEvents);
    
    // Mettre à jour la variable events pour la suite
    Object.assign(events, eventsToUse);
    events.length = eventsToUse.length;
  }

  if (error) {
    console.error('❌ Error fetching events:', error);
    process.exit(1);
  }

  if (!events || events.length === 0) {
    console.error('❌ No pending events found. Please add events to the events table first.');
    process.exit(1);
  }

  if (events.length < numEvents) {
    console.warn(`⚠️  Only found ${events.length} events (requested ${numEvents})`);
  }

  const results: ValidationResult[] = [];
  const eventIds = events.map((e) => e.id);

  // Extraire les événements
  console.log('Extracting events...\n');
  for (const event of events) {
    console.log(`Processing: ${event.title.substring(0, 60)}...`);
    try {
      const extracted = await extractNucigenEvent(event.id);
      const validation = validateExtractedEvent(extracted);

      if (validation.valid) {
        results.push({
          eventId: event.id,
          title: event.title,
          status: 'success',
          errors: [],
          extracted,
        });
        console.log('  ✅ Success\n');
      } else {
        results.push({
          eventId: event.id,
          title: event.title,
          status: 'failed',
          errors: validation.errors,
          extracted,
        });
        console.log(`  ❌ Validation failed: ${validation.errors.join(', ')}\n`);
      }
    } catch (error) {
      results.push({
        eventId: event.id,
        title: event.title,
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
  const successful = results.filter((r) => r.status === 'success' && r.extracted);
  if (successful.length > 0) {
    const avgConfidence =
      successful.reduce((sum, r) => sum + (r.extracted?.confidence || 0), 0) / successful.length;
    const avgImpact =
      successful.reduce((sum, r) => sum + (r.extracted?.impact_score || 0), 0) / successful.length;

    console.log('Statistics:');
    console.log(`  Average confidence: ${avgConfidence.toFixed(3)}`);
    console.log(`  Average impact_score: ${avgImpact.toFixed(3)}\n`);
  }

  // Détails des erreurs
  const failed = results.filter((r) => r.status === 'failed');
  if (failed.length > 0) {
    console.log('Failed events:');
    for (const result of failed) {
      console.log(`\n  ❌ ${result.title.substring(0, 60)}`);
      for (const error of result.errors) {
        console.log(`     - ${error}`);
      }
    }
  }

  // Exemples de succès
  const examples = successful.slice(0, 2);
  if (examples.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('EXAMPLE EXTRACTED EVENTS (first 2)');
    console.log('='.repeat(60));
    for (const example of examples) {
      console.log(`\n📰 ${example.title.substring(0, 60)}...`);
      console.log(JSON.stringify(example.extracted, null, 2));
    }
  }

  console.log('\n' + '='.repeat(60));
  if (successRate >= 80) {
    console.log('✅ PHASE 1 VALIDATION PASSED (>= 80% success rate)');
  } else {
    console.log('❌ PHASE 1 VALIDATION FAILED (< 80% success rate)');
    console.log('Please review errors and improve extraction before proceeding.');
  }
  console.log('='.repeat(60) + '\n');
}

// Exécuter si appelé directement
// En ES modules, on vérifie si c'est le module principal
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('phase1_validate')) {
  validatePhase1(10)
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { validatePhase1 };

