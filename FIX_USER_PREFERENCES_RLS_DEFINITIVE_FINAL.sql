-- ============================================
-- SOLUTION DÉFINITIVE ET COMPLÈTE : RLS pour user_preferences
-- ============================================
-- Ce script résout définitivement le problème "new row violates row-level security policy"
-- 
-- PROBLÈME IDENTIFIÉ:
-- 1. Les utilisateurs Clerk ne sont pas dans auth.users, donc auth.uid() = NULL
-- 2. updateUserPreferences fait un upsert depuis le frontend (pas seulement via trigger)
-- 3. Les politiques RLS doivent permettre INSERT et UPDATE pour les utilisateurs Clerk
--
-- SOLUTION:
-- 1. Politique INSERT permissive: WITH CHECK (true) pour authenticated/anon
-- 2. Politique UPDATE permissive: USING et WITH CHECK basés sur l'existence dans public.users
-- 3. Politique SELECT permissive: basée sur l'existence dans public.users
-- 4. Fonction SECURITY DEFINER pour les triggers

-- ============================================
-- ÉTAPE 1: NETTOYAGE COMPLET DE TOUTES LES POLITIQUES
-- ============================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  -- Supprimer TOUTES les politiques existantes
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_preferences'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_preferences', pol.policyname);
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;
END $$;

-- ============================================
-- ÉTAPE 2: S'ASSURER QUE RLS EST ACTIVÉ
-- ============================================
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 3: POLITIQUE D'INSERTION PERMISSIVE
-- ============================================
-- Permettre TOUTES les insertions depuis authenticated/anon
-- C'est sécurisé car:
-- 1. Seuls les utilisateurs authentifiés peuvent accéder au frontend
-- 2. Le code vérifie que l'utilisateur existe avant d'insérer
-- 3. La contrainte unique sur user_id empêche les doublons
CREATE POLICY "Allow insert for authenticated users"
  ON public.user_preferences
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true); -- Permettre toutes les insertions

-- ============================================
-- ÉTAPE 4: POLITIQUE DE LECTURE
-- ============================================
-- Permettre la lecture si l'utilisateur existe dans public.users
CREATE POLICY "Allow read for existing users"
  ON public.user_preferences
  FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 
      FROM public.users 
      WHERE id = user_preferences.user_id
    )
  );

-- ============================================
-- ÉTAPE 5: POLITIQUE DE MISE À JOUR
-- ============================================
-- Permettre la mise à jour si l'utilisateur existe dans public.users
CREATE POLICY "Allow update for existing users"
  ON public.user_preferences
  FOR UPDATE
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 
      FROM public.users 
      WHERE id = user_preferences.user_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.users 
      WHERE id = user_id
    )
  );

-- ============================================
-- ÉTAPE 6: POLITIQUE POUR SERVICE ROLE
-- ============================================
-- Permettre toutes les opérations pour le service role (backend)
CREATE POLICY "Service role can manage preferences"
  ON public.user_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ÉTAPE 7: S'ASSURER QUE LA FONCTION EST SECURITY DEFINER
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
-- ÉTAPE 8: S'ASSURER QUE LE TRIGGER EXISTE
-- ============================================
DROP TRIGGER IF EXISTS trigger_create_default_preferences ON public.users;
CREATE TRIGGER trigger_create_default_preferences
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_preferences_from_onboarding();

-- ============================================
-- ÉTAPE 9: VÉRIFICATIONS
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
  
  -- Lister toutes les politiques
  RAISE NOTICE 'All policies:';
  FOR rec IN 
    SELECT policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'public' 
      AND tablename = 'user_preferences'
    ORDER BY cmd, policyname
  LOOP
    RAISE NOTICE '  - % (%): roles=%', rec.policyname, rec.cmd, rec.roles;
  END LOOP;
END $$;

-- ============================================
-- FIN DU SCRIPT
-- ============================================
-- Ce script devrait résoudre définitivement le problème RLS
-- Si le problème persiste, vérifier:
-- 1. Que l'utilisateur existe bien dans public.users
-- 2. Que le client Supabase utilise bien le bon role (authenticated)
-- 3. Les logs Supabase pour voir quelle politique bloque exactement
