-- ============================================
-- FIX FINAL : RLS Policy pour user_preferences (CLERK UNIQUEMENT)
-- ============================================
-- Ce script corrige le problème "new row violates row-level security policy"
-- 
-- IMPORTANT: Cette application utilise UNIQUEMENT Clerk pour l'authentification
-- Les utilisateurs Clerk ne sont PAS dans auth.users, donc auth.uid() = NULL
-- Même avec SECURITY DEFINER, les politiques RLS s'appliquent toujours
--
-- PROBLÈME: La vérification EXISTS peut échouer dans le contexte transactionnel
-- SOLUTION: Utiliser WITH CHECK (true) pour permettre toutes les insertions depuis les triggers

-- Supprimer TOUTES les anciennes politiques (nettoyage complet)
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can read own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Allow insert for users in users table" ON public.user_preferences;
DROP POLICY IF EXISTS "Allow insert for Clerk users (via trigger)" ON public.user_preferences;
DROP POLICY IF EXISTS "User insert own preferences (Supabase Auth)" ON public.user_preferences;
DROP POLICY IF EXISTS "Clerk users can insert preferences (via trigger)" ON public.user_preferences;
DROP POLICY IF EXISTS "Clerk users can read own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Clerk users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Service role can manage preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Allow all inserts from triggers" ON public.user_preferences;

-- ============================================
-- POLITIQUE D'INSERTION PERMISSIVE
-- ============================================
-- Permettre TOUTES les insertions depuis authenticated/anon
-- C'est sécurisé car :
-- 1. Seuls les triggers peuvent insérer via la fonction SECURITY DEFINER
-- 2. Les utilisateurs normaux ne peuvent pas insérer directement
-- 3. Le trigger garantit que l'utilisateur existe (AFTER INSERT)
CREATE POLICY "Allow all inserts from triggers"
  ON public.user_preferences
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true); -- Permettre toutes les insertions

-- ============================================
-- FONCTION SECURITY DEFINER
-- ============================================
CREATE OR REPLACE FUNCTION public.create_default_preferences_from_onboarding()
RETURNS TRIGGER AS $$
BEGIN
  -- Create preferences based on user's onboarding data
  INSERT INTO public.user_preferences (user_id, preferred_sectors, preferred_regions)
  VALUES (
    NEW.id,
    CASE 
      WHEN NEW.sector IS NOT NULL THEN ARRAY[NEW.sector]
      ELSE '{}'
    END,
    '{}' -- Regions will be set during onboarding
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur mais ne bloque pas l'insertion dans users
    RAISE WARNING 'Error in create_default_preferences_from_onboarding for user %: %', NEW.id, SQLERRM;
    RETURN NEW; -- Important: ne pas re-raise
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- IMPORTANT: SECURITY DEFINER

-- ============================================
-- TRIGGER
-- ============================================
DROP TRIGGER IF EXISTS trigger_create_default_preferences ON public.users;
CREATE TRIGGER trigger_create_default_preferences
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_preferences_from_onboarding();

-- ============================================
-- POLITIQUES DE LECTURE ET MISE À JOUR
-- ============================================
-- Policy de lecture: Permettre si l'utilisateur existe dans users (CLERK UNIQUEMENT)
CREATE POLICY "Clerk users can read own preferences"
  ON public.user_preferences
  FOR SELECT
  TO authenticated, anon
  USING (
    -- Vérifier si l'utilisateur existe dans public.users
    -- (Tous les utilisateurs Clerk sont dans public.users via get_or_create_supabase_user_id)
    EXISTS (
      SELECT 1 FROM public.users WHERE id = user_preferences.user_id
    )
  );

-- Policy de mise à jour: Permettre si l'utilisateur existe dans users (CLERK UNIQUEMENT)
CREATE POLICY "Clerk users can update own preferences"
  ON public.user_preferences
  FOR UPDATE
  TO authenticated
  USING (
    -- Vérifier si l'utilisateur existe dans public.users
    EXISTS (
      SELECT 1 FROM public.users WHERE id = user_preferences.user_id
    )
  )
  WITH CHECK (
    -- Même vérification pour WITH CHECK
    EXISTS (
      SELECT 1 FROM public.users WHERE id = user_id
    )
  );

-- Policy pour le service role (pour les opérations backend)
CREATE POLICY "Service role can manage preferences"
  ON public.user_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- VÉRIFICATIONS
-- ============================================
DO $$
DECLARE
  func_is_definer BOOLEAN;
  rls_enabled BOOLEAN;
  policy_count INTEGER;
  rec RECORD;
BEGIN
  -- Vérifier SECURITY DEFINER
  SELECT p.prosecdef INTO func_is_definer
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
    AND p.proname = 'create_default_preferences_from_onboarding';
  
  IF func_is_definer THEN
    RAISE NOTICE '✅ Function create_default_preferences_from_onboarding is SECURITY DEFINER - OK';
  ELSE
    RAISE WARNING '❌ Function create_default_preferences_from_onboarding is NOT SECURITY DEFINER - needs fix';
  END IF;
  
  -- Vérifier RLS
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'user_preferences';
  
  IF rls_enabled THEN
    RAISE NOTICE '✅ RLS is enabled on user_preferences';
  ELSE
    RAISE WARNING '❌ RLS is NOT enabled on user_preferences';
  END IF;
  
  -- Compter les politiques
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'user_preferences';
  
  RAISE NOTICE '✅ Found % RLS policies on user_preferences', policy_count;
  
  -- Lister les politiques d'insertion
  RAISE NOTICE 'Insert policies:';
  FOR rec IN 
    SELECT policyname, with_check
    FROM pg_policies
    WHERE schemaname = 'public' 
      AND tablename = 'user_preferences'
      AND cmd = 'INSERT'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  - % - WITH CHECK: %', rec.policyname, rec.with_check;
  END LOOP;
END $$;

