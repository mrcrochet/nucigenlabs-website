-- ============================================
-- FIX: Problème avant l'onboarding
-- ============================================
-- Ce script corrige le problème qui peut survenir AVANT l'onboarding
-- quand le trigger essaie de créer les préférences par défaut
--
-- PROBLÈME: Le trigger trigger_create_default_preferences peut échouer
-- à cause de RLS, ce qui peut bloquer la création de l'utilisateur
--
-- SOLUTION: 
-- 1. S'assurer que les politiques RLS permettent l'insertion depuis le trigger
-- 2. Améliorer la gestion d'erreur du trigger pour qu'il ne bloque jamais la création de l'utilisateur
-- 3. S'assurer que la fonction est SECURITY DEFINER

-- ============================================
-- ÉTAPE 1: AMÉLIORER LA FONCTION TRIGGER
-- ============================================
-- La fonction doit être robuste et ne jamais bloquer la création de l'utilisateur
CREATE OR REPLACE FUNCTION public.create_default_preferences_from_onboarding()
RETURNS TRIGGER AS $$
BEGIN
  -- Essayer de créer les préférences par défaut
  -- Si ça échoue, on log l'erreur mais on ne bloque pas la création de l'utilisateur
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
  EXCEPTION
    WHEN OTHERS THEN
      -- Log l'erreur mais ne bloque pas la création de l'utilisateur
      -- Les préférences pourront être créées plus tard lors de l'onboarding
      RAISE WARNING 'Could not create default preferences for user %: %', NEW.id, SQLERRM;
      -- Ne pas re-raise l'exception pour ne pas bloquer l'INSERT dans users
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- IMPORTANT: SECURITY DEFINER

-- ============================================
-- ÉTAPE 2: S'ASSURER QUE LE TRIGGER EXISTE
-- ============================================
DROP TRIGGER IF EXISTS trigger_create_default_preferences ON public.users;
CREATE TRIGGER trigger_create_default_preferences
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_preferences_from_onboarding();

-- ============================================
-- ÉTAPE 3: S'ASSURER QUE LES POLITIQUES RLS PERMETTENT L'INSERTION
-- ============================================
-- Vérifier que les politiques RLS permettent l'insertion depuis authenticated/anon
-- (Le script FIX_USER_PREFERENCES_RLS_SIMPLE_FINAL.sql devrait avoir créé ces politiques)

-- Vérifier si la politique d'insertion existe
DO $$
DECLARE
  insert_policy_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'user_preferences'
      AND cmd = 'INSERT'
      AND (roles::text LIKE '%authenticated%' OR roles::text LIKE '%anon%')
  ) INTO insert_policy_exists;
  
  IF NOT insert_policy_exists THEN
    RAISE WARNING '⚠️ No INSERT policy found for authenticated/anon. Run FIX_USER_PREFERENCES_RLS_SIMPLE_FINAL.sql first!';
  ELSE
    RAISE NOTICE '✅ INSERT policy exists for authenticated/anon';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 4: VÉRIFICATIONS
-- ============================================
DO $$
DECLARE
  func_is_definer BOOLEAN;
  trigger_exists BOOLEAN;
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
    RAISE WARNING '❌ Function is NOT SECURITY DEFINER - this may cause RLS issues';
  END IF;
  
  -- Vérifier que le trigger existe
  SELECT EXISTS (
    SELECT 1 
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relname = 'users'
      AND t.tgname = 'trigger_create_default_preferences'
  ) INTO trigger_exists;
  
  IF trigger_exists THEN
    RAISE NOTICE '✅ Trigger exists on users table';
  ELSE
    RAISE WARNING '❌ Trigger does not exist on users table';
  END IF;
END $$;

-- ============================================
-- FIN DU SCRIPT
-- ============================================
-- Ce script devrait résoudre les problèmes avant l'onboarding
-- Si le problème persiste, vérifier:
-- 1. Que FIX_USER_PREFERENCES_RLS_SIMPLE_FINAL.sql a été exécuté
-- 2. Les logs Supabase pour voir les erreurs exactes
-- 3. Que get_or_create_supabase_user_id fonctionne correctement
