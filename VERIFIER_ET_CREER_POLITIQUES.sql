-- ============================================
-- VÉRIFIER ET CRÉER LES POLITIQUES RLS
-- ============================================
-- Ce script vérifie l'état actuel et crée les politiques si nécessaire

-- 1. Vérifier les politiques actuelles
SELECT 
  policyname,
  cmd as command,
  roles,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'user_preferences'
ORDER BY cmd, policyname;

-- 2. Si aucune politique d'insertion n'existe, créer la politique permissive
DO $$
BEGIN
  -- Vérifier si une politique d'insertion existe
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_preferences'
      AND cmd = 'INSERT'
  ) THEN
    -- Créer la politique permissive
    CREATE POLICY "Allow all inserts from triggers"
      ON public.user_preferences
      FOR INSERT
      TO authenticated, anon
      WITH CHECK (true);
    
    RAISE NOTICE '✅ Politique d''insertion créée';
  ELSE
    RAISE NOTICE '✅ Politique d''insertion existe déjà';
  END IF;
  
  -- Vérifier et créer la politique de lecture
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_preferences'
      AND cmd = 'SELECT'
  ) THEN
    CREATE POLICY "Allow read for existing users"
      ON public.user_preferences
      FOR SELECT
      TO authenticated, anon
      USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = user_preferences.user_id)
      );
    
    RAISE NOTICE '✅ Politique de lecture créée';
  ELSE
    RAISE NOTICE '✅ Politique de lecture existe déjà';
  END IF;
  
  -- Vérifier et créer la politique de mise à jour
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_preferences'
      AND cmd = 'UPDATE'
  ) THEN
    CREATE POLICY "Allow update for existing users"
      ON public.user_preferences
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = user_preferences.user_id)
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = user_id)
      );
    
    RAISE NOTICE '✅ Politique de mise à jour créée';
  ELSE
    RAISE NOTICE '✅ Politique de mise à jour existe déjà';
  END IF;
  
  -- Vérifier et créer la politique pour service role
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_preferences'
      AND roles::text LIKE '%service_role%'
  ) THEN
    CREATE POLICY "Service role full access"
      ON public.user_preferences
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
    
    RAISE NOTICE '✅ Politique service role créée';
  ELSE
    RAISE NOTICE '✅ Politique service role existe déjà';
  END IF;
END $$;

-- 3. Vérifier la fonction
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  p.prosecdef as is_security_definer,
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
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'users'
  AND trigger_name = 'trigger_create_default_preferences';

-- 5. Afficher toutes les politiques après création
SELECT 
  policyname,
  cmd as command,
  roles,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'user_preferences'
ORDER BY cmd, policyname;

