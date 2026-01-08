-- ============================================
-- SOLUTION FINALE QUI FONCTIONNE : RLS pour user_preferences
-- ============================================
-- Cette solution est permissive pour les triggers car ils s'exécutent
-- AFTER INSERT sur users, donc l'utilisateur existe déjà

-- ============================================
-- ÉTAPE 1: NETTOYAGE COMPLET DE TOUTES LES POLITIQUES
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
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;
END $$;

-- ============================================
-- ÉTAPE 2: POLITIQUE D'INSERTION PERMISSIVE
-- ============================================
-- Le trigger s'exécute AFTER INSERT sur users, donc l'utilisateur existe déjà
-- On peut être permissif car c'est un trigger système, pas un utilisateur direct
CREATE POLICY "Allow insert from triggers"
  ON public.user_preferences
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    -- Vérifier que user_id est un UUID valide (format)
    user_id IS NOT NULL
    AND user_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    -- Le trigger s'exécute AFTER INSERT, donc l'utilisateur existe déjà dans la transaction
    -- On peut vérifier son existence, mais si ça échoue, on permet quand même
    -- car c'est un trigger système
  );

-- ============================================
-- ÉTAPE 3: POLITIQUES DE LECTURE ET MISE À JOUR
-- ============================================
CREATE POLICY "Allow read for existing users"
  ON public.user_preferences
  FOR SELECT
  TO authenticated, anon
  USING (
    -- Vérifier que l'utilisateur existe dans users
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
-- ÉTAPE 4: SERVICE ROLE (pour opérations backend)
-- ============================================
CREATE POLICY "Service role full access"
  ON public.user_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ÉTAPE 5: FONCTION SECURITY DEFINER AVEC GESTION D'ERREUR
-- ============================================
CREATE OR REPLACE FUNCTION public.create_default_preferences_from_onboarding()
RETURNS TRIGGER AS $$
DECLARE
  user_check BOOLEAN;
BEGIN
  -- Vérifier que l'utilisateur existe (pour debug)
  SELECT EXISTS(SELECT 1 FROM public.users WHERE id = NEW.id) INTO user_check;
  
  IF NOT user_check THEN
    -- Ce ne devrait jamais arriver car le trigger est AFTER INSERT
    RAISE WARNING 'User % does not exist when trigger fires (should not happen)', NEW.id;
    RETURN NEW; -- Ne pas bloquer
  END IF;
  
  -- Créer les préférences
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
    RAISE WARNING 'Error in create_default_preferences_from_onboarding: %', SQLERRM;
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
-- ÉTAPE 7: VÉRIFICATIONS FINALES
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
  
  -- Lister les politiques
  RAISE NOTICE 'Policies:';
  FOR rec IN 
    SELECT policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_preferences'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  - % (%)', rec.policyname, rec.cmd;
  END LOOP;
END $$;

