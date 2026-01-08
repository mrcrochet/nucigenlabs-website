-- ============================================
-- FIX IMMÉDIAT : Conflit d'email dans users
-- ============================================
-- Ce script corrige immédiatement le problème de conflit d'email
-- Exécutez-le dans Supabase SQL Editor

-- Étape 1: Vérifier les emails en double
SELECT email, COUNT(*) as count
FROM public.users
GROUP BY email
HAVING COUNT(*) > 1;

-- Étape 2: Mettre à jour la fonction get_or_create_supabase_user_id
-- pour gérer correctement les emails existants
CREATE OR REPLACE FUNCTION public.get_or_create_supabase_user_id(clerk_id TEXT, user_email TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  supabase_uuid UUID;
  existing_user_id UUID;
BEGIN
  -- Try to get existing mapping
  SELECT supabase_user_id INTO supabase_uuid
  FROM public.clerk_user_mapping
  WHERE clerk_user_id = clerk_id;
  
  -- If mapping exists, return it
  IF supabase_uuid IS NOT NULL THEN
    RETURN supabase_uuid;
  END IF;
  
  -- Check if a user with this email already exists
  IF user_email IS NOT NULL AND user_email != '' THEN
    SELECT id INTO existing_user_id
    FROM public.users
    WHERE email = user_email
    LIMIT 1;
    
    IF existing_user_id IS NOT NULL THEN
      -- User with this email exists, use that ID
      supabase_uuid := existing_user_id;
      
      -- Create mapping pointing to existing user
      INSERT INTO public.clerk_user_mapping (clerk_user_id, supabase_user_id, email)
      VALUES (clerk_id, existing_user_id, user_email)
      ON CONFLICT (clerk_user_id) DO UPDATE
        SET supabase_user_id = EXCLUDED.supabase_user_id,
            email = EXCLUDED.email,
            updated_at = NOW();
      
      RETURN supabase_uuid;
    END IF;
  END IF;
  
  -- No existing user, create new UUID and mapping
  supabase_uuid := gen_random_uuid();
  
  INSERT INTO public.clerk_user_mapping (clerk_user_id, supabase_user_id, email)
  VALUES (clerk_id, supabase_uuid, user_email)
  ON CONFLICT (clerk_user_id) DO UPDATE
    SET email = COALESCE(EXCLUDED.email, clerk_user_mapping.email),
        updated_at = NOW()
  RETURNING supabase_user_id INTO supabase_uuid;
  
  -- Create new user record in public.users table
  -- IMPORTANT: This creates a minimal profile. The user must complete onboarding
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    supabase_uuid,
    COALESCE(user_email, ''),
    COALESCE(user_email, ''),
    'user'
  )
  ON CONFLICT (id) DO UPDATE
    SET email = COALESCE(NULLIF(EXCLUDED.email, ''), public.users.email),
        updated_at = NOW();
  
  RETURN supabase_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Étape 3: Vérifier que la fonction est bien mise à jour
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname = 'get_or_create_supabase_user_id';

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Fonction get_or_create_supabase_user_id mise à jour avec succès!';
  RAISE NOTICE 'La fonction vérifie maintenant les emails existants avant de créer un nouvel utilisateur.';
END $$;


