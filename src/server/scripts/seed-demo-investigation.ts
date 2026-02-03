/**
 * Seed Demo Investigation — Option 1 Démo Analyste.
 * Inserts the demo thread + signals so the demo appears in a user's investigation list.
 * Optional: the frontend also supports loading the demo without DB (via "Voir la démo analyste").
 *
 * Usage:
 *   npx tsx src/server/scripts/seed-demo-investigation.ts
 *   DEMO_SUPABASE_USER_ID=<uuid> npx tsx src/server/scripts/seed-demo-investigation.ts
 *
 * If DEMO_SUPABASE_USER_ID is not set, the script tries to use the first row from clerk_user_mapping.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { DEMO_THREAD_ID, DEMO_THREAD_PAYLOAD } from '../../lib/investigation/demo-graph-fixture';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_SUPABASE_USER_ID = process.env.DEMO_SUPABASE_USER_ID;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function getSupabaseUserId(): Promise<string | null> {
  if (DEMO_SUPABASE_USER_ID) return DEMO_SUPABASE_USER_ID;
  const { data } = await supabase.from('clerk_user_mapping').select('supabase_user_id').limit(1).single();
  return data?.supabase_user_id ?? null;
}

async function main() {
  const userId = await getSupabaseUserId();
  if (!userId) {
    console.error('❌ No user ID. Set DEMO_SUPABASE_USER_ID or ensure clerk_user_mapping has at least one row.');
    process.exit(1);
  }

  const thread = {
    ...DEMO_THREAD_PAYLOAD.thread,
    id: DEMO_THREAD_ID,
    user_id: userId,
  };

  const { error: threadError } = await supabase.from('investigation_threads').upsert(thread, { onConflict: 'id' });
  if (threadError) {
    console.error('❌ Thread upsert failed:', threadError.message);
    process.exit(1);
  }
  console.log('✅ Demo thread upserted:', thread.title);

  await supabase.from('investigation_signals').delete().eq('thread_id', DEMO_THREAD_ID);

  for (const sig of DEMO_THREAD_PAYLOAD.signals) {
    const { id: _id, ...rest } = sig;
    const { error: sigError } = await supabase.from('investigation_signals').insert({
      ...rest,
      thread_id: DEMO_THREAD_ID,
    });
    if (sigError) {
      console.warn('⚠️ Signal insert failed:', sigError.message);
    }
  }
  console.log('✅ Demo signals inserted:', DEMO_THREAD_PAYLOAD.signals.length);

  console.log('\n📌 Demo investigation ID:', DEMO_THREAD_ID);
  console.log('   Open in app: /investigations/' + DEMO_THREAD_ID);
  console.log('   Or click "Voir la démo analyste" in the sidebar (no seed required).');
}

main();
