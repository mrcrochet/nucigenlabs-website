-- ============================================
-- FIX : RLS Policy pour user_preferences (CLERK UNIQUEMENT)
-- ============================================
-- Ce script corrige le problème "new row violates row-level security policy"
-- 
-- IMPORTANT: Cette application utilise UNIQUEMENT Clerk pour l'authentification
-- Les utilisateurs Clerk ne sont PAS dans auth.users, donc auth.uid() = NULL
-- Même avec SECURITY DEFINER, les politiques RLS s'appliquent toujours
--
-- SOLUTION: Toutes les politiques sont basées sur l'existence dans public.users
-- (le trigger s'exécute AFTER INSERT, donc l'utilisateur existe déjà)

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

-- Policy pour les utilisateurs Clerk UNIQUEMENT (pas de Supabase Auth)
-- Le trigger s'exécute AFTER INSERT sur users, donc l'utilisateur existe déjà
CREATE POLICY "Clerk users can insert preferences (via trigger)"
  ON public.user_preferences
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    -- Permettre si l'utilisateur existe dans public.users
    -- (le trigger s'exécute AFTER INSERT, donc l'utilisateur existe déjà)
    EXISTS (
      SELECT 1 FROM public.users WHERE id = user_id
    )
  );

-- S'assurer que la fonction est bien SECURITY DEFINER
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

-- Vérifier que le trigger existe
DROP TRIGGER IF EXISTS trigger_create_default_preferences ON public.users;
CREATE TRIGGER trigger_create_default_preferences
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_preferences_from_onboarding();

-- IMPORTANT: Mettre à jour les politiques de lecture et mise à jour pour Clerk
-- Les utilisateurs Clerk ne sont pas dans auth.users, donc auth.uid() = NULL
-- Il faut permettre l'accès basé sur l'existence dans public.users

-- Policy de lecture: Permettre si l'utilisateur existe dans users (CLERK UNIQUEMENT)
DROP POLICY IF EXISTS "Users can read own preferences" ON public.user_preferences;
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
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
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
DROP POLICY IF EXISTS "Service role can manage preferences" ON public.user_preferences;
CREATE POLICY "Service role can manage preferences"
  ON public.user_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Vérification: S'assurer que la fonction est bien SECURITY DEFINER
DO $$
BEGIN
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
END $$;
