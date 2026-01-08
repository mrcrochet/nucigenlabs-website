-- ============================================
-- FIX : RLS Policy pour user_preferences (CLERK UNIQUEMENT)
-- ============================================
-- Ce script corrige le problème "new row violates row-level security policy"
-- 
-- IMPORTANT: Cette application utilise UNIQUEMENT Clerk pour l'authentification
-- Les utilisateurs Clerk ne sont PAS dans auth.users, donc auth.uid() = NULL
-- Toutes les politiques doivent être basées sur l'existence dans public.users

-- ============================================
-- 1. SUPPRIMER TOUTES LES ANCIENNES POLITIQUES
-- ============================================
DROP POLICY IF EXISTS "Users can read own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Allow insert for users in users table" ON public.user_preferences;
DROP POLICY IF EXISTS "Allow insert for Clerk users (via trigger)" ON public.user_preferences;
DROP POLICY IF EXISTS "User insert own preferences (Supabase Auth)" ON public.user_preferences;
DROP POLICY IF EXISTS "Service role can manage preferences" ON public.user_preferences;

-- ============================================
-- 2. POLITIQUES POUR CLERK UNIQUEMENT
-- ============================================

-- Policy de LECTURE: Permettre si l'utilisateur existe dans public.users
-- (Tous les utilisateurs Clerk sont dans public.users via get_or_create_supabase_user_id)
CREATE POLICY "Clerk users can read own preferences"
  ON public.user_preferences
  FOR SELECT
  TO authenticated, anon
  USING (
    -- Vérifier que l'utilisateur existe dans public.users
    EXISTS (
      SELECT 1 FROM public.users WHERE id = user_preferences.user_id
    )
  );

-- Policy d'INSERTION: Permettre si l'utilisateur existe dans public.users
-- (Le trigger s'exécute AFTER INSERT sur users, donc l'utilisateur existe déjà)
CREATE POLICY "Clerk users can insert preferences (via trigger)"
  ON public.user_preferences
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    -- Le trigger s'exécute AFTER INSERT, donc l'utilisateur existe déjà
    EXISTS (
      SELECT 1 FROM public.users WHERE id = user_id
    )
  );

-- Policy de MISE À JOUR: Permettre si l'utilisateur existe dans public.users
CREATE POLICY "Clerk users can update own preferences"
  ON public.user_preferences
  FOR UPDATE
  TO authenticated
  USING (
    -- Vérifier que l'utilisateur existe dans public.users
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
-- 3. S'ASSURER QUE LA FONCTION EST SECURITY DEFINER
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- IMPORTANT: SECURITY DEFINER

-- ============================================
-- 4. VÉRIFIER QUE LE TRIGGER EXISTE
-- ============================================
DROP TRIGGER IF EXISTS trigger_create_default_preferences ON public.users;
CREATE TRIGGER trigger_create_default_preferences
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_preferences_from_onboarding();

-- ============================================
-- 5. VÉRIFICATIONS
-- ============================================
DO $$
BEGIN
  -- Vérifier que la fonction est bien SECURITY DEFINER
  IF EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'create_default_preferences_from_onboarding'
    AND p.prosecdef = true -- SECURITY DEFINER
  ) THEN
    RAISE NOTICE '✅ Function create_default_preferences_from_onboarding is SECURITY DEFINER - OK';
  ELSE
    RAISE WARNING '❌ Function create_default_preferences_from_onboarding is NOT SECURITY DEFINER - needs fix';
  END IF;
  
  -- Vérifier que RLS est activé
  IF EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_preferences'
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✅ RLS is enabled on user_preferences - OK';
  ELSE
    RAISE WARNING '❌ RLS is NOT enabled on user_preferences';
  END IF;
END $$;

