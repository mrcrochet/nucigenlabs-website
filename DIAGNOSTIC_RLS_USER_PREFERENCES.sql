-- ============================================
-- DIAGNOSTIC : Vérifier les politiques RLS sur user_preferences
-- ============================================
-- Exécutez ce script pour voir l'état actuel des politiques

-- 1. Vérifier si RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'user_preferences';

-- 2. Lister toutes les politiques RLS sur user_preferences
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'user_preferences'
ORDER BY policyname;

-- 3. Vérifier si la fonction est SECURITY DEFINER
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  p.prosecdef as is_security_definer,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'create_default_preferences_from_onboarding';

-- 4. Vérifier que le trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'users'
  AND trigger_name = 'trigger_create_default_preferences';

-- 5. Tester si un utilisateur existe (remplacez l'UUID par un vrai)
-- SELECT EXISTS (
--   SELECT 1 FROM public.users WHERE id = 'VOTRE-UUID-ICI'
-- ) as user_exists;

