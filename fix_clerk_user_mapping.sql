-- ============================================
-- Fix: Update get_or_create_supabase_user_id function
-- to handle duplicate email constraint
-- ============================================
-- This fixes the error: "duplicate key value violates unique constraint 'users_email_key'"
-- 
-- Execute this in Supabase SQL Editor

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
  -- Note: We use the generated UUID, not referencing auth.users since Clerk doesn't use Supabase Auth
  -- Since this function uses SECURITY DEFINER, it can bypass RLS policies
  -- We already checked for email conflicts above, so this should only conflict on id
  -- IMPORTANT: This creates a minimal profile. The user must complete onboarding to fill:
  -- - company, sector, professional_role, intended_use, exposure (in users table)
  -- - preferred_sectors, preferred_regions, preferred_event_types, focus_areas (in user_preferences table)
  -- These fields are essential for personalized scraping (tavily-personalized-collector.ts)
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
  
  -- Note: A trigger (trigger_create_default_preferences) will automatically create
  -- an empty user_preferences entry for this user. The user must complete onboarding
  -- to populate these preferences for personalized scraping to work.
  
  RETURN supabase_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

