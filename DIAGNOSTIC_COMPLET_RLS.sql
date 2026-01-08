-- ============================================
-- DIAGNOSTIC COMPLET : RLS pour user_preferences
-- ============================================
-- Ce script vérifie TOUT ce qui peut causer le problème RLS

-- 1. Vérifier si RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'user_preferences';

-- 2. Lister TOUTES les politiques RLS (y compris celles qui peuvent bloquer)
SELECT 
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

-- 3. Vérifier la fonction et son statut SECURITY DEFINER
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  p.prosecdef as is_security_definer,
  p.proowner::regrole as function_owner,
  CASE 
    WHEN p.prosecdef THEN '✅ SECURITY DEFINER'
    ELSE '❌ NOT SECURITY DEFINER'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'create_default_preferences_from_onboarding';

-- 4. Vérifier le trigger
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing,
  action_orientation
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'users'
  AND trigger_name = 'trigger_create_default_preferences';

-- 5. Vérifier les permissions sur la table user_preferences
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'user_preferences'
ORDER BY grantee, privilege_type;

-- 6. Tester si un utilisateur récent existe (pour tester la politique)
-- Remplacez l'UUID par un utilisateur récent de votre base
/*
SELECT 
  id,
  email,
  created_at,
  EXISTS (
    SELECT 1 FROM public.user_preferences WHERE user_id = users.id
  ) as has_preferences
FROM public.users
ORDER BY created_at DESC
LIMIT 5;
*/

-- 7. Vérifier s'il y a des politiques restrictives qui pourraient bloquer
-- Les politiques avec auth.uid() ne fonctionnent pas avec Clerk
SELECT 
  policyname,
  cmd,
  with_check,
  CASE 
    WHEN with_check LIKE '%auth.uid()%' THEN '⚠️ Utilise auth.uid() - NE FONCTIONNE PAS AVEC CLERK'
    WHEN with_check LIKE '%EXISTS%' THEN '⚠️ Utilise EXISTS - peut échouer dans le contexte transactionnel'
    ELSE '✅ Politique OK'
  END as status
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'user_preferences'
  AND cmd = 'INSERT';

