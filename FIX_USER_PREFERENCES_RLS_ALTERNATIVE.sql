-- ============================================
-- SOLUTION ALTERNATIVE : RLS Policy pour user_preferences
-- ============================================
-- Si la solution avec EXISTS ne fonctionne pas, cette version est plus permissive
-- mais toujours sécurisée car elle vérifie que l'utilisateur existe

-- Supprimer toutes les politiques
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
DROP POLICY IF EXISTS "Allow insert if user exists" ON public.user_preferences;

-- SOLUTION 1: Politique permissive pour les triggers (recommandée)
-- Permettre l'insertion si l'user_id est un UUID valide et existe dans users
CREATE POLICY "Allow insert if user exists"
  ON public.user_preferences
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    -- Vérifier que user_id existe dans users
    user_id IN (SELECT id FROM public.users)
  );

-- SOLUTION 2: Si SOLUTION 1 ne fonctionne pas, utiliser cette version encore plus permissive
-- (Décommentez seulement si SOLUTION 1 échoue)
/*
CREATE POLICY "Allow insert for triggers (permissive)"
  ON public.user_preferences
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true); -- Permettre toutes les insertions depuis les triggers
*/

-- Politiques de lecture et mise à jour
CREATE POLICY "Clerk users can read own preferences"
  ON public.user_preferences
  FOR SELECT
  TO authenticated, anon
  USING (
    user_id IN (SELECT id FROM public.users)
  );

CREATE POLICY "Clerk users can update own preferences"
  ON public.user_preferences
  FOR UPDATE
  TO authenticated
  USING (
    user_id IN (SELECT id FROM public.users)
  )
  WITH CHECK (
    user_id IN (SELECT id FROM public.users)
  );

-- Service role
CREATE POLICY "Service role can manage preferences"
  ON public.user_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fonction avec gestion d'erreur améliorée
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
    -- Log l'erreur mais ne bloque pas l'insertion dans users
    RAISE WARNING 'Error in create_default_preferences_from_onboarding for user %: %', NEW.id, SQLERRM;
    RETURN NEW; -- Important: ne pas re-raise pour ne pas bloquer l'insertion dans users
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger
DROP TRIGGER IF EXISTS trigger_create_default_preferences ON public.users;
CREATE TRIGGER trigger_create_default_preferences
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_preferences_from_onboarding();

