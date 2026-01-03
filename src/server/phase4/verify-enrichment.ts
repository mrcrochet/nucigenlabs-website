/**
 * Quick verification script for Phase 4 enrichment
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyEnrichment() {
  console.log('='.repeat(60));
  console.log('Phase 4 Enrichment Verification');
  console.log('='.repeat(60));

  // Check Tavily context
  const { data: contexts, error: contextError } = await supabase
    .from('event_context')
    .select('id, nucigen_event_id, historical_context, similar_events')
    .limit(3);

  if (contextError) {
    console.error('❌ Error fetching context:', contextError.message);
  } else {
    console.log(`\n✅ Tavily Context:`);
    console.log(`   - Records found: ${contexts?.length || 0}`);
    if (contexts && contexts.length > 0) {
      const sample = contexts[0];
      console.log(`   - Sample event ID: ${sample.nucigen_event_id}`);
      console.log(`   - Historical context: ${sample.historical_context?.length || 0} chars`);
      console.log(`   - Similar events: ${sample.similar_events?.length || 0}`);
    }
  }

  // Check Firecrawl whitelist
  const { data: whitelist, error: whitelistError } = await supabase
    .from('firecrawl_whitelist')
    .select('domain, source_type, enabled')
    .eq('enabled', true)
    .limit(10);

  if (whitelistError) {
    console.error('❌ Error fetching whitelist:', whitelistError.message);
  } else {
    console.log(`\n✅ Firecrawl Whitelist:`);
    console.log(`   - Domains: ${whitelist?.length || 0}`);
    if (whitelist && whitelist.length > 0) {
      console.log(`   - Sample domains: ${whitelist.slice(0, 5).map(w => w.domain).join(', ')}`);
    }
  }

  // Check official documents
  const { data: documents, error: docError } = await supabase
    .from('official_documents')
    .select('id, url, domain, source_type')
    .limit(5);

  if (docError) {
    console.error('❌ Error fetching documents:', docError.message);
  } else {
    console.log(`\n✅ Official Documents:`);
    console.log(`   - Documents found: ${documents?.length || 0}`);
    if (documents && documents.length > 0) {
      console.log(`   - Sample: ${documents[0].domain} (${documents[0].source_type})`);
    } else {
      console.log(`   - No documents yet (normal if no whitelisted URLs in events)`);
    }
  }

  console.log('\n' + '='.repeat(60));
}

verifyEnrichment().catch(console.error);

