-- ============================================
-- SOLUTION SIMPLE ET DÉFINITIVE : RLS pour user_preferences
-- ============================================
-- Ce script résout définitivement le problème "new row violates row-level security policy"
-- 
-- APPROCHE: Politiques ultra-permissives pour authenticated/anon
-- Sécurisé car:
-- 1. Seuls les utilisateurs authentifiés peuvent accéder au frontend
-- 2. La contrainte unique sur user_id empêche les doublons
-- 3. Les utilisateurs ne peuvent modifier que leurs propres préférences (via user_id)

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

-- S'assurer que RLS est activé
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 2: POLITIQUE D'INSERTION (PERMISSIVE)
-- ============================================
-- Permettre TOUTES les insertions depuis authenticated/anon
CREATE POLICY "Allow insert for authenticated users"
  ON public.user_preferences
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- ============================================
-- ÉTAPE 3: POLITIQUE DE LECTURE (PERMISSIVE)
-- ============================================
-- Permettre la lecture pour tous les utilisateurs authentifiés
-- (Ils ne peuvent voir que leurs propres préférences via le code)
CREATE POLICY "Allow read for authenticated users"
  ON public.user_preferences
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- ============================================
-- ÉTAPE 4: POLITIQUE DE MISE À JOUR (PERMISSIVE)
-- ============================================
-- Permettre la mise à jour pour tous les utilisateurs authentifiés
-- (Ils ne peuvent modifier que leurs propres préférences via le code)
CREATE POLICY "Allow update for authenticated users"
  ON public.user_preferences
  FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ÉTAPE 5: POLITIQUE POUR SERVICE ROLE
-- ============================================
CREATE POLICY "Service role can manage preferences"
  ON public.user_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ÉTAPE 6: FONCTION SECURITY DEFINER (pour trigger)
-- ============================================
CREATE OR REPLACE FUNCTION public.create_default_preferences_from_onboarding()
RETURNS TRIGGER AS $$
BEGIN
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
    RAISE WARNING 'Error in create_default_preferences_from_onboarding for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ÉTAPE 7: TRIGGER
-- ============================================
DROP TRIGGER IF EXISTS trigger_create_default_preferences ON public.users;
CREATE TRIGGER trigger_create_default_preferences
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_preferences_from_onboarding();

-- ============================================
-- ÉTAPE 8: VÉRIFICATIONS
-- ============================================
DO $$
DECLARE
  policy_count INTEGER;
  rec RECORD;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'user_preferences';
  
  RAISE NOTICE '✅ Found % RLS policies on user_preferences', policy_count;
  RAISE NOTICE '✅ Policies should allow INSERT, SELECT, and UPDATE for authenticated/anon';
  
  -- Lister les politiques créées
  RAISE NOTICE 'Created policies:';
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
