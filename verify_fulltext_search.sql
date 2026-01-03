-- ============================================
-- Vérification de l'installation Full-Text Search
-- ============================================

-- 1. Vérifier que la colonne search_vector existe
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'nucigen_events' 
  AND column_name = 'search_vector';

-- 2. Vérifier que l'index GIN existe
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'nucigen_events' 
  AND indexname = 'idx_nucigen_events_search_vector';

-- 3. Vérifier que le trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_nucigen_events_search_vector';

-- 4. Vérifier que les fonctions existent
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'search_nucigen_events',
    'count_nucigen_events_search',
    'search_causal_chains',
    'update_nucigen_events_search_vector'
  )
ORDER BY routine_name;

-- 5. Vérifier que search_vector est rempli pour les événements existants
SELECT 
  COUNT(*) as total_events,
  COUNT(search_vector) as events_with_search_vector,
  COUNT(*) - COUNT(search_vector) as events_missing_search_vector
FROM nucigen_events;

-- 6. Tester la fonction de recherche (doit retourner des résultats si vous avez des événements)
SELECT * FROM search_nucigen_events(
  search_query := '',
  limit_count := 5
) LIMIT 5;

