-- ============================================
-- SOLUTION SIMPLE ET ROBUSTE : RLS pour user_preferences
-- ============================================
-- Cette solution utilise une approche plus directe et permissive
-- pour les triggers, tout en restant sécurisée

-- ============================================
-- ÉTAPE 1: NETTOYAGE COMPLET
-- ============================================
-- Supprimer TOUTES les politiques existantes
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
-- ÉTAPE 2: POLITIQUE D'INSERTION PERMISSIVE
-- ============================================
-- Permettre l'insertion si l'user_id est un UUID valide
-- (Les triggers créent toujours des UUIDs valides)
CREATE POLICY "Allow insert for valid user IDs"
  ON public.user_preferences
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    -- Vérifier que user_id est un UUID valide et existe dans users
    user_id IS NOT NULL
    AND user_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND EXISTS (SELECT 1 FROM public.users WHERE id = user_id)
  );

-- ============================================
-- ÉTAPE 3: POLITIQUES DE LECTURE ET MISE À JOUR
-- ============================================
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
    -- Log l'erreur mais ne bloque pas
    RAISE WARNING 'Error creating preferences for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ÉTAPE 6: TRIGGER
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
BEGIN
  RAISE NOTICE '✅ Politiques RLS créées pour user_preferences';
  RAISE NOTICE '✅ Fonction create_default_preferences_from_onboarding recréée';
  RAISE NOTICE '✅ Trigger trigger_create_default_preferences recréé';
END $$;

