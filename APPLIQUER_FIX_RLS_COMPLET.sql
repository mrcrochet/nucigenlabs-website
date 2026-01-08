-- ============================================
-- APPLIQUER LE FIX RLS COMPLET
-- ============================================
-- Ce script applique la solution complète de manière idempotente

-- ÉTAPE 1: Supprimer toutes les anciennes politiques d'insertion
DROP POLICY IF EXISTS "Allow all inserts from triggers" ON public.user_preferences;
DROP POLICY IF EXISTS "Allow insert for valid UUIDs (triggers only)" ON public.user_preferences;
DROP POLICY IF EXISTS "Allow insert for valid UUIDs (triggers)" ON public.user_preferences;
DROP POLICY IF EXISTS "Clerk users can insert preferences (via trigger)" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Allow insert if user exists" ON public.user_preferences;
DROP POLICY IF EXISTS "Allow insert from triggers" ON public.user_preferences;

-- ÉTAPE 2: Créer la politique d'insertion permissive
CREATE POLICY "Allow all inserts from triggers"
  ON public.user_preferences
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- ÉTAPE 3: S'assurer que les autres politiques existent
DROP POLICY IF EXISTS "Allow read for existing users" ON public.user_preferences;
CREATE POLICY "Allow read for existing users"
  ON public.user_preferences
  FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = user_preferences.user_id)
  );

DROP POLICY IF EXISTS "Allow update for existing users" ON public.user_preferences;
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

DROP POLICY IF EXISTS "Service role full access" ON public.user_preferences;
CREATE POLICY "Service role full access"
  ON public.user_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ÉTAPE 4: S'assurer que la fonction est SECURITY DEFINER
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
    RAISE WARNING 'Error in create_default_preferences_from_onboarding for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ÉTAPE 5: S'assurer que le trigger existe
DROP TRIGGER IF EXISTS trigger_create_default_preferences ON public.users;
CREATE TRIGGER trigger_create_default_preferences
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_preferences_from_onboarding();

-- ÉTAPE 6: Vérification finale
SELECT 
  'Politiques RLS créées:' as status,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'user_preferences';

SELECT 
  policyname,
  cmd as command,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'user_preferences'
ORDER BY cmd, policyname;

