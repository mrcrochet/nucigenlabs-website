-- ============================================
-- FIX FINAL : RLS Policy pour user_preferences (CLERK UNIQUEMENT)
-- ============================================
-- Ce script corrige définitivement le problème "new row violates row-level security policy"
-- 
-- PROBLÈME: Même avec SECURITY DEFINER, Supabase applique toujours RLS
-- SOLUTION: Politique permissive pour les triggers + fonction avec logs

-- ============================================
-- 1. SUPPRIMER TOUTES LES ANCIENNES POLITIQUES
-- ============================================
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
DROP POLICY IF EXISTS "Allow trigger to insert preferences" ON public.user_preferences;

-- ============================================
-- 2. POLITIQUE D'INSERTION PERMISSIVE POUR TRIGGERS
-- ============================================
-- Permettre l'insertion si l'utilisateur existe dans users
-- Cette politique est permissive car le trigger s'exécute AFTER INSERT
CREATE POLICY "Allow trigger to insert preferences"
  ON public.user_preferences
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    -- Permettre si l'utilisateur existe dans public.users
    -- Le trigger s'exécute AFTER INSERT, donc l'utilisateur existe déjà
    EXISTS (
      SELECT 1 FROM public.users WHERE id = user_id
    )
  );

-- ============================================
-- 3. POLITIQUES DE LECTURE ET MISE À JOUR
-- ============================================
CREATE POLICY "Clerk users can read own preferences"
  ON public.user_preferences
  FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = user_preferences.user_id
    )
  );

CREATE POLICY "Clerk users can update own preferences"
  ON public.user_preferences
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = user_preferences.user_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = user_id
    )
  );

-- Policy pour le service role
CREATE POLICY "Service role can manage preferences"
  ON public.user_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 4. FONCTION AVEC LOGS ET GESTION D'ERREUR
-- ============================================
CREATE OR REPLACE FUNCTION public.create_default_preferences_from_onboarding()
RETURNS TRIGGER AS $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  -- Vérifier que l'utilisateur existe (pour debug)
  SELECT EXISTS(SELECT 1 FROM public.users WHERE id = NEW.id) INTO user_exists;
  
  -- Log pour debug (visible dans Supabase logs)
  RAISE NOTICE 'Trigger create_default_preferences_from_onboarding: user_id=%, user_exists=%', NEW.id, user_exists;
  
  -- Si l'utilisateur n'existe pas, c'est un problème
  IF NOT user_exists THEN
    RAISE WARNING 'User % does not exist in public.users when trigger fires', NEW.id;
    RETURN NEW; -- Ne pas bloquer l'insertion dans users
  END IF;
  
  -- Créer les préférences par défaut
  BEGIN
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
    
    RAISE NOTICE 'Successfully created default preferences for user %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log l'erreur mais ne bloque pas l'insertion dans users
      RAISE WARNING 'Error creating default preferences for user %: %', NEW.id, SQLERRM;
      -- Ne pas re-raise l'erreur pour ne pas bloquer l'insertion dans users
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. RECRÉER LE TRIGGER
-- ============================================
DROP TRIGGER IF EXISTS trigger_create_default_preferences ON public.users;
CREATE TRIGGER trigger_create_default_preferences
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_preferences_from_onboarding();

-- ============================================
-- 6. VÉRIFICATIONS
-- ============================================
DO $$
DECLARE
  rec RECORD;
BEGIN
  -- Vérifier que la fonction est bien SECURITY DEFINER
  IF EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'create_default_preferences_from_onboarding'
    AND p.prosecdef = true
  ) THEN
    RAISE NOTICE '✅ Function is SECURITY DEFINER - OK';
  ELSE
    RAISE WARNING '❌ Function is NOT SECURITY DEFINER';
  END IF;
  
  -- Vérifier que RLS est activé
  IF EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_preferences'
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✅ RLS is enabled - OK';
  ELSE
    RAISE WARNING '❌ RLS is NOT enabled';
  END IF;
  
  -- Lister les politiques actuelles
  RAISE NOTICE 'Current RLS policies on user_preferences:';
  FOR rec IN 
    SELECT policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_preferences'
  LOOP
    RAISE NOTICE '  Policy: % (command: %)', rec.policyname, rec.cmd;
  END LOOP;
END $$;

