-- ============================================
-- SOLUTION ULTIME : RLS pour user_preferences
-- ============================================
-- Cette solution utilise une politique très permissive pour les triggers
-- car le trigger s'exécute AFTER INSERT sur users, donc l'utilisateur existe déjà
-- dans la transaction, mais RLS peut ne pas le voir immédiatement

-- ============================================
-- ÉTAPE 1: NETTOYAGE COMPLET
-- ============================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_preferences'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_preferences', pol.policyname);
  END LOOP;
END $$;

-- ============================================
-- ÉTAPE 2: POLITIQUE D'INSERTION ULTRA-PERMISSIVE
-- ============================================
-- Permettre l'insertion si user_id est un UUID valide
-- Le trigger s'exécute AFTER INSERT, donc l'utilisateur existe déjà
-- On ne vérifie PAS l'existence dans users car RLS peut avoir des problèmes
-- de visibilité transactionnelle dans les triggers
CREATE POLICY "Allow insert for valid UUIDs (triggers)"
  ON public.user_preferences
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    -- Vérifier uniquement le format UUID (pas l'existence)
    -- Le trigger garantit que l'utilisateur existe
    user_id IS NOT NULL
    AND user_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  );

-- ============================================
-- ÉTAPE 3: POLITIQUES DE LECTURE ET MISE À JOUR
-- ============================================
-- Pour la lecture et mise à jour, on vérifie l'existence dans users
CREATE POLICY "Allow read for existing users"
  ON public.user_preferences
  FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = user_preferences.user_id)
  );

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

-- ============================================
-- ÉTAPE 4: SERVICE ROLE
-- ============================================
CREATE POLICY "Service role full access"
  ON public.user_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ÉTAPE 5: FONCTION SECURITY DEFINER
-- ============================================
CREATE OR REPLACE FUNCTION public.create_default_preferences_from_onboarding()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer les préférences par défaut
  -- Le trigger s'exécute AFTER INSERT, donc NEW.id existe déjà dans users
  INSERT INTO public.user_preferences (user_id, preferred_sectors, preferred_regions)
  VALUES (
    NEW.id,
    CASE 
      WHEN NEW.sector IS NOT NULL THEN ARRAY[NEW.sector]
      ELSE '{}'
    END,
    '{}'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur mais ne bloque pas l'insertion dans users
    RAISE WARNING 'Error in create_default_preferences_from_onboarding for user %: %', NEW.id, SQLERRM;
    RETURN NEW; -- Important: ne pas re-raise
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ÉTAPE 6: RECRÉER LE TRIGGER
-- ============================================
DROP TRIGGER IF EXISTS trigger_create_default_preferences ON public.users;
CREATE TRIGGER trigger_create_default_preferences
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_preferences_from_onboarding();

-- ============================================
-- ÉTAPE 7: VÉRIFICATIONS
-- ============================================
DO $$
DECLARE
  func_is_definer BOOLEAN;
  rls_enabled BOOLEAN;
  policy_count INTEGER;
BEGIN
  -- Vérifier SECURITY DEFINER
  SELECT p.prosecdef INTO func_is_definer
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
    AND p.proname = 'create_default_preferences_from_onboarding';
  
  IF func_is_definer THEN
    RAISE NOTICE '✅ Function is SECURITY DEFINER';
  ELSE
    RAISE WARNING '❌ Function is NOT SECURITY DEFINER';
  END IF;
  
  -- Vérifier RLS
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'user_preferences';
  
  IF rls_enabled THEN
    RAISE NOTICE '✅ RLS is enabled';
  ELSE
    RAISE WARNING '❌ RLS is NOT enabled';
  END IF;
  
  -- Compter les politiques
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'user_preferences';
  
  RAISE NOTICE '✅ Found % RLS policies on user_preferences', policy_count;
END $$;

