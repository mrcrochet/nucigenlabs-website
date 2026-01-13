// Script de vérification de la configuration Supabase
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n🔍 Vérification de la configuration Supabase...\n');

const requiredRPCFunctions = [
  'get_or_create_supabase_user_id',
  'upsert_user_profile',
  'search_nucigen_events',
  'count_nucigen_events_search',
  'get_event_relationships',
  'get_historical_comparisons',
  'get_scenario_predictions',
];

const requiredTables = [
  'users',
  'user_preferences',
  'nucigen_events',
  'nucigen_causal_chains',
  'event_relationships',
  'historical_comparisons',
  'scenario_predictions',
];

try {
  const envContent = readFileSync(join(__dirname, '.env'), 'utf-8');
  
  const supabaseUrl = process.env.SUPABASE_URL || envContent.match(/SUPABASE_URL=(.+)/)?.[1]?.trim();
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Variables Supabase manquantes dans .env');
    console.log('   Vérifiez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY\n');
    process.exit(1);
  }
  
  console.log('✅ Variables d\'environnement trouvées');
  console.log(`   URL: ${supabaseUrl.substring(0, 30)}...\n`);
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Test connection
  console.log('1. Test de connexion...');
  const { data: healthCheck, error: healthError } = await supabase
    .from('users')
    .select('count')
    .limit(1);
  
  if (healthError && healthError.code !== 'PGRST116') {
    console.log(`   ⚠️  Erreur de connexion: ${healthError.message}`);
  } else {
    console.log('   ✅ Connexion réussie\n');
  }
  
  // Check tables
  console.log('2. Vérification des tables...');
  for (const table of requiredTables) {
    const { error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log(`   ❌ Table "${table}" n'existe pas`);
    } else if (error && error.code === '42501') {
      console.log(`   ⚠️  Table "${table}" existe mais RLS bloque l'accès (normal si RLS activé)`);
    } else {
      console.log(`   ✅ Table "${table}" accessible`);
    }
  }
  
  // Check RPC functions (try calling them)
  console.log('\n3. Vérification des RPC functions...');
  for (const funcName of requiredRPCFunctions) {
    try {
      // Try a simple call to see if function exists
      const { error } = await supabase.rpc(funcName, {});
      
      if (error && error.message.includes('function') && error.message.includes('does not exist')) {
        console.log(`   ❌ Function "${funcName}" n'existe pas`);
      } else if (error && error.message.includes('permission denied')) {
        console.log(`   ⚠️  Function "${funcName}" existe mais permissions insuffisantes`);
      } else {
        // Function exists (even if it errors on parameters, that's OK)
        console.log(`   ✅ Function "${funcName}" existe`);
      }
    } catch (err) {
      // If we can't even call it, assume it doesn't exist
      console.log(`   ❌ Function "${funcName}" n'existe pas ou erreur: ${err.message}`);
    }
  }
  
  // Check RLS policies (basic check)
  console.log('\n4. Vérification RLS (basique)...');
  const { data: rlsInfo, error: rlsError } = await supabase
    .rpc('check_rls_policies', {})
    .catch(() => ({ data: null, error: { message: 'Function not available' } }));
  
  if (rlsError) {
    console.log('   ⚠️  Impossible de vérifier RLS automatiquement');
    console.log('   💡 Vérifiez manuellement dans Supabase Dashboard → Authentication → Policies');
  } else {
    console.log('   ✅ RLS vérifié');
  }
  
  console.log('\n✅ Vérification terminée');
  console.log('💡 Si des tables/functions manquent, exécutez les migrations SQL dans Supabase Dashboard\n');
  
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('❌ Fichier .env non trouvé\n');
    process.exit(1);
  } else {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
}
