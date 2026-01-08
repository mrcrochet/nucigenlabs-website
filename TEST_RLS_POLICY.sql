-- ============================================
-- TEST : Vérifier que la politique RLS fonctionne
-- ============================================

-- 1. Vérifier les politiques actuelles
SELECT 
  policyname,
  cmd as command,
  roles,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'user_preferences'
ORDER BY policyname;

-- 2. Vérifier que la fonction est SECURITY DEFINER
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  p.prosecdef as is_security_definer,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'create_default_preferences_from_onboarding';

-- 3. Tester manuellement l'insertion (remplacez l'UUID par un vrai)
-- Cette requête devrait échouer si RLS bloque
/*
INSERT INTO public.user_preferences (user_id, preferred_sectors, preferred_regions)
VALUES (
  'VOTRE-UUID-ICI'::uuid,
  '{}',
  '{}'
);
*/

-- 4. Vérifier si un utilisateur existe (remplacez l'UUID)
/*
SELECT EXISTS (
  SELECT 1 FROM public.users WHERE id = 'VOTRE-UUID-ICI'::uuid
) as user_exists;
*/

-- 5. Vérifier le trigger
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

