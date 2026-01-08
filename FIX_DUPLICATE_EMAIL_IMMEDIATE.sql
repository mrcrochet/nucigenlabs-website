-- ============================================
-- FIX IMMÉDIAT : Conflit d'email dans users
-- ============================================
-- Ce script corrige immédiatement le problème de conflit d'email
-- en ajoutant une gestion d'exception pour les violations de contrainte unique sur email
-- Exécutez-le dans Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_or_create_supabase_user_id(clerk_id TEXT, user_email TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  supabase_uuid UUID;
  existing_user_id UUID;
  final_email TEXT;
BEGIN
  -- Try to get existing mapping first
  SELECT supabase_user_id INTO supabase_uuid
  FROM public.clerk_user_mapping
  WHERE clerk_user_id = clerk_id;
  
  -- If mapping exists, return it immediately
  IF supabase_uuid IS NOT NULL THEN
    RETURN supabase_uuid;
  END IF;
  
  -- Normalize email (lowercase, trim) to avoid case-sensitivity issues
  IF user_email IS NOT NULL AND user_email != '' THEN
    final_email := LOWER(TRIM(user_email));
    
    -- Check if a user with this email already exists (case-insensitive)
    SELECT id INTO existing_user_id
    FROM public.users
    WHERE LOWER(TRIM(email)) = final_email
    LIMIT 1;
    
    IF existing_user_id IS NOT NULL THEN
      -- User with this email exists, use that ID
      supabase_uuid := existing_user_id;
      
      -- Create mapping pointing to existing user
      INSERT INTO public.clerk_user_mapping (clerk_user_id, supabase_user_id, email)
      VALUES (clerk_id, existing_user_id, final_email)
      ON CONFLICT (clerk_user_id) DO UPDATE
        SET supabase_user_id = EXCLUDED.supabase_user_id,
            email = EXCLUDED.email,
            updated_at = NOW();
      
      RETURN supabase_uuid;
    END IF;
  ELSE
    -- No email provided, generate a unique placeholder
    final_email := clerk_id || '@clerk.temp';
  END IF;
  
  -- No existing user, create new UUID and mapping
  supabase_uuid := gen_random_uuid();
  
  -- Insert mapping first
  INSERT INTO public.clerk_user_mapping (clerk_user_id, supabase_user_id, email)
  VALUES (clerk_id, supabase_uuid, final_email)
  ON CONFLICT (clerk_user_id) DO UPDATE
    SET email = COALESCE(EXCLUDED.email, clerk_user_mapping.email),
        updated_at = NOW()
  RETURNING supabase_user_id INTO supabase_uuid;
  
  -- Create new user record with proper conflict handling
  BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
      supabase_uuid,
      final_email,
      COALESCE(final_email, ''),
      'user'
    )
    ON CONFLICT (id) DO UPDATE
      SET email = COALESCE(NULLIF(EXCLUDED.email, ''), public.users.email),
          updated_at = NOW();
  EXCEPTION
    WHEN unique_violation THEN
      -- Email conflict occurred - find existing user
      SELECT id INTO existing_user_id
      FROM public.users
      WHERE email = final_email
      LIMIT 1;
      
      IF existing_user_id IS NOT NULL THEN
        supabase_uuid := existing_user_id;
        
        -- Update mapping to point to existing user
        UPDATE public.clerk_user_mapping
        SET supabase_user_id = existing_user_id,
            email = final_email,
            updated_at = NOW()
        WHERE clerk_user_id = clerk_id;
      ELSE
        RAISE EXCEPTION 'Failed to resolve email conflict for email: %', final_email;
      END IF;
  END;
  
  RETURN supabase_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

